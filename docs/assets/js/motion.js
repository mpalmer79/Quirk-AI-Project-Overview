// Motion helpers for the launch page
(function(){
  const prefersReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 1) Scroll reveal
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, {rootMargin: '0px 0px -10% 0px', threshold: 0.2});

  // Auto-instrument hero, sections, and cards
  const toReveal = [
    ...document.querySelectorAll('.hero .countdown-wrap'),
    ...document.querySelectorAll('.section h2, .section .muted'),
    ...document.querySelectorAll('.section .card'),
    ...document.querySelectorAll('#downloads .card')
  ];
  toReveal.forEach((el, i)=>{
    el.classList.add('reveal');
    el.style.setProperty('--delay', `${(i%6) * 60}ms`); // gentle stagger
    if (!prefersReduce) io.observe(el); else el.classList.add('in');
  });

  // 2) Topbar shadow on scroll
  const topbar = document.querySelector('.topbar');
  const onScroll = ()=>{
    if (!topbar) return;
    const y = window.scrollY || document.documentElement.scrollTop;
    if (y > 8) topbar.classList.add('scrolled'); else topbar.classList.remove('scrolled');
  };
  onScroll(); window.addEventListener('scroll', onScroll, {passive:true});

  // 3) Subtle parallax for hero glow
  const glow = document.querySelector('.countdown-glow');
  if (glow && !prefersReduce){
    window.addEventListener('scroll', ()=>{
      const y = window.scrollY || document.documentElement.scrollTop;
      // dial this factor to taste (smaller = subtler)
      const t = Math.min(40, y * 0.06);
      glow.style.transform = `translateY(${t}px)`;
    }, {passive:true});
  }
})();
