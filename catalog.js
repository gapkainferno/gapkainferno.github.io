import { sanitize } from './utils/sanitizer.js';

const safeText = (value) => sanitize.text(String(value ?? ''));

const isEnglishCatalog = false;

const CATEGORY_PAGES = {
    'all-seeds': {
        url: 'all-seeds.html', navLabel: '🌱 Усе насіння',
        title: 'Каталог насіння',
        description: 'Усе насіння Gapka Homestead Inferno в одному місці — обирайте культуру та знаходьте свої сорти.',
        filterTitle: 'Культура:', filters: []
    },
    seeds: {
        url: 'seedsandseedlings.html',
        navLabel: isEnglishCatalog ? '🌶️ Superhot peppers' : '🌶️ Супергострі перці',
        title: isEnglishCatalog ? 'Hot pepper seeds (Superhots)' : 'Насіння гострих перців (Superhots)',
        description: '',
        filterTitle: isEnglishCatalog ? 'Heat level:' : 'Рівень вогню:',
        filters: isEnglishCatalog ? [
            ['all', 'All'],
            ['1', '🔥'],
            ['2', '🔥🔥'],
            ['3', '🔥🔥🔥'],
            ['4', '☠️']
        ] : [
            ['all', 'Всі'],
            ['1', '🔥'],
            ['2', '🔥🔥'],
            ['3', '🔥🔥🔥'],
            ['4', '☠️']
        ]
    },
    sauces: {
        url: 'sauces.html',
        navLabel: isEnglishCatalog ? '🔥 Craft sauces' : '🔥 Крафтові Соуси',
        title: isEnglishCatalog ? 'INFERNO craft sauces' : 'Крафтові соуси INFERNO',
        description: isEnglishCatalog ? 'Small-batch sauces made from our own peppers: from gentle warmth to total fire.' : 'Малі партії соусів із власних перців: від лагідного тепла до повного вогню.',
        filterTitle: isEnglishCatalog ? 'Heat level:' : 'Рівень гостроти:',
        filters: isEnglishCatalog ? [
            ['all', 'All'],
            ['1', '🔥 Mild'],
            ['2', '🔥🔥 Hot'],
            ['3', '🔥🔥🔥 Infernal']
        ] : [
            ['all', 'Всі'],
            ['1', '🔥 Лагідні'],
            ['2', '🔥🔥 Гарячі'],
            ['3', '🔥🔥🔥 Пекельні']
        ]
    },
    tomatoes: {
        url: 'tomatoes.html',
        navLabel: isEnglishCatalog ? '🍅 Tomato seeds' : '🍅 Насіння томатів',
        title: isEnglishCatalog ? 'Tomato seeds' : 'Насіння томатів',
        description: '',
        filterTitle: isEnglishCatalog ? 'Varieties:' : 'Сорти:',
        filters: []
    },
    'vegetable-seeds': {
        url: 'vegetable-seeds.html',
        navLabel: isEnglishCatalog ? '🫑 Vegetable seeds' : '🫑 Насіння овочів',
        title: isEnglishCatalog ? 'Vegetable seeds' : 'Насіння овочів',
        description: '',
        filterTitle: isEnglishCatalog ? 'Varieties:' : 'Сорти:',
        filters: []
    },
    'fresh-peppers': {
        url: 'fresh-peppers.html',
        navLabel: isEnglishCatalog ? '🌶️ Inferno harvest' : '🌶️ Врожай Пекла',
        title: isEnglishCatalog ? 'Inferno harvest: fresh, dried peppers & pepper products' : 'Врожай Пекла: свіжі, сушені перці та продукти з перців',
        description: '',
        filterTitle: isEnglishCatalog ? 'Product type:' : 'Тип продукту:',
        filters: isEnglishCatalog ? [
            ['all', 'All'],
            ['1', '🥗 Fresh'],
            ['2', '💨 Dried'],
            ['3', '🔥 Pepper products']
        ] : [
            ['all', 'Всі'],
            ['1', '🥗 Свіжі'],
            ['2', '💨 Сушені'],
            ['3', '🔥 Продукти з перців']
        ]
    },
    };

