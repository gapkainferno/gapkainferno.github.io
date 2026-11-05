
// ✅ RATE LIMITING - Запобігаємо спаму на оформлення замовлення
// Видаляємо персональні дані, збережені старими версіями кошика.
try {
    ['saved_name', 'saved_phone', 'saved_email', 'saved_city', 'saved_city_ref',
     'saved_branch', 'saved_address', 'saved_zip', 'saved_country', 'saved_state']
        .forEach(key => localStorage.removeItem(key));
} catch (_) {}

const orderRateLimiter = {
    lastSubmit: 0,
    minInterval: 30000,  // Мінімум 30 секунд між спробами
    canSubmit() {
        const now = Date.now();
        if (now - this.lastSubmit < this.minInterval) {
            console.warn('⏱️ Rate limit: спроба реєстрації замовлення занадто часто');
            return false;
        }
        this.lastSubmit = now;
        return true;
    }
};

const GLOBAL_SETTINGS = {
    // Щоб відкрити магазин: isCategoryLockActive: false або lockedCategories: []
    isCategoryLockActive: false,
    lockedCategories: ['sauces', 'seeds', 'tomatoes', 'vegetable-seeds', 'fresh-peppers'],
    lockedCategoryTitle: 'Незабаром',
    lockedCategoryText: 'Розділ готується до старту 2026 🔥',
    lockedCategoryAlert: '🌶️ Цей розділ ще в розробці. Чекаємо на вас восени 2026!'
};

// ===== ЄДИНИЙ ПУЛЬТ АКЦІЙ =====
// Щоб запустити акцію: isActive: true і потрібний discountPercent.
// Щоб вимкнути банер, але лишити знижки: banner.isActive: false.
const SALE_SETTINGS = {
    isActive: false,
    discountPercent: 10,
    deadline: "", // Наприклад: "2026-09-30T23:59:59+03:00"
    badgeText: "АКЦІЯ",
    banner: {
        isActive: false,
        text: ""
    }
};

const CATEGORY_LOCK_CONFIG = {
    sauces: {
        cardSelector: '.card-link.sauces',
        pagePattern: /sauces(\.html)?$/,
        productCategories: ['sauces']
    },
    seeds: {
        cardSelector: '.card-link.seeds',
        pagePattern: /seedsandseedlings(\.html)?$/,
        productCategories: ['seeds', 'seedlings']
    },
    tomatoes: {
        cardSelector: '.card-link.tomatoes',
        pagePattern: /tomatoes(\.html)?$/,
        productCategories: ['tomatoes']
    },
    'vegetable-seeds': {
        cardSelector: '.card-link.vegetable-seeds',
        pagePattern: /vegetable-seeds(\.html)?$/,
        productCategories: ['vegetable-seeds']
    },
    'fresh-peppers': {
        cardSelector: '.card-link.fresh-peppers',
        pagePattern: /fresh-peppers(\.html)?$/,
        productCategories: ['fresh-peppers']
    }
};

function getLockedCategoryKeys() {
    if (!GLOBAL_SETTINGS.isCategoryLockActive || !Array.isArray(GLOBAL_SETTINGS.lockedCategories)) {
        return [];
    }

    return GLOBAL_SETTINGS.lockedCategories;
}

function isProductCategoryLocked(productCategory) {
    if (!productCategory) return false;

    return getLockedCategoryKeys().some(cat => {
        const config = CATEGORY_LOCK_CONFIG[cat];
        const productCategories = config && config.productCategories ? config.productCategories : [cat];
        return productCategories.includes(productCategory);
    });
}

function isProductLocked(product) {
    return !!product && isProductCategoryLocked(product.rawCategory || product.category);
}

window.isProductLocked = isProductLocked;
window.getLockedCategoryAlert = function() {
    return GLOBAL_SETTINGS.lockedCategoryAlert || 'Цей розділ тимчасово недоступний.';
};

function isProductOrderable(product) {
    return !!product && !product.isHidden && product.inStock !== false && !isProductLocked(product);
}

function getCartValidationError(cart) {
    if (!Array.isArray(cart) || cart.length === 0) {
        return 'Кошик порожній.';
    }

    if (typeof allProducts === 'undefined') {
        return null;
    }

    for (const item of cart) {
        if (item.productId && item.productId.startsWith('bundle_')) continue;

        const product = item.productId ? allProducts[item.productId] : null;
        if (!product) {
            return `Товар "${item.name || 'без назви'}" більше не доступний. Оновіть кошик.`;
        }

        if (isProductLocked(product)) {
            const productName = window.getProductDisplayName?.(product) || product.name;
            return `Товар "${productName}" зараз недоступний до запуску.`;
        }

        if (product.inStock === false) {
            const productName = window.getProductDisplayName?.(product) || product.name;
            return `Товар "${productName}" зараз відсутній у наявності.`;
        }
    }

    return null;
}

const CART_CONSTANTS = {
    MAX_QTY: 100,           // Максимальна кількість товару
    MAX_NAME_LENGTH: 200,   // Максимальна довжина назви
    MAX_DISCOUNT: 0.35,     // Максимальна знижка (35%)
    MAX_ORDERS_PER_MINUTE: 5 // Rate limiting
};

// ===== ОКРЕМИЙ ENDPOINT ПРОКСІ НОВОЇ ПОШТИ =====
const NP_SETTINGS = {
    apiUrl: 'https://script.google.com/macros/s/AKfycbyM4hOHvoUThsKDWSjPPR84TLh_D5SrvBJW3qmly4r2xWk6u2wBO1GVavU1jDUULM83Xg/exec'
};

// ===== ФУНКЦІЯ ЗАХИСТУ ВІД XSS АТАК =====
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function sanitizeInput(text, maxLength = 100) {
    if (!text) return '';
    
    // 1. Конвертуємо в рядок
    text = String(text);
    
    // 2. Видаляємо HTML теги (більш надійний вираз)
    text = text.replace(/<\/?[^>]+(>|$)/g, "");
    
    // 3. Видаляємо потенційно небезпечні технічні символи, зберігаючи пунктуацію
    text = text.replace(/[<>\\]/g, '');
    
    // 4. Видаляємо зайві пробіли
    text = text.trim().replace(/\s+/g, ' ');
    
    // 5. Обмежуємо довжину
    text = text.substring(0, maxLength);
    
    return text;
}


// ===== ВАЛІДАЦІЯ ЦІН (ЗАХИСТ ВІД МАНІПУЛЯЦІЙ) =====
function getSaleConfig() {
    const discount = Number(SALE_SETTINGS.discountPercent) || 0;
    const deadline = SALE_SETTINGS.deadline ? new Date(SALE_SETTINGS.deadline) : null;
    const hasDeadlinePassed = deadline instanceof Date && !Number.isNaN(deadline.getTime()) && Date.now() > deadline.getTime();

    return {
        isActive: SALE_SETTINGS.isActive === true && discount > 0 && !hasDeadlinePassed,
        discountPercent: Math.min(Math.max(discount, 0), 90),
        badgeText: SALE_SETTINGS.badgeText || "АКЦІЯ",
        bannerText: SALE_SETTINGS.banner?.text || "",
        isBannerActive: SALE_SETTINGS.banner?.isActive === true
    };
}

function isSaleAllowed(product) {
    return getSaleConfig().isActive && !!product && product.allowSale === true;
}

function getDiscountedPrice(basePrice, product) {
    const price = Number(basePrice);
    if (!Number.isFinite(price)) return 0;

    const sale = getSaleConfig();
    if (!sale.isActive || !product || product.allowSale !== true) {
        return price;
    }

    return Math.round(price * (1 - sale.discountPercent / 100));
}

function getPriceVariants(product) {
    if (!product) return [];

    const basePrices = [product.price];
    if (product.seedVersions) {
        Object.values(product.seedVersions).forEach(version => basePrices.push(version.price));
    }

    return basePrices
        .map(price => getDiscountedPrice(price, product))
        .filter(price => Number.isFinite(price));
}

function getCartItemBasePrice(item, product) {
    if (!item || !product) return 0;

    if (item.versionKey && product.seedVersions?.[item.versionKey]) {
        return Number(product.seedVersions[item.versionKey].price) || 0;
    }

    if (product.seedVersions) {
        const itemName = String(item.name || '').toLowerCase();
        const matchedVersion = Object.entries(product.seedVersions).find(([, version]) => {
            return version.label && itemName.includes(String(version.label).toLowerCase());
        });

        if (matchedVersion) {
            item.versionKey = matchedVersion[0];
            return Number(matchedVersion[1].price) || 0;
        }
    }

    return Number(product.price) || 0;
}

