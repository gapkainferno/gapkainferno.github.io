// ════════════════════════════════════════════════════════════════
// HOMESTEAD INFERNO — ORDER PROCESSING SCRIPT
// Google Apps Script для обробки замовлень з сайту
// ════════════════════════════════════════════════════════════════
const SCRIPT_PROPS = PropertiesService.getScriptProperties();
const CONTACT_EMAIL = "homestead.inferno@gmail.com";

const SHEET_NAME = "Замовлення"; // ЗАМІНИ на назву свого аркуша з замовленнями
const SUB_SHEET_NAME = "Підписки"; 
const REVIEW_SHEET_NAME = "Відгуки"; 

function getOrdersSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
}

function normalizeOrderId(value) {
  const orderId = String(value).trim();
  return /^\d+$/.test(orderId) ? orderId.replace(/^0+(?=\d)/, '') : orderId;
}

function doGet() {
  return ContentService.createTextOutput("Gapka Homestead Inferno — сервіс замовлень активний. Версія: 49")
    .setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    if (!e || !e.postData || !e.postData.contents) return errorResponse("Немає даних");
    const data = JSON.parse(e.postData.contents);
    if (!data || typeof data !== "object" || Array.isArray(data)) return errorResponse("Некоректний запит");

    // Honeypot: приховане поле має залишатися порожнім.
    if (String(data.website_url || "").trim()) {
      return ContentService.createTextOutput(JSON.stringify({status:"success"})).setMimeType(ContentService.MimeType.JSON);
    }

    const email = String(data.email || "").trim().toLowerCase();
    const phone = String(data.phone || "").replace(/[^0-9+]/g, "").slice(0, 20);
    const limiterKey = "submit_" + Utilities.base64EncodeWebSafe(email || phone || "unknown").slice(0, 60);
    const cache = CacheService.getScriptCache();
    const attempts = Number(cache.get(limiterKey) || 0);
    if (attempts >= 5) return errorResponse("Забагато запитів. Спробуйте пізніше.");

    if (data.orderType === "ПІДПИСКА_МАРКЕТИНГ" || data.orderType === "ЗАПИТ_НА_ЗАПУСК") {
      if (!validateEmail(email)) return errorResponse("Некоректна електронна адреса");
      cache.put(limiterKey, String(attempts + 1), 300);
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      let subSheet = ss.getSheetByName(SUB_SHEET_NAME);
      if (!subSheet) {
        subSheet = ss.insertSheet(SUB_SHEET_NAME);
        subSheet.appendRow(["Дата", "Email", "Тип", "Деталі/Категорія"]);
        subSheet.getRange(1, 1, 1, 4).setFontWeight("bold").setBackground("#fcefe1");
      }
      subSheet.insertRowBefore(2);
      subSheet.getRange(2, 1, 1, 4).setValues([[
        Utilities.formatDate(new Date(), "Europe/Kyiv", "dd.MM.yyyy HH:mm:ss"),
        email, String(data.orderType).slice(0, 60), String(data.details || "-").slice(0, 300)
      ]]);
      const emailSent = sendWelcomeEmail(email, data.orderType, data.details);
      return ContentService.createTextOutput(JSON.stringify({status:"success", type:"subscription", emailSent:emailSent}))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (data.orderType === "ВІДГУК") {
      const author = String(data.name || "").trim().slice(0, 100);
      const product = String(data.product || "").trim().slice(0, 150);
      const message = String(data.message || "").trim().slice(0, 1500);
      if (!author || !product || !message) return errorResponse("Заповніть усі поля відгуку");
      cache.put(limiterKey, String(attempts + 1), 300);
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      let revSheet = ss.getSheetByName(REVIEW_SHEET_NAME);
      if (!revSheet) {
        revSheet = ss.insertSheet(REVIEW_SHEET_NAME);
        revSheet.appendRow(["Дата", "Автор", "Товар", "Текст відгуку"]);
        revSheet.getRange(1, 1, 1, 4).setFontWeight("bold").setBackground("#cfe2f3");
      }
      revSheet.insertRowBefore(2);
      revSheet.getRange(2, 1, 1, 4).setValues([[
        Utilities.formatDate(new Date(), "Europe/Kyiv", "dd.MM.yyyy HH:mm:ss"), author, product, message
      ]]);
      MailApp.sendEmail({
        to: CONTACT_EMAIL,
        subject: "Новий відгук на Gapka Homestead Inferno",
        body: "Автор: " + author + "\nТовар: " + product + "\n\n" + message
      });
      return ContentService.createTextOutput(JSON.stringify({status:"success", type:"review"})).setMimeType(ContentService.MimeType.JSON);
    }

    // Замовлення приймаємо лише з українськими способами доставки.
    const allowedDelivery = ["Відділення НП", "Поштомат НП", "Укрпошта", "Кур'єр НП"];
    const delivery = String(data.delivery || "").trim();
    if (!allowedDelivery.includes(delivery)) return errorResponse("Недоступний спосіб доставки");
    const name = String(data.name || "").trim().slice(0, 100);
    const cleanPhone = phone;
    if (!name || !/^\\+?38?0?\\d{9}$/.test(cleanPhone.replace(/^\\+/, ""))) {
      return errorResponse("Перевірте ім'я та номер телефону");
    }
    if (email && email !== "-" && !validateEmail(email)) return errorResponse("Некоректна електронна адреса");

    const safeCart = normalizeCart(data.cart);
    if (safeCart.error) return errorResponse(safeCart.error);
    const orderId = String(data.id || generateOrderId()).trim().slice(0, 40);
    const total = safeCart.items.reduce((sum, item) => sum + item.price * item.qty, 0);
    const formattedTotal = total.toFixed(2);
    const customerPayment = String(data.payment || "-").slice(0, 80);
    const timestamp = Utilities.formatDate(new Date(), "Europe/Kyiv", "dd.MM.yyyy HH:mm:ss");
    const fullMessage = buildOrderDetails(data, safeCart.items);

    if (!lock.tryLock(10000)) return errorResponse("Сервер зайнятий. Спробуйте ще раз.");
    cache.put(limiterKey, String(attempts + 1), 300);
    const sheet = getOrdersSheet();
    sheet.insertRowBefore(2);
    sheet.getRange(2, 3).setNumberFormat("@");
    sheet.getRange(2, 1, 1, 11).setValues([[
      false, timestamp, orderId, name, email || "-", cleanPhone || "-",
      fullMessage, "🆕 Нове", formattedTotal + " ₴", "", customerPayment
    ]]);
    sheet.getRange(2, 1).insertCheckboxes();
    sheet.getRange(2, 1, 1, 11).setBackground("#061a07").setFontColor("#ffffff").setVerticalAlignment("middle");
    lock.releaseLock();

    // Сповіщення власнику надсилається незалежно від наявності email клієнта.
    const adminBody = [
      "Нове замовлення #" + orderId,
      "Клієнт: " + name,
      "Телефон: " + cleanPhone,
      "Email: " + (email || "не вказано"),
      "Оплата: " + customerPayment,
      "Сума: " + formattedTotal + " грн",
      "",
      fullMessage
    ].join("\n");
    MailApp.sendEmail({to: CONTACT_EMAIL, subject: "🔥 Нове замовлення #" + orderId, body: adminBody, replyTo: email || CONTACT_EMAIL});

    if (validateEmail(email)) {
      try { sendConfirmationEmail(email, name, orderId, formattedTotal, safeCart.items, customerPayment); }
      catch (mailError) { Logger.log("Customer confirmation email failed: " + mailError); }
    }
    return ContentService.createTextOutput(JSON.stringify({status:"success", orderId:orderId})).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    try { if (lock.hasLock()) lock.releaseLock(); } catch (_) {}
    Logger.log("doPost error: " + err);
    return errorResponse("Не вдалося обробити запит. Спробуйте ще раз.");
  }
}

