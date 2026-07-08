/* ============================================================
   EFFECTS.JS
   Набор небольших, но "дорогих" UI-эффектов:
   - магнитные кнопки (тянутся к курсору)
   - ripple-эффект при клике
   - аккордеон FAQ
   - плавающие лейблы формы
   - перетаскивание (drag-scroll) карусели отзывов
   ============================================================ */

(function () {
  /* ---------- МАГНИТНЫЕ КНОПКИ ---------- */
  if (window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.magnetic').forEach((el) => {
      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        el.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = 'translate(0, 0)'; });
    });
  }

  /* ---------- RIPPLE НА КНОПКАХ ---------- */
  document.querySelectorAll('.btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const rect = btn.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      const size = Math.max(rect.width, rect.height);
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
      ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
      btn.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove());
    });
  });

  /* ---------- FAQ-АККОРДЕОН ---------- */
  document.querySelectorAll('.faq__item').forEach((item) => {
    const question = item.querySelector('.faq__q');
    const answer = item.querySelector('.faq__a');
    question.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');

      // закрываем остальные пункты (классический accordion-режим)
      item.parentElement.querySelectorAll('.faq__item.is-open').forEach((openItem) => {
        if (openItem !== item) {
          openItem.classList.remove('is-open');
          openItem.querySelector('.faq__a').style.maxHeight = '0px';
        }
      });

      item.classList.toggle('is-open', !isOpen);
      answer.style.maxHeight = isOpen ? '0px' : answer.scrollHeight + 'px';
    });
  });

  /* ---------- ПЛАВАЮЩИЕ ЛЕЙБЛЫ ФОРМЫ ---------- */
  document.querySelectorAll('.field input, .field textarea').forEach((input) => {
    const field = input.closest('.field');
    const sync = () => field.classList.toggle('is-active', input.value.trim() !== '');
    input.addEventListener('input', sync);
    input.addEventListener('blur', sync);
    sync();
  });

  /* ---------- DRAG-SCROLL ДЛЯ КАРУСЕЛИ ОТЗЫВОВ ---------- */
  const track = document.querySelector('.reviews__track');
  if (track) {
    track.style.overflowX = 'auto';
    track.style.cursor = 'grab';
    let isDown = false, startX = 0, scrollLeft = 0;

    track.addEventListener('mousedown', (e) => {
      isDown = true;
      track.style.cursor = 'grabbing';
      startX = e.pageX;
      scrollLeft = track.scrollLeft;
    });
    ['mouseup', 'mouseleave'].forEach((evt) =>
      track.addEventListener(evt, () => { isDown = false; track.style.cursor = 'grab'; })
    );
    track.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      track.scrollLeft = scrollLeft - (e.pageX - startX);
    });
  }

  /* Форма контактов отправляется в contact.js через Cloudflare Worker. */
})();
