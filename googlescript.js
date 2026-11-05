// ════════════════════════════════════════════════════════════════
// HOMESTEAD INFERNO — ORDER PROCESSING SCRIPT
// Google Apps Script для обробки замовлень з сайту
// ════════════════════════════════════════════════════════════════
const CONTACT_EMAIL = "homestead.inferno@gmail.com";

const SHEET_NAME = "Замовлення"; // ЗАМІНИ на назву свого аркуша з замовленнями
const SUB_SHEET_NAME = "Підписки"; 
const REVIEW_SHEET_NAME = "Відгуки"; 

function getSpreadsheet_() {
  const spreadsheetId = PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID");
  if (!spreadsheetId) {
    throw new Error("Не налаштовано Script Property SPREADSHEET_ID");
  }
  return SpreadsheetApp.openById(spreadsheetId);
}

function getOrdersSheet() {
  const ss = getSpreadsheet_();
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    throw new Error("У таблиці не знайдено аркуш «" + SHEET_NAME + "»");
  }
  return sheet;
}

function normalizeOrderId(value) {
  const orderId = String(value).trim();
  return /^\d+$/.test(orderId) ? orderId.replace(/^0+(?=\d)/, '') : orderId;
}
function consumeRateLimit_(key, limit, windowSeconds) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(3000)) return false;
  try {
    const cache = CacheService.getScriptCache();
    const current = Number(cache.get(key) || 0);
    if (current >= limit) return false;
    cache.put(key, String(current + 1), windowSeconds);
    return true;
  } finally { lock.releaseLock(); }
}
function hashKey_(value) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(value), Utilities.Charset.UTF_8);
  return Utilities.base64EncodeWebSafe(bytes).replace(/=+$/g, '').slice(0, 40);
}
function safeSheetText_(value) {
  const text = String(value == null ? '' : value);
  return /^[=+\-@\t\r]/.test(text) ? "'" + text : text;
}
function consumeRateLimitLocked_(key, limit, windowSeconds) {
  const cache = CacheService.getScriptCache();
  const current = Number(cache.get(key) || 0);
  if (!Number.isFinite(current) || current < 0 || current >= limit) return false;
  cache.put(key, String(current + 1), windowSeconds);
  return true;
}

function ensureIdempotencyColumn_(sheet, column, header) {
  const headerCell = sheet.getRange(1, column);
  if (!headerCell.getValue()) {
    headerCell.setValue(header);
    headerCell.setFontWeight("bold").setBackground("#eeeeee");
  }
  try { sheet.hideColumns(column); } catch (_) {}
}

function findIdempotentRow_(sheet, column, key) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return 0;
  const match = sheet.getRange(2, column, lastRow - 1, 1)
    .createTextFinder(key).matchEntireCell(true).findNext();
  return match ? match.getRow() : 0;
}

function jsonResponse_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function verifyTurnstile_(token) {
  const secret = PropertiesService.getScriptProperties().getProperty("TURNSTILE_SECRET_KEY");
  // Fail closed: без секретного ключа сервер не приймає запити.
  if (!secret) {
    Logger.log("Turnstile secret is not configured.");
    return { ok: false, configured: false };
  }
  if (!token || typeof token !== "string" || token.length > 2048) return { ok: false, configured: true };
  try {
    const response = UrlFetchApp.fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "post", payload: { secret: secret, response: token }, muteHttpExceptions: true
    });
    if (response.getResponseCode() !== 200) return { ok: false, configured: true };
    const result = JSON.parse(response.getContentText());
    if (result.success !== true) return { ok: false, configured: true };
    const allowedHosts = (PropertiesService.getScriptProperties().getProperty("TURNSTILE_ALLOWED_HOSTNAMES") ||
      "gapkainferno.github.io,localhost,127.0.0.1").split(",").map(host => host.trim().toLowerCase()).filter(Boolean);
    const hostname = String(result.hostname || "").toLowerCase();
    if (!hostname || !allowedHosts.includes(hostname)) return { ok: false, configured: true };
    return { ok: true, configured: true };
  } catch (error) {
    Logger.log("Turnstile verification failed: " + error);
    return { ok: false, configured: true };
  }
}

