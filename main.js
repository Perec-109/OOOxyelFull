/* ============================================================
   MAIN.JS
   Точка входа: мелкие глобальные вещи, которые не относятся
   к отдельным модулям, плюс дополнительные GSAP-анимации
   для секций (если библиотека подключена через CDN).
   Подключается последним в index.html.
   ============================================================ */

(function () {
  // ---------- Текущий год в футере ----------
  const yearEl = document.querySelector('[data-year]');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ---------- Лёгкая защита от "битых" внешних изображений ----------
  document.querySelectorAll('img').forEach((img) => {
    img.addEventListener('error', () => {
      img.style.opacity = '0';
    }, { once: true });
  });

  // ---------- GSAP: дополнительные scroll-triggered анимации ----------
  // GSAP подключается через CDN в index.html. Если по какой-то причине
  // скрипт не загрузился (например, нет интернета), весь остальной сайт
  // продолжит работать на чистом CSS/IO — этот блок просто не выполнится.
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);

    // Параллакс изображений в карточках при скролле
    gsap.utils.toArray('.about__visual img').forEach((img) => {
      gsap.to(img, {
        yPercent: 8,
        ease: 'none',
        scrollTrigger: { trigger: img, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    });

    // Лёгкое "наплытие" заголовков секций
    gsap.utils.toArray('.section-title').forEach((title) => {
      gsap.from(title, {
        opacity: 0,
        y: 40,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: { trigger: title, start: 'top 85%' },
      });
    });
  }

  console.info('%cZara', 'font-size:14px;letter-spacing:4px;color:#C9A876;', '— site engine initialized');
})();
