/* ============================================================
   CURSOR.JS
   Кастомный курсор: точка следует мгновенно,
   кольцо — с инерцией (lerp), плюс увеличение
   при наведении на интерактивные элементы.
   ============================================================ */

(function () {
  // На тач-устройствах кастомный курсор не нужен
  if (window.matchMedia('(hover: none), (pointer: coarse)').matches) return;

  const dot = document.querySelector('.cursor-dot');
  const ring = document.querySelector('.cursor-ring');
  if (!dot || !ring) return;

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let ringX = mouseX;
  let ringY = mouseY;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    dot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
  });

  // lerp-цикл для плавного "догоняющего" кольца
  function loop() {
    ringX += (mouseX - ringX) * 0.18;
    ringY += (mouseY - ringY) * 0.18;
    ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
    requestAnimationFrame(loop);
  }
  loop();

  const hoverTargets = 'a, button, .card, .btn, input, textarea, .magnetic';

  document.addEventListener('mouseover', (e) => {
    if (e.target.closest(hoverTargets)) ring.classList.add('is-hover');
  });
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest(hoverTargets)) ring.classList.remove('is-hover');
  });

  document.addEventListener('mousedown', () => ring.style.transform += ' scale(0.85)');
  document.addEventListener('mouseup', () => {});
})();
