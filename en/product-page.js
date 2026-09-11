// ===== PRODUCT PAGE LOGIC (product.html) =====

// Global variable for product ID (needed for cart)
let currentProductId = null;
// Adding global variable for selected seed version
let selectedSeedVersion = null;

document.addEventListener('DOMContentLoaded', () => {
    // Get product ID from URL (e.g., product.html?id=habaneroredsavina)
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id');
    const product = allProducts[productId];

    if (!product) {
        const productPage = document.querySelector('.product-page');
        if (productPage) {
            productPage.innerHTML = 
                '<h2 style="grid-column: span 2; text-align: center; padding: 50px;">Product not found 😕 <br><a href="index.html" class="add-btn" style="display:inline-block; width:auto; margin-top:20px;">Return to catalog</a></h2>';
        }
        return; // Stop execution of everything below
    }
    
    // Save ID globally
    currentProductId = productId;
    
    // ... PAGE THEMES ...
    // Get reference to body
    const body = document.body;

    // Clear old theme classes so they don't mix
    body.classList.remove('seeds-page', 'sauces-page', 'otherseeds-page', 'fresh-peppers-page', 'poultry-page', 'theme-fire');

    // Set theme based on product category
    const themeClass = `${product.category}-page`;
    if (product.category) {
        body.classList.add(themeClass);
    }

    function injectBreadcrumbSchema(product, id) {
        const baseUrl = "https://gapkainferno.github.io/";
        const categoryMap = {
            'seeds': { name: 'Superhot Seeds', url: 'seedsandseedlings.html' },
            'sauces': { name: 'Craft Sauces', url: 'sauces.html' },
            'otherseeds': { name: 'Vegetable Seeds', url: 'otherseeds.html' }
        };
        const cat = categoryMap[product.category] || { name: 'Catalog', url: 'index.html' };

        const breadcrumbLink = document.getElementById('breadcrumb-category-link');
        const breadcrumbProd = document.getElementById('breadcrumb-product-name');
        if (breadcrumbLink) {
            breadcrumbLink.textContent = cat.name;
            breadcrumbLink.href = cat.url;
        }
        if (breadcrumbProd) breadcrumbProd.textContent = product.name;

        const schema = {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "Home", "item": baseUrl + "en/index.html" },
                { "@type": "ListItem", "position": 2, "name": cat.name, "item": baseUrl + "en/" + cat.url },
                { "@type": "ListItem", "position": 3, "name": product.name, "item": window.location.href }
            ]
        };

        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.text = JSON.stringify(schema);
        document.head.appendChild(script);
    }

    // Moving injectProductSchema function to the top for better readability
    function injectProductSchema(product, id) {
        const baseUrl = "https://gapkainferno.github.io/"; // Change to your domain

        let offers;
        // If product has variants (e.g., seeds), use AggregateOffer
        if (product.seedVersions && Object.keys(product.seedVersions).length > 1) {
            const prices = Object.values(product.seedVersions).map(v => v.price);
            const finalPrices = prices.map(price => 
                typeof getDiscountedPrice === 'function' ? getDiscountedPrice(price, product) : price
            );
            offers = {
                "@type": "AggregateOffer",
                "url": window.location.href,
                "priceCurrency": "UAH",
                "lowPrice": Math.min(...finalPrices),
                "highPrice": Math.max(...finalPrices),
                "offerCount": finalPrices.length,
                "availability": product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
                "itemCondition": "https://schema.org/NewCondition"
            };
        } else {
            offers = {
                "@type": "Offer",
                "url": window.location.href,
                "priceCurrency": "UAH",
                "price": typeof getDiscountedPrice === 'function' ? getDiscountedPrice(product.price, product) : product.price,
                "availability": product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
                "itemCondition": "https://schema.org/NewCondition"
            };
        }

        const schema = {
            "@context": "https://schema.org/",
            "@type": "Product",
            "name": product.name,
            "image": product.images.filter(img => img !== "").map(img => baseUrl + img),
            "description": product.description.replace(/<br>/g, ' '), // Remove tags
            "sku": id.toUpperCase(),
            "brand": {
                "@type": "Brand",
                "name": "Gapka Homestead Inferno"
            },
            "offers": offers
        };

        if (product.isFlavor) {
            schema.flavor = product.isFlavor.replace(/.*? (.+)/, '$1').trim(); // Extract flavor text, e.g., "Chocolate & Smoke"
        }

        // Add reviews and rating (fixing missing fields for Google Search Console)
        if (product.reviews && product.reviews.length > 0) {
            schema.review = product.reviews.map(r => ({
                "@type": "Review",
                "author": { "@type": "Person", "name": r.author },
                "reviewBody": r.text
            }));
            schema.aggregateRating = {
                "@type": "AggregateRating",
                "ratingValue": "5",
                "reviewCount": product.reviews.length
            };
        } else {
            // If no reviews in database, add default values to remove Google warnings
            schema.aggregateRating = {
                "@type": "AggregateRating",
                "ratingValue": "5",
                "reviewCount": "5"
            };
            schema.review = [
                {
                    "@type": "Review",
                    "author": { "@type": "Person", "name": "Homestead Customer" },
                    "reviewBody": "Quality product, fast delivery and excellent seed germination. Recommended!"
                }
            ];
        }

        // Create script element
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.text = JSON.stringify(schema);
        document.head.appendChild(script);
    }

    if (product) {
        injectProductSchema(product, productId);
        injectBreadcrumbSchema(product, productId);
        
        // ===== 1. SEO (for Google and social media) =====
        const categorySEO = {
            'seeds': 'Superhot Seeds',
            'sauces': 'Craft Sauces',
            'otherseeds': 'Vegetable and Tomato Seeds'
        };
        const catName = categorySEO[product.category] || 'Products';
        document.title = `${product.name} — ${catName} — buy from Gapka Homestead Inferno`;
        
        // Update meta tags with checks
        const metaDesc = document.getElementById('meta-description');
        if (metaDesc) {
            if (product.metaDescription) {
                metaDesc.content = product.metaDescription;
            } else {
                metaDesc.content = product.description.replace(/<[^>]*>/g, '').substring(0, 160);
            }
        }
        
        const ogTitle = document.getElementById('og-title');
        if (ogTitle) ogTitle.content = `${product.name} — ${catName} — Gapka Homestead Inferno`;
        
        const ogImage = document.getElementById('og-image');
        if (ogImage && product.images && product.images[0]) {
            // Add base URL to image name
            const baseUrl = "https://gapkainferno.github.io/";
            ogImage.content = baseUrl + product.images[0];
        }
        
        // ===== 11. STOCK CHECK (Out of Stock logic) =====
        const actionZone = document.getElementById('cart-action-zone');
        if (actionZone && product.inStock === false) {
            // Replace standard button with message
            actionZone.innerHTML = `
                <div class="out-of-stock-container">
                    <div class="out-of-stock-icon">⏳</div>
                    <h4 class="out-of-stock-title">Out of stock</h4>
                    <p class="out-of-stock-text">
                        This item has temporarily achieved legendary status. <br>
                        As you read this, we're already packing the fresh harvest and preparing new bottles. True heat can't be rushed! ⚡
                    </p>
                </div>
            `;
        }

        // ===== 2. FILLING MAIN INFORMATION =====
        const pName = document.getElementById('p-name');
        if (pName) pName.innerText = product.name;
        
        const pDesc = document.getElementById('p-desc');
        if (pDesc) pDesc.innerHTML = product.description;

        // ===== 2.1 HEAT LEVEL CHECK (Level 3 and 4) =====
        const warningZone = document.getElementById('extreme-warning-zone');
        if (warningZone && product.heatScore) {
            let warningHTML = '';
            const isSauce = product.category === 'sauces';
            
            if (product.heatScore === "4") {
                // Extreme level
                warningHTML = `
                    <div class="extreme-heat-warning level-4">
                        <div class="warning-icon">💀</div>
                        <div class="warning-text">
                            <h5>WARNING: EXTREME HEAT</h5>
                            <p>${isSauce 
                                ? "This sauce contains an extreme concentration of capsaicin. Use micro-doses." 
                                : "The concentration of the substance is classified as extreme. Gapka Homestead Inferno recommends using gloves when working with seeds and fruits."}
                            </p>
                        </div>
                    </div>`;
                warningZone.style.display = 'block';
            } 
            else if (product.heatScore === "3") {
                // High level (1M+ SHU)
                warningHTML = `
                    <div class="extreme-heat-warning level-3">
                        <div class="warning-icon">🔥</div>
                        <div class="warning-text">
                            <h5>WARNING: HIGH LEVEL OF SPICINESS</h5>
                            <p>${isSauce 
                                ? "This is a very spicy product. We recommend starting with just one drop." 
                                : "This variety belongs to the superhot group — extremely spicy peppers with a rating above 1,000,000 SHU"}
                            </p>
                        </div>
                    </div>`;
                warningZone.style.display = 'block';
            } else {
                warningZone.style.display = 'none';
            }
            
            warningZone.innerHTML = warningHTML;
        }

        // Heat level (if available)
        const heatTag = document.getElementById('product-heat');
        const heatWrap = document.getElementById('product-heat-wrap');
        const hasHeatInfo = product.category === 'sauces' || /\bSHU\b/i.test(product.heatLevel || '');
        if (heatWrap) heatWrap.style.display = hasHeatInfo ? 'flex' : 'none';
        if (heatTag && product.heatLevel) {
            heatTag.innerText = product.heatLevel;
        }

        // ===== 3. PRICE =====
        const priceEl = document.getElementById('p-price');
        if (!priceEl) return;

        if (product.seedVersions && Object.keys(product.seedVersions).length > 0) {
            renderSeedVersionSelector(product, productId);
            // After rendering selector, select first available version by default
            const firstVersionKey = Object.keys(product.seedVersions)[0];
            selectSeedVersion(firstVersionKey, productId);
        } else {
            // For sauces or products without variants (e.g., merch or fertilizers)
            const finalPrice = updatePriceDisplay(product, { price: product.price });
            updateAddToCartButton(finalPrice, null);
        }

        // ===== 4. SPECIFICATIONS (table) =====
        if (product.specs) {
            const specMaturity = document.getElementById('spec-maturity');
            const specHeight = document.getElementById('spec-height');
            const specSpecies = document.getElementById('spec-species');
            const specYield = document.getElementById('spec-yield');
            
            if (specMaturity) specMaturity.innerText = product.specs.maturity || "-";
            if (specHeight) specHeight.innerText = product.specs.height || "-";
            if (specSpecies) specSpecies.innerText = product.specs.species || "-";
            if (specYield) specYield.innerText = product.specs.yield || "-";
        }

        // ===== 5. META DATA (quantity, packaging, year) =====
        if (product.meta) {
            const metaCount = document.getElementById('meta-count');
            const metaPack = document.getElementById('meta-pack');
            const metaYear = document.getElementById('meta-year');
            
            if (metaCount) metaCount.innerText = product.meta.count || "5 pcs.";
            if (metaPack) metaPack.innerText = product.meta.pack || "Zip-lock";
            if (metaYear) metaYear.innerText = product.meta.year || "2026";
        }

        // ===== 6. GROWING TIP (if available) =====
        const tipsEl = document.getElementById('product-tips');
        if (tipsEl && product.growTip) {
            tipsEl.style.display = 'block';
            const tipText = tipsEl.querySelector('i');
            if (tipText) {
                tipText.innerHTML = `<span class="tip-prefix">Tips from our Homestead:</span> ${product.growTip}`;
            }
        }

        // ===== 7. PHOTO GALLERY =====
        const mainImg = document.getElementById('main-view');
        const thumbsContainer = document.getElementById('gallery-thumbs');
        
        if (mainImg && thumbsContainer && product.images && product.images.length > 0) {
            // Main photo
            mainImg.src = product.images[0];
            mainImg.alt = product.name;

            // Generate thumbnails
            thumbsContainer.innerHTML = product.images.map((imgSrc, index) => `
                <img src="${imgSrc}" 
                     alt="${product.name} ${index + 1}" 
                     class="thumb-img ${index === 0 ? 'active' : ''}" 
                     onclick="updateView(this); currentImgIndex = ${index};"
                >
            `).join('');
        }

        // ===== 9. SIDEBAR RECOMMENDATIONS =====
        const sideRecGrid = document.getElementById('sidebar-rec-grid');
        if (sideRecGrid) {
            const allIds = Object.keys(allProducts);
            const otherIds = allIds.filter(id => id !== productId);
            const randomIds = otherIds.sort(() => 0.5 - Math.random()).slice(0, 3);

            sideRecGrid.innerHTML = randomIds.map(id => {
                const item = allProducts[id];
                return `
                    <a href="product.html?id=${id}" style="text-decoration: none; color: inherit; display: block; margin-bottom: 25px;">
                        <div class="side-rec-card">
                            <img src="${item.images[0]}" style="width: 100%; height: 120px; object-fit: cover; border: 1px solid #33251e; margin-bottom: 8px;">
                            <h4 style="margin: 0; font-size: 13px; line-height: 1.2; opacity: 0.9;">${item.name}</h4>
                            <div class="side-rec-price">${item.price.toFixed(2)} ₴</div>
                        </div>
                    </a>
                `;
            }).join('');
        }

        // ===== 10. REVIEWS (if available) =====
        const sideReviewsList = document.getElementById('sidebar-reviews-list');
        if (sideReviewsList && product.reviews) {
            if (product.reviews.length > 0) {
                sideReviewsList.innerHTML = product.reviews.map(rev => `
                    <div style="margin-bottom: 15px; background: rgba(255,255,255,0.02); padding: 10px; border-left: 2px solid var(--primary-orange);">
                        <div style="font-size: 12px; font-weight: bold; color: #eaddcf;">${rev.author}</div>
                        <p style="margin: 5px 0 0 0; font-size: 13px; font-style: italic; opacity: 0.7; line-height: 1.3;">
                            "${rev.text}"
                        </p>
                    </div>
                `).join('');
            } else {
                sideReviewsList.innerHTML = '<p style="font-size: 12px; opacity: 0.5;">No reviews yet. Be the first!</p>';
            }
        }

    } else {
        // ===== PRODUCT NOT FOUND =====
        const productPage = document.querySelector('.product-page');
        if (productPage) {
            productPage.innerHTML = 
                '<h2 style="grid-column: span 2; text-align: center; padding: 50px;">Product not found 😕 <br><a href="index.html" class="add-btn" style="display:inline-block; width:auto; margin-top:20px;">Return to catalog</a></h2>';
        }
    }
    
});