function doGet() {
  return ContentService.createTextOutput("Gapka Homestead Inferno — сервіс замовлень активний. Версія: 52")
    .setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    if (!e || !e.postData || !e.postData.contents) return errorResponse("Немає даних");
    const rawBody = e.postData.contents;
    if (Utilities.newBlob(rawBody).getBytes().length > 30000) return errorResponse("Запит завеликий.");

    let data;
    try { data = JSON.parse(rawBody); }
    catch (_) { return errorResponse("Некоректний формат JSON."); }
    if (!data || typeof data !== "object" || Array.isArray(data)) return errorResponse("Некоректний запит");

    // Honeypot: не зберігаємо й не розсилаємо дані, якщо приховане поле заповнене.
    if (String(data.website_url || "").trim()) return jsonResponse_({status:"success", accepted:true});

    // CAPTCHA перевіряємо до пошуку дублікатів: requestId не може бути способом
    // дізнатися про наявність чужого замовлення без успішної перевірки.
    const captcha = verifyTurnstile_(data.turnstileToken);
    if (!captcha.ok) return errorResponse("Перевірка безпеки не пройдена. Оновіть сторінку та повторіть спробу.");
    // Глобальний запобіжник застосовується лише після CAPTCHA, щоб не дозволяти
    // анонімним запитам блокувати справжніх покупців.
    if (!consumeRateLimit_("verified_global_requests", 120, 60)) {
      return errorResponse("Забагато запитів. Спробуйте за хвилину.");
    }

    const requestId = String(data.requestId || "").trim();
    if (!/^[A-Za-z0-9_-]{20,100}$/.test(requestId)) {
      return errorResponse("Не вдалося підтвердити запит. Оновіть сторінку та повторіть спробу.");
    }

    const emailInput = String(data.email || "").trim().toLowerCase();
    const email = emailInput === "-" ? "" : emailInput;
    const phone = String(data.phone || "").replace(/[^0-9+]/g, "").slice(0, 20);
    const orderType = String(data.orderType || "ЗАМОВЛЕННЯ").trim();
    const idempotencyKey = hashKey_(orderType + "|" + requestId);

    // ПІДПИСКА ТА ЗАПИТ НА ПОВІДОМЛЕННЯ ПРО ПОЯВУ ТОВАРУ
    if (orderType === "ПІДПИСКА_МАРКЕТИНГ" || orderType === "ЗАПИТ_НА_ЗАПУСК") {
      if (!validateEmail(email)) return errorResponse("Некоректна електронна адреса");
      const details = String(data.details || "-").trim().slice(0, 300);

      if (!lock.tryLock(10000)) return errorResponse("Сервер зайнятий. Спробуйте ще раз.");
      try {
        const ss = getSpreadsheet_();
        let subSheet = ss.getSheetByName(SUB_SHEET_NAME);
        if (!subSheet) {
          subSheet = ss.insertSheet(SUB_SHEET_NAME);
          subSheet.getRange(1, 1, 1, 5).setValues([["Дата", "Email", "Тип", "Деталі/Категорія", "Ключ запиту (службовий)"]]);
          subSheet.getRange(1, 1, 1, 5).setFontWeight("bold").setBackground("#fcefe1");
        }
        ensureIdempotencyColumn_(subSheet, 5, "Ключ запиту (службовий)");
        if (findIdempotentRow_(subSheet, 5, idempotencyKey)) {
          return jsonResponse_({status:"success", type:"subscription", duplicate:true, emailSent:true});
        }
        if (!consumeRateLimitLocked_("subscription_" + hashKey_(email), 5, 600)) {
          return errorResponse("Забагато запитів з цієї адреси. Спробуйте пізніше.");
        }
        subSheet.insertRowBefore(2);
        subSheet.getRange(2, 1, 1, 5).setValues([[
          Utilities.formatDate(new Date(), "Europe/Kyiv", "dd.MM.yyyy HH:mm:ss"),
          safeSheetText_(email), safeSheetText_(orderType.slice(0, 60)),
          safeSheetText_(details), idempotencyKey
        ]]);
      } finally {
        if (lock.hasLock()) lock.releaseLock();
      }

      const emailSent = sendWelcomeEmail(email, orderType, details);
      return jsonResponse_({status:"success", type:"subscription", emailSent:emailSent});
    }

    // ВІДГУКИ
    if (orderType === "ВІДГУК") {
      const author = String(data.name || "").trim().slice(0, 100);
      const product = String(data.product || "").trim().slice(0, 150);
      const message = String(data.message || "").trim().slice(0, 1500);
      if (!author || !product || !message) return errorResponse("Заповніть усі поля відгуку");

      if (!lock.tryLock(10000)) return errorResponse("Сервер зайнятий. Спробуйте ще раз.");
      try {
        const ss = getSpreadsheet_();
        let revSheet = ss.getSheetByName(REVIEW_SHEET_NAME);
        if (!revSheet) {
          revSheet = ss.insertSheet(REVIEW_SHEET_NAME);
          revSheet.getRange(1, 1, 1, 5).setValues([["Дата", "Автор", "Товар", "Текст відгуку", "Ключ запиту (службовий)"]]);
          revSheet.getRange(1, 1, 1, 5).setFontWeight("bold").setBackground("#cfe2f3");
        }
        ensureIdempotencyColumn_(revSheet, 5, "Ключ запиту (службовий)");
        if (findIdempotentRow_(revSheet, 5, idempotencyKey)) {
          return jsonResponse_({status:"success", type:"review", duplicate:true});
        }
        if (!consumeRateLimitLocked_("review_" + hashKey_(author.toLowerCase()), 5, 600)) {
          return errorResponse("Забагато відгуків. Спробуйте пізніше.");
        }
        revSheet.insertRowBefore(2);
        revSheet.getRange(2, 1, 1, 5).setValues([[
          Utilities.formatDate(new Date(), "Europe/Kyiv", "dd.MM.yyyy HH:mm:ss"),
          safeSheetText_(author), safeSheetText_(product), safeSheetText_(message), idempotencyKey
        ]]);
      } finally {
        if (lock.hasLock()) lock.releaseLock();
      }

      let adminEmailSent = false;
      try {
        MailApp.sendEmail({
          to: CONTACT_EMAIL,
          subject: "Новий відгук на Gapka Homestead Inferno",
          body: "Автор: " + author + "\nТовар: " + product + "\n\n" + message
        });
        adminEmailSent = true;
      } catch (mailError) {
        Logger.log("Review notification failed: " + mailError);
      }
      return jsonResponse_({status:"success", type:"review", adminEmailSent:adminEmailSent});
    }

    // ЗАМОВЛЕННЯ: спочатку шукаємо довговічний ключ у прихованому стовпці.
    if (!lock.tryLock(10000)) return errorResponse("Сервер зайнятий. Спробуйте ще раз.");
    try {
      const existingOrderSheet = getOrdersSheet();
      ensureIdempotencyColumn_(existingOrderSheet, 12, "Ключ запиту (службовий)");
      const duplicateRow = findIdempotentRow_(existingOrderSheet, 12, idempotencyKey);
      if (duplicateRow) {
        const previousOrderId = String(existingOrderSheet.getRange(duplicateRow, 3).getValue());
        return jsonResponse_({status:"success", orderId:previousOrderId, duplicate:true});
      }
    } finally {
      if (lock.hasLock()) lock.releaseLock();
    }

    const allowedDelivery = ["Відділення НП", "Поштомат НП", "Укрпошта", "Кур'єр НП"];
    const delivery = String(data.delivery || "").trim();
    if (!allowedDelivery.includes(delivery)) return errorResponse("Недоступний спосіб доставки");
    const name = String(data.name || "").trim().slice(0, 100);
    if (!name || !/^(?:\+380|0)\d{9}$/.test(phone)) return errorResponse("Перевірте ім'я та номер телефону");
    if (email && !validateEmail(email)) return errorResponse("Некоректна електронна адреса");

    const safeCart = normalizeCart(data.cart);
    if (safeCart.error) return errorResponse(safeCart.error);
    const orderId = generateOrderId();
    const total = safeCart.items.reduce((sum, item) => sum + item.price * item.qty, 0);
    const formattedTotal = total.toFixed(2);
    const customerPayment = String(data.payment || "-").slice(0, 80);
    const timestamp = Utilities.formatDate(new Date(), "Europe/Kyiv", "dd.MM.yyyy HH:mm:ss");
    const fullMessage = buildOrderDetails(data, safeCart.items);

    if (!lock.tryLock(10000)) return errorResponse("Сервер зайнятий. Спробуйте ще раз.");
    try {
      const sheet = getOrdersSheet();
      ensureIdempotencyColumn_(sheet, 12, "Ключ запиту (службовий)");
      const duplicateRow = findIdempotentRow_(sheet, 12, idempotencyKey);
      if (duplicateRow) {
        const previousOrderId = String(sheet.getRange(duplicateRow, 3).getValue());
        return jsonResponse_({status:"success", orderId:previousOrderId, duplicate:true});
      }
      if (!consumeRateLimitLocked_("order_" + hashKey_(phone + "|" + (email || "")), 5, 600)) {
        return errorResponse("Забагато замовлень з цих контактних даних. Спробуйте пізніше.");
      }

      sheet.insertRowBefore(2);
      sheet.getRange(2, 3).setNumberFormat("@");
      sheet.getRange(2, 1, 1, 12).setValues([[
        false, timestamp, safeSheetText_(orderId), safeSheetText_(name), safeSheetText_(email || "-"),
        safeSheetText_(phone), safeSheetText_(fullMessage), "🆕 Нове", formattedTotal + " ₴", "",
        safeSheetText_(customerPayment), idempotencyKey
      ]]);
      sheet.getRange(2, 1).insertCheckboxes();
      sheet.getRange(2, 1, 1, 11).setBackground("#061a07").setFontColor("#ffffff").setVerticalAlignment("middle");
    } finally {
      if (lock.hasLock()) lock.releaseLock();
    }

    const adminBody = [
      "Нове замовлення #" + orderId,
      "Клієнт: " + name,
      "Телефон: " + phone,
      "Email: " + (email || "не вказано"),
      "Оплата: " + customerPayment,
      "Сума: " + formattedTotal + " грн",
      "",
      fullMessage
    ].join("\n");
    let adminEmailSent = false;
    try {
      MailApp.sendEmail({to:CONTACT_EMAIL, subject:"🔥 Нове замовлення #" + orderId, body:adminBody, replyTo:email || CONTACT_EMAIL});
      adminEmailSent = true;
    } catch (adminMailError) {
      Logger.log("Admin order notification failed: " + adminMailError);
    }
    if (validateEmail(email)) {
      try { sendConfirmationEmail(email, name, orderId, formattedTotal, safeCart.items, customerPayment); }
      catch (mailError) { Logger.log("Customer confirmation email failed: " + mailError); }
    }
    return jsonResponse_({status:"success", orderId:orderId, adminEmailSent:adminEmailSent});
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

function getCanonicalOrderCatalog() {
  const properties = PropertiesService.getScriptProperties();
  const url = properties.getProperty("CANONICAL_ORDER_CATALOG_URL") ||
    "https://raw.githubusercontent.com/gapkainferno/gapkainferno.github.io/master/order-catalog.json";
  const cache = CacheService.getScriptCache();
  const cacheKey = "canonical_order_catalog_v1_" + encodeURIComponent(url).slice(0, 180);
  const cached = cache.get(cacheKey);
  if (cached) {
    try { return JSON.parse(cached); } catch (_) {}
  }

  const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true, followRedirects: true });
  if (response.getResponseCode() !== 200) {
    throw new Error("Canonical order catalog is unavailable (HTTP " + response.getResponseCode() + ")");
  }
  const catalog = JSON.parse(response.getContentText());
  if (!catalog || catalog.schemaVersion !== 1 || !catalog.products || !catalog.bundles) {
    throw new Error("Canonical order catalog has an unsupported format");
  }
  cache.put(cacheKey, JSON.stringify(catalog), 60);
  return catalog;
}

