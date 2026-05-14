// ════════════════════════════════════════════════════════════════
// HOMESTEAD INFERNO — ORDER PROCESSING SCRIPT
// Google Apps Script для обробки замовлень з сайту
// ════════════════════════════════════════════════════════════════
const BOT_TOKEN = '8532849974:AAG-JfB6E6_XfNggptnpygCrr0JqutvRhgA'; // Токен від @BotFather
const CHAT_IDS = ['457261010', '593171782']; 
const API_SECRET = "summerof26";    // Пароль для захисту (як у cart.js)
const CONTACT_EMAIL = "homestead.inferno@gmail.com";
const PAYMENT_IBAN = "UA000000000000000000000000000";
const PAYMENT_RECIPIENT = "ПІБ Отримувача";

const SHEET_NAME = "Замовлення"; // ЗАМІНИ на назву свого аркуша з замовленнями
const SUB_SHEET_NAME = "Підписки"; 
const REVIEW_SHEET_NAME = "Відгуки"; 

function doGet() {
  return ContentService.createTextOutput("Бот Homestead Inferno активний. " + 
    "Скрипт очікує POST-запити від Telegram. Поточна версія: 46")
    .setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) return errorResponse("No data");
    let data = JSON.parse(e.postData.contents);

    // 1. ОБРОБКА КНОПКИ З TELEGRAM (Callback)
    if (data.callback_query) {
      return handleTelegramCallback(data.callback_query);
    }

    // 2. ОБРОБКА НОВОГО ЗАМОВЛЕННЯ З САЙТУ
    if (data.secret_token !== API_SECRET) return errorResponse("Unauthorized");

    // 3. ОБРОБКА ПІДПИСКИ (МАРКЕТИНГ АБО ЗАПУСК ТОВАРУ)
    if (data.orderType === "ПІДПИСКА_МАРКЕТИНГ" || data.orderType === "ЗАПИТ_НА_ЗАПУСК") {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      let subSheet = ss.getSheetByName(SUB_SHEET_NAME);
      
      // Якщо аркуша немає — створюємо його з заголовками
      if (!subSheet) {
        subSheet = ss.insertSheet(SUB_SHEET_NAME);
        subSheet.appendRow(["Дата", "Email", "Тип", "Деталі/Категорія"]);
        subSheet.getRange(1, 1, 1, 4).setFontWeight("bold").setBackground("#fcefe1");
      }

      subSheet.insertRowBefore(2);
      subSheet.getRange(2, 1, 1, 4).setValues([[
        data.date || Utilities.formatDate(new Date(), "Europe/Kiev", "dd.MM.yyyy HH:mm:ss"),
        data.email,
        data.orderType,
        data.details || "-"
      ]]);

      // ВІДПРАВКА ВІТАЛЬНОГО ЛИСТА
      if (data.email && data.email.includes("@")) {
        sendWelcomeEmail(data.email, data.orderType, data.details);
      }
      
      return ContentService.createTextOutput(JSON.stringify({status: "success", type: "subscription"}))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 4. ОБРОБКА ВІДГУКУ
    if (data.orderType === "ВІДГУК") {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      let revSheet = ss.getSheetByName(REVIEW_SHEET_NAME);
      
      if (!revSheet) {
        revSheet = ss.insertSheet(REVIEW_SHEET_NAME);
        revSheet.appendRow(["Дата", "Автор", "Товар", "Текст відгуку"]);
        revSheet.getRange(1, 1, 1, 4).setFontWeight("bold").setBackground("#cfe2f3");
      }

      revSheet.insertRowBefore(2);
      revSheet.getRange(2, 1, 1, 4).setValues([[
        data.date || Utilities.formatDate(new Date(), "Europe/Kiev", "dd.MM.yyyy HH:mm:ss"),
        data.name || "Анонім",
        data.product || "-",
        data.message || ""
      ]]);

      // Відправка повідомлення в Telegram
      const tgMsg = `💬 <b>НОВИЙ ВІДГУК</b>\n\n👤 <b>Автор:</b> ${escapeHtml(data.name)}\n📦 <b>Товар:</b> ${escapeHtml(data.product)}\n📝 <b>Текст:</b> ${escapeHtml(data.message)}`;
      CHAT_IDS.forEach(chatId => {
        UrlFetchApp.fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: 'post',
          contentType: 'application/json',
          payload: JSON.stringify({ chat_id: chatId, text: tgMsg, parse_mode: 'HTML' }),
          muteHttpExceptions: true
        });
      });

      return ContentService.createTextOutput(JSON.stringify({status: "success", type: "review"}))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const orderId = data.id || generateOrderId();
    const customerEmail = data.email || "-";
    const customerName = data.name || "Друже";
    const customerPhone = data.phone || "-";
    const fullMessage = data.message || "";
    const customerPayment = data.payment || "-";
    
    // Фіксація точного часу (день.місяць.рік години:хвилини:секунди)
    const timestamp = Utilities.formatDate(new Date(), "Europe/Kiev", "dd.MM.yyyy HH:mm:ss");

    // Витягуємо суму
    let orderTotal = parseFloat(data.total) || 0;
    const formattedTotal = orderTotal.toFixed(2);

    // Запис у таблицю
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    sheet.insertRowBefore(2);
    
    const rowData = [[
      false,               // A - Чекбокс
      timestamp,           // B - Дата
      orderId,             // C - ID
      customerName,        // D - Ім'я
      customerEmail,       // E - Email
      customerPhone,       // F - Телефон
      fullMessage,         // G - Повідомлення
      "🆕 Нове",           // H - Статус
      formattedTotal + " ₴", // I - Сума
      "",                   // J - ТТН
      customerPayment      // K - Оплата
    ]];
    
    sheet.getRange(2, 1, 1, 11).setValues(rowData);
    sheet.getRange(2, 1).insertCheckboxes();
    
    // Стилізація (ваша логіка)
    const wholeRow = sheet.getRange(2, 1, 1, 11);
    wholeRow.setBackground('#061a07').setFontColor('#ffffff').setVerticalAlignment("middle");

    // Відправка повідомлення з кнопками в Telegram
    const telegramMessage = formatTelegramMessage(orderId, customerName, customerEmail, customerPhone, formattedTotal, fullMessage, customerPayment);
    // Логуємо повідомлення перед відправкою, щоб перевірити чи воно не порожнє
    sendOrderWithButtons(telegramMessage, orderId);

    

    // Відправка підтвердження клієнту на імейл
    if (customerEmail !== "-" && customerEmail.includes("@")) {
      sendConfirmationEmail(customerEmail, customerName, orderId, formattedTotal, data.cart, customerPayment);
    }

    return ContentService.createTextOutput(JSON.stringify({status: "success", orderId: orderId})).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return errorResponse(err.toString());
  }
}

