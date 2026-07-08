/* ============================================================
   CART.JS
   Полноценная система корзины:
   - хранение в localStorage (переживает закрытие вкладки)
   - drawer-панель с количеством, удалением, итоговой суммой
   - модалка оформления заказа (имя, телефон, адрес)
   - отправка заказа в Telegram через тот же воркер,
     что используется для contact.js (см. /worker)

   Подключается ДО products.js, чтобы products.js мог
   использовать window.OOX_CART при рендере кнопки "+".
   ============================================================ */

(function () {
  const CART_KEY = 'oox_cart';
  // ⚠️ Тот же адрес воркера, что и в contact.js.
  // Если меняешь его там — поменяй и здесь (или вынеси в одну переменную,
  // см. секцию "ВАЖНО" в README).
  const WORKER_URL_FALLBACK = 'https://ooxyel-contact-proxy.YOUR-SUBDOMAIN.workers.dev';

  // ---------- Состояние ----------
  function getCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
    catch { return []; }
  }

  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    renderCart();
    updateCount();
  }

  function formatPrice(value) {
    return new Intl.NumberFormat('ru-RU').format(value) + ' ₸';
  }

  // ---------- Публичное API (используется в products.js / catalog.js) ----------
  function addToCart(product, qty = 1, size = null) {
    const cart = getCart();
    // Один и тот же товар, но другой размер — отдельная позиция в корзине
    const existing = cart.find((item) => item.id === product.id && item.size === size);
    if (existing) {
      existing.qty += qty;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        img: product.img,
        size: size || null,
        qty,
      });
    }
    saveCart(cart);
    openDrawer();
  }

  function removeFromCart(id, size = null) {
    saveCart(getCart().filter((item) => !(item.id === id && item.size === size)));
  }

  function setQty(id, qty, size = null) {
    const cart = getCart();
    const item = cart.find((i) => i.id === id && i.size === size);
    if (!item) return;
    if (qty <= 0) {
      saveCart(cart.filter((i) => !(i.id === id && i.size === size)));
      return;
    }
    item.qty = qty;
    saveCart(cart);
  }

  function getTotal() {
    return getCart().reduce((sum, item) => sum + item.price * item.qty, 0);
  }

  function getCount() {
    return getCart().reduce((sum, item) => sum + item.qty, 0);
  }

  function clearCart() {
    saveCart([]);
  }

  // ---------- UI: drawer ----------
  const overlay = document.getElementById('cartOverlay');
  const drawer = document.getElementById('cartDrawer');
  const body = document.getElementById('cartBody');
  const footer = document.getElementById('cartFooter');
  const totalEl = document.getElementById('cartTotal');
  const countEl = document.getElementById('cartCount');
  const toggleBtn = document.getElementById('cartToggle');
  const closeBtn = document.getElementById('cartClose');
  const checkoutBtn = document.getElementById('cartCheckoutBtn');

  function updateCount() {
    if (!countEl) return;
    const count = getCount();
    countEl.textContent = count;
    countEl.hidden = count === 0;
  }

  function renderCart() {
    if (!body) return;
    const cart = getCart();

    if (!cart.length) {
      body.innerHTML = '<p class="cart-drawer__empty">Корзина пуста</p>';
      if (footer) footer.hidden = true;
      return;
    }

    body.innerHTML = cart.map((item) => `
      <div class="cart-item" data-id="${item.id}" data-size="${item.size || ''}">
        <div class="cart-item__media">
          <img src="${item.img}" alt="${item.name}" onerror="this.style.display='none'">
        </div>
        <div class="cart-item__info">
          <p class="cart-item__name">${item.name}${item.size ? ` <span class="cart-item__size">· ${item.size}</span>` : ''}</p>
          <p class="cart-item__price">${formatPrice(item.price)}</p>
          <div class="cart-item__qty">
            <button class="cart-item__qty-btn" data-action="dec" data-id="${item.id}" data-size="${item.size || ''}">−</button>
            <span>${item.qty}</span>
            <button class="cart-item__qty-btn" data-action="inc" data-id="${item.id}" data-size="${item.size || ''}">+</button>
          </div>
        </div>
        <button class="cart-item__remove" data-action="remove" data-id="${item.id}" data-size="${item.size || ''}" aria-label="Удалить">✕</button>
      </div>
    `).join('');

    if (footer) {
      footer.hidden = false;
      totalEl.textContent = formatPrice(getTotal());
    }
  }

  if (body) {
    body.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const id = Number(btn.dataset.id);
      const size = btn.dataset.size || null;
      const cart = getCart();
      const item = cart.find((i) => i.id === id && i.size === size);
      if (!item) return;

      if (btn.dataset.action === 'inc') setQty(id, item.qty + 1, size);
      if (btn.dataset.action === 'dec') setQty(id, item.qty - 1, size);
      if (btn.dataset.action === 'remove') removeFromCart(id, size);
    });
  }

  function openDrawer() {
    drawer?.classList.add('is-open');
    overlay?.classList.add('is-visible');
    drawer?.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function closeDrawer() {
    drawer?.classList.remove('is-open');
    overlay?.classList.remove('is-visible');
    drawer?.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  toggleBtn?.addEventListener('click', openDrawer);
  closeBtn?.addEventListener('click', closeDrawer);
  overlay?.addEventListener('click', closeDrawer);

  // ---------- UI: модалка оформления заказа ----------
  const checkoutOverlay = document.getElementById('checkoutOverlay');
  const checkoutModal = document.getElementById('checkoutModal');
  const checkoutClose = document.getElementById('checkoutClose');
  const checkoutForm = document.getElementById('checkoutForm');
  const checkoutSummary = document.getElementById('checkoutSummary');

  function openCheckout() {
    if (!getCart().length) return;
    closeDrawer();
    const count = getCount();
    checkoutSummary.textContent = `${count} ${pluralize(count)} на сумму ${formatPrice(getTotal())}`;
    checkoutModal?.classList.add('is-open');
    checkoutOverlay?.classList.add('is-visible');
    checkoutModal?.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function closeCheckout() {
    checkoutModal?.classList.remove('is-open');
    checkoutOverlay?.classList.remove('is-visible');
    checkoutModal?.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function pluralize(n) {
    const mod10 = n % 10, mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return 'товар';
    if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return 'товара';
    return 'товаров';
  }

  checkoutBtn?.addEventListener('click', openCheckout);
  checkoutClose?.addEventListener('click', closeCheckout);
  checkoutOverlay?.addEventListener('click', closeCheckout);

  checkoutForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('checkoutName').value.trim();
    const phone = document.getElementById('checkoutPhone').value.trim();
    const address = document.getElementById('checkoutAddress').value.trim();
    const cart = getCart();

    const submitBtn = document.getElementById('checkoutSubmitBtn');
    const original = submitBtn.textContent;
    submitBtn.textContent = 'Отправляю...';
    submitBtn.disabled = true;

    const workerUrl =
      document.querySelector('[data-contact-form]')?.dataset.workerUrl || WORKER_URL_FALLBACK;

    try {
      const response = await fetch(workerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'order',
          name,
          phone,
          address,
          items: cart.map((i) => ({ name: i.name, qty: i.qty, price: i.price, size: i.size })),
          total: getTotal(),
        }),
      });

      let data = null;
      try { data = await response.json(); } catch { /* ignore */ }

      if (!response.ok || !data || data.ok !== true) {
        throw new Error((data && data.error) || `HTTP ${response.status}`);
      }

      clearCart();
      closeCheckout();
      checkoutForm.reset();
      showToast('Заказ оформлен! Мы свяжемся с вами в ближайшее время.');
    } catch (error) {
      console.error('Checkout error:', error);
      showToast('Не удалось отправить заказ. Попробуйте ещё раз.', true);
    } finally {
      submitBtn.textContent = original;
      submitBtn.disabled = false;
    }
  });

  // ---------- Простое уведомление (toast) ----------
  function showToast(text, isError = false) {
    const toast = document.createElement('div');
    toast.className = 'oox-toast' + (isError ? ' is-error' : '');
    toast.textContent = text;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('is-visible'));
    setTimeout(() => {
      toast.classList.remove('is-visible');
      setTimeout(() => toast.remove(), 400);
    }, 3200);
  }

  // ---------- Esc закрывает любую открытую панель ----------
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    closeCheckout();
    closeDrawer();
  });

  // ---------- Инициализация ----------
  document.addEventListener('DOMContentLoaded', () => {
    renderCart();
    updateCount();
  });

  // ---------- Экспорт для products.js ----------
  window.OOX_CART = { addToCart, removeFromCart, setQty, getCart, getTotal, getCount, clearCart };
})();