const CATEGORY_NAV = isEnglishCatalog ? [
    {
        key: 'seeds-group',
        url: 'all-seeds.html',
        label: '🌱 Seeds',
        children: [
            { key: 'seeds', url: 'seedsandseedlings.html', label: '🌶️ Superhot peppers' },
            { key: 'tomatoes', url: 'tomatoes.html', label: '🍅 Tomato seeds' },
            { key: 'vegetable-seeds', url: 'vegetable-seeds.html', label: '🫑 Vegetable pepper seeds' }
        ]
    },
    { key: 'sauces', url: 'sauces.html', label: '🔥 Craft sauces' }
] : [
    {
        key: 'seeds-group',
        url: 'all-seeds.html',
        label: '🌱 Насіння',
        children: [
            { key: 'seeds', url: 'seedsandseedlings.html', label: '🌶️ Супергострі перці' },
            { key: 'tomatoes', url: 'tomatoes.html', label: '🍅 Насіння томатів' },
            { key: 'vegetable-seeds', url: 'vegetable-seeds.html', label: '🫑 Насіння овочів' }
        ]
    },
    { key: 'sauces', url: 'sauces.html', label: '🔥 Крафтові соуси' }
];

const HEAT_LEVELS = {
    "1": { shu: "1k-50k", width: "25%" },
    "2": { shu: "50k-500k", width: "50%" },
    "3": { shu: "500k-1M", width: "75%" },
    "4": { shu: "1M-2.2M+", width: "100%" }
};

const SCOVILLE_HELP = {
    title: isEnglishCatalog ? 'What do these numbers mean?' : 'Що означають ці цифри?',
    link: isEnglishCatalog ? '' : 'blog-article.html?id=scoville-scale-explained'
};

const SCOVILLE_DATA = isEnglishCatalog ? {
    "1": { name: "Ancho, Aji Melocoton", shu: "~1,000-50,000", status: "Spicy aroma 🌿", color: "#4C9900" },
    "2": { name: "Sugar Rush, Habanero Dominica", shu: "50,000-577,000", status: "Serious challenge! 🔥", color: "#ffcc00" },
    "3": { name: "Ghost, 7 Pot", shu: "577,000-1,000,000+", status: "Blazing ghost! 🔥🔥", color: "#ff4d00" },
    "4": { name: "Scorpion, Carolina Reaper", shu: "1,000,000-2,200,000+", status: "TOTAL ERUPTION ☠️", color: "#8b0000" }
} : {
    "1": { name: "Ancho, Aji Melocoton", shu: "~1,000-50,000", status: "Пряний аромат 🌿", color: "#4C9900" },
    "2": { name: "Sugar Rush, Habanero Dominica", shu: "50,000-577,000", status: "Серйозний виклик! 🔥", color: "#ffcc00" },
    "3": { name: "Ghost, 7 Pot", shu: "577,000-1,000,000+", status: "Палаючий привид! 🔥🔥", color: "#ff4d00" },
    "4": { name: "Scorpion, Carolina Reaper", shu: "1,000,000-2,200,000+", status: "ПОВНА АНІГІЛЯЦІЯ ☠️", color: "#8b0000" }
};

function buildCategorySidebar(activeCategory) {
    document.querySelectorAll('.main-layout > .sidebar nav ul').forEach(list => {
        const nav = list.closest('nav');
        const sidebar = list.closest('.sidebar');
        if (nav && sidebar && !sidebar.querySelector('.sidebar-menu-toggle')) {
            const menuToggle = document.createElement('button');
            sidebar.classList.add('is-category-collapsible');
            menuToggle.type = 'button';
            menuToggle.className = 'sidebar-menu-toggle';
            menuToggle.setAttribute('aria-expanded', 'false');
            menuToggle.innerHTML = `<span>${isEnglishCatalog ? 'Browse categories' : 'Категорії товарів'}</span><span class="sidebar-menu-chevron" aria-hidden="true">⌄</span>`;
            nav.id = 'category-navigation';
            menuToggle.setAttribute('aria-controls', nav.id);
            nav.setAttribute('aria-label', isEnglishCatalog ? 'Product categories' : 'Категорії товарів');
            nav.before(menuToggle);

            menuToggle.addEventListener('click', () => {
                const isOpen = sidebar.classList.toggle('is-category-menu-open');
                menuToggle.setAttribute('aria-expanded', String(isOpen));
            });
        }

        list.innerHTML = CATEGORY_NAV.map(group => {
            const activeLeafClass = group.key === activeCategory ? ' class="theme-active active"' : '';

            if (group.children) {
                const groupHasActive = group.children.some(child => child.key === activeCategory);
                return `
                    <li class="sidebar-group${groupHasActive ? ' is-open' : ''}">
                        <a class="sidebar-group-label${activeCategory === 'all-seeds' ? ' theme-active active' : ''}" href="${group.url}">${safeText(group.label)}</a>
                        <ul class="sidebar-submenu" id="category-submenu-${safeText(group.key)}">
                            ${group.children.map(child => {
                                const childActiveClass = child.key === activeCategory ? ' class="theme-active active"' : '';
                                return `<li><a href="${child.url}"${childActiveClass}>${safeText(child.label)}</a></li>`;
                            }).join('')}
                        </ul>
                    </li>`;
            }

            return `<li><a href="${group.url}"${activeLeafClass}>${safeText(group.label)}</a></li>`;
        }).join('');
    });
    // Батьківська категорія «Насіння» веде до спільного каталогу; підкатегорії залишаються окремими посиланнями.
}

