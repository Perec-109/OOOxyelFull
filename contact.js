/* ============================================================
   CONTACT.JS
   ----------------------------------------------------------
   Форма контактов. Токен бота и chat_id НЕ хранятся во фронтенде —
   форма отправляет данные на Cloudflare Worker (см. /worker),
   адрес которого задаётся ОДИН РАЗ в config.js.
   ============================================================ */

(function () {
  const form = document.querySelector('[data-contact-form]');
  if (!form) return;

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

    const workerUrl = window.OOX_CONFIG?.WORKER_URL;

    // ---------- Проверка конфига ДО отправки ----------
    // Если адрес воркера не настроен — сразу говорим об этом,
    // а не даём человеку ждать и гадать, почему "не работает".
    if (!workerUrl || workerUrl.includes('YOUR-SUBDOMAIN')) {
      status.textContent = 'Форма не настроена: не задан адрес сервера отправки (см. config.js).';
      status.style.color = '#ff8a80';
      console.error('Contact form error: WORKER_URL не настроен в config.js');
      return;
    }

    button.textContent = 'Отправляю...';
    button.disabled = true;
    status.textContent = '';

    try {
      const response = await fetch(workerUrl, {
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
