// ✅ RATE LIMITING - Prevents spam on order submission
const orderRateLimiter = {
    lastSubmit: 0,
    minInterval: 30000,  // Minimum 30 seconds between attempts
    canSubmit() {
        const now = Date.now();
        if (now - this.lastSubmit < this.minInterval) {
            console.warn('⏱️ Rate limit: order submission attempt too frequent');
            return false;
        }
        this.lastSubmit = now;
        return true;
    }
};

const GLOBAL_SETTINGS = {
    // To open the store: isCategoryLockActive: false or lockedCategories: []
    isCategoryLockActive: false,
    lockedCategories: ['sauces', 'seeds', 'otherseeds', 'fresh-peppers', 'poultry'],
    lockedCategoryTitle: 'Coming Soon',
    lockedCategoryText: 'The section is being prepared for launch in the fall of 2026 🔥',
    lockedCategoryAlert: '🌶️ This section is still under development. We are waiting for you in the fall of 2026!'
};

// ===== SINGLE SALE CONFIG =====
// To launch a sale: isActive: true and required discountPercent.
// To disable banner but keep discounts: banner.isActive: false.
const SALE_SETTINGS = {
    isActive: false,
    discountPercent: 10,
    deadline: "", // Example: "2026-09-30T23:59:59+03:00"
    badgeText: "SALE",
    banner: {
        isActive: true,
        text: "🔥 PREPARING FOR THE BIG LAUNCH OF FALL 2026!"
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
    otherseeds: {
        cardSelector: '.card-link.otherseeds',
        pagePattern: /otherseeds(\.html)?$/,
        productCategories: ['otherseeds']
    },
    'fresh-peppers': {
        cardSelector: '.card-link.fresh-peppers',
        pagePattern: /fresh-peppers(\.html)?$/,
        productCategories: ['fresh-peppers']
    },
    poultry: {
        cardSelector: '.card-link.poultry',
        pagePattern: /orpington-eggs(\.html)?$/,
        productCategories: ['poultry']
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
    return GLOBAL_SETTINGS.lockedCategoryAlert || 'This section is temporarily unavailable.';
};

function isProductOrderable(product) {
    return !!product && product.inStock !== false && !isProductLocked(product);
}

function getCartValidationError(cart) {
    if (!Array.isArray(cart) || cart.length === 0) {
        return 'Cart is empty.';
    }

    if (typeof allProducts === 'undefined') {
        return null;
    }

    for (const item of cart) {
        if (item.productId && item.productId.startsWith('bundle_')) continue;

        const product = item.productId ? allProducts[item.productId] : null;
        if (!product) {
            return `Product "${item.name || 'untitled'}" is no longer available. Please refresh your cart.`;
        }

        if (isProductLocked(product)) {
            return `Product "${product.name}" is currently unavailable for launch.`;
        }

        if (product.inStock === false) {
            return `Product "${product.name}" is currently out of stock.`;
        }
    }

    return null;
}

const CART_CONSTANTS = {
    MAX_QTY: 100,           // Maximum quantity of product
    MAX_NAME_LENGTH: 200,   // Maximum name length
    MAX_DISCOUNT: 0.35,     // Maximum discount (35%)
    MAX_ORDERS_PER_MINUTE: 5 // Rate limiting
};

// ===== NOVA POSHTA SETTINGS =====
const NP_SETTINGS = { // Insert your deployed Google Apps Script URL here
    apiUrl: 'https://script.google.com/macros/s/AKfycbyM4hOHvoUThsKDWSjPPR84TLh_D5SrvBJW3qmly4r2xWk6u2wBO1GVavU1jDUULM83Xg/exec' // <-- DO NOT CHANGE THIS
};

// ===== XSS PROTECTION FUNCTION =====
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function sanitizeInput(text, maxLength = 100) {
    if (!text) return '';
    
    // 1. Convert to string
    text = String(text);
    
    // 2. Remove HTML tags (more reliable expression)
    text = text.replace(/<\/?[^>]+(>|$)/g, "");
    
    // 3. Remove potentially dangerous technical characters, keeping punctuation
    text = text.replace(/[<>\\]/g, '');
    
    // 4. Remove extra spaces
    text = text.trim().replace(/\s+/g, ' ');
    
    // 5. Limit length
    text = text.substring(0, maxLength);
    
    return text;
}


// ===== PRICE VALIDATION (PROTECTION AGAINST MANIPULATION) =====
function getSaleConfig() {
    const discount = Number(SALE_SETTINGS.discountPercent) || 0;
    const deadline = SALE_SETTINGS.deadline ? new Date(SALE_SETTINGS.deadline) : null;
    const hasDeadlinePassed = deadline instanceof Date && !Number.isNaN(deadline.getTime()) && Date.now() > deadline.getTime();

    return {
        isActive: SALE_SETTINGS.isActive === true && discount > 0 && !hasDeadlinePassed,
        discountPercent: Math.min(Math.max(discount, 0), 90),
        badgeText: SALE_SETTINGS.badgeText || "SALE",
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
        console.log('🛒 Cart synchronized with current prices and promotions.');
    }

    return { cart: syncedCart, changed };
}

function renderSalePriceHTML(basePrice, salePrice, suffix = "") {
    if (salePrice < basePrice) {
        return `
            <span class="old-price">${Number(basePrice).toFixed(2)} ₴</span>
            <span class="sale-price">${Number(salePrice).toFixed(2)} ₴</span>${suffix}
        `;
    }

    return `${Number(basePrice).toFixed(2)} ₴${suffix}`;
}

window.getSaleConfig = getSaleConfig;
window.isSaleAllowed = isSaleAllowed;
window.getDiscountedPrice = getDiscountedPrice;
window.renderSalePriceHTML = renderSalePriceHTML;
window.syncCartPrices = syncCartPrices;

function validatePrice(productId, price) {
    if (typeof allProducts === 'undefined' || !allProducts[productId]) {
        console.warn('⚠️ Product not found:', productId);
        return price;
    }
    
    const product = allProducts[productId];
    const expectedPrices = getPriceVariants(product);

    // Now we compare with precision of 1 hryvnia (in case of rounding nuances)
    const isValid = expectedPrices.some(ep => Math.abs(price - ep) <= 1);

    if (!isValid) {
        console.warn('⚠️ Suspicious price for', productId);
        console.warn('   Allowed variants:', expectedPrices);
        console.warn('   Received:', price);
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

// Function for blocking "Coming Soon" categories
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

            // Add visual overlay "Coming Soon" if not already present
            if (!link.querySelector('.coming-soon-overlay')) {
                const overlay = document.createElement('div');
                overlay.className = 'coming-soon-overlay';
                overlay.style.opacity = '1'; // Make it visible immediately
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
        console.warn('⛔ User tried to access locked page:', currentPath);
        window.location.href = 'index.html'; // Redirect to home
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('📍 DOMContentLoaded: Initializing sale and lock functions');
    console.log('🎯 GLOBAL_SETTINGS:', GLOBAL_SETTINGS);
    applyGlobalSale();
    applyCategoryLock();
    
    // Diagnostics: Check if elements were locked
    setTimeout(() => {
        const lockedElements = document.querySelectorAll('.card-link.is-locked');
        console.log(`🔍 Locked elements on page: ${lockedElements.length}`);
        lockedElements.forEach(el => {
            console.log('   - Locked:', el.className, el.href);
        });
    }, 100);
});

// === 1. WORK WITH MEMORY ===
function getFreshCart() {
    try { return JSON.parse(localStorage.getItem('homestead_cart')) || []; } 
    catch (e) { return []; }
}
function saveCart(cart) { localStorage.setItem('homestead_cart', JSON.stringify(cart)); }

// === 2. UPDATE UI ===
function updateCartUI() {
    let cart = getFreshCart(); 

    // ✅ AUTO-CLEANUP: Remove products that are no longer in the database (products.js)
    if (typeof allProducts !== 'undefined' && cart.length > 0) {
        const originalLength = cart.length;
        cart = cart.filter(item => {
            // Bundles (Box) from the main page are not in products.js, so we don't remove them
            if (item.productId && item.productId.startsWith('bundle_')) return true;
            
            // Check if ID exists and is available in the global allProducts object
            return isProductOrderable(allProducts[item.productId]);
        });

        if (cart.length !== originalLength) {
            saveCart(cart);
            console.log('🛒 Cart synchronized: removed outdated products not in database');
        }

        cart = syncCartPrices(cart, { save: true }).cart;
    }

    const totalQty = cart.reduce((acc, item) => acc + item.qty, 0);
    const totalSum = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);

    // Cache elements for performance
    const cartCounts = document.querySelectorAll('.cart-count, #cart-count, .cart-badge');
    cartCounts.forEach(c => { c.innerText = totalQty; });

    const listContainers = document.querySelectorAll('#final-list, .cart-items-container');
    listContainers.forEach(container => {
    if (cart.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 30px 10px;">
                <p class="empty-cart-msg" style="margin-bottom: 20px;">Your basket is still empty 🌶️</p>
                <a href="index.html" class="add-btn" style="display: inline-block; width: auto; margin: 0 !important; text-decoration: none;" onclick="closeCheckout()">Go to catalog</a>
            </div>
        `;
    } else {
        const fragment = document.createDocumentFragment(); // Use fragment for performance
        cart.forEach((item, index) => {
            // Check if there's an old price for strikethrough display
            const hasDiscount = item.originalPrice && item.originalPrice > item.price;
            const priceDisplay = hasDiscount 
                ? `<span style="text-decoration: line-through; opacity: 0.5; font-size: 0.85em; margin-right: 5px;">${parseFloat(item.originalPrice).toFixed(2)} ₴</span>${parseFloat(item.price).toFixed(2)} ₴`
                : `${parseFloat(item.price).toFixed(2)} ₴`;
            
            // Check if product exists in database (protection against deleted IDs)
            const productData = (typeof allProducts !== 'undefined' && item.productId) 
                                ? allProducts[item.productId] 
                                : null;

            // Priority:
            // 1. Direct link saved in item object (item.image)
            // 2. Photo from allProducts database (if found by ID)
            // 3. Placeholder (logo)
            let imageUrl = item.image || (productData && productData.images && productData.images[0]) || 'GapkaLogo.png';
            
            if (!imageUrl || imageUrl === 'null') imageUrl = 'GapkaLogo.png';

            // Use saved name from cart (contains version),
            // or get from database, or set default placeholder
            const safeName = item.name || (productData ? productData.name : 'Product');

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
                                (item.name.toLowerCase().includes('sauce')) 
                                ? '/ pc.' 
                                : (item.name.toLowerCase().includes('box') || item.name.toLowerCase().includes('set'))
                                ? '/ per set' 
                                : (item.name.toLowerCase().includes('egg'))
                                ? '/ per position'
                                : '/ per packet with seeds'
                            }
                        </span>
                    </div>
                </div>
                <div class="cart-item-actions">
                    <span class="cart-item-subtotal">${(parseFloat(item.price) * parseInt(item.qty)).toFixed(2)} ₴</span>
                    <div class="qty-stepper">
                        <button class="qty-btn qty-minus" onclick="changeQty(${index}, -1)" aria-label="Reduce">−</button>
                        <span class="qty-value">${parseInt(item.qty)}</span>
                        <button class="qty-btn qty-plus" onclick="changeQty(${index}, +1)" aria-label="Increase">+</button>
                    </div>
                    <button class="cart-item-remove" onclick="removeFromCart(${index})" aria-label="Remove item">×</button>
                </div>
            `;
            fragment.appendChild(itemDiv);
        });
        container.innerHTML = '';
        container.appendChild(fragment);
    }
    });

    document.querySelectorAll('#final-price, .total-price-display, #cart-total').forEach(priceEl => {
        priceEl.innerText = `${totalSum.toFixed(2)} ₴`;
    });

    // Hide order button if empty
    const orderBtn = document.querySelector('.order-btn');
    if (orderBtn) orderBtn.style.display = (cart.length === 0) ? 'none' : 'block';
}

