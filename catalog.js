/* ============================================================
   CATALOG.JS
   Модалка детального просмотра товара (фото, описание,
   выбор размера, добавление в корзину) + панель "Избранное".
   Подключается после products.js и cart.js — использует
   window.OOX_PRODUCTS, window.OOX_FAVORITES, window.OOX_CART.
   ============================================================ */

(function () {
  function formatPrice(value) {
    return new Intl.NumberFormat('ru-RU').format(value) + ' ₸';
  }

  const CATEGORY_LABELS = {
    all: 'Все',
    outerwear: 'Верх',
    dresses: 'Платья',
    tops: 'Топы',
    bottoms: 'Низ',
  };

  /* ============================================================
     МОДАЛКА ТОВАРА
     ============================================================ */
  const productOverlay = document.getElementById('productOverlay');
  const productModal = document.getElementById('productModal');
  const productClose = document.getElementById('productClose');
  const modalImg = document.getElementById('productModalImg');
  const modalCat = document.getElementById('productModalCat');
  const modalName = document.getElementById('productModalName');
  const modalPrice = document.getElementById('productModalPrice');
  const modalOld = document.getElementById('productModalOld');
  const modalDesc = document.getElementById('productModalDesc');
  const sizePicker = document.getElementById('sizePicker');
  const modalAddBtn = document.getElementById('productModalAdd');
  const modalHint = document.getElementById('productModalHint');

  let currentProduct = null;
  let selectedSize = null;

  function openProduct(product) {
    if (!productModal) return;
    currentProduct = product;
    selectedSize = null;

    modalImg.src = product.img;
    modalImg.alt = product.name;
    modalCat.textContent = CATEGORY_LABELS[product.cat] || product.cat;
    modalName.textContent = product.name;
    modalDesc.textContent = product.desc || '';

    modalPrice.textContent = formatPrice(product.price);
    if (product.old) {
      modalOld.textContent = formatPrice(product.old);
      modalOld.hidden = false;
    } else {
      modalOld.hidden = true;
    }

    // ---------- Размеры ----------
    const sizes = product.sizes && product.sizes.length ? product.sizes : ['ONE SIZE'];
    sizePicker.innerHTML = sizes
      .map((s) => `<button type="button" class="size-picker__item" data-size="${s}">${s}</button>`)
      .join('');

    // Если размер всего один — выбираем автоматически
    if (sizes.length === 1) {
      selectedSize = sizes[0];
      sizePicker.querySelector('.size-picker__item')?.classList.add('is-selected');
    }

    modalHint.textContent = '';
    updateAddButtonState();

    productModal.classList.add('is-open');
    productOverlay?.classList.add('is-visible');
    productModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeProduct() {
    productModal?.classList.remove('is-open');
    productOverlay?.classList.remove('is-visible');
    productModal?.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    currentProduct = null;
  }

  function updateAddButtonState() {
    if (!modalAddBtn) return;
    const needsSize = currentProduct?.sizes && currentProduct.sizes.length > 1;
    modalAddBtn.disabled = needsSize && !selectedSize;
    modalAddBtn.style.opacity = modalAddBtn.disabled ? '0.5' : '1';
  }

  sizePicker?.addEventListener('click', (e) => {
    const btn = e.target.closest('.size-picker__item');
    if (!btn) return;
    sizePicker.querySelectorAll('.size-picker__item').forEach((b) => b.classList.remove('is-selected'));
    btn.classList.add('is-selected');
    selectedSize = btn.dataset.size;
    modalHint.textContent = '';
    updateAddButtonState();
  });

  modalAddBtn?.addEventListener('click', () => {
    if (!currentProduct) return;
    const needsSize = currentProduct.sizes && currentProduct.sizes.length > 1;
    if (needsSize && !selectedSize) {
      modalHint.textContent = 'Выберите размер';
      modalHint.classList.add('is-error');
      return;
    }
    window.OOX_CART?.addToCart(currentProduct, 1, selectedSize);
    closeProduct();
  });

  productClose?.addEventListener('click', closeProduct);
  productOverlay?.addEventListener('click', closeProduct);

  /* ============================================================
     ПАНЕЛЬ "ИЗБРАННОЕ"
     ============================================================ */
  const favOverlay = document.getElementById('favOverlay');
  const favDrawer = document.getElementById('favDrawer');
  const favBody = document.getElementById('favBody');
  const favToggle = document.getElementById('favToggle');
  const favClose = document.getElementById('favClose');
  const favCountEl = document.getElementById('favCount');

  function updateFavCount() {
    if (!favCountEl || !window.OOX_FAVORITES) return;
    const count = window.OOX_FAVORITES.getFavorites().length;
    favCountEl.textContent = count;
    favCountEl.hidden = count === 0;
  }

  function renderFavorites() {
    if (!favBody || !window.OOX_FAVORITES || !window.OOX_PRODUCTS) return;
    const favIds = window.OOX_FAVORITES.getFavorites();
    const items = window.OOX_PRODUCTS.filter((p) => favIds.includes(p.id));

    if (!items.length) {
      favBody.innerHTML = '<p class="cart-drawer__empty">Список избранного пуст</p>';
      return;
    }

    favBody.innerHTML = items.map((p) => `
      <div class="cart-item" data-id="${p.id}">
        <div class="cart-item__media">
          <img src="${p.img}" alt="${p.name}" onerror="this.style.display='none'">
        </div>
        <div class="cart-item__info">
          <p class="cart-item__name">${p.name}</p>
          <p class="cart-item__price">${formatPrice(p.price)}</p>
          <button class="fav-item__add" data-action="open" data-id="${p.id}">Смотреть товар →</button>
        </div>
        <button class="cart-item__remove" data-action="unfav" data-id="${p.id}" aria-label="Убрать из избранного">✕</button>
      </div>
    `).join('');
  }

  favBody?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const id = Number(btn.dataset.id);
    const product = window.OOX_PRODUCTS?.find((p) => p.id === id);

    if (btn.dataset.action === 'unfav') {
      window.OOX_FAVORITES?.toggleFavorite(id);
      renderFavorites();
      updateFavCount();
      // синхронизируем сердечки на карточках в основном каталоге
      document.querySelectorAll(`.card__fav[data-id="${id}"]`).forEach((el) => el.classList.remove('is-active'));
    }
    if (btn.dataset.action === 'open' && product) {
      closeFavDrawer();
      openProduct(product);
    }
  });

  function openFavDrawer() {
    renderFavorites();
    favDrawer?.classList.add('is-open');
    favOverlay?.classList.add('is-visible');
    favDrawer?.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function closeFavDrawer() {
    favDrawer?.classList.remove('is-open');
    favOverlay?.classList.remove('is-visible');
    favDrawer?.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  favToggle?.addEventListener('click', openFavDrawer);
  favClose?.addEventListener('click', closeFavDrawer);
  favOverlay?.addEventListener('click', closeFavDrawer);

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    closeProduct();
    closeFavDrawer();
  });

  document.addEventListener('DOMContentLoaded', updateFavCount);

  // Обновляем счётчик избранного каждый раз, когда меняется сердечко на карточке
  document.addEventListener('click', (e) => {
    if (e.target.closest('.card__fav')) {
      // toggleFavorite уже выполнился в products.js к этому моменту (bubbling порядок тот же обработчик)
      setTimeout(updateFavCount, 0);
    }
  });

  window.OOX_CATALOG = { openProduct, closeProduct };
})();
