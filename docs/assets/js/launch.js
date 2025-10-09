// Quirk AI VIN Solutions Helper — Launch Countdown
(function(){
  // Target: November 1, 2025 00:00 Eastern (EDT switches to EST on Nov 2 in 2025)
  // Use a fixed ET offset for launch night; adjust to a specific hour if needed.
  const target = new Date('2025-11-01T00:00:00-04:00').getTime();

  const elD = document.getElementById('tDays');
  const elH = document.getElementById('tHours');
  const elM = document.getElementById('tMins');
  const elS = document.getElementById('tSecs');
  const timerWrap = document.getElementById('launchTimer');

  if (!elD || !elH || !elM || !elS || !timerWrap) return;

  function pad(n){ return n.toString().padStart(2,'0'); }

  function renderLaunched(){
    timerWrap.innerHTML = `
      <div class="tbox" style="min-width:280px;background:#06210f;border-color:rgba(34,197,94,.35);box-shadow:0 10px 28px rgba(8,145,78,.35), inset 0 1px 0 rgba(255,255,255,.06)">
        <div class="num" style="color:#bbf7d0">LAUNCHED</div>
        <span class="lab" style="color:#86efac">Quirk AI VIN Solutions Helper</span>
      </div>`;
  }

  function tick(){
    const now = Date.now();
    let diff = Math.max(0, target - now);

    const days = Math.floor(diff / (1000*60*60*24));
    diff -= days * (1000*60*60*24);
    const hours = Math.floor(diff / (1000*60*60));
    diff -= hours * (1000*60*60);
    const mins = Math.floor(diff / (1000*60));
    diff -= mins * (1000*60);
    const secs = Math.floor(diff / 1000);

    if (target - now <= 0){
      renderLaunched();
      clearInterval(int);
      return;
    }

    elD.textContent = days;
    elH.textContent = pad(hours);
    elM.textContent = pad(mins);
    elS.textContent = pad(secs);
  }

  tick();
  const int = setInterval(tick, 1000);

  // Hook up CTAs later when links are ready
  // document.getElementById('watchOverviewBtn').href = 'assets/your-video.mp4';
  // document.getElementById('getExtensionBtn').href = 'assets/your-zip-or-webstore-url';
  // document.getElementById('watchOverviewBtn').removeAttribute('aria-disabled');
  // document.getElementById('getExtensionBtn').removeAttribute('aria-disabled');
})();