function renderCategoryIntro(mainGrid, category) {
    const title = mainGrid.querySelector('.page-title');
    if (title) title.textContent = category.title;

    let description = Array.from(mainGrid.children).find(child => child.classList?.contains('description'));
    if (category.description) {
        if (!description) {
            description = document.createElement('p');
            description.className = 'description category-description';
            title?.insertAdjacentElement('afterend', description);
        }
        description.textContent = category.description;
        description.classList.add('category-description');
    } else if (description) {
        description.remove();
    }
}

function renderCategoryFilters(mainGrid, category) {
    let filterSection = mainGrid.querySelector('.filter-section');
    if (!category.filters.length && category !== CATEGORY_PAGES['all-seeds']) {
        filterSection?.remove();
        return;
    }

    const catalogContainer = mainGrid.querySelector('#catalog-container');

    if (!filterSection) {
        filterSection = document.createElement('div');
        filterSection.className = 'filter-section';
        catalogContainer?.insertAdjacentElement('beforebegin', filterSection);
    }

    const extraFilters = category === CATEGORY_PAGES.seeds ? `
        <div class="catalog-extra-filters">
            <label class="catalog-filter-field" for="species-filter">
                <span>Вид перцю</span>
                <select id="species-filter">
                    <option value="all">Усі види</option>
                </select>
            </label>
            <label class="catalog-stock-filter" for="stock-only-filter">
                <input type="checkbox" id="stock-only-filter">
                <span>Лише в наявності</span>
            </label>
        </div>
    ` : category === CATEGORY_PAGES['all-seeds'] ? `
        <div class="catalog-extra-filters">
            <label class="catalog-filter-field" for="seed-category-filter">
                <span>Перейти до каталогу</span>
                <select id="seed-category-filter">
                    <option value="all-seeds">Усе насіння</option>
                    <option value="seeds">Супергострі перці</option>
                    <option value="tomatoes">Томати</option>
                    <option value="vegetable-seeds">Інше насіння</option>
                </select>
            </label>
            <label class="catalog-stock-filter" for="stock-only-filter">
                <input type="checkbox" id="stock-only-filter">
                <span>Лише в наявності</span>
            </label>
        </div>
    ` : '';

    filterSection.innerHTML = `
        <span class="filter-title">${safeText(category.filterTitle)}</span>
        <div class="filter-buttons">
            ${category.filters.map(([value, label], index) => `
                <button class="filter-btn ${index === 0 ? 'active' : ''}" data-heat="${safeText(value)}">
                    ${safeText(label)}
                </button>
            `).join('')}
        </div>
        ${extraFilters}
    `;

    if (category === CATEGORY_PAGES.seeds) {
        const speciesSelect = filterSection.querySelector('#species-filter');
        const speciesByKey = new Map();
        Object.values(allProducts)
            .filter(product => product && product.category === 'seeds' && product.specs?.species)
            .forEach(product => {
                const value = String(product.specs.species)
                    .normalize('NFKC')
                    .replace(/\s+/g, ' ')
                    .trim();
                if (!value) return;
                const key = value.toLocaleLowerCase('uk');
                if (!speciesByKey.has(key)) speciesByKey.set(key, value);
            });
        const species = [...speciesByKey.values()].sort((a, b) => a.localeCompare(b, 'uk'));
        species.forEach(value => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = value;
            speciesSelect.appendChild(option);
        });
    }
}