// Функція для відправки повідомлення з кнопками "Прийняти"
function sendOrderWithButtons(message, orderId) {
  if (!message || message.trim() === "") {
    Logger.log("⚠️ КРИТИЧНО: Спроба відправити порожній текст замовлення скасована.");
    return;
  }
  const messageIdsMapping = {};
  CHAT_IDS.forEach(chatId => {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    const payload = {
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML',
      reply_markup: JSON.stringify({
        inline_keyboard: [[
          { text: "✅ Прийняти та Оформити", callback_data: `accept_${orderId}` },
          { text: "❌ Скасувати", callback_data: `cancel_${orderId}` }
        ]]
      })
    };
    try {
      const response = UrlFetchApp.fetch(url, { method: 'post', contentType: 'application/json', payload: JSON.stringify(payload), muteHttpExceptions: true });
      const resObj = JSON.parse(response.getContentText());
      
      if (resObj.ok) {
        // Зберігаємо ID повідомлення для кожного адміна
        messageIdsMapping[chatId] = resObj.result.message_id;
        Logger.log(`✅ Повідомлення відправлено адміну ${chatId}, ID: ${resObj.result.message_id}`);
      } else if (resObj.description.includes("bot was blocked")) {
        Logger.log("🚫 Користувач " + chatId + " заблокував бота або не натиснув START.");
      }
    } catch (e) {
      Logger.log("Критична помилка відправки для ID " + chatId + ": " + e);
    }
  });

  // Записуємо мапу повідомлень у властивості скрипта (діє 24+ години, зазвичай достатньо для обробки)
  const cleanOrderId = String(orderId).trim();
  const mapToSave = JSON.stringify(messageIdsMapping);
  PropertiesService.getScriptProperties().setProperty('msg_map_' + cleanOrderId, mapToSave);
  Logger.log("📝 DEBUG: Збережено мапу повідомлень для " + orderId + ": " + mapToSave);
}

