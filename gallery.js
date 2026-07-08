/* ============================================================
   GALLERY.JS
   Простой и быстрый лайтбокс для секции "Галерея":
   клик по изображению открывает увеличенный просмотр
   с навигацией стрелками и закрытием по Esc / клику вне фото.
   ============================================================ */

(function () {
  const items = [...document.querySelectorAll('.gallery__item img')];
  if (!items.length) return;

  let current = 0;
  let overlay;

  function buildOverlay() {
    overlay = document.createElement('div');
    overlay.className = 'lightbox';
    overlay.innerHTML = `
      <button class="lightbox__close" aria-label="Закрыть">✕</button>
      <button class="lightbox__nav lightbox__nav--prev" aria-label="Предыдущее">‹</button>
      <img class="lightbox__img" src="" alt="">
      <button class="lightbox__nav lightbox__nav--next" aria-label="Следующее">›</button>
    `;
    Object.assign(overlay.style, {
      position: 'fixed', inset: '0', zIndex: '950',
      background: 'rgba(10,10,12,0.92)', backdropFilter: 'blur(20px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      opacity: '0', transition: 'opacity 0.35s ease',
    });
    document.body.appendChild(overlay);

    const img = overlay.querySelector('.lightbox__img');
    Object.assign(img.style, { maxWidth: '86vw', maxHeight: '82vh', borderRadius: '14px' });

    ['lightbox__close', null].forEach(() => {});
    overlay.querySelector('.lightbox__close').addEventListener('click', close);
    overlay.querySelector('.lightbox__nav--prev').addEventListener('click', () => show(current - 1));
    overlay.querySelector('.lightbox__nav--next').addEventListener('click', () => show(current + 1));
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

    [...overlay.querySelectorAll('.lightbox__nav')].forEach((btn) => {
      Object.assign(btn.style, {
        position: 'absolute', top: '50%', transform: 'translateY(-50%)',
        fontSize: '2.4rem', color: '#EDEAE3', padding: '0 24px', background: 'none', border: 'none', cursor: 'pointer',
      });
    });
    overlay.querySelector('.lightbox__nav--prev').style.left = '0';
    overlay.querySelector('.lightbox__nav--next').style.right = '0';
    overlay.querySelector('.lightbox__close').style.cssText += 'position:absolute;top:24px;right:32px;font-size:1.4rem;color:#EDEAE3;background:none;border:none;cursor:pointer;';
  }

  function show(index) {
    current = (index + items.length) % items.length;
    overlay.querySelector('.lightbox__img').src = items[current].src;
  }

  function open(index) {
    if (!overlay) buildOverlay();
    show(index);
    requestAnimationFrame(() => (overlay.style.opacity = '1'));
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
  }

  function close() {
    overlay.style.opacity = '0';
    document.body.style.overflow = '';
    document.removeEventListener('keydown', onKey);
  }

  function onKey(e) {
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowRight') show(current + 1);
    if (e.key === 'ArrowLeft') show(current - 1);
  }

  items.forEach((img, i) => {
    img.style.cursor = 'pointer';
    img.addEventListener('click', () => open(i));
  });
})();
