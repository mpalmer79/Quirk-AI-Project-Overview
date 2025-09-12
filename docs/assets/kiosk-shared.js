// Minimal helpers for all kiosk modules (iframes)
(function () {
  function track(event, data = {}) {
    try {
      const now = new Date().toISOString();
      const row = { event, at: now, ...data };
      const key = "guidedflow_analytics";
      const arr = JSON.parse(localStorage.getItem(key) || "[]");
      arr.push(row);
      localStorage.setItem(key, JSON.stringify(arr));
    } catch {}
  }
  const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
  const load = (k, def) => { try { const v = JSON.parse(localStorage.getItem(k)); return (v ?? def); } catch { return def; } };
  const post = (type, payload) => { try { window.parent?.postMessage({ type, payload }, "*"); } catch {} };

  window.kiosk = { track, save, load, post };
})();
