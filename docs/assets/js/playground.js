/* -------- Agent Playground: front-end generator with backend-ready cURL -------- */
  const API_BASE = ""; // later: "https://your-platform.example.com" (FastAPI)
  const OEM_TTL_MS = 15 * 60 * 1000; // 15 minutes

  /* Agent Profile state */
  let __agentProfile = 'new_lead'; // 'new_lead' | 'best_price' | 'credit' | 'manager'

  /* Profiles: tone + CTA modifiers */
  const PROFILES = {
    new_lead: {
      opener: "Hi",
      closer: "— Quirk BDC",
      cta: (a,b)=>`Would ${a} or ${b} work for a quick drive? I can have one ready.`,
      disclaimer: (ch)=> ch==="email" ? "\n\nPricing/availability subject to prior sale. Incentives subject to eligibility; see dealer for details." : ""
    },
    best_price: {
      opener: "Hi",
      closer: "— Quirk Pricing Team",
      cta: (a,b)=>`I can show all programs side-by-side on a vehicle you can drive. Would ${a} or ${b} work for a quick visit?`,
      forceScenario: "best_price",
      disclaimer: (ch)=> ch==="email" ? "\n\nAll pricing subject to incentives/eligibility; see dealer for details." : ""
    },
    credit: {
      opener: "Hi",
      closer: "— Quirk BDC",
      cta: (a,b)=>`We work with many lenders—happy to walk options with no obligation. Would ${a} or ${b} work to stop by for 15 minutes?`,
      disclaimer: (ch)=> ch==="email" ? "\n\nFinancing subject to credit approval; terms may vary." : ""
    },
    manager: {
      opener: "Hi",
      closer: "— Sales Manager, Quirk",
      cta: (a,b)=>`I'll personally set aside a vehicle for you. Would ${a} or ${b} work for a quick drive?`,
      disclaimer: (ch)=> ch==="email" ? "\n\nSubject to prior sale; incentives and availability change frequently." : ""
    }
  };

  /* Intent classifier expanded to catch "rebates/offers/APR/lease" */
  function classifyLeadText(lead) {
    const t = String(lead || "").toLowerCase();
    if (/(rebate|incentive|offer|program|apr|lease)/.test(t)) return "offers_question";
    if (/(trade|trade-in|appraisal|value|kbb|carvana|carmax)/.test(t)) return "trade_in";
    if (/(best price|price quote|out the door|otd|lowest|payment)/i.test(t)) return "best_price";
    if (/(just looking|just shopping|browsing|compare|research)/i.test(t)) return "just_shopping";
    if (/(available|in stock|inventory|color|trim|option)/i.test(t)) return "new_inventory";
    return "new_inventory";
  }

  function tonePreset(profileKey) {
    const p = PROFILES[profileKey] || PROFILES.new_lead;
    return p;
  }

  function buildMessage({ scenario, tokens, model, name, twoSlots, channel, meta, profileKey }) {
    const tone = tonePreset(profileKey);
    const greeting = `${tone.opener} ${name || "there"},`;

    const inventoryLine =
      `We currently have ${tokens.stock_count ?? "several"} ${model} in stock including ${tokens.model_trim ?? "popular trims"}.`;

    const incentivesBits = [];
    if (tokens.cash_rebate) incentivesBits.push(tokens.cash_rebate);
    if (tokens.apr_rate)    incentivesBits.push(tokens.apr_rate);
    const incentivesLine = incentivesBits.length ? `This week: ${incentivesBits.join(" + ")}.` : "";

    const offersAck = incentivesBits.length
      ? `Great question on current offers — ${incentivesBits.join(" + ")} for well-qualified customers.`
      : `Great question on current offers — I’ll pull the exact programs for your ZIP and eligibility.`;

    const copyMap = {
      offers_question: `${offersAck} ${tone.cta(twoSlots[0], twoSlots[1])}`,
      new_inventory:   tone.cta(twoSlots[0], twoSlots[1]),
      best_price:      `I can show current programs side-by-side on a vehicle you can drive. ${tone.cta(twoSlots[0], twoSlots[1])}`,
      just_shopping:   `No pressure—15 minutes is enough to compare trims in person. ${tone.cta(twoSlots[0], twoSlots[1])}`,
      trade_in:        `Bring your keys and we’ll give you a firm number in about 20 minutes. ${tone.cta(twoSlots[0], twoSlots[1])}`,
    };
    const copy = copyMap[scenario] || copyMap.new_inventory;

    const disclaimer = tone.disclaimer(channel);

    // Optional source link (email only)
    const srcLink = (channel === "email" && meta?.oem_source)
      ? `\nSource: GM Financial current offers — ${meta.oem_source}`
      : "";

    if (channel === "sms") {
      return `${greeting} ${inventoryLine} ${incentivesLine} ${copy}`;
    }
    return `${greeting}\n\n${inventoryLine}${incentivesLine ? "\n" + incentivesLine : ""}\n\n${copy}\n\n${tone.closer}${disclaimer}${srcLink}`;
  }

  function extractName(lead) {
    const m = (lead || "").match(/name[:\-]?\s*([A-Z][a-z]+)\b/mi);
    return m ? m[1] : null;
  }

  // simple two-slot generator
  function generateTwoApptOptions() {
    if (window.__apptOptions?.suggest) return window.__apptOptions.suggest();
    const now = new Date();
    const thurs = nextDowAt(now, 4, 18, 15);
    const sat   = nextDowAt(now, 6, 10, 30);
    return [fmt(thurs), fmt(sat)];
  }
  function nextDowAt(base, dow, hh, mm) { const d = new Date(base); const diff = (dow - d.getDay() + 7) % 7 || 7; d.setDate(d.getDate() + diff); d.setHours(hh, mm, 0, 0); return d; }
  function fmt(d) { return d.toLocaleString(undefined, { weekday:"long", hour:"numeric", minute:"2-digit" }); }

  async function composeDraftFrontEnd({ lead, make, model, zip, offersZip, channel, profileKey }) {
    const full = await window.__inventoryTokens?.getFull({ make, model, zip, offersZip }).catch(() => null);
    const tokens = full?.tokens || {};
    const meta   = full?.meta   || {};
    const twoSlots = generateTwoApptOptions();

    // Scenario may be forced by the profile
    const classified = classifyLeadText(lead);
    const scenario = (PROFILES[profileKey]?.forceScenario) || classified;

    const name = extractName(lead);
    const text = buildMessage({ scenario, tokens, model, name, twoSlots, channel, meta, profileKey });

    return { text, tokens: { ...tokens, two_appt_options: twoSlots, scenario, profile: profileKey } };
  }

  /* Profiles UI wiring */
  (function wireProfiles(){
    const seg = document.getElementById('profilesSeg');
    if (!seg) return;
    seg.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-profile]');
      if (!btn) return;
      seg.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      __agentProfile = btn.getAttribute('data-profile');
      document.getElementById('profileHelp').textContent = ({
        new_lead: 'Balanced tone. Book a quick drive with two options.',
        best_price: 'Price-forward tone. Nudges pricing scenario and side-by-side programs.',
        credit: 'Reassuring tone. Mentions many lenders; low-commitment visit.',
        manager: 'Authoritative tone. Manager signature and strong CTA.'
      })[__agentProfile] || 'Preset shapes tone + CTA.';
    });
  })();

  /* Feedback helpers */
  function saveFeedback({ rating }) {
    const reason = document.getElementById('fbReason')?.value || '';
    const draft = document.getElementById('draftPane')?.textContent || '';
    if (!draft) { alert('Generate a draft first.'); return; }
    const feedback = JSON.parse(localStorage.getItem('agent_feedback') || '[]');
    const entry = {
      id: 'fb_' + Date.now(),
      rating, // 'up' | 'down'
      reason,
      draft_preview: draft.slice(0, 240),
      profile: __agentProfile,
      channel: document.getElementById('channel')?.value || 'email',
      make: document.getElementById('make')?.value || '',
      model: document.getElementById('model')?.value || '',
      zip: document.getElementById('zip')?.value || '',
      offersZip: document.getElementById('offersZip')?.value || '',
      created_at: new Date().toISOString()
    };
    feedback.unshift(entry);
    localStorage.setItem('agent_feedback', JSON.stringify(feedback));
    const badge = document.getElementById('fbSaved');
    if (badge) { badge.style.display = 'inline'; setTimeout(()=> badge.style.display='none', 1400); }
    window.dispatchEvent(new Event('agent_feedback_updated'));
  }

  document.getElementById('fbUp')?.addEventListener('click', () => saveFeedback({ rating: 'up' }));
  document.getElementById('fbDown')?.addEventListener('click', () => saveFeedback({ rating: 'down' }));
  document.getElementById('fbSave')?.addEventListener('click', () => saveFeedback({ rating: 'note' }));

  /* Compose + actions */
  document.getElementById('composeBtn')?.addEventListener('click', async () => {
    const lead = document.getElementById('leadText').value.trim();
    const make = document.getElementById('make').value.trim();
    const model = document.getElementById('model').value.trim();
    const zip = document.getElementById('zip').value.trim();
    const offersZip = document.getElementById('offersZip').value.trim() || zip;
    const channel = document.getElementById('channel').value;
    const profileKey = __agentProfile;

    const { text, tokens } = await composeDraftFrontEnd({ lead, make, model, zip, offersZip, channel, profileKey });
    document.getElementById('draftPane').textContent = text;

    const payload = JSON.stringify({ lead, make, model, zip, offersZip, channel, profileKey, tokens }, null, 2);
    const curl = API_BASE
      ? `curl -X POST '${API_BASE}/api/compose' -H 'Content-Type: application/json' -d '${payload.replace(/\n/g,"")}'`
      : `# When your AutoGPT Platform is up, set API_BASE and use:\n# curl -X POST '$API_BASE/api/compose' -H 'Content-Type: application/json' -d '${payload.replace(/\n/g,"")}'`;
    document.getElementById('curlBlock').textContent = curl;
  });

  document.getElementById('copyDraftBtn')?.addEventListener('click', async () => {
    const text = document.getElementById('draftPane').textContent;
    if (!text) return;
    await navigator.clipboard.writeText(text);
    alert('Draft copied to clipboard.');
  });

  document.getElementById('saveRunBtn')?.addEventListener('click', () => {
    const draft = document.getElementById('draftPane').textContent;
    if (!draft) return;
    const runs = JSON.parse(localStorage.getItem('agent_runs') || '[]');
    const run = {
      id: 'run_' + Date.now(),
      status: 'drafted',
      created_at: new Date().toISOString(),
      channel: document.getElementById('channel').value,
      profile: __agentProfile,
      preview: draft.slice(0,180) + (draft.length>180?'…':'' )
    };
    runs.unshift(run);
    localStorage.setItem('agent_runs', JSON.stringify(runs));
    window.dispatchEvent(new Event('agent_runs_updated'));
  });