function prepareCategoryPage(mainGrid, pageCategory) {
    const category = CATEGORY_PAGES[pageCategory];
    if (!category) return;

    buildCategorySidebar(pageCategory);
    renderCategoryIntro(mainGrid, category);
    renderCategoryFilters(mainGrid, category);
}

function getDescriptionText(product) {
    return product.description
        ? product.description.replace(/<[^>]*>/g, '').substring(0, 130) + '...'
        : '';
}

function getMiniSpecsHTML(product) {
    const specs = [];
    const s = product.specs || {};
    const isSeed = ['seeds', 'tomatoes', 'vegetable-seeds'].includes(product.category);

    // Для насіння головне на картці — фасування та числовий діапазон SHU.
    if (isSeed && product.meta?.count) {
        specs.push({ label: 'У пакетику', value: product.meta.count });
    }

    if (product.category === 'seeds' && product.heatLevel) {
        const shuMatch = product.heatLevel.match(/\(([^()]*)\)/);
        const shuValue = shuMatch?.[1]?.match(/[\d,.\s–—+-]+\s*SHU/i)?.[0]?.trim();
        if (shuValue) {
            specs.push({ label: 'Гострота', value: shuValue.replace(/\\s+/g, ' ') });
        }
    }

    // Решту характеристик залишаємо на сторінці товару; картка зберігає лише
    // короткі додаткові відомості, які не дублюють висоту чи дозрівання.
    if ((product.category === 'tomatoes' || product.category === 'vegetable-seeds') && s.color && s.color.trim() !== '' && s.color.trim() !== '-') {
        specs.push({ label: 'Колір', value: s.color });
    }

    if (specs.length === 0) return '';

    const specsHTML = specs.map(spec => `
        <div class="spec-item">
            <span class="spec-label">${safeText(spec.label)}</span>
            <span class="spec-value">
                ${safeText(spec.value)}
                ${spec.label === 'Гострота' && SCOVILLE_HELP.link ? `<span class="scoville-help-text" role="link" tabindex="0" aria-label="${safeText(SCOVILLE_HELP.title)}" title="${safeText(SCOVILLE_HELP.title)}" onclick="event.stopPropagation(); event.preventDefault(); window.location.href='${SCOVILLE_HELP.link}'; return false;" onkeydown="if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); this.click(); }">Що таке SHU?</span>` : ''}
            </span>
        </div>
    `).join('');

    return `<div class="product-specs-mini">${specsHTML}</div>`;
}

function hasScovilleInfo(product) {
    return product.category === 'sauces' || (!product.isSpicy && /\bSHU\b/i.test(product.heatLevel || ''));
}

function getTagsHTML(product) {
    let tagsHTML = '';
    if (product.isNew) tagsHTML += '<span class="product-tag new">NEW</span>';
    if (product.isSpicy) tagsHTML += '<span class="product-tag hot">🌶️ ГОСТРИЙ</span>';
    else if (product.isHot) tagsHTML += '<span class="product-tag hot">🔥 HOT</span>';
    if (product.isFlavor) tagsHTML += `<span class="product-tag flavor">${safeText(product.isFlavor)}</span>`;
    return tagsHTML;
}

