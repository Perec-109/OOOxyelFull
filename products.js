/* ============================================================
   PRODUCTS.JS
   Данные товаров бренда Zara + рендер карточек
   в секции "Популярные товары" и "Новая коллекция",
   фильтрация по категориям, избранное (localStorage).
   ============================================================ */

(function () {
  // ---------- ДАННЫЕ ТОВАРОВ ----------
  // Чтобы добавить свой товар — скопируй объект и поменяй поля.
  // img можно указывать как путь к файлу в папке /img.
  const PRODUCTS = [
    { id: 1,  name: 'Coat Noir',        cat: 'outerwear', price: 24900, old: null,  tag: 'NEW',    img: 'assets/products/coat-noir.jpg',        desc: 'Прямое пальто из плотной шерсти с шёлковой подкладкой. Строгий силуэт, минимум деталей — вещь, которая работает в любом образе.', sizes: ['XS','S','M','L','XL'] },
    { id: 2,  name: 'Wool Trench',      cat: 'outerwear', price: 31900, old: 36900, tag: 'SALE',   img: 'assets/products/wool-trench.jpg',      desc: 'Классический тренч из шерстяной смеси с поясом. Утеплённая версия для прохладного сезона, сохраняет форму годами.', sizes: ['S','M','L','XL'] },
    { id: 3,  name: 'Champagne Slip',   cat: 'dresses',   price: 18900, old: null,  tag: 'NEW',    img: 'assets/products/champagne-slip.jpg',   desc: 'Платье-комбинация из атласа цвета шампань. Струящийся крой, регулируемые бретели, скрытая молния сбоку.', sizes: ['XS','S','M','L'] },
    { id: 4,  name: 'Velvet Midi',      cat: 'dresses',   price: 21900, old: null,  tag: null,     img: 'assets/products/velvet-midi.jpg',      desc: 'Бархатное платье миди с V-образным вырезом. Плотная посадка по корпусу, свободная юбка ниже линии бёдер.', sizes: ['XS','S','M','L','XL'] },
    { id: 5,  name: 'Oversized Blazer', cat: 'outerwear', price: 22900, old: null,  tag: 'BESTSELLER', img: 'assets/products/oversized-blazer.jpg', desc: 'Оверсайз-блейзер с широкими плечами и удлинённым рукавом. Один из самых заказываемых силуэтов сезона.', sizes: ['S','M','L','XL'] },
    { id: 6,  name: 'Silk Shirt Onyx',  cat: 'tops',      price: 12900, old: null,  tag: null,     img: 'assets/products/silk-shirt-onyx.jpg',  desc: 'Рубашка из натурального шёлка глубокого чёрного оттенка. Свободный крой, перламутровые пуговицы.', sizes: ['XS','S','M','L'] },
    { id: 7,  name: 'Cashmere Knit',    cat: 'tops',      price: 15900, old: 18900, tag: 'SALE',   img: 'assets/products/cashmere-knit.jpg',    desc: 'Джемпер из 100% кашемира. Лёгкий, но тёплый — базовая вещь гардероба, которая носится сезон за сезоном.', sizes: ['XS','S','M','L','XL'] },
    { id: 8,  name: 'Tailored Trousers',cat: 'bottoms',   price: 13900, old: null,  tag: null,     img: 'assets/products/tailored-trousers.jpg', desc: 'Брюки прямого кроя со стрелками. Высокая посадка, скрытая застёжка, подклад до колена.', sizes: ['XS','S','M','L','XL'] },
    { id: 9,  name: 'Leather Skirt',    cat: 'bottoms',   price: 17900, old: null,  tag: 'NEW',    img: 'assets/products/leather-skirt.jpg',    desc: 'Юбка-карандаш из натуральной кожи. Плотная посадка по бёдрам, разрез сзади для свободы движения.', sizes: ['XS','S','M','L'] },
    { id: 10, name: 'Signature Suit',   cat: 'outerwear', price: 38900, old: null,  tag: 'BESTSELLER', img: 'assets/products/signature-suit.jpg', desc: 'Фирменный костюм-двойка: жакет + брюки. Итальянская шерсть, ручная строчка лацканов.', sizes: ['S','M','L','XL'] },
    { id: 11, name: 'Linen Wide Pants', cat: 'bottoms',   price: 11900, old: null,  tag: null,     img: 'assets/products/linen-wide-pants.jpg', desc: 'Широкие брюки из умягчённого льна. Дышащая ткань, эластичный пояс сзади для комфортной посадки.', sizes: ['XS','S','M','L','XL'] },
    { id: 12, name: 'Bodycon Noir',     cat: 'dresses',   price: 19900, old: 23900, tag: 'SALE',   img: 'assets/products/bodycon-noir.jpg',     desc: 'Облегающее платье из плотного трикотажа. Подчёркивает силуэт, не теряет форму при носке.', sizes: ['XS','S','M','L'] },
  ];

  const CATEGORY_LABELS = {
    all: 'Все',
    outerwear: 'Верх',
    dresses: 'Платья',
    tops: 'Топы',
    bottoms: 'Низ',
  };

  const FAV_KEY = 'oox_favorites';
  let memoryFavorites = [];

  function storageGet(key) {
    try { return window.localStorage ? window.localStorage.getItem(key) : null; }
    catch { return null; }
  }

  function storageSet(key, value) {
    try {
      if (!window.localStorage) return false;
      window.localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  }

  function getFavorites() {
    const raw = storageGet(FAV_KEY);
    if (!raw) return memoryFavorites;
    try { return JSON.parse(raw) || []; }
    catch { return memoryFavorites; }
  }
  function toggleFavorite(id) {
    const favs = getFavorites();
    const idx = favs.indexOf(id);
    if (idx > -1) favs.splice(idx, 1); else favs.push(id);
    memoryFavorites = favs;
    storageSet(FAV_KEY, JSON.stringify(favs));
    return favs.includes(id);
  }

  function formatPrice(value) {
    return new Intl.NumberFormat('ru-RU').format(value) + ' ₸';
  }

  // ---------- РЕНДЕР ОДНОЙ КАРТОЧКИ ----------
  function renderCard(product) {
    const isFav = getFavorites().includes(product.id);
    const card = document.createElement('article');
    card.className = 'card';
    card.dataset.cat = product.cat;
    card.dataset.id = product.id;
    card.innerHTML = `
      <div class="card__media">
        ${product.tag ? `<span class="card__tag">${product.tag}</span>` : ''}
        <button class="card__fav ${isFav ? 'is-active' : ''}" aria-label="В избранное" data-id="${product.id}">♥</button>
        <img src="${product.img}" alt="${product.name}" loading="lazy"
             onerror="this.closest('.card__media').classList.add('shimmer'); this.remove();">
      </div>
      <div class="card__body">
        <h3 class="card__name">${product.name}</h3>
        <p class="card__cat">${CATEGORY_LABELS[product.cat] || product.cat}</p>
        <div class="card__footer">
          <span>
            ${product.old ? `<span class="card__old">${formatPrice(product.old)}</span>` : ''}
            <span class="card__price">${formatPrice(product.price)}</span>
          </span>
          <button class="card__add" aria-label="Добавить в корзину" data-id="${product.id}">+</button>
        </div>
      </div>
    `;
    return card;
  }

  // ---------- ОТРИСОВКА СЕТКИ С ФИЛЬТРОМ ----------
  function renderGrid(container, list) {
    container.innerHTML = '';
    list.forEach((p) => container.appendChild(renderCard(p)));
    container.classList.remove('is-visible'); // перезапуск stagger-анимации
    requestAnimationFrame(() => {
      const obs = new IntersectionObserver((entries) => {
        entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-visible'); obs.disconnect(); } });
      }, { threshold: 0.1 });
      obs.observe(container);
    });
  }

  // ---------- Делегирование кликов по "избранное" и "в корзину" (общее для всех гридов) ----------
  function bindGridActions(grid) {
    grid.addEventListener('click', (e) => {
      const favBtn = e.target.closest('.card__fav');
      if (favBtn) {
        const id = Number(favBtn.dataset.id);
        const active = toggleFavorite(id);
        favBtn.classList.toggle('is-active', active);
        return;
      }
      const addBtn = e.target.closest('.card__add');
      if (addBtn) {
        const id = Number(addBtn.dataset.id);
        const product = PRODUCTS.find((p) => p.id === id);
        if (product && window.OOX_CART) {
          window.OOX_CART.addToCart(product, 1);
        }
        addBtn.textContent = '✓';
        addBtn.style.background = 'var(--color-accent)';
        addBtn.style.color = 'var(--color-bg)';
        setTimeout(() => {
          addBtn.textContent = '+';
          addBtn.style.background = '';
          addBtn.style.color = '';
        }, 1200);
        return;
      }

      // Клик по самой карточке (не по кнопкам) — открыть модалку товара
      const card = e.target.closest('.card');
      if (card && window.OOX_CATALOG) {
        const id = Number(card.dataset.id);
        const product = PRODUCTS.find((p) => p.id === id);
        if (product) window.OOX_CATALOG.openProduct(product);
      }
    });
  }

  function initProductsSection() {
    const grid = document.querySelector('.products__grid');
    const filterBar = document.querySelector('.filters');
    if (!grid) return;

    renderGrid(grid, PRODUCTS);

    if (filterBar) {
      filterBar.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        filterBar.querySelectorAll('button').forEach((b) => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        const cat = btn.dataset.filter;
        const filtered = cat === 'all' ? PRODUCTS : PRODUCTS.filter((p) => p.cat === cat);
        renderGrid(grid, filtered);
      });
    }

    bindGridActions(grid);
  }

  // ---------- НОВАЯ КОЛЛЕКЦИЯ (первые 4 товара с тегом NEW) ----------
  function initCollectionSection() {
    const grid = document.querySelector('.collection__grid');
    if (!grid) return;
    const newest = PRODUCTS.filter((p) => p.tag === 'NEW' || p.tag === 'BESTSELLER').slice(0, 4);
    renderGrid(grid, newest.length ? newest : PRODUCTS.slice(0, 4));
    bindGridActions(grid);
  }

  document.addEventListener('DOMContentLoaded', () => {
    initCollectionSection();
    initProductsSection();
  });

  // Делаем данные доступными другим модулям (корзина, модалка товара, избранное)
  window.OOX_PRODUCTS = PRODUCTS;
  window.OOX_FAVORITES = {
    getFavorites,
    toggleFavorite,
    isFavorite: (id) => getFavorites().includes(id),
  };
})();