/**
 * Санітизація рядка — видаляє небезпечні символи
 */
function sanitizeString(str) {
  if (!str || typeof str !== 'string') return '';
  
  // Видаляємо HTML теги
  str = str.replace(/<[^>]*>/g, '');
  
  // Видаляємо потенційно небезпечні символи
  str = str.replace(/[<>\"\']/g, '');
  
  // Обмежуємо довжину
  return str.substring(0, 1000).trim();
}

/**
 * Валідація email
 */
function validateEmail(email) {
  if (!email || typeof email !== 'string') return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length < 255;
}

/**
 * Генерація унікального ID замовлення
 */
function generateOrderId() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = String(now.getFullYear()).slice(-2);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  
  return `HS-${day}${month}${year}-${random}`;
}

function normalizeCart(cartItems) {
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    return { error: "Cart is empty", items: [] };
  }

  if (cartItems.length > 50) {
    return { error: "Too many cart items", items: [] };
  }

  const items = [];

  for (let i = 0; i < cartItems.length; i++) {
    const item = cartItems[i] || {};
    const name = String(item.name || '').trim().slice(0, 200);
    const productId = String(item.productId || '').trim().slice(0, 100);
    const price = Number(item.price);
    const qty = Math.max(1, Math.min(100, parseInt(item.qty, 10) || 1));

    if (!name || !Number.isFinite(price) || price < 0 || price > 100000) {
      return { error: "Invalid cart item", items: [] };
    }

    items.push({
      productId: productId,
      name: name,
      price: Math.round(price * 100) / 100,
      qty: qty
    });
  }

  return { items: items };
}