function renderProductCard(id, product) {
    const currentHeat = HEAT_LEVELS[product.heatScore] || { shu: "Unknown", width: "0%" };
    const hasHeatInfo = hasScovilleInfo(product);
    const isInStock = product.inStock !== false;
    const productDisplayName = window.getProductDisplayName?.(product) || product.name;
    const descriptionText = getDescriptionText(product);
    const productImage = Array.isArray(product.images)
        ? product.images.find(image => typeof image === 'string' && image.trim() && !/placeholder/i.test(image))
        : '';
    const mutedImageClass = isInStock ? '' : ' muted-product-img';
    const mutedPriceClass = isInStock ? '' : ' muted-card-price';

    return `
        <a href="product.html?id=${safeText(id)}" class="product-card ${isInStock ? '' : 'out-of-stock'}" data-id="${safeText(id)}" data-category="${safeText(product.category)}">
            <div class="product-tags">${getTagsHTML(product)}</div>
            <div class="img-container${productImage ? '' : ' is-image-missing'}">
                ${productImage
                    ? `<img src="${safeText(productImage)}" alt="${safeText(productDisplayName)}" loading="lazy" class="${mutedImageClass}">`
                    : '<span class="image-missing-label">Фото буде додано</span>'}


                ${isInStock ? `
                    <button class="quick-add-btn"
                            onclick="event.stopPropagation(); event.preventDefault(); addToCartDirectly('${safeText(id)}', this); return false;"
                            aria-label="Додати ${safeText(productDisplayName)} у кошик">
                        🛒
                    </button>
                ` : ''}
            </div>

            <div class="product-label">
                <div class="name-price-row">
                    <h3 class="p-name">${safeText(productDisplayName)}</h3>
                    <p class="card-price${mutedPriceClass}"
                       data-base-price="${safeText(product.price)}"
                       data-allow-sale="${product.allowSale === true ? 'true' : 'false'}">
                        ${false && typeof window.formatEnglishPrice === 'function' 
                            ? window.formatEnglishPrice(product.price)
                            : `${safeText(product.price)} ₴`}
                    </p>
                </div>
                ${descriptionText ? `<p class="product-description-short">${safeText(descriptionText)}</p>` : '<p class="product-description-short is-empty"></p>'}
                ${getMiniSpecsHTML(product)}
            </div>
        </a>
    `;
}

function renderCatalog(container, pageCategory) {
    container.innerHTML = '';

    const productIds = Object.keys(allProducts)
        .filter(id => {
            const product = allProducts[id];
            const seedCategories = ['seeds', 'tomatoes', 'vegetable-seeds'];
            const matchesCategory = pageCategory === 'all-seeds'
                ? seedCategories.includes(product.category)
                : (!pageCategory || product.category === pageCategory);
            return !product.isHidden && matchesCategory;
        })
        .sort((a, b) => Number(allProducts[a].inStock === false) - Number(allProducts[b].inStock === false));

    productIds.forEach(id => {
        const product = allProducts[id];
        container.insertAdjacentHTML('beforeend', renderProductCard(id, product));
    });

    if (typeof applyGlobalSale === 'function') {
        applyGlobalSale();
    }
}

function renderSauceBundle(pageCategory) {
    if (pageCategory !== 'sauces') return;

    const bundleSection = document.getElementById('sauce-bundle');
    const bundleItems = document.getElementById('sauce-bundle-items');
    const addButton = document.getElementById('sauce-bundle-add');
    const sauceIds = ['sauceCoreHeat', 'sauceMildForest', 'sauceCarrotMadness', 'sauceMeanForest'];
    const bundlePrice = Number(window.orderBundles?.bundle_sauce_pack?.price);

    if (!bundleSection || !bundleItems || !addButton) return;

    const availableSauces = sauceIds
        .map(id => [id, allProducts[id]])
        .filter(([, product]) => product && product.category === 'sauces' && !product.isHidden && product.inStock !== false);

    if (availableSauces.length !== sauceIds.length) {
        bundleSection.hidden = true;
        return;
    }

    const originalPrice = availableSauces.reduce((total, [, product]) => total + Number(product.price), 0);
    bundleItems.replaceChildren();

    availableSauces.forEach(([, product]) => {
        const item = document.createElement('div');
        item.className = 'sauce-bundle-item';

        const imageSource = Array.isArray(product.images)
            ? product.images.find(image => typeof image === 'string' && image.trim() && !/placeholder/i.test(image))
            : '';
        if (imageSource) {
            const image = document.createElement('img');
            image.src = imageSource;
            image.alt = window.getProductDisplayName?.(product) || product.name;
            image.loading = 'lazy';
            item.append(image);
        }

        const name = document.createElement('span');
        name.textContent = window.getProductDisplayName?.(product) || product.name;
        item.append(name);
        bundleItems.append(item);
    });

    const originalPriceElement = document.getElementById('sauce-bundle-original-price');
    if (originalPriceElement) originalPriceElement.textContent = `${originalPrice.toFixed(2)} ₴`;

    addButton.addEventListener('click', () => {
        const stillAvailable = sauceIds.every(id => {
            const product = allProducts[id];
            return product && product.category === 'sauces' && !product.isHidden && product.inStock !== false;
        });
        if (!stillAvailable) {
            bundleSection.hidden = true;
            alert('Набір тимчасово недоступний: перевірте наявність соусів.');
            return;
        }

        const added = window.addToCart(
            'bundle_sauce_pack',
            bundlePrice,
            'Пак із чотирьох соусів',
            1,
            originalPrice,
            'sauces-inferno-assortment.webp'
        );
        if (!added) {
            alert('Не вдалося додати набір. Спробуйте ще раз за кілька секунд.');
            return;
        }
        alert('🔥 Пак із чотирьох соусів додано у кошик!');
    });

    bundleSection.hidden = false;
}

