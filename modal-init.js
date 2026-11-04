document.addEventListener("DOMContentLoaded", function() {
    // Перевіряємо, чи модалки ще немає на сторінці (щоб не дублювати)
    if (document.getElementById('checkoutModal')) return;

    // Українська форма замовлення для доставки в межах України.
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

    // ═══════════════════════════════════════════════════════════════
    // Кнопки кошика
    // ═══════════════════════════════════════════════════════════════
    const cartIcon = '🛒';
    const cartText = 'Кошик';

    const floatingCartHTML = `
    <button type="button" class="floating-cart" onclick="openCheckout()" title="Відкрити кошик">
        <span class="cart-icon">${cartIcon}</span>
        <span id="cart-count">0</span>
    </button>`;

    const headerCartHTML = `
    <button type="button" class="header-cart-link" onclick="openCheckout()" title="Перейти до кошика">
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

let currentNotifyCategory = '';

function openNotifyModal(category) {
    const modal = document.getElementById('notifyModal');
    const text = document.getElementById('notify-text');
    currentNotifyCategory = category;
    
    const messages = {
        'fresh-peppers': "Ми напишемо вам, як тільки зберемо перший врожай свіжих суперхотів! 🍂"
    };
    
    if (messages[category]) {
        text.innerText = messages[category];
    }
    
    // Показуємо модалку notify, якщо вона є
    if (modal) {
        modal.style.display = 'flex';
    }
}

// Універсальна функція для відправки даних у Google Sheet
async function sendToGoogleSheet(data) {
    try {
        const response = await fetch(window.GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'cors',
            cache: 'no-cache',
            headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
            body: JSON.stringify(data)
        });
        if (!response.ok) return false;
        const result = await response.json();
        return result.status === 'success';
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
        alert('Будь ласка, введіть коректну адресу електронної пошти!');
        emailInput.classList.add('input-error');
        return;
    }
    emailInput.classList.remove('input-error');

    const btn = document.querySelector('#notifyModal .order-btn');
    btn.disabled = true;
    btn.innerText = "Записуємо...";

    const data = {
        date: new Date().toLocaleString("uk-UA"),
        email: email,
        orderType: "ЗАПИТ_НА_ЗАПУСК",
        details: `Запит на повідомлення про появу: ${currentNotifyCategory}`,
    };

    const sent = await sendToGoogleSheet(data);
    if (!sent) {
        alert('Не вдалося надіслати запит. Спробуйте ще раз.');
        btn.disabled = false;
        btn.innerText = "Хочу дізнатися першим";
        return;
    }

    const successMessage = document.getElementById('notify-success');
    successMessage.innerText = 'Запит надіслано. Перевірте пошту для підтвердження. 🔥';
    successMessage.style.display = 'block';
    setTimeout(() => {
        document.getElementById('notifyModal').style.display = 'none';
        document.getElementById('notify-success').style.display = 'none';
        emailInput.value = '';
        btn.disabled = false;
        btn.innerText = "Хочу дізнатися першим";
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
            <h2 class="modal-title">Кошик <span>порожній</span></h2>
            <p style="margin: 15px 0; font-size: 16px; opacity: 0.8;">Відкрийте для себе світ гострих смаків! Перегляньте наш каталог:</p>
            <a href="sauces.html" class="order-btn" style="display: inline-block; width: auto; text-decoration: none; margin-top: 20px;">🔥 Гострі соуси</a>
            <a href="seedsandseedlings.html" class="order-btn" style="display: inline-block; width: auto; text-decoration: none; margin-top: 10px;">🌱 Насіння суперхотів</a>
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
        alert('Будь ласка, введіть коректну адресу електронної пошти!');
        emailInput.classList.add('input-error');
        return;
    }
    emailInput.classList.remove('input-error');

    btn.disabled = true;
    btn.innerText = "⏳";

    const sent = await sendToGoogleSheet({
        date: new Date().toISOString(),
        email: email,
        orderType: "ПІДПИСКА_МАРКЕТИНГ",
        details: "Підписка з головної сторінки (футер)",
    });

    if (!sent) {
        alert('Не вдалося оформити підписку. Спробуйте ще раз.');
        btn.disabled = false;
        btn.innerText = "Підписатися";
        return;
    }

    alert('Запит надіслано. Перевірте пошту для підтвердження. 🔥');
    btn.disabled = false;
    btn.innerText = "Підписатися";
    document.getElementById('sub-email').value = '';
}