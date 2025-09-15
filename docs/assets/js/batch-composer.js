(function(){
    const $ = (id) => document.getElementById(id);
    const state = { items: [] }; // {id, raw, name, channelPref, channel, make, model, zip, offersZip, draft}

    function parseLeads(raw) {
      const chunks = String(raw || "").replace(/\r/g,'').split(/\n\s*\n/g).map(s=>s.trim()).filter(Boolean);
      const leads = (chunks.length > 1 ? chunks : String(raw || "").split(/\n/g).map(s=>s.trim()).filter(Boolean));
      return leads.map((raw, i) => {
        const nameMatch = raw.match(/name[:\-]?\s*([A-Z][a-z]+)/i);
        const channelMatch = raw.match(/\b(sms|text|email)\b/i);
        return {
          id: 'lead_' + (Date.now() + i),
          raw,
          name: nameMatch ? nameMatch[1] : null,
          channelPref: channelMatch ? channelMatch[1].toLowerCase() : null,
        };
      });
    }
    function refreshCount(){ $('batchCount').textContent = `${state.items.length} lead${state.items.length===1?'':'s'} detected`; }

    function renderTable() {
      if (!state.items.length) { $('batchStatus').textContent = 'No results yet.'; $('batchTableWrap').innerHTML=''; return; }
      $('batchStatus').textContent = 'Generated drafts appear below.';
      const rows = state.items.map((it, idx) => `
        <tr>
          <td>${idx+1}</td>
          <td>${(it.name || '—')}</td>
          <td>${(it.channel || it.channelPref || 'email')}</td>
          <td>${(it.zip || '—')}</td>
          <td>${(it.offersZip || '—')}</td>
          <td style="white-space:pre-wrap">${(it.draft || '—').replace(/</g,'&lt;')}</td>
          <td style="white-space:nowrap">
            <button class="btn small" data-id="${it.id}" data-act="copy">Copy</button>
            <button class="btn small" data-id="${it.id}" data-act="fbup" title="Helpful">👍</button>
            <button class="btn small" data-id="${it.id}" data-act="fbdown" title="Needs work">👎</button>
          </td>
        </tr>
      `).join('');
      $('batchTableWrap').innerHTML = `
        <table class="table">
          <thead><tr><th>#</th><th>Name</th><th>Channel</th><th>ZIP</th><th>Offers ZIP</th><th>Draft</th><th>Actions</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>`;
    }

    function exportCSV() {
      if (!state.items.length) return alert('Nothing to export.');
      const headers = ['name','channel','zip','offers_zip','make','model','profile','draft'];
      const lines = [headers.join(',')];
      state.items.forEach(it => {
        const vals = [
          (it.name || ''),
          (it.channel || it.channelPref || 'email'),
          (it.zip || ''),
          (it.offersZip || ''),
          (it.make || ''),
          (it.model || ''),
          (__agentProfile || 'new_lead'),
          (it.draft || '').replace(/\n/g,' ').replace(/"/g,'""'),
        ].map(v => `"${v}"`);
        lines.push(vals.join(','));
      });
      const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'batch_drafts.csv';
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    }

    async function generateAll() {
      if (!state.items.length) return alert('Paste and Parse first.');
      $('batchGenerateBtn').disabled = true; $('batchGenerateBtn').textContent = 'Generating…';

      const make = $('make')?.value.trim() || 'Chevrolet';
      const model = $('model')?.value.trim() || 'Traverse';
      const zip = $('zip')?.value.trim() || '03103';
      const offersZip = $('offersZip')?.value.trim() || zip;
      const profileKey = __agentProfile;

      for (const it of state.items) {
        const channel = it.channelPref || ($('channel')?.value || 'email');
        it.channel = channel; it.make = make; it.model = model; it.zip = zip; it.offersZip = offersZip;

        const { text } = await composeDraftFrontEnd({ lead: it.raw, make, model, zip, offersZip, channel, profileKey });
        it.draft = text;

        // Save as run
        const runs = JSON.parse(localStorage.getItem('agent_runs') || '[]');
        runs.unshift({
          id: 'run_' + Date.now() + '_' + Math.random().toString(36).slice(2,7),
          status: 'drafted',
          created_at: new Date().toISOString(),
          channel, profile: profileKey,
          preview: text.slice(0,180) + (text.length>180?'…':'')
        });
        localStorage.setItem('agent_runs', JSON.stringify(runs));
        window.dispatchEvent(new Event('agent_runs_updated'));

        renderTable();
      }

      $('batchGenerateBtn').disabled = false; $('batchGenerateBtn').textContent = 'Generate All';
    }

    // Feedback save for batch items
    function saveBatchFeedback(id, rating) {
      const it = state.items.find(x => x.id === id);
      if (!it?.draft) return;
      const feedback = JSON.parse(localStorage.getItem('agent_feedback') || '[]');
      feedback.unshift({
        id: 'fb_' + Date.now(),
        rating,
        reason: '',
        draft_preview: it.draft.slice(0,240),
        profile: __agentProfile,
        channel: it.channel || 'email',
        make: it.make, model: it.model, zip: it.zip, offersZip: it.offersZip,
        created_at: new Date().toISOString()
      });
      localStorage.setItem('agent_feedback', JSON.stringify(feedback));
      window.dispatchEvent(new Event('agent_feedback_updated'));
      alert('Feedback saved.');
    }

    // Wire buttons
    $('batchParseBtn')?.addEventListener('click', () => { state.items = parseLeads($('batchInput').value); refreshCount(); renderTable(); });
    $('batchGenerateBtn')?.addEventListener('click', generateAll);
    $('batchExportBtn')?.addEventListener('click', exportCSV);
    $('batchClearBtn')?.addEventListener('click', () => { state.items = []; $('batchInput').value=''; refreshCount(); renderTable(); });

    $('batchTableWrap')?.addEventListener('click', async (e) => {
      const btn = e.target.closest('button[data-act]');
      if (!btn) return;
      const id = btn.getAttribute('data-id');
      const act = btn.getAttribute('data-act');
      const it = state.items.find(x => x.id === id);
      if (!it) return;
      if (act === 'copy') {
        await navigator.clipboard.writeText(it.draft || '');
        alert('Draft copied.');
      } else if (act === 'fbup') {
        saveBatchFeedback(id, 'up');
      } else if (act === 'fbdown') {
        saveBatchFeedback(id, 'down');
      }
    });
  })();
