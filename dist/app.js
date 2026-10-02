(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- scroll reveals ---------- */
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.15, rootMargin: '0px 0px -5% 0px' });
    reveals.forEach((el, i) => { el.style.transitionDelay = `${(i % 3) * 0.08}s`; io.observe(el); });
  } else {
    reveals.forEach((el) => el.classList.add('in'));
  }

  /* ---------- kinetic band: drifts on its own, speeds up and skews with scroll ---------- */
  const track = document.querySelector('[data-band]');
  if (track && !reduce) {
    let x = 0;
    let velocity = 0;
    let lastY = scrollY;
    let half = track.scrollWidth / 2;
    addEventListener('resize', () => { half = track.scrollWidth / 2; });
    const tick = () => {
      const dy = scrollY - lastY;
      lastY = scrollY;
      velocity += (dy - velocity) * 0.1;
      x -= 0.6 + Math.abs(velocity) * 0.35;
      if (-x >= half) x += half;
      const skew = Math.max(-8, Math.min(8, velocity * 0.25));
      track.style.transform = `translate3d(${x}px,0,0) skewX(${-skew}deg)`;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ---------- cursor ---------- */
  const cursor = document.querySelector('.cursor');
  if (cursor && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    let cx = innerWidth / 2, cy = innerHeight / 2, tx = cx, ty = cy;
    addEventListener('pointermove', (e) => { tx = e.clientX; ty = e.clientY; }, { passive: true });
    document.addEventListener('pointerover', (e) => {
      cursor.classList.toggle('big', !!e.target.closest('a.project-link, .big-link'));
    });
    const loop = () => {
      cx += (tx - cx) * (reduce ? 1 : 0.2);
      cy += (ty - cy) * (reduce ? 1 : 0.2);
      cursor.style.transform = `translate3d(${cx}px,${cy}px,0)`;
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
})();
