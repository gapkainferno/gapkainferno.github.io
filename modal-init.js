document.addEventListener("DOMContentLoaded", function() {
    // Перевіряємо, чи модалки ще немає на сторінці (щоб не дублювати)
    if (document.getElementById('checkoutModal')) return;

    // ═══════════════════════════════════════════════════════════════
    // АНГЛІЙСЬКА ВЕРСІЯ МОДАЛКИ (для міжнародних замовлень)
    // ═══════════════════════════════════════════════════════════════
    if (window.IS_ENGLISH) {
        const enModalHTML = `
    <div id="checkoutModal" class="modal">
        <div class="modal-box">
            <button class="close-btn" onclick="closeCheckout()">&times;</button>
            
            <div class="checkout-header">
                <h2 class="modal-title">🌶️ <span>International</span> Order</h2>
                <p style="color: var(--primary-orange); font-size: 13px; opacity: 0.8; margin-top: 5px;">
                    We ship worldwide! Shipping cost is calculated individually based on your location and order weight.
                </p>
            </div>

            <div id="modal-main-content" class="checkout-grid">
                <div class="checkout-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label>Full Name</label>
                            <input type="text" id="cust-name" placeholder="Your full name">
                        </div>
                        <div class="form-group">
                            <label>Phone</label>
                            <input type="tel" id="cust-phone" placeholder="+1..." maxlength="20">
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Email (required for international orders)</label>
                        <input type="email" id="email" placeholder="your@email.com" required>
                    </div>

                    <div class="form-group">
                        <label>Country</label>
                        <select id="cust-country">
                            <option value="">— Select your country —</option>
                            <option value="US">🇺🇸 United States</option>
                            <option value="CA">🇨🇦 Canada</option>
                            <option value="GB">🇬🇧 United Kingdom</option>
                            <option value="DE">🇩🇪 Germany</option>
                            <option value="FR">🇫🇷 France</option>
                            <option value="IT">🇮🇹 Italy</option>
                            <option value="ES">🇪🇸 Spain</option>
                            <option value="NL">🇳🇱 Netherlands</option>
                            <option value="PL">🇵🇱 Poland</option>
                            <option value="CZ">🇨🇿 Czech Republic</option>
                            <option value="AT">🇦🇹 Austria</option>
                            <option value="CH">🇨🇭 Switzerland</option>
                            <option value="BE">🇧🇪 Belgium</option>
                            <option value="SE">🇸🇪 Sweden</option>
                            <option value="DK">🇩🇰 Denmark</option>
                            <option value="NO">🇳🇴 Norway</option>
                            <option value="FI">🇫🇮 Finland</option>
                            <option value="IE">🇮🇪 Ireland</option>
                            <option value="PT">🇵🇹 Portugal</option>
                            <option value="GR">🇬🇷 Greece</option>
                            <option value="RO">🇷🇴 Romania</option>
                            <option value="BG">🇧🇬 Bulgaria</option>
                            <option value="HU">🇭🇺 Hungary</option>
                            <option value="SK">🇸🇰 Slovakia</option>
                            <option value="LT">🇱🇹 Lithuania</option>
                            <option value="LV">🇱🇻 Latvia</option>
                            <option value="EE">🇪🇪 Estonia</option>
                            <option value="AU">🇦🇺 Australia</option>
                            <option value="NZ">🇳🇿 New Zealand</option>
                            <option value="JP">🇯🇵 Japan</option>
                            <option value="KR">🇰🇷 South Korea</option>
                            <option value="SG">🇸🇬 Singapore</option>
                            <option value="UA">🇺🇦 Ukraine</option>
                            <option value="OTHER">🌍 Other country</option>
                        </select>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>City</label>
                            <input type="text" id="cust-city" placeholder="Your city">
                        </div>
                        <div class="form-group">
                            <label>State / Region</label>
                            <input type="text" id="cust-state" placeholder="State or region">
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group" style="flex: 2;">
                            <label>Street Address</label>
                            <input type="text" id="cust-address" placeholder="Street, building, apartment">
                        </div>
                        <div class="form-group" style="flex: 1;">
                            <label>ZIP / Postal Code</label>
                            <input type="text" id="cust-zip" placeholder="e.g. 90210">
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Delivery Method</label>
                        <select id="cust-delivery">
                            <option value="Standard International">📦 Standard International Shipping (7-14 business days, with tracking)</option>
                            <option value="Express International">🚀 Express International Shipping (3-5 business days, with tracking)</option>
                        </select>
                        <small style="color: var(--primary-orange); display: block; margin-top: 5px; font-style: italic;">
                            💰 Exact shipping cost will be calculated after order placement. We'll contact you via email with the total including shipping.
                        </small>
                    </div>

                    <div class="form-group">
                        <label>Payment Method</label>
                        <select id="cust-payment">
                            <option value="Online Payment">💳 Online Payment (Credit Card / PayPal) — Prepayment Required</option>
                        </select>
                        <div id="online-payment-hint" style="color: var(--primary-orange); font-size: 13px; margin-top: 5px; font-style: italic; line-height: 1.3;">
                            ℹ️ Payment is required before shipping. After placing the order, we'll send you payment details and the shipping cost estimate via email.
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Comment / Special Instructions</label>
                        <textarea id="cust-comment" placeholder="Any special requests?"></textarea>
                    </div>

                    <div style="position: absolute; left: -9999px; opacity: 0;">
                        <input type="text" id="website_url" tabindex="-1" autocomplete="off">
                    </div>
                </div>

                <div class="checkout-summary">
                    <div class="summary-header-row">
                        <h3 class="summary-title">Your Order</h3>
                        <button onclick="clearFullCart()" class="clear-cart-btn">Clear</button>
                    </div>
                    <div id="final-list" class="cart-items-list"></div> 
                    <div class="cart-total-block">
                        <div class="total-row">
                            <span>Total (without shipping):</span>
                            <span class="total-price-display"><span id="final-price">0.00</span></span>
                        </div>
                        <p style="font-size: 12px; color: var(--primary-orange); font-style: italic; margin: 5px 0;">Shipping calculated after order</p>
                        <button class="order-btn" onclick="submitOrder()">Place Order</button>
                    </div>
                </div>
            </div>

            <div id="success-msg" style="display:none; text-align: center; padding: 50px 20px;">
                <h2 style="color: var(--primary-orange);">🌿 Order Placed Successfully!</h2>
                <p>Order number: <strong id="orderNumberDisplay"></strong></p>
                <p style="margin-top: 20px; line-height: 1.6;">Thank you for your order! We'll contact you via email within 24 hours with the shipping cost estimate and payment details.</p>
                <p style="margin-top: 10px; font-size: 14px; opacity: 0.8;">💌 Check your email (including spam folder) for the order confirmation.</p>
                <button class="order-btn" style="max-width: 200px; margin: 20px auto 0;" onclick="closeCheckout()">Close</button>
            </div>
        </div>
    </div>`;
        document.body.insertAdjacentHTML('beforeend', enModalHTML);
    } else {
        // ═══════════════════════════════════════════════════════════════
        // УКРАЇНСЬКА ВЕРСІЯ МОДАЛКИ (для замовлень в Україні)
        // ═══════════════════════════════════════════════════════════════
        const uaModalHTML = `
        <div id="checkoutModal" class="modal">
            <div class="modal-box">
                <button class="close-btn" onclick="closeCheckout()">&times;</button>
                
                <div class="checkout-header">
                    <h2 class="modal-title"><span>Оформлення</span> замовлення</h2>
                </div>

                <div id="modal-main-content" class="checkout-grid">
                    <div class="checkout-form">
                        <div class="form-row">
                            <div class="form-group">
                                <label>Прізвище та Ім'я</label>
                                <input type="text" id="cust-name" placeholder="Ваше ім'я">
                            </div>
                            <div class="form-group">
                                <label>Телефон</label>
                                <input type="tel" id="cust-phone" placeholder="+380..." maxlength="13">
                            </div>
                        </div>

                        <div class="form-group">
                            <label>Спосіб доставки</label>
                            <select id="cust-delivery">
                                <option value="Відділення НП">Нова Пошта (Відділення)</option>
                                <option value="Поштомат НП">Нова Пошта (Поштомат)</option>
                                <option value="Укрпошта">Укрпошта</option>
                                <option value="Кур'єр НП">Нова Пошта (Адресна доставка)</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label>Спосіб оплати</label>
                            <select id="cust-payment">
                                <option value="Онлайн оплата">Онлайн оплата (передоплата)</option>
                                <option value="Накладений платіж">Накладений платіж (післяплата)</option>
                            </select>
                            <div id="cod-payment-hint" style="display:none; color: var(--primary-orange); font-size: 13px; margin-top: 5px; font-style: italic; line-height: 1.3;">
                                ℹ️ Будь ласка, зверніть увагу, що Нова Пошта бере комісію за переказ коштів (~2% від суми + 20 грн).
                            </div>
                            <div id="online-payment-hint" style="display:none; color: var(--primary-orange); font-size: 13px; margin-top: 5px; font-style: italic; line-height: 1.3;">
                                ℹ️ Товар буде відправлено тільки після отримання оплати. Реквізити та посилання на оплату з'являться одразу після оформлення замовлення та продублюються на ваш Email.
                            </div>
                        </div>

                        <div class="form-group">
                            <label>Місто (почніть вводити...)</label>
                            <div style="position: relative;">
                                <input type="text" id="cust-city" placeholder="Наприклад: Київ" autocomplete="off">
                                <div id="city-suggestions" class="np-suggestions"></div>
                            </div>
                            <small>Тільки населені пункти України</small>
                        </div>

                        <div class="form-group" id="branch-group">
                            <label>Відділення або поштомат (номер чи адреса)</label>
                            <div style="position: relative;">
                                <input type="text" id="cust-branch-input" placeholder="Введіть номер або назву..." autocomplete="off">
                                <div id="branch-suggestions" class="np-suggestions"></div>
                            </div>
                            <input type="hidden" id="cust-branch">
                        </div>

                        <div class="form-group">
                            <label>Електронна пошта</label>
                            <input type="email" id="email">
                        </div>

                        <div class="form-group">
                            <label>Коментар</label>
                            <textarea id="cust-comment"></textarea>
                        </div>

                        <div style="position: absolute; left: -9999px; opacity: 0;">
                            <input type="text" id="website_url" tabindex="-1" autocomplete="off">
                        </div>
                    </div>

                    <div class="checkout-summary">
                        <div class="summary-header-row">
                            <h3 class="summary-title">Ваше замовлення</h3>
                            <button onclick="clearFullCart()" class="clear-cart-btn">Очистити</button>
                        </div>
                        <div id="final-list" class="cart-items-list"></div> 
                        <div class="cart-total-block">
                            <div class="total-row">
                                <span>Разом:</span>
                                <span class="total-price-display"><span id="final-price">0.00</span> ₴</span>
                            </div>
                            <button class="order-btn" onclick="submitOrder()">Підтвердити замовлення</button>
                        </div>
                    </div>
                </div>

                <div id="success-msg" style="display:none; text-align: center; padding: 50px 20px;">
                    <h2 style="color: var(--primary-orange);">🌿 Замовлення прийнято!</h2>
                    <p>Номер: <strong id="orderNumberDisplay"></strong></p>
                    <p>Дякуємо! Якщо ви обрали онлайн оплату, будь ласка, сплатіть за реквізитами нижче, щоб ми почали відправку. При оплаті вкажіть номер замовлення. Якщо Ви обрали післяплату - ми скоро зв'яжемося з вами. Всі деталі заказу продубльовані на Вашій пошті 🔥.</p>
                    <div id="payment-details-success" style="display:none; margin-top: 30px; border-top: 1px dashed rgba(255,255,255,0.1); padding-top: 20px;"></div>
                    <button class="order-btn" style="max-width: 200px; margin: 20px auto 0;" onclick="closeCheckout()">Закрити</button>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', uaModalHTML);
    }

    // ═══════════════════════════════════════════════════════════════
    // ФЛОАТИНГ КОШИК ТА ХЕДЕР КОШИК (для обох версій)
    // ═══════════════════════════════════════════════════════════════
    const cartIcon = window.IS_ENGLISH ? '🛒' : '🛒';
    const cartText = window.IS_ENGLISH ? 'Cart' : 'Кошик';

    const floatingCartHTML = `
    <button type="button" class="floating-cart" onclick="openCheckout()" title="${window.IS_ENGLISH ? 'Open cart' : 'Відкрити кошик'}">
        <span class="cart-icon">${cartIcon}</span>
        <span id="cart-count">0</span>
    </button>`;

    const headerCartHTML = `
    <button type="button" class="header-cart-link" onclick="openCheckout()" title="${window.IS_ENGLISH ? 'Go to cart' : 'Перейти до кошика'}">
        <span class="cart-text">${cartText}</span>
        <span class="cart-icon">${cartIcon}</span>
        <span class="cart-count">0</span>
    </button>`;

    document.body.insertAdjacentHTML('beforeend', floatingCartHTML + headerCartHTML);

    // ═══════════════════════════════════════════════════════════════
    // ЗАГАЛЬНІ ОБРОБНИКИ ПОДІЙ
    // ═══════════════════════════════════════════════════════════════

    // Закриття модального вікна при кліку на темну область
    const modal = document.getElementById('checkoutModal');
    modal.addEventListener('click', function(event) {
        if (event.target === modal) {
            closeCheckout();
        }
    });

    // Закриття emptyCartModal при кліку на оверлей
    const emptyCartModal = document.getElementById('emptyCartModal');
    if (emptyCartModal) {
        emptyCartModal.addEventListener('click', function(event) {
            if (event.target === emptyCartModal) {
                closeEmptyCartModal();
            }
        });
    }

    // Оновлюємо інтерфейс кошика відразу
    if (typeof updateCartUI === 'function') {
        updateCartUI();
    }
});

// ═══════════════════════════════════════════════════════════════
// СПІЛЬНІ ЗМІННІ ТА ФУНКЦІЇ
// ═══════════════════════════════════════════════════════════════

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyiEM5NnSk-Hg6-ObFifQQf3Xfmt8AjRcqHuinxkueImuEbBUKWl0AlAYUcmn5v0tfm/exec";

let currentNotifyCategory = '';

function openNotifyModal(category) {
    const modal = document.getElementById('notifyModal');
    const text = document.getElementById('notify-text');
    currentNotifyCategory = category;
    
    const messages = {
        'fresh-peppers': window.IS_ENGLISH
            ? "We'll email you as soon as we harvest our first crop of fresh superhots this fall! 🍂"
            : "Ми напишемо вам, як тільки зберемо перший врожай свіжих суперхотів восени 2026! 🍂"
    };
    
    if (messages[category]) {
        text.innerText = messages[category];
    }
    
    // Показуємо модалку notify, якщо вона є
    if (modal) {
        modal.style.display = 'flex';
    } else {
        // Створюємо на льоту для англійської версії
        createNotifyModalEn(category);
    }
}

function createNotifyModalEn(category) {
    const notifyHTML = `
    <div id="notifyModal" class="modal" style="display: flex;">
        <div class="modal-box" style="max-width: 500px; padding: 40px; text-align: center;">
            <button class="close-btn" onclick="document.getElementById('notifyModal').style.display='none'">&times;</button>
            <h2 class="modal-title">Notify me <span>on launch</span></h2>
            <p style="margin: 20px 0; opacity: 0.8;" id="notify-text">Leave your email and we'll send you a hot update when the product arrives!</p>
            <div class="form-group">
                <input type="email" id="notify-email" placeholder="Your Email" style="width: 100%; margin-bottom: 20px;">
                <button class="order-btn" onclick="submitNotification()">Notify Me First</button>
            </div>
            <div id="notify-success" style="display:none; color: var(--primary-color); margin-top: 20px; font-weight: bold;">
                You're on the list! 🔥
            </div>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', notifyHTML);
}

// Універсальна функція для відправки даних у Google Sheet
async function sendToGoogleSheet(data) {
    try {
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            cache: 'no-cache',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return true;
    } catch (error) {
        console.error('Помилка відправки:', error);
        return false;
    }
}

// Валідація Email
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

async function submitNotification() {
    const emailInput = document.getElementById('notify-email');
    const email = emailInput.value.trim();
    
    if (!validateEmail(email)) {
        alert(window.IS_ENGLISH ? 'Please enter a valid email address!' : 'Будь ласка, введіть коректну адресу електронної пошти!');
        emailInput.classList.add('input-error');
        return;
    }
    emailInput.classList.remove('input-error');

    const btn = document.querySelector('#notifyModal .order-btn');
    btn.disabled = true;
    btn.innerText = window.IS_ENGLISH ? "Saving..." : "Записуємо...";

    const data = {
        date: new Date().toLocaleString("en-US"),
        email: email,
        orderType: "LAUNCH_REQUEST",
        details: `Category: ${currentNotifyCategory}${window.IS_ENGLISH ? ' (EN)' : ''}`,
        secret_token: "summerof26"
    };

    await sendToGoogleSheet(data);

    document.getElementById('notify-success').style.display = 'block';
    setTimeout(() => {
        document.getElementById('notifyModal').style.display = 'none';
        document.getElementById('notify-success').style.display = 'none';
        emailInput.value = '';
        btn.disabled = false;
        btn.innerText = window.IS_ENGLISH ? "Notify Me First" : "Хочу дізнатися першим";
    }, 2000);
}

// Функції для управління модалкою порожнього кошика
function openEmptyCartModal() {
    let modal = document.getElementById('emptyCartModal');
    
    if (modal) {
        modal.style.display = 'flex';
        return;
    }
    
    // Створюємо модалку на льоту
    const emptyModalHTML = `
    <div id="emptyCartModal" class="modal" style="display: flex;">
        <div class="modal-box" style="max-width: 600px; padding: 40px; text-align: center;">
            <button class="close-btn" onclick="closeEmptyCartModal()">&times;</button>
            <h2 class="modal-title">${window.IS_ENGLISH ? 'Your cart is <span>empty</span>' : 'Кошик <span>порожній</span>'}</h2>
            <p style="margin: 15px 0; font-size: 16px; opacity: 0.8;">${window.IS_ENGLISH ? 'Discover the world of spicy flavors! Browse our catalog:' : 'Відкрийте для себе світ гострих смаків! Перегляньте наш каталог:'}</p>
            <a href="sauces.html" class="order-btn" style="display: inline-block; width: auto; text-decoration: none; margin-top: 20px;">🔥 ${window.IS_ENGLISH ? 'Hot Sauces' : 'Гострі соуси'}</a>
            <a href="seedsandseedlings.html" class="order-btn" style="display: inline-block; width: auto; text-decoration: none; margin-top: 10px;">🌱 ${window.IS_ENGLISH ? 'Superhot Seeds' : 'Насіння суперхотів'}</a>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', emptyModalHTML);
    
    // Додаємо обробник для закриття модалки
    modal = document.getElementById('emptyCartModal');
    if (modal) {
        modal.addEventListener('click', function(event) {
            if (event.target === modal) {
                closeEmptyCartModal();
            }
        });
    }
}

function closeEmptyCartModal() {
    const modal = document.getElementById('emptyCartModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

async function handleGeneralSubscribe(event) {
    event.preventDefault();
    const emailInput = document.getElementById('sub-email');
    const email = emailInput.value.trim();
    const btn = document.getElementById('sub-btn');

    if (!validateEmail(email)) {
        alert(window.IS_ENGLISH ? 'Please enter a valid email address!' : 'Будь ласка, введіть коректну адресу електронної пошти!');
        emailInput.classList.add('input-error');
        return;
    }
    emailInput.classList.remove('input-error');

    btn.disabled = true;
    btn.innerText = "⏳";

    await sendToGoogleSheet({
        date: new Date().toISOString(),
        email: email,
        orderType: "MARKETING_SUBSCRIBE",
        details: window.IS_ENGLISH ? "Subscribe from English homepage" : "Підписка з головної сторінки (футер)",
        secret_token: "summerof26"
    });

    alert(window.IS_ENGLISH ? 'Thank you! You\'re on the list 🔥' : 'Дякуємо! Тепер ви в списку обраних 🔥');
    btn.disabled = false;
    btn.innerText = window.IS_ENGLISH ? "Subscribe" : "Підписатися";
    document.getElementById('sub-email').value = '';
}