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
                            <div id="turnstile-checkout" style="display:flex; justify-content:center; margin:14px 0;"></div>
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

// Спільний Turnstile для форм поза checkout.
window.gapkaFormTurnstile = (() => {
  const widgets = new Map();
  const tokens = new Map();
  let loading = null;

  function load() {
    if (window.turnstile) return Promise.resolve();
    if (loading) return loading;
    loading = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.onload = resolve;
      script.onerror = () => reject(new Error("Не вдалося завантажити перевірку безпеки."));
      document.head.appendChild(script);
    });
    return loading;
  }

  async function render(containerId) {
    const container = document.getElementById(containerId);
    if (!container) throw new Error("Не знайдено контейнер перевірки безпеки.");
    const siteKey = window.TURNSTILE_SITE_KEY;
    if (!siteKey) throw new Error("Перевірка безпеки тимчасово недоступна.");
    await load();
    if (widgets.has(containerId)) return;
    const widgetId = window.turnstile.render(container, {
      sitekey: siteKey,
      callback: token => tokens.set(containerId, token),
      "expired-callback": () => tokens.set(containerId, ""),
      "error-callback": () => tokens.set(containerId, "")
    });
    widgets.set(containerId, widgetId);
  }

  function get(containerId) { return tokens.get(containerId) || ""; }
  function reset(containerId) {
    tokens.set(containerId, "");
    if (widgets.has(containerId) && window.turnstile) {
      try { window.turnstile.reset(widgets.get(containerId)); } catch (_) {}
    }
  }
  return {render, get, reset};
})();

window.gapkaRequestId_ = function(storageKey) {
  let id = localStorage.getItem(storageKey);
  if (!id) {
    id = window.crypto?.randomUUID
      ? window.crypto.randomUUID()
      : "ghi_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    localStorage.setItem(storageKey, id);
  }
  return id;
}

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
async function sendToGoogleSheet(data, turnstileContainerId, storageKey) {
    const token = gapkaFormTurnstile.get(turnstileContainerId);
    if (!token) {
        alert('Пройдіть, будь ласка, перевірку безпеки перед надсиланням.');
        await gapkaFormTurnstile.render(turnstileContainerId);
        return false;
    }
    try {
        const response = await fetch(window.GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'cors',
            cache: 'no-cache',
            headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
            body: JSON.stringify({...data, requestId: gapkaRequestId_(storageKey), turnstileToken: token})
        });
        if (!response.ok) throw new Error('HTTP ' + response.status);
        const result = await response.json();
        if (!result || result.status !== 'success') {
            throw new Error(result?.message || 'Сервер не підтвердив запит.');
        }
        localStorage.removeItem(storageKey);
        return true;
    } catch (error) {
        console.error('Помилка відправки:', error);
        return false;
    } finally {
        gapkaFormTurnstile.reset(turnstileContainerId);
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
    let captchaBox = document.getElementById('notify-turnstile');
    if (!captchaBox) {
        captchaBox = document.createElement('div');
        captchaBox.id = 'notify-turnstile';
        captchaBox.style.cssText = 'display:flex;justify-content:center;margin:12px 0;';
        btn.parentNode.insertBefore(captchaBox, btn);
    }
    try { await gapkaFormTurnstile.render('notify-turnstile'); }
    catch (error) { alert(error.message); return; }
    if (!gapkaFormTurnstile.get('notify-turnstile')) {
        alert('Пройдіть перевірку безпеки перед надсиланням.');
        return;
    }
    btn.disabled = true;
    btn.innerText = "Записуємо...";

    const data = {
        email: email,
        orderType: "ЗАПИТ_НА_ЗАПУСК",
        details: \`Запит на повідомлення про появу: \${currentNotifyCategory}\`,
    };

    const sent = await sendToGoogleSheet(data, 'notify-turnstile', 'pending_notify_request_id');
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

    let captchaBox = document.getElementById('subscribe-turnstile');
    if (!captchaBox) {
        captchaBox = document.createElement('div');
        captchaBox.id = 'subscribe-turnstile';
        captchaBox.style.cssText = 'display:flex;justify-content:center;margin:12px 0;';
        btn.parentNode.insertBefore(captchaBox, btn);
    }
    try { await gapkaFormTurnstile.render('subscribe-turnstile'); }
    catch (error) { alert(error.message); return; }
    if (!gapkaFormTurnstile.get('subscribe-turnstile')) {
        alert('Пройдіть перевірку безпеки перед підпискою.');
        return;
    }

    btn.disabled = true;
    btn.innerText = "⏳";

    const sent = await sendToGoogleSheet({
        email: email,
        orderType: "ПІДПИСКА_МАРКЕТИНГ",
        details: "Підписка з головної сторінки (футер)",
    }, 'subscribe-turnstile', 'pending_subscribe_request_id');

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