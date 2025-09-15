(function(){
    const CACHE_KEY = 'inv_tokens_cache_v2';
    const TTL_MS = 15 * 60 * 1000;
    const OEM_ENDPOINT = '/api/oem-offers'; // OK to 404 on GH Pages; UI will just show "missing"

    async function fetchJson(url, opts) {
      const res = await fetch(url, opts);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    }

    async function computeTokens({ make, model, zip, offersZip }) {
      let inventory=[], incentives=null, oemOffers=null, sourceNotes=[];
      try { inventory = await fetchJson('inventory.json'); sourceNotes.push('inventory:live'); }
      catch { sourceNotes.push('inventory:missing'); }

      try {
        const q = new URLSearchParams({ make, model, zip: offersZip || zip }).toString();
        oemOffers = await fetchJson(`${OEM_ENDPOINT}?${q}`);
        sourceNotes.push('oem:gmfinancial');
      } catch { sourceNotes.push('oem:gmfinancial:missing'); }

      try {
        incentives = await fetchJson(`incentives.json?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&zip=${encodeURIComponent(zip)}`);
        sourceNotes.push('incentives:local');
      } catch { sourceNotes.push('incentives:local:missing'); }

      const list = (inventory || []).filter(v =>
        (!make || ciEq(v.make, make)) && (!model || ciEq(v.model, model)) && (!v.status || v.status.toLowerCase() !== 'sold')
      );
      const stockCount = list.length;
      const first = list[0] || {};
      const trim = first.trim || 'popular trims';

      const cash = oemOffers?.cash_rebate ?? (incentives?.cash_rebate ? `$${Number(incentives.cash_rebate).toLocaleString()} customer cash` : null);
      const apr = (oemOffers?.apr != null) ? `${oemOffers.apr}% APR` : (incentives?.apr ? `${incentives.apr}% APR` : null);
      const lease = oemOffers?.lease || null;

      return {
        tokens: {
          stock_count: stockCount || undefined,
          model_trim: trim,
          cash_rebate: cash || undefined,
          apr_rate: apr || undefined,
          lease_monthly: lease?.monthly || undefined,
          lease_due: lease?.due_at_signing || undefined,
          lease_months: lease?.months || undefined,
          primary_photo: first.photo || undefined
        },
        meta: {
          sourceNotes,
          updated_at: first.updated_at || null,
          oem_source: oemOffers?.source || null,
          fetched_at: oemOffers?.fetched_at || null
        }
      };
    }

    function ciEq(a,b){ return String(a||'').toLowerCase() === String(b||'').toLowerCase(); }

    async function get({ make, model, zip, offersZip }) {
      const now = Date.now();
      const key = `${make}|${model}|${zip}|${offersZip||''}`;
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
      if (cached && (now - cached.ts) < TTL_MS && cached.key === key) return cached.payload;
      const payload = await computeTokens({ make, model, zip, offersZip });
      localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: now, key, payload }));
      return payload;
    }

    function renderPreview(payload) {
      const { tokens, meta } = payload || {};
      const el = document.getElementById('tokenPreview');
      const metaEl = document.getElementById('tokenMeta');
      if (!tokens) { el.textContent = 'No tokens available.'; return; }
      el.innerHTML = `
        <code>[[stock_count]]</code>: ${tokens.stock_count ?? '—'} &nbsp;|&nbsp;
        <code>[[model_trim]]</code>: ${tokens.model_trim ?? '—'} &nbsp;|&nbsp;
        <code>[[cash_rebate]]</code>: ${tokens.cash_rebate ?? '—'} &nbsp;|&nbsp;
        <code>[[apr_rate]]</code>: ${tokens.apr_rate ?? '—'}<br>
        <code>lease</code>: ${tokens.lease_monthly ? ('$' + tokens.lease_monthly + '/mo, $' + (tokens.lease_due||0).toLocaleString() + ' DAS, ' + (tokens.lease_months||'—') + ' mo') : '—'}
      `;
      const stale = isStale();
      metaEl.innerHTML = `${(meta?.sourceNotes||[]).join(', ')}${stale ? ' • cache ≤15m' : ''}${meta?.updated_at ? ' • inv updated ' + meta.updated_at : ''}${
        meta?.oem_source ? ' • <a href="'+meta.oem_source+'" target="_blank" rel="noopener">GM Financial source</a>' : ''
      }`;
      metaEl.style.color = stale ? '#b45309' : '#475569';
    }

    function isStale() {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
      if (!cached) return true;
      return (Date.now() - cached.ts) >= TTL_MS;
    }

    // public APIs
    window.__inventoryTokens = {
      get: async ({ make, model, zip, offersZip }) => get({ make, model, zip, offersZip }).then(p => p.tokens),
      getFull: async ({ make, model, zip, offersZip }) => get({ make, model, zip, offersZip })
    };

    async function refreshFromInputs() {
      const make = document.getElementById('make')?.value || '';
      const model = document.getElementById('model')?.value || '';
      const zip = document.getElementById('zip')?.value || '';
      const offersZip = document.getElementById('offersZip')?.value || zip;
      const payload = await get({ make, model, zip, offersZip });
      renderPreview(payload);
    }

    document.getElementById('refreshTokensBtn')?.addEventListener('click', refreshFromInputs);
    ['make','model','zip','offersZip'].forEach(id => {
      const el = document.getElementById(id);
      el && el.addEventListener('change', refreshFromInputs);
    });
  })();