function getCanonicalPrice(basePrice, product, catalog) {
  let price = Number(basePrice);
  const sale = catalog.sale || {};
  const deadline = sale.deadline ? new Date(sale.deadline) : null;
  const deadlinePassed = deadline instanceof Date && !Number.isNaN(deadline.getTime()) && Date.now() > deadline.getTime();
  if (sale.isActive === true && product.allowSale === true && !deadlinePassed) {
    const discount = Math.min(Math.max(Number(sale.discountPercent) || 0, 0), 90);
    price = Math.round(price * (1 - discount / 100));
  }
  return Math.round(price * 100) / 100;
}

function normalizeCart(cartItems) {
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    return { error: "Кошик порожній.", items: [] };
  }
  if (cartItems.length > 50) {
    return { error: "У кошику забагато позицій.", items: [] };
  }

  let catalog;
  try {
    catalog = getCanonicalOrderCatalog();
  } catch (error) {
    Logger.log("Order catalog error: " + error);
    return { error: "Не вдалося перевірити актуальний каталог. Спробуйте трохи пізніше.", items: [] };
  }

  const items = [];
  for (let i = 0; i < cartItems.length; i++) {
    const item = cartItems[i] || {};
    const productId = String(item.productId || "").trim().slice(0, 100);
    const qty = Number(item.qty);
    const submittedPrice = Number(item.price);

    if (!productId || !Number.isInteger(qty) || qty < 1 || qty > 100 ||
        !Number.isFinite(submittedPrice) || submittedPrice < 0) {
      return { error: "Некоректна позиція кошика. Оновіть кошик і спробуйте ще раз.", items: [] };
    }

    let canonicalName = "";
    let basePrice = NaN;
    let saleProduct = null;

    if (Object.prototype.hasOwnProperty.call(catalog.bundles, productId)) {
      const bundle = catalog.bundles[productId];
      if (bundle.inStock !== true || !Number.isFinite(Number(bundle.price))) {
        return { error: "Набір «" + String(bundle.name || productId) + "» зараз недоступний.", items: [] };
      }
      canonicalName = String(bundle.name || productId);
      basePrice = Number(bundle.price);
      saleProduct = bundle;
    } else {
      const product = catalog.products[productId];
      if (!product || product.isHidden === true || product.inStock === false ||
          !Number.isFinite(Number(product.price)) || Number(product.price) <= 0) {
        return { error: "Один із товарів більше недоступний. Оновіть кошик.", items: [] };
      }

      canonicalName = String(product.name || productId);
      saleProduct = product;
      const variants = product.variants || {};
      const variantKeys = Object.keys(variants);
      let versionKey = String(item.versionKey || "").trim();

      if (variantKeys.length > 0) {
        if (!versionKey) versionKey = "openPollinated";
        const variant = variants[versionKey];
        if (!variant || variant.inStock !== true || !Number.isFinite(Number(variant.price))) {
          return { error: "Обраний варіант товару «" + canonicalName + "» більше недоступний. Оновіть кошик.", items: [] };
        }
        basePrice = Number(variant.price);
        if (variant.label) canonicalName += " (" + String(variant.label) + ")";
      } else {
        if (versionKey) {
          return { error: "Для товару «" + canonicalName + "» обрано невідомий варіант. Оновіть кошик.", items: [] };
        }
        basePrice = Number(product.price);
      }
    }

    const expectedPrice = getCanonicalPrice(basePrice, saleProduct, catalog);
    if (Math.abs(submittedPrice - expectedPrice) > 0.01) {
      return { error: "Ціна товару «" + canonicalName + "» змінилася. Оновіть кошик, щоб побачити актуальну суму.", items: [] };
    }

    items.push({
      productId: productId,
      name: canonicalName.slice(0, 200),
      price: expectedPrice,
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
                Вітаємо, <strong style="color: #ff4500;">${escapeHtml(name)}</strong>! 
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
