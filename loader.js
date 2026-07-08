/* ============================================================
   LOADER.JS
   Показывает экран загрузки, пока не подгрузятся
   шрифты/изображения, затем плавно скрывает его
   и запускает hero-анимацию (через CustomEvent).
   ============================================================ */

(function () {
  const loader = document.querySelector('.loader');
  const bar = document.querySelector('.loader__bar');
  const percentEl = document.querySelector('.loader__percent');

  if (!loader) return;

  let progress = 0;
  const target = 100;

  // Имитация прогресса загрузки (плавный счётчик).
  // Реальная готовность страницы (window.load) гарантирует, что
  // прогресс дойдёт до 100% не раньше, чем контент действительно готов.
  const tick = () => {
    const step = (target - progress) * 0.08 + 0.4;
    progress = Math.min(progress + step, 99);
    render();
    if (progress < 99) requestAnimationFrame(tick);
  };

  function render() {
    const value = Math.round(progress);
    bar.style.setProperty('--p', value + '%');
    percentEl.textContent = value + '%';
  }

  function finish() {
    progress = 100;
    render();
    setTimeout(() => {
      loader.classList.add('is-hidden');
      document.body.classList.add('is-loaded');
      document.dispatchEvent(new CustomEvent('oox:loaded'));
    }, 350);
  }

  requestAnimationFrame(tick);

  window.addEventListener('load', () => {
    // Даём анимации прогресса время "догнать" 100%, чтобы не было рывка
    setTimeout(finish, 600);
  });

  // Защита: если что-то долго грузится — не держим пользователя вечно
  setTimeout(finish, 4000);
})();