function syncCartPrices(cart, options = {}) {
    if (!Array.isArray(cart) || typeof allProducts === 'undefined') {
        return { cart: Array.isArray(cart) ? cart : [], changed: false };
    }

    let changed = false;

    const syncedCart = cart.map(item => {
        if (!item?.productId || item.productId.startsWith('bundle_')) {
            return item;
        }

        const product = allProducts[item.productId];
        if (!product) return item;

        const previousVersionKey = item.versionKey || null;
        const basePrice = getCartItemBasePrice(item, product);
        const currentPrice = getDiscountedPrice(basePrice, product);
        const normalizedOriginalPrice = basePrice || item.originalPrice || item.price;

        if ((item.versionKey || null) !== previousVersionKey) {
            changed = true;
        }

        if (Math.abs(Number(item.price) - currentPrice) > 0.01) {
            item.price = currentPrice;
            changed = true;
        }

        if (Math.abs(Number(item.originalPrice || 0) - normalizedOriginalPrice) > 0.01) {
            item.originalPrice = normalizedOriginalPrice;
            changed = true;
        }

        return item;
    });

    if (changed && options.save) {
        saveCart(syncedCart);
        console.log('🛒 Кошик синхронізовано з актуальними цінами та акціями.');
    }

    return { cart: syncedCart, changed };
}

function renderSalePriceHTML(basePrice, salePrice, suffix = "") {
    if (salePrice < basePrice) {
        const oldPriceHtml = false && typeof window.formatEnglishPrice === 'function'
            ? window.formatEnglishPrice(Number(basePrice))
            : `${Number(basePrice).toFixed(2)} ₴`;
        const salePriceHtml = false && typeof window.formatEnglishPrice === 'function'
            ? window.formatEnglishPrice(Number(salePrice))
            : `${Number(salePrice).toFixed(2)} ₴`;
        return `
            <span class="old-price">${oldPriceHtml}</span>
            <span class="sale-price">${salePriceHtml}</span>${suffix}
        `;
    }

    if (false && typeof window.formatEnglishPrice === 'function') {
        return window.formatEnglishPrice(Number(basePrice)) + suffix;
    }
    return `${Number(basePrice).toFixed(2)} ₴${suffix}`;
}

window.getSaleConfig = getSaleConfig;
window.isSaleAllowed = isSaleAllowed;
window.getDiscountedPrice = getDiscountedPrice;
window.renderSalePriceHTML = renderSalePriceHTML;
window.syncCartPrices = syncCartPrices;

function validatePrice(productId, price) {
    if (productId && productId.startsWith('bundle_')) return price;

    if (typeof allProducts === 'undefined' || !allProducts[productId]) {
        console.warn('⚠️ Товар не знайдено:', productId);
        return price;
    }
    
    const product = allProducts[productId];
    const expectedPrices = getPriceVariants(product);

    // Тепер порівнюємо з точністю до 1 гривні (на випадок нюансів округлення)
    const isValid = expectedPrices.some(ep => Math.abs(price - ep) <= 1);

    if (!isValid) {
        console.warn('⚠️ Підозріла ціна для', productId);
        console.warn('   Дозволені варіанти:', expectedPrices);
        console.warn('   Отримано:', price);
        return getDiscountedPrice(product.price, product);
    }

    return price;
}

function applyGlobalSale() {
    const sale = getSaleConfig();

    document.querySelectorAll('.card-price').forEach(el => {
        const basePrice = parseFloat(el.getAttribute('data-base-price'));
        const productId = el.closest('.product-card')?.getAttribute('data-id');
        const product = productId && typeof allProducts !== 'undefined' ? allProducts[productId] : null;
        const salePrice = getDiscountedPrice(basePrice, product);
        const card = el.closest('.product-card');
        const cardBtn = card?.querySelector('.quick-add-btn');
        const existingBadge = card?.querySelector('.sale-badge');

        el.innerHTML = renderSalePriceHTML(basePrice, salePrice);
        if (cardBtn) cardBtn.setAttribute('data-price', salePrice);

        if (card && salePrice < basePrice) {
            card.style.position = 'relative';
            if (!existingBadge) {
                const badge = document.createElement('div');
                badge.className = 'sale-badge';
                badge.innerText = sale.badgeText;
                card.appendChild(badge);
            } else {
                existingBadge.innerText = sale.badgeText;
            }
        } else if (existingBadge) {
            existingBadge.remove();
        }
    });

    if (sale.isBannerActive && sale.bannerText && !document.getElementById('sale-banner')) {
        const banner = document.createElement('div');
        banner.id = "sale-banner";
        banner.style.cssText = "background: #e74c3c; color: white; text-align: center; padding: 12px 20px; font-weight: bold; position: fixed; top: 0; left: 0; width: 100%; z-index: 10000; font-family: 'Oswald', sans-serif; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 2px 10px rgba(0,0,0,0.5); font-size: 14px;";
        banner.innerText = sale.bannerText;
        document.body.prepend(banner);
        document.body.classList.add('has-sale-banner');
    }
}

// Функція для блокування категорій "Скоро у продажу"
function applyCategoryLock() {
    const lockedCategoryKeys = getLockedCategoryKeys();

    if (lockedCategoryKeys.length === 0) {
        return;
    }

    const lockedCategories = new Set(lockedCategoryKeys);
    const currentPath = window.location.pathname.toLowerCase();
    const currentProductId = new URLSearchParams(window.location.search).get('id');
    let shouldRedirect = false;

    lockedCategories.forEach(cat => {
        const config = CATEGORY_LOCK_CONFIG[cat] || {};
        const selector = config.cardSelector || `.card-link.${cat}`;
        const links = document.querySelectorAll(selector);
        
        links.forEach(link => {
            link.classList.add('is-locked');

            // Додаємо візуальний оверлей "Незабаром", якщо його ще немає
            if (!link.querySelector('.coming-soon-overlay')) {
                const overlay = document.createElement('div');
                overlay.className = 'coming-soon-overlay';
                overlay.style.opacity = '1'; // Робимо його видимим одразу
                overlay.innerHTML = `
                    <div class="coming-soon-content">
                        <h3>${escapeHtml(GLOBAL_SETTINGS.lockedCategoryTitle)}</h3>
                        <p>${escapeHtml(GLOBAL_SETTINGS.lockedCategoryText)}</p>
                    </div>
                `;
                link.appendChild(overlay);
            }

            link.addEventListener('click', (e) => {
                e.preventDefault();
                alert(GLOBAL_SETTINGS.lockedCategoryAlert);
            });
        });

        if (config.pagePattern && config.pagePattern.test(currentPath)) {
            shouldRedirect = true;
        }
    });

    if (currentPath.includes('product.html') && currentProductId && typeof allProducts !== 'undefined') {
        const product = allProducts[currentProductId];

        if (product) {
            shouldRedirect = isProductLocked(product);
        }
    }

    if (shouldRedirect) {
        console.warn('⛔ Користувач спробував зайти на заблоковану сторінку:', currentPath);
        window.location.href = 'index.html'; // Редирект на головну
    }
}

document.addEventListener('DOMContentLoaded', () => {
    applyGlobalSale();
    applyCategoryLock();
});

// === 1. РОБОТА З ПАМ'ЯТТЮ ===
function getFreshCart() {
    try {
        const cart = JSON.parse(localStorage.getItem('homestead_cart')) || [];
        return cart.map(item => {
            const product = item.productId && typeof allProducts !== 'undefined'
                ? allProducts[item.productId]
                : null;
            if (!product || typeof window.getProductDisplayName !== 'function') return item;
            return { ...item, name: window.getProductDisplayName(product, item.name) };
        });
    }
    catch (e) { return []; }
}
function saveCart(cart) { localStorage.setItem('homestead_cart', JSON.stringify(cart)); }