function initCatalogPagination(container, mainGrid) {
    const pagination = document.createElement('nav');
    pagination.className = 'catalog-pagination';
    pagination.setAttribute('aria-label', 'Сторінки каталогу');
    pagination.hidden = true;
    container.insertAdjacentElement('afterend', pagination);

    let currentPage = 1;
    let pageSize = 12;

    const getColumns = () => {
        const template = getComputedStyle(container).gridTemplateColumns;
        const columns = template.trim().split(/\s+/).filter(Boolean).length;
        return Math.max(1, columns || 1);
    };

    const getFilteredCards = () => Array.from(container.querySelectorAll('.product-card'))
        .filter(card => !card.classList.contains('is-filtered-out'));

    const render = (reset = false) => {
        const cards = Array.from(container.querySelectorAll('.product-card'));
        const filteredCards = getFilteredCards();
        pageSize = window.matchMedia('(max-width: 760px)').matches ? 12 : getColumns() * 3;
        const totalPages = Math.max(1, Math.ceil(filteredCards.length / pageSize));
        if (reset) currentPage = 1;
        currentPage = Math.min(currentPage, totalPages);

        const visibleCards = new Set(filteredCards.slice((currentPage - 1) * pageSize, currentPage * pageSize));
        cards.forEach(card => card.classList.toggle('is-page-hidden', !visibleCards.has(card)));

        pagination.hidden = totalPages <= 1;
        if (totalPages <= 1) {
            pagination.replaceChildren();
            return;
        }

        pagination.innerHTML = `
            <button type="button" class="catalog-page-arrow" data-page="prev" aria-label="Попередня сторінка" ${currentPage === 1 ? 'disabled' : ''}>‹</button>
            <div class="catalog-page-numbers">
                ${Array.from({ length: totalPages }, (_, index) => {
                    const page = index + 1;
                    return `<button type="button" class="catalog-page-number ${page === currentPage ? 'is-active' : ''}" data-page="${page}" aria-label="Сторінка ${page}" aria-current="${page === currentPage ? 'page' : 'false'}">${page}</button>`;
                }).join('')}
            </div>
            <button type="button" class="catalog-page-arrow" data-page="next" aria-label="Наступна сторінка" ${currentPage === totalPages ? 'disabled' : ''}>›</button>
        `;
    };

    pagination.addEventListener('click', event => {
        const button = event.target.closest('button[data-page]');
        if (!button || button.disabled) return;
        const filteredCards = getFilteredCards();
        const totalPages = Math.max(1, Math.ceil(filteredCards.length / pageSize));
        const target = button.dataset.page;
        if (target === 'prev') currentPage--;
        else if (target === 'next') currentPage++;
        else currentPage = Number(target);
        currentPage = Math.max(1, Math.min(currentPage, totalPages));
        render();
        document.querySelector('.main-layout')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    let resizeFrame = null;
    window.addEventListener('resize', () => {
        if (resizeFrame) cancelAnimationFrame(resizeFrame);
        resizeFrame = requestAnimationFrame(() => render());
    });

    render();
    return { refresh: render };
}

function initFilters(mainGrid) {
    const filterButtons = mainGrid.querySelectorAll('.filter-btn');
    let selectedHeat = 'all';
    const speciesSelect = mainGrid.querySelector('#species-filter');
    const stockOnly = mainGrid.querySelector('#stock-only-filter');
    const pagination = initCatalogPagination(mainGrid.querySelector('#catalog-container'), mainGrid);

    const applyFilters = () => {
        mainGrid.querySelectorAll('.product-card').forEach(card => {
            const productId = card.getAttribute('data-id');
            const product = allProducts[productId];
            if (!product) return;

            const heatMatches = selectedHeat === 'all' || String(product.heatScore || '') === selectedHeat;
            const selectedSpecies = speciesSelect?.value || 'all';
            const speciesMatches = selectedSpecies === 'all' ||
                String(product.specs?.species || '').normalize('NFKC').replace(/\s+/g, ' ').trim().toLocaleLowerCase('uk') ===
                selectedSpecies.normalize('NFKC').replace(/\s+/g, ' ').trim().toLocaleLowerCase('uk');
            const stockMatches = !stockOnly?.checked ||
                (product.inStock === true && product.allowSale === true && product.isHidden !== true);

            card.classList.toggle('is-filtered-out', !(heatMatches && speciesMatches && stockMatches));
        });
        pagination?.refresh(true);
    };

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(button => button.classList.remove('active'));
            btn.classList.add('active');
            selectedHeat = btn.getAttribute('data-heat') || 'all';
            applyFilters();
        });
    });

    speciesSelect?.addEventListener('change', applyFilters);
    const seedCategorySelect = mainGrid.querySelector('#seed-category-filter');
    seedCategorySelect?.addEventListener('change', () => {
        const targetCategory = seedCategorySelect.value;
        const targetPage = CATEGORY_PAGES[targetCategory];
        if (targetPage?.url) window.location.href = targetPage.url;
    });
    stockOnly?.addEventListener('change', applyFilters);

    const slider = document.getElementById('scoville-slider');
    if (!slider) return;

    const pepperName = document.getElementById('pepper-name');
    const pepperShu = document.getElementById('pepper-shu');
    const heatStatus = document.getElementById('heat-status');
    const display = document.getElementById('thermometer-display');
    const resetBtn = document.getElementById('reset-scoville');

    const updateThermometerDisplay = (value) => {
        const data = SCOVILLE_DATA[value];
        if (!data) return;
        if (pepperName) pepperName.innerText = data.name;
        if (pepperShu) pepperShu.innerText = data.shu + " SHU";
        if (heatStatus) heatStatus.innerText = "Рівень: " + data.status;
        if (display) {
            display.style.borderColor = data.color;
            display.style.boxShadow = `inset 0 0 10px ${data.color}`;
        }
    };

    resetBtn?.addEventListener('click', () => {
        slider.value = 1;
        updateThermometerDisplay('1');
        selectedHeat = 'all';
        if (speciesSelect) speciesSelect.value = 'all';
        if (stockOnly) stockOnly.checked = false;
        filterButtons.forEach(button => button.classList.remove('active'));
        mainGrid.querySelector('.filter-btn[data-heat="all"]')?.classList.add('active');
        applyFilters();
    });

    slider.addEventListener('input', function() {
        updateThermometerDisplay(this.value);
    });

    slider.addEventListener('change', function() {
        selectedHeat = this.value;
        const targetBtn = mainGrid.querySelector(`.filter-btn[data-heat="${selectedHeat}"]`);
        if (targetBtn) {
            filterButtons.forEach(button => button.classList.remove('active'));
            targetBtn.classList.add('active');
        }
        applyFilters();
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('catalog-container');
    const mainGrid = document.querySelector('.products-grid');

    if (container && mainGrid && typeof allProducts !== 'undefined') {
        const pageCategory = mainGrid.getAttribute('data-category');
        prepareCategoryPage(mainGrid, pageCategory);
        renderCatalog(container, pageCategory);
        renderSauceBundle(pageCategory);
        initFilters(mainGrid);
    }
});

function goBack() {
    if (window.history.length > 1) window.history.back();
    else window.location.href = 'index.html';
}

window.goBack = goBack;

const topBtn = document.createElement('button');
topBtn.innerHTML = '🔝🌶️';
topBtn.className = 'back-to-top';
document.body.appendChild(topBtn);

window.onscroll = function() {
    topBtn.style.display = (document.body.scrollTop > 100 || document.documentElement.scrollTop > 100) ? "block" : "none";
};

topBtn.onclick = function() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
};
