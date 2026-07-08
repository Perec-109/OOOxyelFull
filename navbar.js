/* ============================================================
   NAVBAR.JS
   Управляет состоянием навбара (фон при скролле),
   мобильным меню и плавным скроллом по якорным ссылкам.
   ============================================================ */

(function () {
  const navbar = document.querySelector('.navbar');
  const burger = document.querySelector('.navbar__burger');
  const links = document.querySelector('.navbar__links');

  if (!navbar) return;

  // Подсветка навбара тёмным стеклом после небольшого скролла
  const onScroll = () => {
    navbar.classList.toggle('is-scrolled', window.scrollY > 40);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Мобильное меню (бургер)
  if (burger && links) {
    burger.addEventListener('click', () => {
      const isOpen = links.classList.toggle('is-open');
      burger.classList.toggle('is-open', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });
  }

  // Плавный переход + закрытие мобильного меню после клика по ссылке
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href');
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      links?.classList.remove('is-open');
      burger?.classList.remove('is-open');
      document.body.style.overflow = '';
    });
  });
})();