// === 2. ОНОВЛЕННЯ ІНТЕРФЕЙСУ ===
function updateCartUI() {
    let cart = getFreshCart(); 

    // ✅ АВТО-ОЧИЩЕННЯ: Видаляємо товари, яких більше немає в базі (products.js)
    if (typeof allProducts !== 'undefined' && cart.length > 0) {
        const originalLength = cart.length;
        cart = cart.filter(item => {
            // Бандли (Box) з головної сторінки не внесені в products.js, тому їх не видаляємо
            if (item.productId && item.productId.startsWith('bundle_')) return true;
            
            // Перевіряємо наявність і доступність ID у глобальному об'єкті allProducts
            return isProductOrderable(allProducts[item.productId]);
        });

        if (cart.length !== originalLength) {
            saveCart(cart);
            console.log('🛒 Кошик синхронізовано: видалено застарілі товари, яких немає в базі');
        }

        cart = syncCartPrices(cart, { save: true }).cart;
    }

    const totalQty = cart.reduce((acc, item) => acc + item.qty, 0);
    const totalSum = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);

    // Кешуємо елементи для продуктивності
    const cartCounts = document.querySelectorAll('.cart-count, #cart-count, .cart-badge');
    cartCounts.forEach(c => { c.innerText = totalQty; });

    const listContainers = document.querySelectorAll('#final-list, .cart-items-container');
    listContainers.forEach(container => {
        if (cart.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 30px 10px;">
                    <p class="empty-cart-msg" style="margin-bottom: 20px;">Ваш кошик ще порожній 🌶️</p>
                    <a href="index.html" class="add-btn" style="display: inline-block; width: auto; margin: 0 !important; text-decoration: none;" onclick="closeCheckout()">Перейти до каталогу</a>
                </div>
            `;
        } else {
            const fragment = document.createDocumentFragment(); // Використовуємо фрагмент для продуктивності
            cart.forEach((item, index) => {
                // Перевіряємо, чи є стара ціна для відображення закреслення
                const hasDiscount = item.originalPrice && item.originalPrice > item.price;
                const priceDisplay = hasDiscount 
                    ? `<span style="text-decoration: line-through; opacity: 0.5; font-size: 0.85em; margin-right: 5px;">${parseFloat(item.originalPrice).toFixed(2)} ₴</span>${parseFloat(item.price).toFixed(2)} ₴`
                    : (false && typeof window.formatEnglishPrice === 'function'
                        ? window.formatEnglishPrice(parseFloat(item.price))
                        : `${parseFloat(item.price).toFixed(2)} ₴`);
                
                // Перевірка на існування товару в базі (захист від видалених ID)
                const productData = (typeof allProducts !== 'undefined' && item.productId) 
                                    ? allProducts[item.productId] 
                                    : null;

                // Пріоритет:
                // 1. Пряме посилання збережене в об'єкті товару (item.image)
                // 2. Фото з бази allProducts (якщо знайдено по ID)
                // 3. Заглушка (логотип)
                let imageUrl = item.image || (productData && productData.images && productData.images[0]) || 'GapkaLogo.png';
                
                if (!imageUrl || imageUrl === 'null') imageUrl = 'GapkaLogo.png';

                // Використовуємо збережену назву з кошика (вона містить версію), 
                // або беремо з бази, або ставимо дефолтну заглушку
                const safeName = item.name
                    ? (productData && typeof window.getProductDisplayName === 'function'
                        ? window.getProductDisplayName(productData, item.name)
                        : item.name)
                    : (productData && typeof window.getProductDisplayName === 'function'
                        ? window.getProductDisplayName(productData)
                        : productData?.name || 'Товар');

                const itemDiv = document.createElement('div');
                itemDiv.className = 'cart-item';
                itemDiv.innerHTML = `
                    <div class="cart-item-image-wrapper">
                        <img src="${imageUrl}" alt="${escapeHtml(safeName)}" class="cart-item-img">
                    </div>
                    <div class="cart-item-info">
                        <div class="cart-item-name">${escapeHtml(safeName)}</div>
                        <div class="cart-item-details">
                            ${priceDisplay} 
                            <span style="opacity: 0.7; font-size: 0.9em;">
                                ${
                                    (item.name.toLowerCase().includes('соус') || item.name.toLowerCase().includes('sauce')) 
                                    ? '/ шт.' 
                                    : (item.name.toLowerCase().includes('box') || item.name.toLowerCase().includes('набір'))
                                    ? '/ за набір' 
                                    : '/ за пакет з насінням'
                                }
                            </span>
                        </div>
                    </div>
                    <div class="cart-item-actions">
                        <span class="cart-item-subtotal">${false && typeof window.formatEnglishPrice === 'function' 
                            ? window.formatEnglishPrice(parseFloat(item.price) * parseInt(item.qty)) 
                            : `${(parseFloat(item.price) * parseInt(item.qty)).toFixed(2)} ₴`}</span>
                        <div class="qty-stepper">
                            <button class="qty-btn qty-minus" onclick="changeQty(${index}, -1)" aria-label="Зменшити">−</button>
                            <span class="qty-value">${parseInt(item.qty)}</span>
                            <button class="qty-btn qty-plus" onclick="changeQty(${index}, +1)" aria-label="Збільшити">+</button>
                        </div>
                        <button class="cart-item-remove" onclick="removeFromCart(${index})" aria-label="Видалити товар">×</button>
                    </div>
                `;
                fragment.appendChild(itemDiv);
            });
            container.innerHTML = '';
            container.appendChild(fragment);
        }
    });

    document.querySelectorAll('#final-price, .total-price-display, #cart-total').forEach(priceEl => {
        const totalText = false && typeof window.formatEnglishPrice === 'function'
            ? window.formatEnglishPrice(totalSum)
            : `${totalSum.toFixed(2)} ₴`;
        priceEl.innerHTML = totalText;
    });

    // Ховаємо кнопку замовлення, якщо порожньо
    const orderBtn = document.querySelector('.order-btn');
    if (orderBtn) orderBtn.style.display = (cart.length === 0) ? 'none' : 'block';
}

// === 3. КЕРУВАННЯ КОШИКОМ ===
window.openCheckout = function() {
    // ✅ RATE LIMITING: Перевіряємо чи не надто часто клікають на оформлення
    if (typeof RateLimiter !== 'undefined' && !RateLimiter.check('checkout')) {
        alert('⏱️ Чекайте кілька секунд перед наступним кліком...');
        return;
    }

    const cartSync = syncCartPrices(getFreshCart(), { save: true });
    const cart = cartSync.cart;
    if (cartSync.changed) {
        updateCartUI();
    }
    if (cart.length === 0) {
        openEmptyCartModal();
        return;
    }
    const modal = document.getElementById('checkoutModal');
    if (modal) {
        modal.style.display = 'flex';
        document.getElementById('modal-main-content').style.display = 'grid';
        document.getElementById('success-msg').style.display = 'none';
        
        ['delivery', 'payment'].forEach(field => {
            const value = localStorage.getItem('saved_' + field);
            const element = document.getElementById('cust-' + field);
            if (value && element) element.value = value;
        });
        updateCartUI();
        renderCheckoutTurnstile_();
        
        if (!false) {
            initDeliveryOptions(); // Ініціалізація логіки доставки (тільки для UA)
            initPaymentLogic();    // Ініціалізація підказки про оплату (тільки для UA)
        }
    }
};

let isDeliveryInitialized = false;
let isPaymentInitialized = false;
let currentCityBranches = [];
let lastSelectedCity = "";
let lastSelectedCityRef = "";
let isLocked = false;
let debounceTimeout;
let currentDeliveryType = ""; // Додаємо змінну для відстеження поточного типу доставки

const cleanForSearch = (str) => {
    if (!str) return "";
    return str.toLowerCase()
        .replace(/[^a-zа-яіїєґ0-9]/gi, ' ') 
        .replace(/\s+/g, ' ')               
        .trim();
};

// ───────────────────────────────────────────────────────────────
// ГОЛОВНА ФУНКЦІЯ ІНІЦІАЛІЗАЦІЇ
// ───────────────────────────────────────────────────────────────
function initDeliveryOptions() {
    const cityInput = document.getElementById('cust-city');
    const branchInput = document.getElementById('cust-branch-input');
    const branchLabel = document.querySelector('#branch-group label');
    const deliverySelect = document.getElementById('cust-delivery');
    const branchSuggestions = document.getElementById('branch-suggestions');
    const citySuggestions = document.getElementById('city-suggestions');
    const branchHidden = document.getElementById('cust-branch'); // Приховане поле для Nova Poshta Ref
    const ukrposhtaBranchHint = document.getElementById('ukrposhta-branch-hint');
    const cityDeliveryHint = document.getElementById('city-delivery-hint');

    if (!deliverySelect || !cityInput || !branchInput || !branchLabel) return;

    const isNovaPoshtaDelivery = () =>
        ["Відділення НП", "Поштомат НП", "Кур'єр НП"].includes(currentDeliveryType);
    const supportsCitySearch = () =>
        ["Відділення НП", "Поштомат НП", "Укрпошта"].includes(currentDeliveryType);

    // Оновлення UI для типу доставки
    const updateBranchUI = () => {
        currentDeliveryType = deliverySelect.value;

        // Скидаємо стилі помилок
        cityInput.classList.remove('input-error');
        branchInput.classList.remove('input-error');

        // Приховуємо підказки за замовчуванням
        citySuggestions.style.display = 'none';
        branchSuggestions.style.display = 'none';
        if (ukrposhtaBranchHint) {
            ukrposhtaBranchHint.style.display = currentDeliveryType === "Укрпошта" ? 'block' : 'none';
        }
        if (cityDeliveryHint) {
            cityDeliveryHint.textContent = currentDeliveryType === "Укрпошта"
                ? "Якщо населений пункт не знайдеться у списку, введіть його назву вручну."
                : "Тільки населені пункти України";
        }

        // Логіка для Нової Пошти
        if (isNovaPoshtaDelivery()) {
            branchLabel.innerText = (currentDeliveryType === "Кур'єр НП")
                ? "Адреса доставки (вулиця, будинок, квартира)"
                : "Відділення або поштомат (номер чи адреса)";
            branchInput.placeholder = (currentDeliveryType === "Кур'єр НП")
                ? "Наприклад: вул. Шевченка 1, кв. 10"
                : "Введіть номер або назву...";
            cityInput.placeholder = "Наприклад: Київ";
            cityInput.disabled = false;
            branchInput.disabled = (currentDeliveryType !== "Кур'єр НП" && !cityInput.dataset.ref); // Блокуємо відділення, якщо місто не обрано
        }
        // Логіка для Укрпошти
        else if (currentDeliveryType === "Укрпошта") {
            branchLabel.innerText = "Відділення або поштомат Укрпошти (номер і адреса)";
            branchInput.placeholder = "Наприклад: № 12, вул. Центральна, 1";
            cityInput.placeholder = "Наприклад: Київ";
            cityInput.disabled = false;
            branchInput.disabled = false;
            // Для Укрпошти не використовуємо Nova Poshta API, тому приховуємо підказки
            citySuggestions.style.display = 'none';
            branchSuggestions.style.display = 'none';
        }
    };

    // ✅ ФІКС: Автозавантаження відділень при старті
    const checkAutoLoad = async () => {
        if (!cityInput || !cityInput.value.trim()) return;
        
        const cityRef = cityInput.dataset.ref;
        
        // Якщо є збережений ref і місто
        if (cityRef && cityRef !== "") {
            console.log('🔄 Автозавантаження відділень для:', cityInput.value);
            lastSelectedCity = cityInput.value;
            lastSelectedCityRef = cityRef;
            await loadWarehouses(cityRef);
        }
    };

    // ✅ ФІКС: Перевіряємо чи вже ініціалізовано
    if (isDeliveryInitialized) {
        updateBranchUI();
        checkAutoLoad(); // Викликаємо тільки після ініціалізації
        return;
    }

    if (deliverySelect) deliverySelect.addEventListener('change', updateBranchUI);
    updateBranchUI();

    // ───────────────────────────────────────────────────────────────
    // ПОШУК МІСТА
    // ───────────────────────────────────────────────────────────────

    const triggerCitySearch = async (query) => {
        // Додаємо перевірку блокування на початку функції
        if (!supportsCitySearch()) {
            citySuggestions.style.display = 'none';
            return;
        }


        if (isLocked || !query) {
            console.log('🔒 Пошук заблокований');
            return;
        }

        const cleanedQuery = cleanForSearch(query);
        const cleanedLast = cleanForSearch(lastSelectedCity);

        // Якщо вже вибране це місто — не шукаємо
        if (cleanedQuery === cleanedLast && cityInput.dataset.ref) {
            citySuggestions.style.display = 'none';
            return;
        }

        if (query.length < 1) {
            citySuggestions.style.display = 'none';
            return;
        }

        // Показуємо лоадер
        citySuggestions.innerHTML = '<div class="np-item np-loading">Шукаємо місто... 🔍</div>';
        citySuggestions.style.display = 'block';

        try {
            const response = await fetch(NP_SETTINGS.apiUrl, {
                method: 'POST',
                mode: 'cors',
                redirect: 'follow',
                headers: {
                    'Content-Type': 'text/plain'
                },
                body: JSON.stringify({
                    modelName: "Address",
                    calledMethod: "searchSettlements",
                    methodProperties: { 
                        CityName: query, 
                        Limit: 8 // Збільшено з 5 до 8
                    }
                })
            });

            const data = await response.json();

            // ✅ ФІКС: Перевіряємо чи поле ще активне
            if (cityInput.value.trim() === "") {
                citySuggestions.style.display = 'none';
                return;
            }

            if (data.success && data.data[0]?.Addresses && data.data[0].Addresses.length > 0) {
                citySuggestions.innerHTML = data.data[0].Addresses.map(addr => `
                    <div class="np-item" data-ref="${escapeHtml(addr.DeliveryCity)}">
                        ${escapeHtml(addr.Present)}
                    </div>
                `).join('');
                citySuggestions.style.display = 'block';
            } else {
                citySuggestions.innerHTML = '<div class="np-item np-empty">Місто не знайдено 😕 Спробуйте змінити мову або перевірте правопис.</div>';
                citySuggestions.style.display = 'block';
            }
        } catch (error) {
            console.error('❌ Помилка пошуку міста:', error);
            citySuggestions.innerHTML = '<div class="np-item np-error">Помилка підключення</div>';
            citySuggestions.style.display = 'block';
        }
    };

    // ✅ ПОКРАЩЕНО: Input handler з дебаунсом
    cityInput.addEventListener('input', (e) => {
        if (!supportsCitySearch()) {
            cityInput.dataset.ref = ""; // Скидаємо ref, якщо переключились з НП
            return;
        }

        if (isLocked) return;
        
        clearTimeout(debounceTimeout);
        const query = e.target.value.trim();
        
        // ✅ ФІКС: Скидаємо вибір тільки якщо текст РЕАЛЬНО змінився
        const currentClean = cleanForSearch(query);
        const lastClean = cleanForSearch(lastSelectedCity);
        
        if (currentClean !== lastClean) {
            cityInput.dataset.ref = "";
            lastSelectedCity = "";
            lastSelectedCityRef = "";
            // Очищаємо відділення при зміні міста
            currentCityBranches = [];
            branchInput.value = "";
            branchHidden.value = "";
            branchSuggestions.style.display = 'none';
        }

        // ✅ ПОКРАЩЕНО: Дебаунс 200мс замість 150мс
        debounceTimeout = setTimeout(async () => {
            await triggerCitySearch(query);
        }, 200);
    });

    // ✅ ПОКРАЩЕНО: Показуємо список при фокусі
    cityInput.addEventListener('focus', () => {
        if (!supportsCitySearch()) {
            citySuggestions.style.display = 'none';
            return;
        }

        if (isLocked) return;
        
        const val = cityInput.value.trim();

        // Якщо місто вже обрано (є data-ref) і значення в полі не змінилося,
        // не показуємо підказки знову. Користувач вже зробив вибір.
        if (cityInput.dataset.ref && val === lastSelectedCity) {
            citySuggestions.style.display = 'none';
            return;
        } else if (val.length >= 1) { // Якщо є текст і місто не обрано або змінилося — шукаємо
            triggerCitySearch(val);
        }
    });

    // ✅ ПОКРАЩЕНО: Вибір міста
    citySuggestions.addEventListener('click', async (e) => {
        if (!supportsCitySearch()) {
            citySuggestions.style.display = 'none';
            return;
        }

        const item = e.target.closest('.np-item');
        if (!item || item.classList.contains('np-loading') || 
            item.classList.contains('np-empty') || 
            item.classList.contains('np-error') ||
            item.classList.contains('np-info')) {
            return;
        }

        e.stopPropagation();
        
        // 0. Миттєво скасовуємо будь-який запланований пошук
        clearTimeout(debounceTimeout);

        // ✅ ФІКС: Блокуємо надійно
        isLocked = true;
        clearTimeout(debounceTimeout);
        console.log('🔒 Місто вибрано, блокуємо інтерфейс');

        const cityRef = item.getAttribute('data-ref');
        const fullTitle = item.innerText.trim();

        if (!cityRef) {
            console.error('❌ Не знайдено ref для міста');
            isLocked = false;
            return;
        }

        // 1. Оновлюємо UI МИТТЄВО
        cityInput.dataset.ref = cityRef;
        cityInput.value = fullTitle;
        lastSelectedCity = fullTitle;
        lastSelectedCityRef = cityRef;
        citySuggestions.innerHTML = '';
        citySuggestions.style.display = 'none';

        // 2. Очищаємо поле відділення
        branchInput.value = '';
        branchHidden.value = '';
        currentCityBranches = [];
        
        // 3. Для Укрпошти відділення вводять вручну, без завантаження списку НП
        if (currentDeliveryType === "Укрпошта") {
            branchInput.placeholder = "№ відділення/поштомата та повна адреса";
            branchInput.focus();
            isLocked = false;
            return;
        }

        // 4. Показуємо лоадер у placeholder
        const isCourier = deliverySelect?.value === "Кур'єр НП";
        branchInput.placeholder = isCourier 
            ? 'Вулиця, будинок...' 
            : 'Завантаження відділень... ⏳';
        
        // 5. Переводимо фокус
        branchInput.focus();

        // 6. Завантажуємо відділення
        await loadWarehouses(cityRef);
        
        // ✅ ФІКС: Розблокуємо через більший інтервал
        setTimeout(() => {
            isLocked = false;
            console.log('🔓 Інтерфейс розблоковано');
        }, 600); // Збільшено з 500мс
    });

    // ───────────────────────────────────────────────────────────────
    // ПОШУК ВІДДІЛЕННЯ
    // ───────────────────────────────────────────────────────────────

    // ✅ ПОКРАЩЕНО: Input handler
    branchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();

        // Синхронізуємо з прихованим полем
        branchHidden.value = e.target.value;

        // Якщо не Нова Пошта або кур'єрська доставка НП — не показуємо список відділень
        if (currentDeliveryType === "Укрпошта" || currentDeliveryType === "Кур'єр НП") {
            branchSuggestions.style.display = 'none';
            return;
        }
        // Якщо місто не обрано для НП відділення/поштомат
        if (!cityInput.dataset.ref && (currentDeliveryType === "Відділення НП" || currentDeliveryType === "Поштомат НП")) {
            branchSuggestions.innerHTML = '<div class="np-item np-info">Спочатку оберіть місто ⬆️</div>';
            return;
        }

        // Показуємо відфільтровані відділення
        renderBranchSuggestions(query.toLowerCase());
    });

    // ✅ ПОКРАЩЕНО: Показуємо список при фокусі
    branchInput.addEventListener('focus', () => {
        // Якщо не Нова Пошта або кур'єрська доставка НП — не показуємо список відділень
        if (currentDeliveryType === "Укрпошта" || currentDeliveryType === "Кур'єр НП") {
            return;
        }

        const val = branchInput.value.trim();

        // ✅ ФІКС: Показуємо список навіть якщо пусте поле
        if (currentCityBranches.length > 0) {
            renderBranchSuggestions(val.toLowerCase()); // Показуємо всі, якщо поле пусте
        } else if (cityInput.value.trim() !== "" && !lastSelectedCity) {
            // Підказка що треба спочатку обрати місто
            branchSuggestions.innerHTML = '<div class="np-item np-info">Спочатку оберіть місто ⬆️</div>';
            branchSuggestions.style.display = 'block';
            setTimeout(() => {
                branchSuggestions.style.display = 'none';
            }, 2000);
        }
    });

    // ✅ ПОКРАЩЕНО: Вибір відділення
    branchSuggestions.addEventListener('click', (e) => {
        // Якщо не Нова Пошта або кур'єрська доставка НП — не реагуємо
        if (currentDeliveryType === "Укрпошта" || currentDeliveryType === "Кур'єр НП") {
            return;
        }

        const item = e.target.closest('.np-item');
        if (!item || item.classList.contains('np-empty') || 
            item.classList.contains('np-info')) {
            return;
        }

        const branchName = item.innerText.trim();
        branchInput.value = branchName;
        branchHidden.value = branchName;
        branchSuggestions.style.display = 'none';
    });

    // ✅ ПОКРАЩЕНО: Рендеринг списку відділень
    function renderBranchSuggestions(query) {
        // Захист від Укрпошти та кур'єрської доставки НП
        if (currentDeliveryType === "Укрпошта" || currentDeliveryType === "Кур'єр НП") {
            branchSuggestions.style.display = 'none';
            return;
        }

        if (currentCityBranches.length === 0) {
            branchSuggestions.style.display = 'none';
            return;
        }

        const searchWords = cleanForSearch(query).split(' ').filter(w => w.length > 0);

        const filtered = currentCityBranches.filter(b => {
            if (searchWords.length === 0) return true;
            const cleanDesc = cleanForSearch(b.Description);
            return searchWords.every(word => cleanDesc.includes(word));
        }).slice(0, 20); // Збільшено з 15 до 20

        if (filtered.length > 0) {
            branchSuggestions.innerHTML = filtered.map(b => `
                <div class="np-item">
                    ${escapeHtml(b.Description)}
                </div>
            `).join('');
            branchSuggestions.style.display = 'block';
        } else if (searchWords.length > 0) {
            branchSuggestions.innerHTML = '<div class="np-item np-empty">Нічого не знайдено</div>';
            branchSuggestions.style.display = 'block';
        } else {
            branchSuggestions.style.display = 'none';
        }
    }

    // ───────────────────────────────────────────────────────────────
    // ЗАВАНТАЖЕННЯ ВІДДІЛЕНЬ
    // ───────────────────────────────────────────────────────────────

    async function loadWarehouses(cityRef) {
        console.log('📦 Завантаження відділень для ref:', cityRef);

        if (currentDeliveryType === "Укрпошта" || currentDeliveryType === "Кур'єр НП") {
            currentCityBranches = []; // Очищаємо, якщо переключились
            return;
        }
        
        try {
            const limit = 500;
            const warehouses = [];
            const seenWarehouses = new Set();
            let page = 1;

            while (true) {
                const response = await fetch(NP_SETTINGS.apiUrl, {
                    method: 'POST',
                    mode: 'cors',
                    redirect: 'follow',
                    headers: {
                        'Content-Type': 'text/plain'
                    },
                    body: JSON.stringify({
                        modelName: "Address",
                        calledMethod: "getWarehouses",
                        methodProperties: {
                            CityRef: cityRef,
                            Page: page,
                            Limit: limit
                        }
                    })
                });

                if (!response.ok) {
                    throw new Error(`Nova Poshta API returned HTTP ${response.status}`);
                }

                const data = await response.json();
                if (!data.success || !Array.isArray(data.data)) {
                    throw new Error(data.errors?.join(', ') || 'Invalid warehouse response');
                }

                let newWarehouseCount = 0;
                for (const warehouse of data.data) {
                    const key = warehouse.Ref || warehouse.Description;
                    if (key && seenWarehouses.has(key)) continue;
                    if (key) seenWarehouses.add(key);
                    warehouses.push(warehouse);
                    newWarehouseCount++;
                }

                if (data.data.length < limit) break;
                if (newWarehouseCount === 0) {
                    throw new Error(`Warehouse pagination returned duplicate results on page ${page}`);
                }

                page++;
            }

            if (warehouses.length > 0) {
                currentCityBranches = warehouses;
                console.log(`✅ Завантажено ${warehouses.length} відділень`);
                
                branchInput.placeholder = 'Введіть номер або адресу';
                
                // ✅ ФІКС: Автоматично показуємо список якщо поле активне
                const isNotCourier = currentDeliveryType !== "Кур'єр НП";
                const isFocused = document.activeElement === branchInput;
                
                if (isNotCourier && isFocused) {
                    setTimeout(() => {
                        renderBranchSuggestions(branchInput.value.toLowerCase().trim());
                    }, 100);
                }
            } else {
                currentCityBranches = [];
                branchInput.placeholder = 'Відділень не знайдено';
                console.warn('⚠️ Відділення не знайдено для міста');
            }
        } catch (error) {
            console.error('❌ Помилка завантаження відділень:', error);
            currentCityBranches = [];
            branchInput.placeholder = 'Помилка завантаження';
        }
    }

    // ───────────────────────────────────────────────────────────────
    // ГЛОБАЛЬНІ ОБРОБНИКИ
    // ───────────────────────────────────────────────────────────────

    // Закриття списків при кліку поза ними
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.form-group')) {
            citySuggestions.style.display = 'none';
            branchSuggestions.style.display = 'none';
        }
    });

    // Закриття на ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            citySuggestions.style.display = 'none';
            branchSuggestions.style.display = 'none';
            // Також знімаємо фокус
            if (document.activeElement === cityInput || document.activeElement === branchInput) {
                document.activeElement.blur();
            }
        }
    });

    // ✅ НОВИНКА: Навігація стрілками у списку
    const handleArrowNavigation = (e, suggestions) => {
        const items = Array.from(suggestions.querySelectorAll('.np-item:not(.np-loading):not(.np-empty):not(.np-error):not(.np-info)'));
        if (items.length === 0) return;

        const activeItem = suggestions.querySelector('.np-item.keyboard-active');
        let currentIndex = activeItem ? items.indexOf(activeItem) : -1;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            currentIndex = (currentIndex + 1) % items.length;
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            currentIndex = currentIndex <= 0 ? items.length - 1 : currentIndex - 1;
        } else if (e.key === 'Enter' && activeItem) {
            e.preventDefault();
            activeItem.click();
            return;
        }

        items.forEach(item => item.classList.remove('keyboard-active'));
        if (currentIndex >= 0) {
            items[currentIndex].classList.add('keyboard-active');
            items[currentIndex].scrollIntoView({ block: 'nearest' });
        }
    };

    cityInput.addEventListener('keydown', (e) => {
        if (['ArrowDown', 'ArrowUp', 'Enter'].includes(e.key)) {
            handleArrowNavigation(e, citySuggestions);
        }
    });

    branchInput.addEventListener('keydown', (e) => {
        if (['ArrowDown', 'ArrowUp', 'Enter'].includes(e.key)) {
            handleArrowNavigation(e, branchSuggestions);
        }
    });

    // ───────────────────────────────────────────────────────────────
    // ЗАВЕРШЕННЯ ІНІЦІАЛІЗАЦІЇ
    // ───────────────────────────────────────────────────────────────

    isDeliveryInitialized = true;
    console.log('✅ Нова Пошта ініціалізована');
    
    // ✅ ФІКС: Викликаємо автозавантаження тільки після повної ініціалізації
    setTimeout(() => {
        checkAutoLoad();
    }, 100);
}

function initPaymentLogic() {
    const paymentSelect = document.getElementById('cust-payment');
    const codHint = document.getElementById('cod-payment-hint');
    const onlineHint = document.getElementById('online-payment-hint');
    if (!paymentSelect || !codHint || !onlineHint) return;

    const updateHint = () => {
        codHint.style.display = (paymentSelect.value === "Накладений платіж") ? 'block' : 'none';
        onlineHint.style.display = (paymentSelect.value === "Онлайн оплата") ? 'block' : 'none';
    };

    if (isPaymentInitialized) {
        updateHint();
        return;
    }

    paymentSelect.addEventListener('change', updateHint);
    updateHint();
    isPaymentInitialized = true;
}

window.closeCheckout = function() {
    const modal = document.getElementById('checkoutModal');
    if (modal) modal.style.display = 'none';
};

window.removeFromCart = function(index) {
    let cart = getFreshCart();
    cart.splice(index, 1);
    saveCart(cart);
    updateCartUI();
    if (cart.length === 0) closeCheckout();
};

// +/- кількість у модалці
window.changeQty = function(index, delta) {
    let cart = getFreshCart();
    if (!cart[index]) return;

    const newQty = cart[index].qty + delta;

    if (newQty <= 0) {
        if (!confirm(`Видалити «${cart[index].name}» з кошика?`)) return;
        cart.splice(index, 1);
    } else {
        // ✅ НОВЕ: Використання константи
        cart[index].qty = Math.min(newQty, CART_CONSTANTS.MAX_QTY);
    }

    saveCart(cart);
    updateCartUI();
    if (cart.length === 0) closeCheckout();
};

// Універсальна функція додавання
window.addToCart = function(productId, price, name, qty = 1, originalPrice = null, image = null, versionKey = null) {
    // ✅ RATE LIMITING: Перевіряємо частоту клавіш
    if (typeof RateLimiter !== 'undefined' && !RateLimiter.check('addToCart')) {
        console.warn('⏱️ Надто швидке додавання товарів. Чекайте...');
        return false;
    }

    const productData = productId && typeof allProducts !== 'undefined' ? allProducts[productId] : null;
    if (productId && !productId.startsWith('bundle_') && !isProductOrderable(productData)) {
        const message = productData && isProductLocked(productData)
            ? window.getLockedCategoryAlert()
            : 'Цей товар зараз недоступний для замовлення.';
        alert(message);
        return false;
    }

    let cart = getFreshCart();
    
    // ✅ НОВЕ: Sanitize назви
    const displayName = productData && typeof window.getProductDisplayName === 'function'
        ? window.getProductDisplayName(productData, name)
        : name;
    const safeName = sanitizeInput(displayName, CART_CONSTANTS.MAX_NAME_LENGTH);
    
    // ✅ НОВЕ: Використання константи
    const validatedPrice = validatePrice(productId, parseFloat(price));
    const validatedQty = Math.max(1, Math.min(CART_CONSTANTS.MAX_QTY, parseInt(qty)));
    const productBasePrice = productData ? getCartItemBasePrice({ name: safeName, versionKey, originalPrice, price }, productData) : originalPrice;
    const normalizedOriginalPrice = productBasePrice || originalPrice || validatedPrice;
    
    // Шукаємо існуючий товар
    const existing = cart.find(item => {
        if (productId && item.productId && item.productId === productId) {
            return item.name.toLowerCase().trim() === safeName.toLowerCase().trim();
        }
        return item.name.toLowerCase().trim() === safeName.toLowerCase().trim();
    });

    if (existing) {
        // ✅ НОВЕ: Використання константи
        existing.qty = Math.min(existing.qty + validatedQty, CART_CONSTANTS.MAX_QTY);
        existing.price = validatedPrice;
        existing.originalPrice = normalizedOriginalPrice;
        existing.versionKey = versionKey || existing.versionKey || null;
        if (image) existing.image = image;
        if (productId && !existing.productId) {
            existing.productId = productId;
        }
    } else {
        cart.push({ 
            productId: productId, 
            name: safeName,
            price: validatedPrice, 
            originalPrice: normalizedOriginalPrice,
            qty: validatedQty,
            image: image,
            versionKey: versionKey
        });
    }
    
    saveCart(cart);
    updateCartUI();

    // Відстеження додавання в кошик для аналізу воронки продажів
    if (typeof gtag === 'function') {
        gtag('event', 'add_to_cart', {
            items: [{
                item_id: productId,
                item_name: safeName,
                price: validatedPrice,
                quantity: validatedQty
            }]
        });
    }
    return true;
};


// 1. Для сторінки товару (product.html)
window.pushToCart = function() {
    if (typeof currentProductId === 'undefined') {
        console.error('currentProductId не визначено');
        return;
    }
    const priceContainer = document.getElementById('p-price');
    const addBtn = document.querySelector('.add-btn[onclick*="pushToCart"]');
    const qtyEl = document.getElementById('p-qty');

    if (!priceContainer) return;

    // Отримуємо ID товару
    const productId = typeof currentProductId !== 'undefined' ? currentProductId : null;
    
    // БЕРЕМО НАЗВУ З БАЗИ (як у каталозі), а не з екрана
    let name = (productId && typeof allProducts !== 'undefined' && allProducts[productId]) 
               ? (window.getProductDisplayName?.(allProducts[productId]) || allProducts[productId].name)
               : document.getElementById('p-name').innerText;

    // 🔥 НОВЕ: ДОДАЄМО ВЕРСІЮ НАСІННЯ ДО НАЗВИ
    const versionKey = addBtn.getAttribute('data-version');
    if (versionKey && productId && typeof allProducts !== 'undefined' && allProducts[productId].seedVersions) {
        const versionData = allProducts[productId].seedVersions[versionKey];
        if (versionData && versionData.label) {
            name = `${name} (${versionData.label})`; // Вийде: "Zebrange (Ізольоване)"
        }
    }

    const isAllowed = priceContainer.getAttribute('data-allow-sale') === 'true';
    // Беремо БАЗОВУ ціну (без знижки) з атрибуту data-val
    const originalPrice = parseFloat(priceContainer.getAttribute('data-val'));
    
    const price = isAllowed && addBtn.hasAttribute('data-price') 
                  ? parseFloat(addBtn.getAttribute('data-price')) 
                  : originalPrice;
    
    const qty = parseInt(qtyEl.value) || 1;

    // Отримуємо URL зображення зі сторінки
    const mainImg = document.getElementById('main-view');
    const image = mainImg ? mainImg.src : null;
    
    const added = addToCart(productId, price, name, qty, originalPrice, image, versionKey);
    if (added) {
        alert("Додано у кошик! 🌶️");
    } else {
        alert("Не вдалося додати товар. Спробуйте ще раз за кілька секунд.");
    }
};

window.addToCartDirectly = function(productId, buttonElement) {
    try {
        const card = buttonElement.closest('.product-card');
        if (!card) throw new Error("Картку товару не знайдено");

        // 1. БЕРЕМО НАЗВУ З БАЗИ (products.js)
        let actualName = (typeof allProducts !== 'undefined' && allProducts[productId]) 
                         ? (window.getProductDisplayName?.(allProducts[productId]) || allProducts[productId].name)
                         : productId;

        // 2. ШУКАЄМО ЦІНУ НА КАРТЦІ (щоб врахувати акцію)
        const priceElement = card.querySelector('.card-price');
        if (!priceElement) throw new Error("Ціну на картці не знайдено");

        const buttonPrice = parseFloat(buttonElement?.getAttribute('data-price'));
        const salePriceEl = priceElement.querySelector('.sale-price');
        const priceText = salePriceEl ? salePriceEl.innerText : priceElement.innerText;
        const cleanPrice = Number.isFinite(buttonPrice)
            ? buttonPrice
            : parseFloat(priceText.replace(/[^\d.,]/g, '').replace(',', '.'));
        
        if (isNaN(cleanPrice)) throw new Error("Не вдалося розпізнати ціну");
        // Отримуємо базову ціну для закреслення
        const basePrice = parseFloat(priceElement.getAttribute('data-base-price'));

        // Отримуємо URL зображення з картки
        const imgEl = card.querySelector('.img-container img');
        const image = imgEl ? imgEl.src : null;

        // 3. ДОДАЄМО В КОШИК через універсальну функцію
        const added = addToCart(productId, cleanPrice, actualName, 1, basePrice, image);
        if (added) {
            alert(`🌶️ ${actualName} додано!`);
        } else {
            alert("Не вдалося додати товар. Спробуйте ще раз за кілька секунд.");
        }

    } catch (error) {
        console.error("Помилка додавання:", error.message);
        alert("Помилка додавання товару. Спробуйте ще раз.");
    }
};

window.clearFullCart = function() {
    if (confirm("Видалити всі товари з кошика?")) {
        saveCart([]); // Очищаємо масив у пам'яті
        updateCartUI(); // Оновлюємо всі цифри та списки на сторінці
        closeCheckout(); // Закриваємо модалку, бо купувати нічого
    }
};
// ===== ГЕНЕРАТОР НОМЕРА ЗАМОВЛЕННЯ =====
function generateOrderNumber() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${day}${month}${hour}${minute}${seconds}`;
}

let turnstileLoadPromise = null;
let turnstileWidgetId = null;
window.__gapkaTurnstileToken = "";

function loadTurnstile_() {
    if (window.turnstile) return Promise.resolve();
    if (turnstileLoadPromise) return turnstileLoadPromise;
    turnstileLoadPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.async = true;
        script.defer = true;
        script.onload = resolve;
        script.onerror = () => reject(new Error('Не вдалося завантажити перевірку безпеки.'));
        document.head.appendChild(script);
    });
    return turnstileLoadPromise;
}

