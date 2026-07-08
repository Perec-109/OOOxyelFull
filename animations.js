/* ============================================================
   ANIMATIONS.JS
   Текстовые анимации, которые не относятся к скроллу:
   - разбивка заголовка hero на буквы/слова (split-text)
   - плавный счётчик чисел в секции "О бренде"
   Запускается после события oox:loaded (см. loader.js).
   ============================================================ */

(function () {
  // ---------- Разбивка текста на буквы для letter-rise анимации ----------
  function splitToSpans(el) {
    const text = el.textContent;
    el.textContent = '';
    [...text].forEach((char, i) => {
      const span = document.createElement('span');
      span.textContent = char === ' ' ? '\u00A0' : char;
      span.style.setProperty('--d', i);
      el.appendChild(span);
    });
  }

  document.querySelectorAll('.split-text').forEach(splitToSpans);

  // ---------- Запуск hero-анимации сразу после лоадера ----------
  document.addEventListener('oox:loaded', () => {
    document.querySelectorAll('.hero .split-text').forEach((el) => {
      el.classList.add('is-visible');
    });
    document.querySelectorAll('.hero .reveal').forEach((el, i) => {
      el.style.animationDelay = `${0.4 + i * 0.12}s`;
      el.classList.add('reveal--up', 'is-visible');
    });
  });

  // ---------- Плавный счётчик чисел ----------
  // Использование в HTML: <span class="counter" data-target="124">0</span>
  function animateCounter(el) {
    const target = parseFloat(el.dataset.target || '0');
    const suffix = el.dataset.suffix || '';
    const duration = 1400;
    const start = performance.now();

    function step(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const value = target * eased;
      el.textContent = (target % 1 === 0 ? Math.round(value) : value.toFixed(1)) + suffix;
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.6 });

  document.querySelectorAll('.counter').forEach((el) => counterObserver.observe(el));
})();