// === 3. CART MANAGEMENT ===
window.openCheckout = function() {
    // ✅ RATE LIMITING: Check if clicking too frequently
    if (typeof RateLimiter !== 'undefined' && !RateLimiter.check('checkout')) {
        alert('⏱️ Wait a few seconds before the next click...');
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
        
        // Auto-fill saved data
        const fields = ['name', 'phone', 'city', 'branch', 'email', 'delivery', 'city_ref', 'payment'];
        fields.forEach(f => {
            const val = localStorage.getItem('saved_' + f);
            if (!val) return;
            
            if (f === 'city_ref') {
                const cityEl = document.getElementById('cust-city');
                if (cityEl) cityEl.dataset.ref = val;
                return;
            }
            
            // ✅ FIX: Also fill the visible branch field
            if (f === 'branch') {
                const branchVisible = document.getElementById('cust-branch-input');
                if (branchVisible) branchVisible.value = val;
            }

            const el = document.getElementById(f === 'email' ? 'email' : 'cust-' + f);
            if (el) el.value = val;
        });
        updateCartUI();
        initDeliveryOptions(); // Initialize delivery logic
        initPaymentLogic();    // Initialize payment hint
    }
};

let isDeliveryInitialized = false;
let isPaymentInitialized = false;
let currentCityBranches = [];
let lastSelectedCity = "";
let lastSelectedCityRef = "";
let isLocked = false;
let debounceTimeout;
let currentDeliveryType = ""; // Variable to track current delivery type