async function renderCheckoutTurnstile_() {
    const siteKey = window.TURNSTILE_SITE_KEY;
    if (!siteKey) return;
    const container = document.getElementById('turnstile-checkout');
    if (!container) return;
    try {
        await loadTurnstile_();
        if (turnstileWidgetId !== null) {
            window.turnstile.reset(turnstileWidgetId);
            window.__gapkaTurnstileToken = "";
            return;
        }
        turnstileWidgetId = window.turnstile.render(container, {
            sitekey: siteKey,
            theme: 'dark',
            callback: token => { window.__gapkaTurnstileToken = token; },
            'expired-callback': () => { window.__gapkaTurnstileToken = ""; },
            'error-callback': () => { window.__gapkaTurnstileToken = ""; }
        });
    } catch (error) {
        console.error('Turnstile init error:', error);
    }
}

// === 4. ВІДПРАВКА ЗАМОВЛЕННЯ ===
window.submitOrder = async function() {
    // ✅ Rate limiting
    if (!orderRateLimiter.canSubmit()) {
        alert("Забагато спроб відправки. Зачекайте хвилину.");
        return;
    }
    
    // Honeypot перевірка
    const honeypot = document.getElementById('website_url');
    if (honeypot && honeypot.value !== '') {
        console.warn('🤖 Бот виявлено');
        alert("Дякуємо за замовлення!");
        closeCheckout();
        return;
    }
    
    // ═══════════════════════════════════════════════════════════════
    // VALIDATION: Українська версія
    // ═══════════════════════════════════════════════════════════════
    
    // Отримуємо поля
    const fields = {
        name: document.getElementById('cust-name'),
        phone: document.getElementById('cust-phone'),
        delivery: document.getElementById('cust-delivery'),
        payment: document.getElementById('cust-payment'),
        city: document.getElementById('cust-city'),
        branch: document.getElementById('cust-branch'), // приховане поле для ID/повного тексту
        branchInput: document.getElementById('cust-branch-input') // видиме текстове поле
    };

    // 1. СИНХРОНІЗАЦІЯ ПЕРЕД ВАЛІДАЦІЄЮ
    if (fields.branch && fields.branchInput && !fields.branch.value.trim()) {
        fields.branch.value = fields.branchInput.value.trim();
    }

    let hasError = false;

    Object.values(fields).forEach(el => el && el.classList?.remove('input-error'));
    if (fields.branchInput) fields.branchInput.classList.remove('input-error');

    const sanitizedData = {};
    
    for (let key in fields) {
        const field = fields[key];
        if (!field) continue;
        
        const value = field.value.trim();
        
        if (!value) {
            if (key === 'branch' && fields.branchInput) {
                fields.branchInput.classList.add('input-error');
            } else if (field.classList) {
                field.classList.add('input-error');
            }
            hasError = true;
            continue;
        }
        
        if (key !== 'phone') {
            const maxLen = key === 'name' ? 50 : 100;
            sanitizedData[key] = sanitizeInput(value, maxLen);
            field.value = sanitizedData[key];
        } else {
            sanitizedData[key] = value;
        }
    }
    function validatePhone(phone) {
        if (!phone) return false;
        const cleaned = phone.replace(/[\s\(\)\-]/g, '');
        const phoneRegex = /^(?:\+?38)?(?:0|80)\d{9}$/;
        return phoneRegex.test(cleaned);
    }

    function cleanPhone(phone) {
        if (!phone) return '';
        const cleaned = phone.replace(/[\s\(\)\-]/g, '');
        if (cleaned.startsWith('0')) {
            return '+38' + cleaned;
        }
        if (cleaned.startsWith('+38')) {
            return cleaned;
        }
        return cleaned;
    }

    if (fields.phone) {
        if (!validatePhone(fields.phone.value)) {
            alert("Некоректний номер телефону.\nПриклад: 0951234567 або +380951234567");
            fields.phone.classList.add('input-error');
            hasError = true;
        } else {
            const cleanedPhone = cleanPhone(fields.phone.value);
            fields.phone.value = cleanedPhone;
            sanitizedData.phone = cleanedPhone;
        }
    }

    const emailEl = document.getElementById('email');
    if (emailEl && emailEl.value.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailEl.value.trim())) {
            alert("Будь ласка, введіть коректний email");
            emailEl.classList.add('input-error');
            hasError = true;
        } else {
            sanitizedData.email = sanitizeInput(emailEl.value.trim(), 100);
            emailEl.value = sanitizedData.email;
        }
    }

    const cityInput = document.getElementById('cust-city');
    if (cityInput) {
        const cityRef = cityInput.dataset.ref;
        if (["Відділення НП", "Поштомат НП"].includes(currentDeliveryType) &&
            (!cityRef || cityRef === "" || cityInput.value.trim() !== lastSelectedCity.trim())) {
            alert("Будь ласка, оберіть населений пункт зі списку підказок 📍\nЦе допоможе правильно оформити доставку.");
            cityInput.classList.add('input-error');
            hasError = true;
        }
    }

    const branchVal = fields.branch.value.trim().toLowerCase();
    const deliveryType = fields.delivery.value;

    if (["Відділення НП", "Поштомат НП"].includes(deliveryType) &&
        (branchVal === 'поштомат' || branchVal === 'відділення' || branchVal.length < 3)) {
        alert("Будь ласка, вкажіть конкретний номер або адресу відділення/поштомату Нової Пошти 🏢");
        if (fields.branchInput) fields.branchInput.classList.add('input-error');
        hasError = true;
    }
    else if (deliveryType === "Укрпошта" && branchVal.length < 5) {
        alert("Будь ласка, вкажіть номер і повну адресу відділення або поштомата Укрпошти 📮");
        if (fields.branchInput) fields.branchInput.classList.add('input-error');
        hasError = true;
    }

    if (hasError) {
        return;
    }

    if (window.TURNSTILE_SITE_KEY && !window.__gapkaTurnstileToken) {
        await renderCheckoutTurnstile_();
        alert("Будь ласка, пройдіть перевірку безпеки перед підтвердженням замовлення.");
        return;
    }

    const submitBtn = document.querySelector('.checkout-summary .order-btn');
    if (!submitBtn) { console.error('submitOrder: кнопку order-btn не знайдено'); return; }
    const originalText = submitBtn.textContent;
    const orderID = generateOrderNumber();
    let requestId = localStorage.getItem('pending_order_request_id');
    if (!requestId) {
        requestId = (window.crypto && typeof window.crypto.randomUUID === 'function')
            ? window.crypto.randomUUID()
            : 'ghi_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
        localStorage.setItem('pending_order_request_id', requestId);
    }
    const cartSync = syncCartPrices(getFreshCart(), { save: true });
    const cart = cartSync.cart;
    if (cartSync.changed) {
        updateCartUI();
    }
    const cartError = getCartValidationError(cart);
    if (cartError) {
        alert(cartError);
        updateCartUI();
        return;
    }

    const totalSum = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);

    submitBtn.disabled = true;
    submitBtn.classList.add('btn-loading');
    submitBtn.textContent = `Відправляємо...`;

    const orderData = {
        id: orderID, 
        name: fields.name.value.trim(),
        phone: fields.phone.value.trim(),
        delivery: fields.delivery.value.trim(),
        payment: fields.payment.value.trim(),
        city: fields.city.value.trim(),
        branch: (deliveryType === "Укрпошта")
            ? fields.branchInput.value.trim()
            : fields.branch.value.trim(),
        email: document.getElementById('email')?.value.trim() || "-",
        comment: (document.getElementById('cust-comment')?.value.trim() || "").substring(0, 500),
    };

    // Зберігаємо лише вибір доставки та оплати, не персональні дані.
    localStorage.setItem('saved_delivery', orderData.delivery);
    localStorage.setItem('saved_payment', orderData.payment);

    let orderText = `🌶️ НОВЕ ЗАМОВЛЕННЯ: ${orderData.id}\n`;
    orderText += `👤 ${orderData.name}\n📞 ${orderData.phone}\n`;
    orderText += `🚚 Доставка: ${orderData.delivery}\n`;
    orderText += `💳 Оплата: ${orderData.payment}\n`;
    orderText += `📍 ${orderData.city}, ${orderData.branch}\n`;
    if (orderData.email !== "-") orderText += `📧 ${orderData.email}\n`;
    if (orderData.comment) orderText += `💬 Коментар: ${orderData.comment}\n`;
    orderText += `\n🛒 Товари:\n`;
    orderText += cart.map(i => `- ${i.name} (${i.price}₴) x ${i.qty}`).join("\n");
    orderText += `\n\n💰 РАЗОМ: ${totalSum.toFixed(2)} ₴`;

    try {
        const response = await fetch(window.GOOGLE_SCRIPT_URL, {
            method: "POST",
            mode: "cors", 
            redirect: "follow",
            cache: 'no-cache', 
            headers: { "Content-Type": "text/plain" },
            body: JSON.stringify({ 
                id: orderData.id,
                message: orderText,       
                email: orderData.email,   
                name: orderData.name,
                phone: orderData.phone,
                delivery: orderData.delivery,
                city: orderData.city,
                branch: orderData.branch,
                payment: orderData.payment,
                comment: orderData.comment,
                total: totalSum,
                cart: cart,
                requestId: requestId,
                turnstileToken: window.__gapkaTurnstileToken || '',
                website_url: document.getElementById('website_url')?.value || ''
            })
        });

        if (!response.ok) {
            throw new Error(`Сервер повернув помилку: ${response.status}`);
        }

        let serverResult;
        try {
            serverResult = await response.json();
        } catch (_) {
            throw new Error('Сервер повернув некоректну відповідь. Спробуйте ще раз.');
        }
        if (!serverResult || serverResult.status !== 'success') {
            throw new Error(serverResult?.message || 'Не вдалося підтвердити замовлення. Оновіть кошик і спробуйте ще раз.');
        }

        if (typeof gtag === 'function') {
            gtag('event', 'purchase', {
                transaction_id: serverResult.orderId || orderData.id,
                value: totalSum,
                currency: 'UAH',
                items: cart.map(item => ({
                    item_id: item.productId || item.name,
                    item_name: item.name,
                    price: item.price,
                    quantity: item.qty
                }))
            });
        }

        document.getElementById('modal-main-content').style.display = 'none';
        const successMsg = document.getElementById('success-msg');
        if (successMsg) {
            successMsg.style.display = 'block';
            const orderDisplay = document.getElementById('orderNumberDisplay');
            if (orderDisplay) orderDisplay.innerText = serverResult.orderId || orderData.id;
        }

        const paymentDetails = document.getElementById('payment-details-success');
        if (paymentDetails) {
            if (orderData.payment === "Онлайн оплата") {
                paymentDetails.innerHTML = `
                    <div style="background: rgba(0,0,0,0.3); padding: 20px; border-radius: 12px; border: 1px solid var(--primary-color);">
                        <h3 style="color: #fff; margin-bottom: 15px; font-size: 18px; font-family: var(--font-heading);">💳 Реквізити для оплати</h3>
                        <p style="font-size: 18px; color: #fff; margin-bottom: 15px;">💰 До сплати: <strong style="color: var(--primary-color);">${totalSum.toFixed(2)} ₴</strong></p>
                        <div style="background: #fff; padding: 10px; display: inline-block; border-radius: 8px; margin-bottom: 15px;">
                            <img src="https://gapkainferno.github.io/GHI.jpg" alt="QR" width="140" height="140" style="display: block;">
                        </div>
                        <p style="font-size: 14px; color: #ccc; margin-bottom: 15px;">Відскануйте QR-код або натисніть кнопку нижче:</p>
                        <a href="https://www.privat24.ua/send/km9lh" target="_blank" class="order-btn" style="display: inline-block; width: auto; padding: 10px 25px; font-size: 14px; margin-bottom: 15px; text-decoration: none;">
                            Оплатити у Privat24
                        </a>
                        <p style="font-size: 13px; color: #888;">
                            Рахунок: <br>
                            <strong style="color: var(--primary-color); font-family: monospace; font-size: 16px;">UA693052990262076400946213056</strong>
                        </p>
                        
                    </div>`;
                paymentDetails.style.display = 'block';
            } else {
                paymentDetails.style.display = 'none';
            }
        }

        localStorage.removeItem('pending_order_request_id');
        window.__gapkaTurnstileToken = "";
        if (window.turnstile && turnstileWidgetId !== null) window.turnstile.reset(turnstileWidgetId);
        saveCart([]);
        updateCartUI();
        console.log("Замовлення відправлено успішно!");

    } catch (e) {
        // Turnstile tokens are single-use; require a fresh challenge after any failed attempt.
        window.__gapkaTurnstileToken = "";
        if (window.turnstile && turnstileWidgetId !== null) {
            try { window.turnstile.reset(turnstileWidgetId); } catch (_) {}
        }
        console.error("Помилка відправки:", e);
        if (e.message.includes('Failed to fetch') || e.message.includes('NetworkError')) {
            alert("Помилка мережі або CORS. Перевірте з'єднання. Якщо проблема повторюється — напишіть нам на homestead.inferno@gmail.com 🌐");
        } else {
            alert(e.message || "Помилка сервера. Спробуйте ще раз або напишіть нам на homestead.inferno@gmail.com 🌶️");
        }
    } finally {
        submitBtn.disabled = false;
        submitBtn.classList.remove('btn-loading');
        submitBtn.textContent = originalText;
    }
};