// Обробка натискання кнопки в Telegram
function handleTelegramCallback(callback) {
  // 1. ВІДПОВІДЬ НА КЛІК: Обов'язково для Телеграм, щоб зупинити анімацію завантаження на кнопці
  answerCallbackQuery(callback.id);

  const adminName = callback.from.first_name || callback.from.username || "Адмін";
  const actionTime = Utilities.formatDate(new Date(), "Europe/Kiev", "HH:mm");
  const callbackData = callback.data || "";
  const action = callbackData.split('_')[0];
  const orderId = String(callbackData.split('_')[1] || "").trim();
  
  Logger.log(`🚀 ОБРОБКА КЛІКУ: Адмін ${adminName}, Дія ${action}, Замовлення ${orderId}`);

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
  
  // Оптимізований пошук рядка замовлення через indexOf
  const orderIds = sheet.getRange("C:C").getValues().flat().map(id => String(id).trim());
  const rowIndex = orderIds.indexOf(orderId) + 1;

  // Ініціалізуємо шаблон за замовчуванням (щоб не був порожнім)
  let finalStatusTemplate = `⚠️ Статус замовлення #${escapeHtml(orderId)} змінено (Action: ${action}).`;

  if (rowIndex !== -1) {
    if (action === 'accept') {
      sheet.getRange(rowIndex, 8).setValue("📦 Пакується");
      const name = sheet.getRange(rowIndex, 4).getValue() || "Клієнт";
      const phone = sheet.getRange(rowIndex, 6).getValue() || "-";
      const msg = sheet.getRange(rowIndex, 7).getValue() || "Деталі відсутні";
      const payment = sheet.getRange(rowIndex, 11).getValue() || "-";

      finalStatusTemplate = "✅ <b>ЗАМОВЛЕННЯ ПРИЙНЯТО</b>\n" +
                            "📦 Статус: Пакується\n" +
                            "💳 Оплата: <b>" + escapeHtml(payment) + "</b>\n" +
                            "⚡️ Обробив: <b>" + escapeHtml(adminName) + "</b> о " + actionTime + "\n\n" +
                            "📋 <b>ДАНІ ДОСТАВКИ:</b>\n" +
                            "👤 " + escapeHtml(name) + "\n" +
                            "📱 <code>" + escapeHtml(phone) + "</code>\n" +
                            "📍 " + escapeHtml(msg);
    } else if (action === 'cancel') {
      sheet.getRange(rowIndex, 8).setValue("❌ Скасовано");
      finalStatusTemplate = "❌ <b>ЗАМОВЛЕННЯ СКАСОВАНО</b>\n" +
                            "👤 Ким: <b>" + escapeHtml(adminName) + "</b> о " + actionTime;
    }

    // Отримуємо збережені ID повідомлень для обох адмінів
    const props = PropertiesService.getScriptProperties();
    const msgMapStr = props.getProperty('msg_map_' + orderId); // Використовуємо той самий ключ
    
    if (msgMapStr && msgMapStr !== "{}") {
      const msgMap = JSON.parse(msgMapStr);
      Logger.log("📦 Знайдено зв'язки повідомлень: " + msgMapStr);
      
      // Цикл оновлення повідомлень у ВСІХ адмінів
      for (const chatId in msgMap) {
        try {
          const success = updateTelegramMessage(chatId, msgMap[chatId], finalStatusTemplate);
          Logger.log(`🔄 Оновлення чату ${chatId}: ${success ? "Успішно" : "ПОМИЛКА"}`);
        } catch (e) {
          Logger.log("Помилка оновлення для адміна " + chatId + ": " + e);
        }
      }
    } else {
      Logger.log(`⚠️ КРИТИЧНО: Мапу повідомлень для ${orderId} не знайдено в PropertiesService!`);
      updateTelegramMessage(callback.message.chat.id, callback.message.message_id, finalStatusTemplate);
    }
  } else {
    // Якщо замовлення не знайдено в таблиці
    finalStatusTemplate = `⚠️ Помилка: Замовлення #${escapeHtml(orderId)} не знайдено в таблиці.`;
    updateTelegramMessage(callback.message.chat.id, callback.message.message_id, finalStatusTemplate);
  }
  return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Відправка відповіді на Callback (прибирає "годинник" з кнопки)
 */
function answerCallbackQuery(callbackId) {
  const url = "https://api.telegram.org/bot" + BOT_TOKEN + "/answerCallbackQuery";
  const payload = { callback_query_id: callbackId };
  try {
    UrlFetchApp.fetch(url, { method: 'post', contentType: 'application/json', payload: JSON.stringify(payload), muteHttpExceptions: true });
  } catch (e) { Logger.log("Error answering callback: " + e); }
}

/**
 * Допоміжна функція для ручної перевірки всіх збережених ID повідомлень.
 * Виберіть її у списку функцій зверху і натисніть "Run".
 */
function debugCheckAllStoredOrders() {
  const props = PropertiesService.getScriptProperties().getProperties();
  Logger.log("=== СПИСОК ЗБЕРЕЖЕНИХ ДАНИХ (Properties) ===");
  let found = false;
  for (const key in props) {
    if (key.startsWith('msg_map_')) {
      Logger.log("Замовлення " + key.replace('msg_map_', '') + " -> " + props[key]);
      found = true;
    }
  }
  if (!found) Logger.log("Жодних активних мап повідомлень не знайдено.");
  Logger.log("===========================================");
}

function updateTelegramMessage(chatId, messageId, newText) {
  // ЗАХИСТ: Якщо текст порожній, Telegram видасть помилку 400
  if (!newText || String(newText).trim() === "") {
    Logger.log("Спроба оновити повідомлення порожнім текстом скасована.");
    return;
  }

  const url = `https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`;
  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ chat_id: chatId, message_id: messageId, text: newText, parse_mode: 'HTML' }),
    muteHttpExceptions: true // Дозволяє побачити помилку в логах без зупинки скрипта
  };
  
  const response = UrlFetchApp.fetch(url, options);
  const resObj = JSON.parse(response.getContentText());
  
  // Ігноруємо помилку, якщо повідомлення вже має такий самий текст (наприклад, одночасний клік двох адмінів)
  if (!resObj.ok && resObj.description && resObj.description.includes("message is not modified")) {
    Logger.log(`ℹ️ Чат ${chatId}: Повідомлення вже було оновлене.`);
    return true;
  }

  Logger.log(`Telegram Update Response for ${chatId}: ${response.getContentText()}`);
  return resObj.ok;
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