const cleanForSearch = (str) => {
    if (!str) return "";
    return str.toLowerCase()
        .replace(/[^a-zа-яіїєґ0-9]/gi, ' ') 
        .replace(/\s+/g, ' ')               
        .trim();
};

// ───────────────────────────────────────────────────────────────
// MAIN INITIALIZATION FUNCTION
// ───────────────────────────────────────────────────────────────
function initDeliveryOptions() {
    const cityInput = document.getElementById('cust-city');
    const branchInput = document.getElementById('cust-branch-input');
    const branchLabel = document.querySelector('#branch-group label');
    const deliverySelect = document.getElementById('cust-delivery');
    const branchSuggestions = document.getElementById('branch-suggestions');
    const citySuggestions = document.getElementById('city-suggestions');
    const branchHidden = document.getElementById('cust-branch'); // Hidden field for Nova Poshta Ref

    if (!deliverySelect || !cityInput || !branchInput || !branchLabel) return;

    // Update UI for delivery type
    const updateBranchUI = () => {
        currentDeliveryType = deliverySelect.value;

        // Reset error styles
        cityInput.classList.remove('input-error');
        branchInput.classList.remove('input-error');

        // Hide suggestions by default
        citySuggestions.style.display = 'none';
        branchSuggestions.style.display = 'none';

        // Logic for Nova Poshta
        if (currentDeliveryType.includes("Нова Пошта")) {
            branchLabel.innerText = (currentDeliveryType === "Кур'єр НП")
                ? "Delivery address (street, house, apartment)"
                : "Branch or parcel locker (number or address)";
            branchInput.placeholder = (currentDeliveryType === "Кур'єр НП")
                ? "E.g.: 1 Shevchenko St, apt. 10"
                : "Enter number or name...";
            cityInput.placeholder = "E.g.: Kyiv";
            cityInput.disabled = false;
            branchInput.disabled = (currentDeliveryType !== "Кур'єр НП" && !cityInput.dataset.ref); // Block branch if city not selected
        }
        // Logic for Ukrposhta
        else if (currentDeliveryType === "Укрпошта") {
            branchLabel.innerText = "Delivery address (street, house, apartment, index)";
            branchInput.placeholder = "E.g.: 1 Central St, apt. 5, 01001";
            cityInput.placeholder = "E.g.: Kyiv";
            cityInput.disabled = false;
            branchInput.disabled = false;
            // For Ukrposhta we don't use Nova Poshta API, so hide suggestions
            citySuggestions.style.display = 'none';
            branchSuggestions.style.display = 'none';
        }
    };

    // ✅ FIX: Auto-load warehouses on start
    const checkAutoLoad = async () => {
        if (!cityInput || !cityInput.value.trim()) return;
        
        const cityRef = cityInput.dataset.ref;
        
        // If there's saved ref and city
        if (cityRef && cityRef !== "") {
            console.log('🔄 Auto-loading warehouses for:', cityInput.value);
            lastSelectedCity = cityInput.value;
            lastSelectedCityRef = cityRef;
            await loadWarehouses(cityRef);
        }
    };

    // ✅ FIX: Check if already initialized
    if (isDeliveryInitialized) {
        updateBranchUI();
        checkAutoLoad(); // Call only after initialization
        return;
    }

    if (deliverySelect) deliverySelect.addEventListener('change', updateBranchUI);
    updateBranchUI();

    // ───────────────────────────────────────────────────────────────
    // CITY SEARCH
    // ───────────────────────────────────────────────────────────────

    const triggerCitySearch = async (query) => {
        // Add lock check at the beginning of the function
        if (currentDeliveryType !== "Відділення НП" && currentDeliveryType !== "Поштомат НП") {
            citySuggestions.style.display = 'none';
            return; // Don't search for cities if not Nova Poshta
        }


        if (isLocked || !query) {
            console.log('🔒 Search locked');
            return;
        }

        const cleanedQuery = cleanForSearch(query);
        const cleanedLast = cleanForSearch(lastSelectedCity);

        // If already selected this city - don't search
        if (cleanedQuery === cleanedLast && cityInput.dataset.ref) {
            citySuggestions.style.display = 'none';
            return;
        }

        if (query.length < 1) {
            citySuggestions.style.display = 'none';
            return;
        }

        // Show loader
        citySuggestions.innerHTML = '<div class="np-item np-loading">We are looking for a city... 🔍</div>';
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
                        Limit: 8 // Increased from 5 to 8
                    }
                })
            });

            const data = await response.json();

            // ✅ FIX: Check if field is still active
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
                citySuggestions.innerHTML = '<div class="np-item np-empty">City not found 😕 Try changing language or check spelling.</div>';
                citySuggestions.style.display = 'block';
            }
        } catch (error) {
            console.error('❌ Error searching for city:', error);
            citySuggestions.innerHTML = '<div class="np-item np-error">Connection error</div>';
            citySuggestions.style.display = 'block';
        }
    };

    // ✅ IMPROVED: Input handler with debounce
    cityInput.addEventListener('input', (e) => {
        if (currentDeliveryType !== "Відділення НП" && currentDeliveryType !== "Поштомат НП") {
            cityInput.dataset.ref = ""; // Reset ref if switched from NP
            return;
        }

        if (isLocked) return;
        
        clearTimeout(debounceTimeout);
        const query = e.target.value.trim();
        
        // ✅ FIX: Reset selection only if text REALLY changed
        const currentClean = cleanForSearch(query);
        const lastClean = cleanForSearch(lastSelectedCity);
        
        if (currentClean !== lastClean) {
            cityInput.dataset.ref = "";
            lastSelectedCity = "";
            lastSelectedCityRef = "";
            // Clear branch on city change
            currentCityBranches = [];
            branchInput.value = "";
            branchHidden.value = "";
            branchSuggestions.style.display = 'none';
        }

        // ✅ IMPROVED: Debounce 200ms instead of 150ms
        debounceTimeout = setTimeout(async () => {
            await triggerCitySearch(query);
        }, 200);
    });

    // ✅ IMPROVED: Show list on focus
    cityInput.addEventListener('focus', () => {
        if (currentDeliveryType !== "Відділення НП" && currentDeliveryType !== "Поштомат НП") {
            citySuggestions.style.display = 'none';
            return;
        }

        if (isLocked) return;
        
        const val = cityInput.value.trim();

        // If city already selected (has data-ref) and field value hasn't changed,
        // don't show suggestions again. User already made a choice.
        if (cityInput.dataset.ref && val === lastSelectedCity) {
            citySuggestions.style.display = 'none';
            return;
        } else if (val.length >= 1) { // If there's text and city not selected or changed - search
            triggerCitySearch(val);
        }
    });

    // ✅ IMPROVED: Select city
    citySuggestions.addEventListener('click', async (e) => {
        if (currentDeliveryType !== "Відділення НП" && currentDeliveryType !== "Поштомат НП") {
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
        
        // 0. Immediately cancel any scheduled search
        clearTimeout(debounceTimeout);

        // ✅ FIX: Lock reliably
        isLocked = true;
        clearTimeout(debounceTimeout);
        console.log('🔒 City selected, locking interface');

        const cityRef = item.getAttribute('data-ref');
        const fullTitle = item.innerText.trim();

        if (!cityRef) {
            console.error('❌ City ref not found');
            isLocked = false;
            return;
        }

        // 1. Update UI IMMEDIATELY
        cityInput.dataset.ref = cityRef;
        cityInput.value = fullTitle;
        lastSelectedCity = fullTitle;
        lastSelectedCityRef = cityRef;
        citySuggestions.innerHTML = '';
        citySuggestions.style.display = 'none';

        // 2. Clear branch field
        branchInput.value = '';
        branchHidden.value = '';
        currentCityBranches = [];
        
        // 3. Show loader in placeholder
        const isCourier = deliverySelect?.value === "Кур'єр НП";
        branchInput.placeholder = isCourier 
            ? 'Street, house...' 
            : 'Loading warehouses... ⏳';
        
        // 4. Move focus
        branchInput.focus();

        // 5. Load warehouses
        await loadWarehouses(cityRef);
        
        // ✅ FIX: Unlock after longer interval
        setTimeout(() => {
            isLocked = false;
            console.log('🔓 Interface unlocked');
        }, 600); // Increased from 500ms
    });

    // ───────────────────────────────────────────────────────────────
    // BRANCH SEARCH
    // ───────────────────────────────────────────────────────────────

    // ✅ IMPROVED: Input handler
    branchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();

        // Sync with hidden field
        branchHidden.value = e.target.value;

        // If not Nova Poshta or courier delivery NP - don't show branch list
        if (currentDeliveryType === "Укрпошта" || currentDeliveryType === "Кур'єр НП") {
            branchSuggestions.style.display = 'none';
            return;
        }
        // If city not selected for NP branch/parcel locker
        if (!cityInput.dataset.ref && (currentDeliveryType === "Відділення НП" || currentDeliveryType === "Поштомат НП")) {
            branchSuggestions.innerHTML = '<div class="np-item np-info">Select city first ⬆️</div>';
            return;
        }

        // Show filtered branches
        renderBranchSuggestions(query.toLowerCase());
    });

    // ✅ IMPROVED: Show list on focus
    branchInput.addEventListener('focus', () => {
        // If not Nova Poshta or courier delivery NP - don't show branch list
        if (currentDeliveryType === "Укрпошта" || currentDeliveryType === "Кур'єр НП") {
            return;
        }

        const val = branchInput.value.trim();

        // ✅ FIX: Show list even if field is empty
        if (currentCityBranches.length > 0) {
            renderBranchSuggestions(val.toLowerCase()); // Show all if field is empty
        } else if (cityInput.value.trim() !== "" && !lastSelectedCity) {
            // Hint that city needs to be selected first
            branchSuggestions.innerHTML = '<div class="np-item np-info">Select city first ⬆️</div>';
            branchSuggestions.style.display = 'block';
            setTimeout(() => {
                branchSuggestions.style.display = 'none';
            }, 2000);
        }
    });

    // ✅ IMPROVED: Select branch
    branchSuggestions.addEventListener('click', (e) => {
        // If not Nova Poshta or courier delivery NP - don't react
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

    // ✅ IMPROVED: Rendering branch list
    function renderBranchSuggestions(query) {
        // Protection from Ukrposhta and NP courier
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
        }).slice(0, 20); // Increased from 15 to 20

        if (filtered.length > 0) {
            branchSuggestions.innerHTML = filtered.map(b => `
                <div class="np-item">
                    ${escapeHtml(b.Description)}
                </div>
            `).join('');
            branchSuggestions.style.display = 'block';
        } else if (searchWords.length > 0) {
            branchSuggestions.innerHTML = '<div class="np-item np-empty">Nothing found</div>';
            branchSuggestions.style.display = 'block';
        } else {
            branchSuggestions.style.display = 'none';
        }
    }

    // ───────────────────────────────────────────────────────────────
    // WAREHOUSE LOADING
    // ───────────────────────────────────────────────────────────────

    async function loadWarehouses(cityRef) {
        console.log('📦 Loading warehouses for ref:', cityRef);

        if (currentDeliveryType === "Укрпошта" || currentDeliveryType === "Кур'єр НП") {
            currentCityBranches = []; // Clear if switched
            return;
        }
        
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
                    calledMethod: "getWarehouses",
                    methodProperties: { 
                        CityRef: cityRef,
                        Limit: 500 // Load all warehouses
                    }
                })
            });

            const data = await response.json();

            if (data.success && data.data && data.data.length > 0) {
                currentCityBranches = data.data;
                console.log(`✅ Loaded ${data.data.length} warehouses`);
                
                branchInput.placeholder = 'Enter number or address';
                
                // ✅ FIX: Automatically show list if field is active
                const isNotCourier = currentDeliveryType !== "Кур'єр НП";
                const isFocused = document.activeElement === branchInput;
                
                if (isNotCourier && isFocused) {
                    setTimeout(() => {
                        renderBranchSuggestions(branchInput.value.toLowerCase().trim());
                    }, 100);
                }
            } else {
                currentCityBranches = [];
                branchInput.placeholder = 'No warehouses found';
                console.warn('⚠️ No warehouses found for city');
            }
        } catch (error) {
            console.error('❌ Error loading warehouses:', error);
            currentCityBranches = [];
            branchInput.placeholder = 'Loading error';
        }
    }

    // ───────────────────────────────────────────────────────────────
    // GLOBAL HANDLERS
    // ───────────────────────────────────────────────────────────────

    // Close lists when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.form-group')) {
            citySuggestions.style.display = 'none';
            branchSuggestions.style.display = 'none';
        }
    });

    // Close on ESC
    document.addEventListener('keydown', (e) => {
        // Don't close suggestions if not Nova Poshta
        if (currentDeliveryType === "Укрпошта") {
            return;
        }

        if (e.key === 'Escape') {
            citySuggestions.style.display = 'none';
            branchSuggestions.style.display = 'none';
            // Also remove focus
            if (document.activeElement === cityInput || document.activeElement === branchInput) {
                document.activeElement.blur();
            }
        }
    });

    // ✅ NEW: Navigation with arrow keys in list
    const handleArrowNavigation = (e, suggestions) => {
        // Don't navigate if not Nova Poshta
        if (currentDeliveryType === "Укрпошта") {
            return;
        }

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
    // INITIALIZATION COMPLETE
    // ───────────────────────────────────────────────────────────────

    isDeliveryInitialized = true;
    console.log('✅ Nova Poshta initialized');
    
    // ✅ FIX: Call auto-load only after full initialization
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
        codHint.style.display = (paymentSelect.value === "Cash on delivery") ? 'block' : 'none';
        onlineHint.style.display = (paymentSelect.value === "Online payment") ? 'block' : 'none';
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

// +/- quantity in modal
window.changeQty = function(index, delta) {
    let cart = getFreshCart();
    if (!cart[index]) return;

    const newQty = cart[index].qty + delta;

    if (newQty <= 0) {
        if (!confirm(`Remove "${cart[index].name}" from cart?`)) return;
        cart.splice(index, 1);
    } else {
        // ✅ NEW: Using constant
        cart[index].qty = Math.min(newQty, CART_CONSTANTS.MAX_QTY);
    }

    saveCart(cart);
    updateCartUI();
    if (cart.length === 0) closeCheckout();
};

// Universal add function
window.addToCart = function(productId, price, name, qty = 1, originalPrice = null, image = null, versionKey = null) {
    // ✅ RATE LIMITING: Check key frequency
    if (typeof RateLimiter !== 'undefined' && !RateLimiter.check('addToCart')) {
        console.warn('⏱️ Adding products too quickly. Please wait...');
        return;
    }

    const productData = productId && typeof allProducts !== 'undefined' ? allProducts[productId] : null;
    if (productId && !productId.startsWith('bundle_') && !isProductOrderable(productData)) {
        const message = productData && isProductLocked(productData)
            ? window.getLockedCategoryAlert()
            : 'This item is currently unavailable for order.';
        alert(message);
        return;
    }

    let cart = getFreshCart();
    
    // ✅ NEW: Sanitize name
    const safeName = sanitizeInput(name, CART_CONSTANTS.MAX_NAME_LENGTH);
    
    // ✅ NEW: Using constant
    const validatedPrice = validatePrice(productId, parseFloat(price));
    const validatedQty = Math.max(1, Math.min(CART_CONSTANTS.MAX_QTY, parseInt(qty)));
    const productBasePrice = productData ? getCartItemBasePrice({ name: safeName, versionKey, originalPrice, price }, productData) : originalPrice;
    const normalizedOriginalPrice = productBasePrice || originalPrice || validatedPrice;
    
    // Search for existing product
    const existing = cart.find(item => {
        if (productId && item.productId && item.productId === productId) {
            return item.name.toLowerCase().trim() === safeName.toLowerCase().trim();
        }
        return item.name.toLowerCase().trim() === safeName.toLowerCase().trim();
    });

    if (existing) {
        // ✅ NEW: Using constant
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

    // Tracking add to cart for sales funnel analysis
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
};


// 1. For product page (product.html)
window.pushToCart = function() {
    if (typeof currentProductId === 'undefined') {
        console.error('currentProductId not defined');
        return;
    }
    const priceContainer = document.getElementById('p-price');
    const addBtn = document.querySelector('.add-btn[onclick*="pushToCart"]');
    const qtyEl = document.getElementById('p-qty');

    if (!priceContainer) return;

    // Get product ID
    const productId = typeof currentProductId !== 'undefined' ? currentProductId : null;
    
    // GET NAME FROM DATABASE (as in catalog), not from screen
    let name = (productId && typeof allProducts !== 'undefined' && allProducts[productId]) 
               ? allProducts[productId].name 
               : document.getElementById('p-name').innerText;

    // 🔥 NEW: ADD SEED VERSION TO NAME
    const versionKey = addBtn.getAttribute('data-version');
    if (versionKey && productId && typeof allProducts !== 'undefined' && allProducts[productId].seedVersions) {
        const versionData = allProducts[productId].seedVersions[versionKey];
        if (versionData && versionData.label) {
            name = `${name} (${versionData.label})`; // Will be: "Zebrange (Isolated)"
        }
    }

    const isAllowed = priceContainer.getAttribute('data-allow-sale') === 'true';
    // Get BASE price (without discount) from data-val attribute
    const originalPrice = parseFloat(priceContainer.getAttribute('data-val'));
    
    const price = isAllowed && addBtn.hasAttribute('data-price') 
                  ? parseFloat(addBtn.getAttribute('data-price')) 
                  : originalPrice;
    
    const qty = parseInt(qtyEl.value) || 1;

    // Get image URL from page
    const mainImg = document.getElementById('main-view');
    const image = mainImg ? mainImg.src : null;
    
    addToCart(productId, price, name, qty, originalPrice, image, versionKey);
    alert("Added to cart! 🌶️");
};

window.addToCartDirectly = function(productId, buttonElement) {
    try {
        // ✅ RATE LIMITING to prevent spam
        if (window.RateLimiter && !window.RateLimiter.check('addToCart')) {
            console.warn('⏱️ Too many attempts');
            // Shake the button
            buttonElement?.style?.setProperty('animation', 'pulse 0.3s ease-in-out');
            return;
        }

        const card = buttonElement.closest('.product-card');
        if (!card) throw new Error("Product card not found");

        // 1. GET NAME FROM DATABASE (products.js)
        let actualName = (typeof allProducts !== 'undefined' && allProducts[productId]) 
                         ? allProducts[productId].name 
                         : productId;

        // 2. FIND PRICE ON CARD (to account for sale)
        const priceElement = card.querySelector('.card-price');
        if (!priceElement) throw new Error("Price on card not found");

        const buttonPrice = parseFloat(buttonElement?.getAttribute('data-price'));
        const salePriceEl = priceElement.querySelector('.sale-price');
        const priceText = salePriceEl ? salePriceEl.innerText : priceElement.innerText;
        const cleanPrice = Number.isFinite(buttonPrice)
            ? buttonPrice
            : parseFloat(priceText.replace(/[^\d.,]/g, '').replace(',', '.'));
        
        if (isNaN(cleanPrice)) throw new Error("Failed to recognize price");
        // Get base price for strikethrough
        const basePrice = parseFloat(priceElement.getAttribute('data-base-price'));

        // Get image URL from card
        const imgEl = card.querySelector('.img-container img');
        const image = imgEl ? imgEl.src : null;

        // 3. ADD TO CART via universal function
        addToCart(productId, cleanPrice, actualName, 1, basePrice, image);
        
        alert(`🌶️ ${actualName} added!`);

    } catch (error) {
        console.error("Error adding:", error.message);
        alert("Error adding product. Please try again.");
    }
};

window.clearFullCart = function() {
    if (confirm("Remove all items from the cart?")) {
        saveCart([]); // Clear array in memory
        updateCartUI(); // Update all numbers and lists on page
        closeCheckout(); // Close modal, nothing to buy
    }
};
// ===== ORDER NUMBER GENERATOR =====
function generateOrderNumber() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0'); // Add day (e.g., 06)
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Month (02)
    const year = String(now.getFullYear()).slice(-2); // 26
    // 4 random characters (digits and letters) in uppercase
    const unique = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `HS-${day}${month}${year}-${unique}`;
}

// === 4. ORDER SUBMISSION ===
window.submitOrder = async function() {
    // ✅ NEW: Rate limiting
    if (!orderRateLimiter.canSubmit()) {
        alert("Too many submission attempts. Please wait a minute.");
        return;
    }
    
    // Honeypot check (remains as is)
    const honeypot = document.getElementById('website_url');
    if (honeypot && honeypot.value !== '') {
        console.warn('🤖 Bot detected');
        alert("Thank you for your order!");
        closeCheckout();
        return;
    }
    
    // Get fields
    const fields = {
        name: document.getElementById('cust-name'),
        phone: document.getElementById('cust-phone'),
        delivery: document.getElementById('cust-delivery'),
        payment: document.getElementById('cust-payment'),
        city: document.getElementById('cust-city'),
        branch: document.getElementById('cust-branch'), // hidden field for ID/full text
        branchInput: document.getElementById('cust-branch-input') // visible text field
    };

    // 1. SYNCHRONIZATION BEFORE VALIDATION
    // If hidden field is empty, but visible field has something - copy (in case of manual input)
    if (fields.branch && fields.branchInput && !fields.branch.value.trim()) {
        fields.branch.value = fields.branchInput.value.trim();
    }

    let hasError = false;

    // Clear previous errors
    Object.values(fields).forEach(el => el && el.classList?.remove('input-error'));
    if (fields.branchInput) fields.branchInput.classList.remove('input-error');

    // ✅ NEW: Sanitize all fields
    const sanitizedData = {};
    
    for (let key in fields) {
        const field = fields[key];
        if (!field) continue;
        
        const value = field.value.trim();
        
        // Check for empty
        if (!value) {
            // If error in hidden branch field - highlight visible field
            if (key === 'branch' && fields.branchInput) {
                fields.branchInput.classList.add('input-error');
            } else if (field.classList) {
                field.classList.add('input-error');
            }
            hasError = true;
            continue;
        }
        
        // Sanitize (except phone - we check it separately)
        if (key !== 'phone') {
            const maxLen = key === 'name' ? 50 : 100;
            sanitizedData[key] = sanitizeInput(value, maxLen);
            field.value = sanitizedData[key]; // Update field
        } else {
            sanitizedData[key] = value; // Phone checked below
        }
    }
    function validatePhone(phone) {
    if (!phone) return false;
    
    // 1. Clean from all extra characters
    const cleaned = phone.replace(/[\s\(\)\-]/g, '');
    
    // 2. Check format: <!-- <span>+00000000000</span>--> or 0XXXXXXXXX
    // Allow +380, 380, 80 or just 0 at the start
    const phoneRegex = /^(?:\+?38)?(?:0|80)\d{9}$/;
    
    return phoneRegex.test(cleaned);
}

function cleanPhone(phone) {
    if (!phone) return '';
    
    // Clean and return in format <!-- <span>+00000000000</span>-->
    const cleaned = phone.replace(/[\s\(\)\-]/g, '');
    
    // If starts with 0 - add +38
    if (cleaned.startsWith('0')) {
        return '+38' + cleaned;
    }
    
    // If already has +38 - return as is
    if (cleaned.startsWith('+38')) {
        return cleaned;
    }
    
    return cleaned;
}


    // ✅ NEW: Improved phone validation
    if (fields.phone) {
        if (!validatePhone(fields.phone.value)) {
            alert("Invalid phone number.\nExample: 0951234567 or +380951234567");
            fields.phone.classList.add('input-error');
            hasError = true;
        } else {
            // Clean and format phone
            const cleanedPhone = cleanPhone(fields.phone.value);
            fields.phone.value = cleanedPhone;
            sanitizedData.phone = cleanedPhone;
        }
    }

    // Email validation (if filled)
    const emailEl = document.getElementById('email');
    if (emailEl && emailEl.value.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailEl.value.trim())) {
            alert("Please enter a valid email");
            emailEl.classList.add('input-error');
            hasError = true;
        } else {
            // ✅ NEW: Sanitize email
            sanitizedData.email = sanitizeInput(emailEl.value.trim(), 100);
            emailEl.value = sanitizedData.email;
        }
    }

    // 2. CHECK SELECTED CITY (whether selected from API)
    const cityInput = document.getElementById('cust-city'); // City field
    if (cityInput) {
        const cityRef = cityInput.dataset.ref;
        if (currentDeliveryType.includes("Nova Poshta") && (!cityRef || cityRef === "" || cityInput.value.trim() !== lastSelectedCity.trim())) {
            alert("Please select a city from the suggestions list 📍\nThis is required for correct delivery registration.");
            cityInput.classList.add('input-error');
            hasError = true;
        }
    }

    // 3. CHECK BRANCH CONTENT (Protection against incomplete data)
    const branchVal = fields.branch.value.trim().toLowerCase();
    const deliveryType = fields.delivery.value;

    if (deliveryType.includes("Nova Poshta") && deliveryType !== "Nova Poshta (Courier)" && (branchVal === 'parcel locker' || branchVal === 'branch' || branchVal.length < 3)) {
        alert("Please specify a specific branch number or address of Nova Poshta parcel locker 🏢");
        if (fields.branchInput) fields.branchInput.classList.add('input-error');
        hasError = true;
    }
    else if (deliveryType === "Ukrposhta" && branchVal.length < 5) {
        alert("Please specify full delivery address for Ukrposhta (street, house, apartment, index) 📮");
        if (fields.branchInput) fields.branchInput.classList.add('input-error');
        hasError = true;
    }

    if (hasError) {
        return;
    }

    // --- Your submission code follows (it works) ---
    const submitBtn = document.querySelector('.checkout-summary .order-btn');
    if (!submitBtn) { console.error('submitOrder: order-btn not found'); return; }
    const originalText = submitBtn.textContent;
    // 🔥 BEAUTIFUL ORDER NUMBER GENERATOR
    const orderID = generateOrderNumber();
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
    submitBtn.classList.add('btn-loading'); // Add class for styles
    submitBtn.textContent = `Sending...`;

    // Collect data
    const orderData = {
        id: orderID, 
        name: fields.name.value.trim(),
        phone: fields.phone.value.trim(),
        delivery: fields.delivery.value.trim(),
        payment: fields.payment.value.trim(),
        city: fields.city.value.trim(),
        branch: (deliveryType === "Ukrposhta")
            ? fields.branchInput.value.trim()
            : fields.branch.value.trim(),

        email: document.getElementById('email')?.value.trim() || "-",
        comment: (document.getElementById('cust-comment')?.value.trim() || "").substring(0, 500),
        secret_token: "summerof26"
    };

    // Save to memory for next time
    localStorage.setItem('saved_name', orderData.name);
    localStorage.setItem('saved_phone', orderData.phone);
    localStorage.setItem('saved_delivery', orderData.delivery);
    localStorage.setItem('saved_payment', orderData.payment);
    localStorage.setItem('saved_city', orderData.city); // Save city
    localStorage.setItem('saved_city_ref', fields.city.dataset.ref || '');
    localStorage.setItem('saved_branch', orderData.branch);

    /// 4. Format message for Telegram
    let orderText = `🌶️ NEW ORDER: ${orderData.id}\n`;
    orderText += `👤 ${orderData.name}\n📞 ${orderData.phone}\n`;
    orderText += `🚚 Delivery: ${orderData.delivery}\n`;
    orderText += `💳 Payment: ${orderData.payment}\n`;
    orderText += `📍 ${orderData.city}, ${orderData.branch}\n`;
    if (orderData.email !== "-") orderText += `📧 ${orderData.email}\n`;
    if (orderData.comment) orderText += `💬 Comment: ${orderData.comment}\n`;
    orderText += `\n🛒 Items:\n`;
    orderText += cart.map(i => `- ${i.name} (${i.price}₴) x ${i.qty}`).join("\n");
    orderText += `\n\n💰 TOTAL: ${totalSum.toFixed(2)} ₴`;

    try {
        const response = await fetch("https://script.google.com/macros/s/AKfycbyiEM5NnSk-Hg6-ObFifQQf3Xfmt8AjRcqHuinxkueImuEbBUKWl0AlAYUcmn5v0tfm/exec", {
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
                phone: orderData.phone,    // Added phone (won't hurt)
                delivery: orderData.delivery,
                city: orderData.city,
                branch: orderData.branch,
                payment: orderData.payment,
                comment: orderData.comment,
                total: totalSum,           // Added sum as separate field for logs
                cart: cart,                // Pass array of items for receipt in email
                secret_token: "summerof26"
            })
        });

        // If we're here and mode: "cors", the request was successful
        if (!response.ok) {
            throw new Error(`Server returned error: ${response.status}`);
        }

        // Track successful purchase in Google Analytics 4
        if (typeof gtag === 'function') {
            gtag('event', 'purchase', {
                transaction_id: orderData.id,
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

        // Show success screen
        document.getElementById('modal-main-content').style.display = 'none';
        const successMsg = document.getElementById('success-msg');
        if (successMsg) {
            successMsg.style.display = 'block';
            const orderDisplay = document.getElementById('orderNumberDisplay');
            if (orderDisplay) orderDisplay.innerText = orderData.id;
        }

        // Show payment details if online payment selected
        const paymentDetails = document.getElementById('payment-details-success');
        if (paymentDetails) {
            if (orderData.payment === "Online payment (prepayment)") {
                paymentDetails.innerHTML = `
                    <div style="background: rgba(0,0,0,0.3); padding: 20px; border-radius: 12px; border: 1px solid var(--primary-color);">
                        <h3 style="color: #fff; margin-bottom: 15px; font-size: 18px; font-family: var(--font-heading);">💳 Payment Details</h3>
                        <div style="background: #fff; padding: 10px; display: inline-block; border-radius: 8px; margin-bottom: 15px;">
                            <img src="https://gapkainferno.github.io/GHI.jpg" alt="QR" width="140" height="140" style="display: block;">
                        </div>
                        <p style="font-size: 14px; color: #ccc; margin-bottom: 15px;">Scan QR code or click the button below:</p>
                        <a href="https://www.privat24.ua/send/jkvgx" target="_blank" class="order-btn" style="display: inline-block; width: auto; padding: 10px 25px; font-size: 14px; margin-bottom: 15px; text-decoration: none;">
                            Pay via Privat24
                        </a>
                        <p style="font-size: 13px; color: #888;">
                            Envelope Card: <br>
                            <strong style="color: var(--primary-color); font-family: monospace; font-size: 16px;">5168 7521 5680 2145</strong>
                        </p>
                        <p style="font-size: 12px; color: var(--primary-orange); margin-top: 10px; font-style: italic;">
                            * Please send payment screenshot to email homestead.inferno@gmail.com.
                        </p>
                    </div>`;
                paymentDetails.style.display = 'block';
            } else {
                paymentDetails.style.display = 'none';
            }
        }

        saveCart([]);
        updateCartUI();
        console.log("Order sent successfully!");

    } catch (e) {
        console.error("Submission error:", e);
        // Specific check for CORS errors that often occur with Google Scripts
        if (e.message.includes('Failed to fetch') || e.message.includes('NetworkError')) {
            alert("Network or CORS error. Check your connection. If the problem persists — message us! 🌐");
        } else {
            alert("Server error. Please try again or message us 🌶️");
        }
    } finally {
        submitBtn.disabled = false;
        submitBtn.classList.remove('btn-loading'); // Remove fade class
        submitBtn.textContent = originalText;
    }
};

// Catalog generation code moved to catalog.js
// (to avoid function duplication)

// === GALLERY AND LAUNCH ===
let currentImgIndex = 0; // Add index for photo tracking

function updateView(img) {
    const mainView = document.getElementById('main-view');
    if (mainView) {
        mainView.src = img.src;
        document.querySelectorAll('.thumb-img').forEach(t => t.classList.remove('active'));
        img.classList.add('active');
    }
}

// THIS FUNCTION RETURNED FOR ARROWS:
window.changeImage = function(dir) {
    const thumbs = document.querySelectorAll('.thumb-img');
    if (thumbs.length > 0) {
        // Calculate next or previous index
        currentImgIndex = (currentImgIndex + dir + thumbs.length) % thumbs.length;
        // Update main photo
        updateView(thumbs[currentImgIndex]);
    }
};

// === 5. REVIEW SUBMISSION (NEW) ===
window.sendReview = async function() {
    const honey = document.getElementById('rev-honey')?.value;
    if (honey) return; // If field filled - it's a bot
    // 1. Find button and data
    const btn = document.querySelector('#review-form-section .add-btn-aside');
    const author = document.getElementById('rev-author')?.value.trim().substring(0, 100);
    const text = document.getElementById('rev-text')?.value.trim().substring(0, 1000);
    const prodName = document.getElementById('p-name')?.innerText || "Unknown product";

    // Validation
    if (!author || !text) {
        alert("Please fill in name and review text ✍️");
        return;
    }

    // 2. Visual blocking
    const originalText = btn.innerText;
    btn.disabled = true;
    btn.classList.add('btn-loading');
    btn.innerText = "Sending...";
    btn.style.opacity = "0.6";
    btn.style.cursor = "not-allowed";

    try {
        // 3. Send to main script with token
        await fetch("https://script.google.com/macros/s/AKfycbyL5WKFxLfStcgOQHasZ4QYi5wh1jxNVKhis495gjd6BGAlhex8e1b6607fUV4Y0zUA/exec", {
            method: "POST",
            mode: "cors",
            redirect: "follow",
            headers: { "Content-Type": "text/plain" },
            body: JSON.stringify({ 
                orderType: "REVIEW",
                name: author,
                product: prodName,
                message: text,
                secret_token: "summerof26"
            })
        });

        // 4. Success: change button appearance
        btn.innerText = "Thank you!😊";
        btn.style.background = "#325e34"; 
        btn.style.opacity = "1";

        // Clear fields
        document.getElementById('rev-author').value = '';
        document.getElementById('rev-text').value = '';

        // 5. Return button to normal after 5 seconds
        setTimeout(() => {
            btn.disabled = false;
            btn.classList.remove('btn-loading');
            btn.innerText = originalText;
            btn.style.background = ""; 
            btn.style.cursor = "pointer";
        }, 5000);

    } catch (e) {
        console.error("Review submission error:", e);
        alert("Submission error. Message us on Telegram!");
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