function buildOrderDetails(data, cartItems) {
  const delivery = String(data.delivery || '-').trim().slice(0, 100);
  const city = String(data.city || '-').trim().slice(0, 100);
  const branch = String(data.branch || '-').trim().slice(0, 200);
  const comment = String(data.comment || '').trim().slice(0, 500);
  const itemsText = cartItems.map(item =>
    `- ${item.name} (${item.price.toFixed(2)} грн) x ${item.qty}`
  ).join('\n');

  return [
    `Доставка: ${delivery}`,
    `Адреса: ${city}, ${branch}`,
    comment ? `Коментар: ${comment}` : '',
    '',
    'Товари:',
    itemsText
  ].filter(line => line !== '').join('\n');
}

function escapeHtml(text) {
  if (!text) return '-';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function sendConfirmationEmail(email, name, orderId, total, cartItems, paymentMethod) {
  const subject = `🔥 Замовлення #${orderId} — вже летить до вас!`;
  
  // Формуємо список товарів для чека
  let itemsHtml = '';
  if (cartItems && Array.isArray(cartItems)) {
    itemsHtml = cartItems.map(item => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #222; color: #ffffff; font-size: 14px;">
          ${escapeHtml(item.name)} <br>
          <span style="color: #666; font-size: 12px;">${item.qty} x ${parseFloat(item.price).toFixed(2)} ₴</span>
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #222; color: #ffffff; font-size: 14px; text-align: right; font-weight: bold;">
          ${(parseFloat(item.price) * parseInt(item.qty)).toFixed(2)} ₴
        </td>
      </tr>
    `).join('');
  }

  // Формуємо блок оплати залежно від вибору клієнта
  // Перетворюємо в нижній регістр для максимально надійної перевірки (незалежно від мови/регістру)
  const methodNormalized = (paymentMethod || "").toString().toLowerCase();
  
  let paymentSectionHtml = '';
  if (methodNormalized.includes("онлайн")) {
    paymentSectionHtml = `
      <div style="border: 2px dashed #ff4500; border-radius: 15px; padding: 25px; text-align: center; background-color: #000;">
        <h3 style="color: #ffffff; margin: 0 0 15px 0;">💳 Сплатити можна тут</h3>
        <div style="background-color: #fff; padding: 10px; display: inline-block; border-radius: 10px; margin-bottom: 20px;">
          <img src="https://gapkainferno.github.io/GHI.jpg" alt="QR код для оплати" width="150" height="150" style="display: block;">
        </div>
        <p style="color: #aaa; font-size: 14px; margin-bottom: 20px;">Відскануйте код камерою або натисніть кнопку:</p>
        <a href="https://www.privat24.ua/send/km9lh" style="background-color: #ff4500; color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
          ОПЛАТИТИ В ОДИН КЛІК
        </a>
        <p style="color: #666; font-size: 12px; margin-top: 20px;">Рахунок: <br>
          <strong style="color: #ffffff; font-size: 15px; font-family: monospace;">UA693052990262076400946213056</strong>
        </p>
        <div style="margin-top: 25px; padding-top: 15px; border-top: 1px solid #333;">
          <p style="color: #ffd2b3; font-size: 13px; line-height: 1.6; margin: 0;">
            ✅ <strong>Вже сплатили?</strong><br>
            Будь ласка, надішліть на цю пошту <strong>точний час сплати</strong> або <strong>скріншот переводу</strong>. Це допоможе нам швидше відправити ваші "пекучі" скарби!
          </p>
        </div>
      </div>`;
  } else {
    paymentSectionHtml = `
      <div style="border: 2px dashed #444; border-radius: 15px; padding: 25px; text-align: center; background-color: #000;">
        <h3 style="color: #ffffff; margin: 0 0 15px 0;">📦 Оплата при отриманні</h3>
        <p style="color: #ccc; font-size: 14px; line-height: 1.6; margin: 0;">
          Ви обрали <strong>накладений платіж</strong>. <br>
          Сплатити замовлення можна буде безпосередньо у відділенні пошти під час отримання (післяплата).
        </p>
        <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #333;">
          <p style="color: #888; font-size: 12px; line-height: 1.6; margin: 0; font-style: italic;">
            ℹ️ <strong>Нагадування про комісію:</strong><br>
            Зверніть увагу, що пошта бере додаткову плату за послугу переказу коштів (приблизно 2% від суми замовлення + 20 грн).
          </p>
        </div>
      </div>`;
  }

  const htmlBody = `
    <!DOCTYPE html>
    <html lang="uk">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      
      <div style="background-color: #0a0a0a; padding: 40px 10px;">
        
        <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #141414; border-radius: 20px; overflow: hidden; border: 1px solid #222;">
          
          <tr>
            <td align="center" style="background: linear-gradient(135deg, #ff4500 0%, #a30000 100%); padding: 50px 20px;">
              <div style="font-size: 48px; margin-bottom: 10px;">🌶️</div>
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; text-transform: uppercase; letter-spacing: 5px; font-weight: 900; line-height: 1.2;">
                ПРИЙНЯТО!
              </h1>
              <p style="margin: 10px 0 0 0; color: #ffd2b3; font-size: 14px; letter-spacing: 2px; text-transform: uppercase; font-weight: bold;">
                Дякуємо за довіру 🔥
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding: 40px 30px 20px;">
              <p style="font-size: 18px; color: #ffffff; margin: 0 0 10px 0; text-align: center; line-height: 1.6;">
                Вітаємо, <strong style="color: #ff4500;">${name}</strong>! 
              </p>
              <p style="font-size: 15px; color: #aaa; margin: 0 0 30px 0; text-align: center; line-height: 1.8;">
                Ваше замовлення отримано. Ми вже перевіряємо наші вогняні запаси, щоб якнайшвидше відправити їх до вас!
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding: 0 30px 20px;">
              <table width="100%" border="0" cellpadding="0" cellspacing="0">
                <thead>
                  <tr>
                    <th align="left" style="color: #888; font-size: 11px; text-transform: uppercase; padding-bottom: 10px; border-bottom: 1px solid #333;">Товар</th>
                    <th align="right" style="color: #888; font-size: 11px; text-transform: uppercase; padding-bottom: 10px; border-bottom: 1px solid #333;">Сума</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding: 0 30px 30px;">
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #1d1d1d; border-radius: 12px; border: 1px solid #333;">
                <tr>
                  <td width="50%" align="center" style="padding: 25px; border-right: 1px solid #333;">
                    <p style="margin: 0; font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 1.5px;">Номер замовлення</p>
                    <p style="margin: 8px 0 0 0; font-size: 22px; color: #ffa500; font-weight: bold; font-family: monospace;">#${orderId}</p>
                  </td>
                  <td width="50%" align="center" style="padding: 25px;">
                    <p style="margin: 0; font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 1.5px;">До сплати</p>
                    <p style="margin: 8px 0 0 0; font-size: 22px; color: #ff4500; font-weight: bold;">${total} ₴</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding: 0 30px 40px;">
              <h3 style="color: #ffffff; font-size: 18px; margin: 0 0 20px 0; text-align: center;">
                📦 Що далі?
              </h3>
              
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #0d0d0d; border-radius: 10px; padding: 25px; border: 1px solid #222;">
                <tr>
                  <td style="padding: 10px 0;">
                    ${paymentSectionHtml}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 30px 40px;">
              <div style="background: linear-gradient(90deg, #222 0%, #111 50%, #222 100%); padding: 20px; border-radius: 10px; text-align: center;">
                <p style="margin: 0 0 10px 0; font-size: 14px; color: #aaa;">
                  💬 <strong style="color: #fff;">Є питання?</strong>
                </p>
                <p style="margin: 0; font-size: 13px; color: #888; line-height: 1.8;">
                  Просто відповідайте на цей лист або пишіть на <a href="mailto:${CONTACT_EMAIL}" style="color: #ff4500; text-decoration: none; font-weight: bold;">${CONTACT_EMAIL}</a>
                </p>
              </div>
            </td>
          </tr>

          <tr>
            <td align="center" style="background-color: #0d0d0d; padding: 30px; border-top: 1px solid #222;">
              <p style="margin: 0 0 10px 0; font-size: 13px; color: #444; letter-spacing: 2px; text-transform: uppercase;">
                🌶️ Gapka Homestead Inferno 🌶️
              </p>
              <p style="margin: 0; font-size: 11px; color: #333;">
                З любов'ю та вогнем прямо з городу
              </p>
            </td>
          </tr>
        </table>
        
      </div>
      
    </body>
    </html>
  `;

  // Відправка email
  MailApp.sendEmail({
    to: email,
    subject: subject,
    htmlBody: htmlBody,
    name: "Gapka Homestead Inferno 🔥",
    replyTo: CONTACT_EMAIL // ВАЖЛИВО: дозволяє відповідати на лист
  });
}

function sendWelcomeEmail(email, type, details) {
  // Універсальний текст для будь-якої підписки чи запиту
  const subject = "🔥 Inferno — Ваш запит успішно отримано!";
  const headerText = "ВИ В СПИСКУ!";
  const mainMessage = "Дякуємо за інтерес до нашої ферми! Ми успішно отримали вашу підписку. Тепер ви першими дізнаєтеся про появу нових категорій, збір свіжого врожаю суперхотів або вихід цікавих нотаток у нашому блозі. Залишайтеся на зв'язку — вогняні новини вже готуються!";

  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: sans-serif; color: #ffffff;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #141414; border: 1px solid #222; border-radius: 20px; overflow: hidden;">
        
        <!-- HEADER -->
        <div style="background: linear-gradient(135deg, #c85a2a 0%, #8b0000 100%); padding: 40px 20px; text-align: center;">
          <div style="font-size: 40px; margin-bottom: 10px;">📩</div>
          <h1 style="margin: 0; font-size: 24px; letter-spacing: 3px; text-transform: uppercase;">${headerText}</h1>
        </div>

        <!-- CONTENT -->
        <div style="padding: 40px 30px; text-align: center;">
          <p style="font-size: 18px; line-height: 1.6; color: #fcefe1;">
            ${mainMessage}
          </p>
          <p style="font-size: 15px; color: #aaa; margin-top: 30px;">
            Поки ви чекаєте, запрошуємо заглянути в наш блог, де ми ділимося досвідом вирощування розсади та рецептами.
          </p>
          
          <div style="margin-top: 40px;">
            <a href="https://gapkainferno.github.io/blog.html" 
               style="background-color: #c85a2a; color: white; padding: 15px 30px; text-decoration: none; border-radius: 30px; font-weight: bold; display: inline-block;">
               Читати Inferno Блог
            </a>
          </div>
        </div>

        <!-- FOOTER -->
        <div style="background-color: #0d0d0d; padding: 30px; text-align: center; border-top: 1px solid #222;">
          <p style="margin: 0; font-size: 12px; color: #444; letter-spacing: 1px; text-transform: uppercase;">
            🌶️ Gapka Homestead Inferno 🌶️
          </p>
          <p style="margin: 10px 0 0 0; font-size: 11px; color: #333;">
            Ви отримали цей лист, тому що підписалися на новини на нашому сайті.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    MailApp.sendEmail({
      to: email,
      subject: subject,
      htmlBody: htmlBody,
      name: "Gapka Homestead Inferno 🔥"
    });
    Logger.log("Welcome email sent to: " + email);
    return true;
  } catch (e) {
    Logger.log("Error sending welcome email: " + e.toString());
    return false;
  }
}

function errorResponse(msg) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "error", 
    message: msg
  })).setMimeType(ContentService.MimeType.JSON);
}

function onEdit(e) {
  try {
    const range = e.range;
    const sheet = range.getSheet();
    
    // Перевірка, що ми на правильному аркуші
    if (sheet.getName() !== SHEET_NAME) return;
    
    const col = range.getColumn();
    const row = range.getRow();
    
    if (row === 1) return; // Пропускаємо заголовок
    
    const STATUS_COLUMN = 8; // H
    const lastCol = 11;       // K
    
    // ЛОГІКА: Якщо натиснули чекбокс у стовпці A
    if (col === 1) {
      if (range.getValue() === true) {
        sheet.getRange(row, STATUS_COLUMN).setValue('✔️ Доставлено');
      }
    }

    // Перевіряємо, чи змінився статус (або ми його змінили через чекбокс)
    const status = sheet.getRange(row, STATUS_COLUMN).getValue();
    const rowRange = sheet.getRange(row, 1, 1, lastCol);
    
    // Палітра кольорів для ВСЬОГО рядка
    const colors = {
      '🆕 Нове':         { bg: '#061a07', text: '#ffffff' }, // Темно-зелений
      '💬 Уточнюється':  { bg: '#0d1a26', text: '#8ab4f8' }, // Темно-синій
      '💰 Очікує оплати': { bg: '#1a1605', text: '#ffd966' }, // Темно-коричневий
      '✅ Оплачено':     { bg: '#0a1a0f', text: '#81c995' }, // Темно-хвойний
      '📦 Пакується':    { bg: '#130d1a', text: '#b4a7d6' }, // Темно-фіолетовий
      '🚚 Відправлено':  { bg: '#0d1a18', text: '#81c9b9' }, // Темно-бірюзовий
      '✔️ Доставлено':   { bg: '#111111', text: '#999999' }, // Сірий (архів)
      '❌ Скасовано':    { bg: '#1a0d0d', text: '#f28b82' }  // Темно-червоний
    };

    if (colors[status]) {
      rowRange.setBackground(colors[status].bg);
      rowRange.setFontColor(colors[status].text);
    } else {
      rowRange.setBackground(null).setFontColor('#000000'); // Дефолт, якщо статус невідомий
    }
    
    // Додатково виділяємо суму (стовпець I), щоб вона завжди була жирною
    sheet.getRange(row, 9).setFontWeight('bold').setHorizontalAlignment('center');

  } catch (err) {
    console.error('Error in onEdit:', err.toString());
  }
}