function formatTelegramMessage(orderId, name, email, phone, total, fullMessage, payment) {
  const safeName = escapeHtml(name);
  const safeMessage = escapeHtml(fullMessage);
  const safeEmail = escapeHtml(email);
  
  // 1. Очищуємо номер від усього, крім цифр
  let cleanPhone = String(phone).replace(/\D/g, '');

  // 2. Нормалізуємо для України: якщо починається з 0, додаємо 38
  if (cleanPhone.startsWith('0') && cleanPhone.length === 10) {
    cleanPhone = '38' + cleanPhone;
  }
  // Якщо починається з 80, додаємо 3
  if (cleanPhone.startsWith('80') && cleanPhone.length === 11) {
    cleanPhone = '3' + cleanPhone;
  }

  // Форматуємо дату
  const now = new Date();
  const dateStr = now.toLocaleString('uk-UA', { 
    timeZone: 'Europe/Kiev',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  return `
🔥 <b>НОВЕ ЗАМОВЛЕННЯ</b> 🔥       

📦 <b>Номер:</b> #${orderId}
👤 <b>Клієнт:</b> ${safeName}
📧 <b>Email:</b> ${safeEmail}
📱 <b>Телефон:</b> <code>+${cleanPhone}</code>
💳 <b>Оплата:</b> ${escapeHtml(payment)}

🔗 <b>ШВИДКИЙ ЗВ'ЯЗОК:</b>
• <a href="https://msng.link/vi/${cleanPhone}">Написати у Viber</a>
• <a href="https://wa.me/${cleanPhone}">Написати у WhatsApp</a>
• <a href="https://t.me/+${cleanPhone}">Спробувати Telegram</a>
• <a href="tel:+${cleanPhone}">📞 ЗАПАТЕЛЕФОНУВАТИ</a>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

<b>ПОВІДОМЛЕННЯ:</b>
${safeMessage}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💰 <b>СУМА ДО ОПЛАТИ: ${total} ₴</b>
⏰ ${dateStr}
`.trim();
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
        <h3 style="color: #ffffff; margin: 0 0 15px 0;">💳 Оплата на Конверт</h3>
        <div style="background-color: #fff; padding: 10px; display: inline-block; border-radius: 10px; margin-bottom: 20px;">
          <img src="https://gapkainferno.github.io/GHI.jpg" alt="QR код для оплати" width="150" height="150" style="display: block;">
        </div>
        <p style="color: #aaa; font-size: 14px; margin-bottom: 20px;">Відскануйте код камерою або натисніть кнопку:</p>
        <a href="https://www.privat24.ua/send/jkvgx" style="background-color: #ff4500; color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
          ОПЛАТИТИ В ОДИН КЛІК
        </a>
        <p style="color: #666; font-size: 12px; margin-top: 20px;">Номер картки Конверта: <br>
          <strong style="color: #ffffff; font-size: 15px; font-family: monospace;">5168752156802145</strong>
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
  } catch (e) {
    Logger.log("Error sending welcome email: " + e.toString());
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