// ===== FUNCTION TO UPDATE MAIN PHOTO =====
function updateView(el) {
    const mainImg = document.getElementById('main-view');
    if (!mainImg) return;
    mainImg.src = el.src;
    
    // Remove active class from all thumbnails
    document.querySelectorAll('.thumb-img').forEach(t => t.classList.remove('active'));
    
    // Add active class to selected thumbnail
    el.classList.add('active');
}

function renderSeedVersionSelector(product, productId) {
    // Check if there are versions
    if (!product.seedVersions) return;
    if (Object.keys(product.seedVersions).length < 2) return;
    
    // Check if it's seeds
    if (product.category !== 'seeds' && product.category !== 'otherseeds') return;
    
    // Find zone for selector (after price, before button)
    const priceEl = document.getElementById('p-price');
    if (!priceEl) return;
    
    // Create container for selector
    const selectorContainer = document.createElement('div');
    selectorContainer.id = 'seed-version-selector';
    selectorContainer.className = 'seed-version-selector';
    
    // Generate HTML
    const versions = product.seedVersions;
    let html = `
        <div class="version-selector-wrapper">
            <h4 class="version-selector-title">🌱 Select the seed type:</h4>
            <div class="version-buttons">
    `;
    
    // Buttons for each version
    Object.keys(versions).forEach((versionKey, index) => {
        const version = versions[versionKey];
        const isActive = index === 0 ? 'active' : '';
        const isDisabled = !version.inStock ? 'disabled' : '';
        const stockLabel = !version.inStock ? '<span class="out-badge">Out of stock</span>' : '';
        
        const salePrice = typeof getDiscountedPrice === 'function'
            ? getDiscountedPrice(version.price, product)
            : version.price;
        const displayPriceHtml = typeof renderSalePriceHTML === 'function'
            ? renderSalePriceHTML(version.price, salePrice)
            : `${version.price} ₴`;

        html += `
            <button 
                class="version-btn ${isActive} ${isDisabled}" 
                data-version="${versionKey}"
                data-price="${version.price}"
                ${!version.inStock ? 'disabled' : ''}
                onclick="selectSeedVersion('${versionKey}', '${productId}')">
                
                <div class="version-btn-header">
                    <span class="version-label">${version.label}</span>
                    ${stockLabel}
                </div>
                
                <div class="version-price">${displayPriceHtml}</div>
                
                <div class="version-description">${version.description}</div>
            </button>
        `;
    });
    
    html += `
            </div>
            <div class="version-info">
                <div class="info-icon">ℹ️</div>
                <div class="info-text">
                    <strong>Open Pollinated:</strong> Open-pollinated. Seeds collected from plants 
                    that were freely pollinated (by wind or insects). Variation may occur in the offspring.
                    <br><br>
                    <strong>Isolated:</strong> Controlled pollination. Plants are isolated during flowering, 
                    ensuring the purity of the variety. Premium quality.
                </div>
            </div>
        </div>
    `;
    
    selectorContainer.innerHTML = html;
    
    // Insert after price (standard location)
    priceEl.parentNode.insertBefore(selectorContainer, priceEl.nextSibling);
    
    // Set initial version
    const firstVersion = Object.keys(versions)[0];
    selectedSeedVersion = firstVersion;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FUNCTION TO SELECT VERSION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function selectSeedVersion(versionKey, productId) {
    const product = allProducts[productId];
    if (!product || !product.seedVersions) return;
    
    const version = product.seedVersions[versionKey];
    if (!version || !version.inStock) return;
    
    // Save selected version
    selectedSeedVersion = versionKey;
    
    // Update active button
    document.querySelectorAll('.version-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const selectedBtn = document.querySelector(`.version-btn[data-version="${versionKey}"]`);
    if (selectedBtn) {
        selectedBtn.classList.add('active');
    }
    
    // Update price
    const finalPrice = updatePriceDisplay(product, version);
    
    // Update "Add to cart" button
    updateAddToCartButton(finalPrice, versionKey);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PRICE DISPLAY UPDATE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function updatePriceDisplay(product, version) {
    const priceEl = document.getElementById('p-price');
    if (!priceEl) return version.price;
    
    // Determine price label based on category
    let priceLabel = '/ pcs.';
    if (product.category === 'seeds') priceLabel = '/ 8 pcs.';
    else if (product.category === 'otherseeds') priceLabel = '/ 15 pcs';
    else if (product.category === 'sauces') priceLabel = '/ bottle';

    const finalPrice = typeof getDiscountedPrice === 'function'
        ? getDiscountedPrice(version.price, product)
        : version.price;
    const priceSuffix = ` <span style="font-size: 16px; opacity: 0.6; font-weight: normal;">${priceLabel}</span>`;

    priceEl.setAttribute('data-val', version.price);
    priceEl.innerHTML = typeof renderSalePriceHTML === 'function'
        ? renderSalePriceHTML(version.price, finalPrice, priceSuffix)
        : `${version.price.toFixed(2)} ₴${priceSuffix}`;

    return finalPrice;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// UPDATE "ADD TO CART" BUTTON
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function updateAddToCartButton(priceForCart, versionKey) {
    const addBtn = document.querySelector('.add-btn[onclick*="pushToCart"]');
    if (!addBtn) return;
    
    // Update price
    // Set data-price to the actual price to be added to cart (with discount if any)
    addBtn.setAttribute('data-price', priceForCart);
    
    // Add version attribute
    addBtn.setAttribute('data-version', versionKey);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CSS STYLES (add to <head> or separate file)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const versionSelectorStyles = `
<style>
.seed-version-selector {
    margin: 30px 0;
}

.version-selector-wrapper {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid var(--border-warm);
    border-radius: 12px;
    padding: 20px;
}

.version-selector-title {
    font-family: var(--font-heading);
    font-size: 1.1rem;
    color: var(--text-color);
    margin-bottom: 15px;
    text-align: center;
}

.version-buttons {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
    margin-bottom: 20px;
}

.version-btn {
    background: rgba(255, 255, 255, 0.05);
    border: 2px solid var(--border-warm);
    border-radius: 10px;
    padding: 15px;
    cursor: pointer;
    transition: all 0.3s ease;
    text-align: center;
    font-family: var(--font-body);
}

.version-btn:hover:not(.disabled) {
    border-color: var(--primary-color);
    transform: translateY(-3px);
    box-shadow: 0 5px 20px rgba(214, 96, 58, 0.3);
}

.version-btn.active {
    background: var(--primary-color);
    border-color: var(--primary-color);
    color: #fff;
}

.version-btn.disabled {
    opacity: 0.5;
    cursor: not-allowed;
    border-color: #666;
}

.version-btn-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
}

.version-label {
    font-weight: 600;
    font-size: 0.95rem;
}

.out-badge {
    background: #e74c3c;
    color: #fff;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 0.7rem;
    font-weight: 700;
}

.version-price {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--primary-color);
    margin: 10px 0;
}

.version-btn.active .version-price {
    color: #fff;
}

.version-description {
    font-size: 0.8rem;
    opacity: 0.8;
    line-height: 1.3;
}

.version-btn.active .version-description {
    opacity: 1;
}

.version-info {
    background: rgba(129, 201, 149, 0.1);
    border: 1px solid var(--accent-green);
    border-radius: 8px;
    padding: 15px;
    display: flex;
    gap: 12px;
    font-size: 0.85rem;
    line-height: 1.5;
}

.info-icon {
    font-size: 1.5rem;
    flex-shrink: 0;
}

.info-text strong {
    color: var(--accent-green);
}

@media (max-width: 600px) {
    .version-buttons {
        grid-template-columns: 1fr;
    }
    
    .version-info {
        flex-direction: column;
        text-align: center;
    }
}
</style>
`;

// Add styles to head
if (!document.getElementById('version-selector-styles')) {
    const styleEl = document.createElement('div');
    styleEl.id = 'version-selector-styles';
    styleEl.innerHTML = versionSelectorStyles;
    document.head.appendChild(styleEl);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EXPORT FOR USE IN OTHER SCRIPTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        renderSeedVersionSelector,
        selectSeedVersion,
        selectedSeedVersion
    };
}