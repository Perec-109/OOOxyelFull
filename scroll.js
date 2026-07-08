/* ============================================================
   SCROLL.JS
   Единая точка управления скролл-зависимыми эффектами:
   - появление блоков (.reveal--up / --blur / --in / .stagger)
   - лёгкий параллакс для фоновых декоративных элементов
   ============================================================ */

(function () {
  // ---------- Reveal-on-scroll через IntersectionObserver ----------
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

  document
    .querySelectorAll('.reveal--up, .reveal--blur, .reveal--in, .stagger, .split-text:not(.hero .split-text)')
    .forEach((el) => revealObserver.observe(el));

  // ---------- Параллакс декоративных элементов ----------
  // Элементы с data-parallax="0.3" будут двигаться медленнее скролла
  const parallaxItems = [...document.querySelectorAll('[data-parallax]')];

  function updateParallax() {
    const scrollY = window.scrollY;
    parallaxItems.forEach((el) => {
      const speed = parseFloat(el.dataset.parallax) || 0.2;
      el.style.transform = `translate3d(0, ${scrollY * speed * -0.1}px, 0)`;
    });
  }

  if (parallaxItems.length) {
    window.addEventListener('scroll', () => requestAnimationFrame(updateParallax), { passive: true });
  }

  // ---------- Лёгкий tilt-параллакс для hero по движению мыши ----------
  const heroRotator = document.querySelector('.hero__rotator');
  if (heroRotator && window.matchMedia('(hover: hover)').matches) {
    window.addEventListener('mousemove', (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 18;
      const y = (e.clientY / window.innerHeight - 0.5) * 18;
      heroRotator.style.translate = `${x}px ${y}px`;
    });
  }
})();
