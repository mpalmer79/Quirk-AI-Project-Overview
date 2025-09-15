(function () {
  // ====== Cache + environment ======
  const CACHE_KEY = "inv_tokens_cache_v2";
  const TTL_MS = 15 * 60 * 1000;

  // Detect GitHub Pages so we can avoid noisy 404s
  const IS_GHPAGES = location.hostname.endsWith("github.io");

  // On GitHub Pages there is no backend; skip OEM endpoint
  const OEM_ENDPOINT = IS_GHPAGES ? null : "/api/oem-offers";

  // Also skip local incentives.json queries on GH Pages by default
  // (flip to true if you add a real docs/incentives.json file)
  const TRY_LOCAL_INCENTIVES = !IS_GHPAGES;

  // ====== Helpers ======
  async function fetchJsonSafe(url, opts) {
    try {
      const res = await fetch(url, opts);
      if (!res.ok) return null; // don't throw on 404/500
      try {
        return await res.json();
      } catch {
        return null;
      }
    } catch {
      return null;
    }
  }

  function ciEq(a, b) {
    return String(a || "").toLowerCase() === String(b || "").toLowerCase();
  }

  // ====== Core token computation ======
  async function computeTokens({ make, model, zip, offersZip }) {
    let inventory = [],
      incentives = null,
      oemOffers = null,
      sourceNotes = [];

    // inventory.json (static file)
    const inv = await fetchJsonSafe("inventory.json");
    if (Array.isArray(inv)) {
      inventory = inv;
      sourceNotes.push("inventory:live");
    } else {
      sourceNotes.push("inventory:missing");
    }

    // OEM offers (backend) — SKIPPED on GitHub Pages
    if (OEM_ENDPOINT) {
      const q = new URLSearchParams({
        make,
        model,
        zip: offersZip || zip,
      }).toString();
      oemOffers = await fetchJsonSafe(`${OEM_ENDPOINT}?${q}`);
      sourceNotes.push(oemOffers ? "oem:gmfinancial" : "oem:gmfinancial:missing");
    } else {
      sourceNotes.push("oem:endpoint:skipped");
    }

    // incentives.json (static) — SKIPPED on GitHub Pages unless you enable it
    if (TRY_LOCAL_INCENTIVES) {
      const url = `incentives.json?make=${encodeURIComponent(make)}&model=${encodeURIComponent(
        model
      )}&zip=${encodeURIComponent(zip)}`;
      incentives = await fetchJsonSafe(url);
      sourceNotes.push(incentives ? "incentives:local" : "incentives:local:missing");
    } else {
      sourceNotes.push("incentives:skipped");
    }

    // Filter to requested make/model and not sold
    const list = (inventory || []).filter(
      (v) =>
        (!make || ciEq(v.make, make)) &&
        (!model || ciEq(v.model, model)) &&
        (!v.status || String(v.status).toLowerCase() !== "sold")
    );

    const stockCount = list.length;
    const first = list[0] || {};
    const trim = first.trim || "popular trims";

    // Prefer OEM offers, fall back to local incentives if present
    const cash =
      (oemOffers && oemOffers.cash_rebate) != null
        ? oemOffers.cash_rebate
        : incentives?.cash_rebate != null
        ? `$${Number(incentives.cash_rebate).toLocaleString()} customer cash`
        : null;

    const apr =
      (oemOffers && oemOffers.apr) != null
        ? `${oemOffers.apr}% APR`
        : incentives?.apr != null
        ? `${incentives.apr}% APR`
        : null;

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
        primary_photo: first.photo || undefined,
      },
      meta: {
        sourceNotes,
        updated_at: first.updated_at || null,
        oem_source: oemOffers?.source || null,
        fetched_at: oemOffers?.fetched_at || null,
      },
    };
  }

  async function get({ make, model, zip, offersZip }) {
    const now = Date.now();
    const key = `${make}|${model}|${zip}|${offersZip || ""}`;
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
    if (cached && now - cached.ts < TTL_MS && cached.key === key) return cached.payload;

    const payload = await computeTokens({ make, model, zip, offersZip });
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: now, key, payload }));
    return payload;
  }

  // ====== UI helpers ======
  function renderPreview(payload) {
    const tokens = payload?.tokens || {};
    const meta = payload?.meta || {};
    const el = document.getElementById("tokenPreview");
    const metaEl = document.getElementById("tokenMeta");
    if (!el || !metaEl) return;

    if (!payload) {
      el.textContent = "No tokens available.";
      metaEl.textContent = "";
      return;
    }

    el.innerHTML = `
      <code>[[stock_count]]</code>: ${tokens.stock_count ?? "—"} &nbsp;|&nbsp;
      <code>[[model_trim]]</code>: ${tokens.model_trim ?? "—"} &nbsp;|&nbsp;
      <code>[[cash_rebate]]</code>: ${tokens.cash_rebate ?? "—"} &nbsp;|&nbsp;
      <code>[[apr_rate]]</code>: ${tokens.apr_rate ?? "—"}<br>
      <code>lease</code>: ${
        tokens.lease_monthly
          ? "$" +
            tokens.lease_monthly +
            "/mo, $" +
            (tokens.lease_due || 0).toLocaleString() +
            " DAS, " +
            (tokens.lease_months || "—") +
            " mo"
          : "—"
      }
    `;

    const stale = isStale();
    const notes = Array.isArray(meta.sourceNotes) ? meta.sourceNotes.join(", ") : "";
    const oemLink =
      meta.oem_source && !IS_GHPAGES
        ? ` • <a href="${meta.oem_source}" target="_blank" rel="noopener">GM Financial source</a>`
        : "";

    metaEl.innerHTML = `${notes}${stale ? " • cache ≤15m" : ""}${
      meta.updated_at ? " • inv updated " + meta.updated_at : ""
    }${oemLink}`;
    metaEl.style.color = stale ? "#b45309" : "#475569";
  }

  function isStale() {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
    if (!cached) return true;
    return Date.now() - cached.ts >= TTL_MS;
  }

  // ====== Public API ======
  window.__inventoryTokens = {
    get: async ({ make, model, zip, offersZip }) =>
      get({ make, model, zip, offersZip }).then((p) => p.tokens),
    getFull: async ({ make, model, zip, offersZip }) => get({ make, model, zip, offersZip }),
  };

  // ====== Wire UI ======
  async function refreshFromInputs() {
    const make = document.getElementById("make")?.value || "";
    const model = document.getElementById("model")?.value || "";
    const zip = document.getElementById("zip")?.value || "";
    const offersZip = document.getElementById("offersZip")?.value || zip;
    const payload = await get({ make, model, zip, offersZip });
    renderPreview(payload);
  }

  document.getElementById("refreshTokensBtn")?.addEventListener("click", refreshFromInputs);
  ["make", "model", "zip", "offersZip"].forEach((id) => {
    const el = document.getElementById(id);
    el && el.addEventListener("change", refreshFromInputs);
  });
})();
