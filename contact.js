/* ============================================================
   CONTACT.JS (исправленная версия)
   ----------------------------------------------------------
   Главные изменения относительно старой версии:
   1. Токен бота и chat_id больше НЕ хранятся во фронтенд-коде —
      форма отправляет данные на твой Cloudflare Worker, а уже
      воркер (на сервере, со скрытыми секретами) шлёт их в Telegram.
   2. Убран сломанный фоллбэк через new Image() — он не мог
      определить успех/неуспех отправки, потому что Telegram
      отвечает JSON, а не картинкой, и срабатывал onerror всегда,
      даже при успешной отправке.
   3. Понятные сообщения об ошибке + console.error для отладки.

   КАК ПОДКЛЮЧИТЬ:
   После деплоя воркера (см. /worker/README внутри проекта)
   пропиши его адрес в index.html на самой форме:

     <form ... data-contact-form data-worker-url="https://ooxyel-contact-proxy.ТВОЙ-ЮЗЕРНЕЙМ.workers.dev">

   Либо просто впиши адрес ниже вместо плейсхолдера.
   ============================================================ */

(function () {
  const form = document.querySelector('[data-contact-form]');
  if (!form) return;

  // ⚠️ Замени на свой адрес после деплоя воркера, например:
  // 'https://ooxyel-contact-proxy.твой-юзернейм.workers.dev'
  const WORKER_URL = form.dataset.workerUrl || 'https://ooxyel-contact-proxy.YOUR-SUBDOMAIN.workers.dev';

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const name = document.getElementById('contactName').value.trim();
    const email = document.getElementById('contactEmail').value.trim();
    const message = document.getElementById('contactMessage').value.trim();

    const button = form.querySelector('button[type="submit"]');
    const originalText = button.textContent;

    let status = form.querySelector('.form-status');
    if (!status) {
      status = document.createElement('p');
      status.className = 'form-status';
      status.style.marginTop = '12px';
      status.style.fontSize = '0.95rem';
      form.appendChild(status);
    }

    button.textContent = 'Отправляю...';
    button.disabled = true;
    status.textContent = '';

    try {
      const response = await fetch(WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      });

      let data = null;
      try { data = await response.json(); } catch { /* ignore parse errors */ }

      if (!response.ok || !data || data.ok !== true) {
        throw new Error((data && data.error) || `HTTP ${response.status}`);
      }

      status.textContent = 'Заявка отправлена. Мы свяжемся с вами в ближайшее время.';
      status.style.color = '#8ce99a';
      form.reset();
      form.querySelectorAll('.field').forEach((f) => f.classList.remove('is-active'));
    } catch (error) {
      console.error('Contact form error:', error);
      status.textContent = 'Не удалось отправить заявку. Попробуйте ещё раз чуть позже.';
      status.style.color = '#ff8a80';
    } finally {
      button.textContent = originalText;
      button.disabled = false;
    }
  });
})();
