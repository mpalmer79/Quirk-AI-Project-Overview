<!-- Step 3: Run Log Viewer (localStorage today, API tomorrow) -->
  <script>
  (async function(){
    const API_BASE = ""; // later: "https://your-platform.example.com"
    async function loadRuns() {
      if (API_BASE) {
        try {
          const r = await fetch(`${API_BASE}/api/runs?limit=10`);
          if (!r.ok) throw new Error('Failed to load runs');
          return (await r.json()).runs || [];
        } catch { /* fall through to local */ }
      }
      const local = JSON.parse(localStorage.getItem('agent_runs') || '[]');
      return local.slice(0, 10);
    }

    function statusBadge(s) {
      const color = s === 'succeeded' ? '#065f46' : s === 'failed' ? '#b91c1c' : '#334155';
      return `<span style="border:1px solid ${color};color:${color};padding:2px 6px;border-radius:999px">${s}</span>`;
    }

    async function render() {
      const runs = await loadRuns();
      const el = document.getElementById('runsTable');
      if (!runs.length) { el.textContent = 'No runs yet.'; return; }
      el.innerHTML = `
        <table class="table">
          <thead><tr><th>When</th><th>Status</th><th>Channel</th><th>Profile</th><th>Preview</th><th>Actions</th></tr></thead>
          <tbody>
            ${runs.map(r => `
              <tr>
                <td>${new Date(r.created_at).toLocaleString()}</td>
                <td>${statusBadge(r.status || 'drafted')}</td>
                <td>${r.channel || '—'}</td>
                <td>${r.profile || 'new_lead'}</td>
                <td>${(r.preview || '').replace(/</g,'&lt;')}</td>
                <td>
                  <button class="btn small" data-run="${r.id}" data-action="copy">Copy ID</button>
                  <button class="btn small" data-run="${r.id}" data-action="rerun">Re-run</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }

    document.getElementById('reloadRunsBtn')?.addEventListener('click', render);
    document.getElementById('runsTable')?.addEventListener('click', async (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      const id = btn.getAttribute('data-run');
      const action = btn.getAttribute('data-action');
      if (action === 'copy') {
        await navigator.clipboard.writeText(id);
        alert('Run ID copied.');
      } else if (action === 'rerun') {
        alert('In a real backend, this would POST /api/runs/{id}/rerun.');
      }
    });

    window.addEventListener('agent_runs_updated', render);
    window.addEventListener('agent_feedback_updated', () => { /* placeholder: could refresh a dashboard */ });
    render();
  })();
  </script>
