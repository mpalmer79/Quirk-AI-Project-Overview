// Wizard interactions
(function () {
  const form = document.getElementById('wiz');
  if (!form) return;

  const steps = [...form.querySelectorAll('.wiz-step')];
  const dots = [document.getElementById('sd1'), document.getElementById('sd2'), document.getElementById('sd3')];
  let idx = 0;

  function show(i) {
    steps.forEach((s, n) => (s.hidden = n !== i));
    dots.forEach((d, n) => d && d.classList.toggle('active', n === i));
    idx = i;
  }

  form.addEventListener('click', (e) => {
    if (e.target.closest('[data-next]')) show(Math.min(idx + 1, steps.length - 1));
    if (e.target.closest('[data-prev]')) show(Math.max(idx - 1, 0));
  });

  const submitDemo = document.getElementById('submitDemo');
  if (submitDemo) {
    submitDemo.addEventListener('click', () => {
      alert('Thanks! A service advisor will text you shortly with next steps.');
      show(0);
      form.reset();
    });
  }
})();

// Copy buttons
document.querySelectorAll('[data-copy]').forEach((btn) => {
  btn.addEventListener('click', async () => {
    const code = btn.parentElement.querySelector('code');
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code.textContent);
      btn.textContent = 'Copied!';
      setTimeout(() => (btn.textContent = 'Copy'), 1200);
    } catch {
      btn.textContent = 'Copy failed';
      setTimeout(() => (btn.textContent = 'Copy'), 1200);
    }
  });
});