// Код генерації каталогу перенесено в catalog.js
// (щоб уникнути дублювання функцій)

// === ГАЛЕРЕЯ ТА ЗАПУСК ===
let currentImgIndex = 0; // Додаємо індекс для відстеження фото

function updateView(img) {
    const mainView = document.getElementById('main-view');
    if (mainView) {
        mainView.src = img.src;
        document.querySelectorAll('.thumb-img').forEach(t => t.classList.remove('active'));
        img.classList.add('active');
    }
}

// ОСЬ ЦЯ ФУНКЦІЯ ПОВЕРНУЛАСЯ ДЛЯ СТРІЛОЧОК:
window.changeImage = function(dir) {
    const thumbs = document.querySelectorAll('.thumb-img');
    if (thumbs.length > 0) {
        // Рахуємо наступний або попередній індекс
        currentImgIndex = (currentImgIndex + dir + thumbs.length) % thumbs.length;
        // Оновлюємо головне фото
        updateView(thumbs[currentImgIndex]);
    }
};

// === 5. ВІДПРАВКА ВІДГУКУ (НОВЕ) ===
window.sendReview = async function() {
    const honey = document.getElementById('rev-honey')?.value;
    if (honey) return;

    const btn = document.querySelector('#review-form-section .add-btn-aside');
    const author = document.getElementById('rev-author')?.value.trim().substring(0, 100);
    const message = document.getElementById('rev-text')?.value.trim().substring(0, 1000);
    const product = document.getElementById('p-name')?.innerText.trim().substring(0, 150) || "Невідомий товар";

    if (!author || !message) {
        alert("Заповніть, будь ласка, ім'я та текст відгуку ✍️");
        return;
    }
    if (!window.gapkaFormTurnstile) {
        alert("Перевірка безпеки ще завантажується. Оновіть сторінку та спробуйте знову.");
        return;
    }

    try {
        await window.gapkaFormTurnstile.render('review-turnstile');
    } catch (error) {
        alert(error.message || "Не вдалося завантажити перевірку безпеки.");
        return;
    }
    if (!window.gapkaFormTurnstile.get('review-turnstile')) {
        alert("Пройдіть перевірку безпеки перед надсиланням відгуку.");
        return;
    }

    const originalText = btn.innerText;
    btn.disabled = true;
    btn.classList.add('btn-loading');
    btn.innerText = "Надсилаємо...";
    btn.style.opacity = "0.6";
    btn.style.cursor = "not-allowed";

    try {
        const response = await fetch(window.GOOGLE_SCRIPT_URL, {
            method: "POST",
            mode: "cors",
            redirect: "follow",
            cache: "no-cache",
            headers: {"Content-Type": "text/plain"},
            body: JSON.stringify({
                orderType: "ВІДГУК",
                name: author,
                product,
                message,
                requestId: window.gapkaRequestId_('pending_review_request_id', JSON.stringify([author, product, message])),
                turnstileToken: window.gapkaFormTurnstile.get('review-turnstile'),
                website_url: document.getElementById('rev-honey')?.value || ''
            })
        });
        if (!response.ok) throw new Error("Сервер повернув помилку: " + response.status);
        const result = await response.json();
        if (!result || result.status !== 'success') {
            throw new Error(result?.message || "Сервер не підтвердив відгук.");
        }

        localStorage.removeItem('pending_review_request_id');
        btn.innerText = "Дякуємо! Відгук отримано 😊";
        btn.style.background = "#325e34";
        btn.style.opacity = "1";
        document.getElementById('rev-author').value = '';
        document.getElementById('rev-text').value = '';
        setTimeout(() => {
            btn.disabled = false;
            btn.classList.remove('btn-loading');
            btn.innerText = originalText;
            btn.style.background = "";
            btn.style.cursor = "pointer";
        }, 5000);
    } catch (error) {
        console.error("Помилка відправки відгуку:", error);
        alert(error.message || "Не вдалося надіслати відгук. Спробуйте ще раз.");
        btn.disabled = false;
        btn.classList.remove('btn-loading');
        btn.innerText = originalText;
        btn.style.opacity = "1";
        btn.style.cursor = "pointer";
    } finally {
        window.gapkaFormTurnstile.reset('review-turnstile');
    }
};

document.addEventListener('DOMContentLoaded', updateCartUI);
window.addEventListener('pageshow', updateCartUI);
window.updateCartUI = updateCartUI;

function goBack() {
    if (window.history.length > 1) {
        window.history.back();
    } else {
        window.location.href = 'index.html';
    }
}
