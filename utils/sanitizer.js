/**
 * ═══════════════════════════════════════════════════════════════
 * HTML SANITIZATION MODULE - XSS Protection
 * ═══════════════════════════════════════════════════════════════
 * Запобігає XSS атакам через санітізацію HTML
 * Використовується: catalog.js, search.js, product-page.js, modal-init.js
 */

export const sanitize = {
  /**
   * Безпечний текстовий контент (видаляє ВСІ HTML теги)
   * Використовується для: назв товарів, описів без форматування
   * @param {string} input - Вихідний текст
   * @returns {string} Екранований текст
   */
  text(input) {
    if (!input) return '';
    
    // textContent автоматично екранує HTML спецсимволи
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;  // Тепер це безпечний HTML
  },

  /**
   * Санітизований HTML (дозволяє тільки безпечні теги)
   * Використовується для: описів з форматуванням (b, i, посилання)
   * @param {string} input - Вихідний HTML
   * @returns {string} Очищений HTML
   */
  html(input) {
    if (!input) return '';
    
    // Перевіряємо наявність DOMPurify (має бути підключено в HTML)
    if (typeof DOMPurify === 'undefined') {
      console.warn('⚠️ DOMPurify не знайдено. Використовуємо strict mode.');
      return this.strict(input);
    }

    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br', 'p', 'a', 'ul', 'ol', 'li', 'blockquote'],
      ALLOWED_ATTR: ['href', 'title', 'target', 'rel'],
      KEEP_CONTENT: true
    });
  },

  /**
   * Суворо: без HTML вообще (видаляє навіть безпечні теги)
   * Використовується для: користувацького введення, email, імен
   * @param {string} input - Вихідний текст
   * @returns {string} Текст без HTML
   */
  strict(input) {
    if (!input) return '';
    
    const div = document.createElement('div');
    div.innerHTML = input;
    return div.textContent || div.innerText || '';
  },

  /**
   * Санітизація URL (запобігає javascript: протоколу)
   * Використовується для: href атрибутів
   * @param {string} input - Вихідний URL
   * @returns {string} Валідний URL або порожній рядок
   */
  url(input) {
    if (!input) return '';
    
    try {
      const url = new URL(input, window.location.href);
      
      // Дозволяємо тільки безпечні протоколи
      const allowedProtocols = ['http:', 'https:', 'mailto:', 'tel:', 'ftp:'];
      if (!allowedProtocols.includes(url.protocol)) {
        console.warn(`⚠️ Небезпечний протокол: ${url.protocol}`);
        return '';
      }
      
      return url.href;
    } catch (error) {
      console.warn('⚠️ Невалідний URL:', input);
      return '';
    }
  },

  /**
   * Санітизація атрибутів класу (запобігає код-інжекції)
   * Використовується для: className, data-* атрибутів
   * @param {string} input - Вихідна строка
   * @returns {string} Санітизована строка
   */
  className(input) {
    if (!input) return '';
    
    // Дозволяємо тільки букви, цифри, дефіси та підкреслення
    return input.replace(/[^a-zA-Z0-9\s_-]/g, '');
  },

  /**
   * Санітизація JSON (безпечне парсування)
   * Використовується для: localStorage, API responses
   * @param {string} jsonString - JSON строка
   * @returns {Object|null} Распарсений об'єкт або null
   */
  json(jsonString) {
    try {
      if (!jsonString || typeof jsonString !== 'string') {
        return null;
      }
      
      const parsed = JSON.parse(jsonString);
      
      // Базова валідація - не допускаємо функції
      if (typeof parsed === 'function') {
        console.warn('⚠️ JSON містить функцію - потенційна XSS атака');
        return null;
      }
      
      return parsed;
    } catch (error) {
      console.warn('⚠️ Невалідний JSON:', error.message);
      return null;
    }
  },

  /**
   * Безпечне створення DOM елемента з текстом
   * @param {string} tagName - Назва тегу
   * @param {string} text - Текстовий контент
   * @param {Object} attributes - Атрибути
   * @returns {HTMLElement} Новий елемент
   */
  createElement(tagName, text = '', attributes = {}) {
    const el = document.createElement(tagName);
    
    // Текст завжди безпечний
    if (text) {
      el.textContent = text;
    }
    
    // Безпечне встановлення атрибутів
    Object.entries(attributes).forEach(([key, value]) => {
      if (key === 'href' || key === 'src') {
        el.setAttribute(key, this.url(value));
      } else if (key === 'class') {
        el.setAttribute(key, this.className(value));
      } else {
        el.setAttribute(key, String(value));
      }
    });
    
    return el;
  }
};

/**
 * Альтернативна гроза: якщо DOMPurify недоступен, це безпечне резервне рішення
 */
export const SafeHTML = {
  /**
   * Метод fallback для HTML що не потребує спеціальних тегів
   */
  escape(html) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return html.replace(/[&<>"']/g, m => map[m]);
  },

  /**
   * Безпечно додає HTML в контейнер
   */
  setHTML(element, html) {
    if (typeof DOMPurify !== 'undefined') {
      element.innerHTML = DOMPurify.sanitize(html);
    } else {
      element.textContent = this.escape(html);
    }
  }
};

export default sanitize;
