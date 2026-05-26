/**
 * ═══════════════════════════════════════════════════════════════
 * ERROR HANDLER MODULE - Centralized Error Management
 * ═══════════════════════════════════════════════════════════════
 * Централізована обробка помилок з логуванням та звітуванням
 * Використовується: всі модулі для консистентної обробки помилок
 */

class ErrorHandler {
  constructor() {
    this.errors = [];
    this.maxErrors = 100;  // Зберігаємо останні 100 помилок
  }

  /**
   * Основний метод обробки помилок
   * @param {Error|string} error - Помилка або текст
   * @param {string} context - Контекст де сталася помилка
   * @param {Object} metadata - Додаткові дані
   */
  async handle(error, context = 'Unknown', metadata = {}) {
    const errorData = this.normalizeError(error, context, metadata);
    
    // 1. Логування в консоль (розробка)
    this.logToConsole(errorData);
    
    // 2. Логування в сховище (для аналізу)
    this.storeError(errorData);
    
    // 3. Відправлення в аналітику (продакшн)
    if (window.location.hostname !== 'localhost') {
      this.reportToAnalytics(errorData);
    }
    
    // 4. Показування користувачу дружнього повідомлення
    this.showNotification(errorData);
    
    return errorData;
  }

  /**
   * Нормалізація помилки до стандартного формату
   */
  normalizeError(error, context, metadata) {
    const isString = typeof error === 'string';
    
    return {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      context,
      message: isString ? error : error?.message || 'Unknown error',
      code: error?.code || 'UNKNOWN',
      stack: isString ? '' : error?.stack || '',
      metadata,
      url: window.location.href,
      userAgent: navigator.userAgent
    };
  }

  /**
   * Логування в консоль з форматуванням
   */
  logToConsole(errorData) {
    const style = 'color: #e74c3c; font-weight: bold; font-size: 12px;';
    console.error(`%c[${errorData.context}]`, style, errorData.message);
    
    if (errorData.stack) {
      console.error(errorData.stack);
    }
    
    if (Object.keys(errorData.metadata).length > 0) {
      console.error('Metadata:', errorData.metadata);
    }
  }

  /**
   * Зберігання помилок локально для аналізу
   */
  storeError(errorData) {
    try {
      const stored = this.getStoredErrors();
      stored.push(errorData);
      
      // Зберігаємо тільки останні N помилок
      if (stored.length > this.maxErrors) {
        stored.shift();
      }
      
      localStorage.setItem('_app_errors', JSON.stringify(stored));
    } catch (e) {
      console.warn('Failed to store error:', e);
    }
  }

  /**
   * Отримання збережених помилок
   */
  getStoredErrors() {
    try {
      const data = localStorage.getItem('_app_errors');
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  /**
   * Вичищення збережених помилок
   */
  clearStoredErrors() {
    try {
      localStorage.removeItem('_app_errors');
    } catch (e) {
      console.warn('Failed to clear errors:', e);
    }
  }

  /**
   * Відправлення в аналітику (Firebase/GTM)
   */
  reportToAnalytics(errorData) {
    try {
      if (window.trackEvent) {
        window.trackEvent('error', {
          context: errorData.context,
          message: errorData.message.substring(0, 100),
          code: errorData.code,
          url: errorData.url
        });
      }
    } catch (err) {
      console.warn('⚠️ Analytics reporting failed:', err);
    }
  }

  /**
   * Показування користувачу дружнього повідомлення
   */
  showNotification(errorData) {
    const userMessage = this.getUserMessage(errorData);
    
    const notification = document.createElement('div');
    notification.className = 'error-notification';
    notification.setAttribute('role', 'alert');
    notification.setAttribute('aria-live', 'assertive');
    
    notification.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: #e74c3c;
        color: white;
        padding: 15px 20px;
        border-radius: 6px;
        z-index: 99999;
        max-width: 350px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        font-family: 'Roboto Slab', serif;
        font-size: 14px;
        line-height: 1.4;
      ">
        <div style="display: flex; justify-content: space-between; align-items: start; gap: 10px;">
          <div>
            <strong style="display: block; margin-bottom: 5px;">⚠️ Помилка</strong>
            <p style="margin: 0;">${userMessage}</p>
          </div>
          <button onclick="this.parentElement.parentElement.remove()" style="
            background: none;
            border: none;
            color: white;
            font-size: 20px;
            cursor: pointer;
            padding: 0;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
          ">×</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Автоматичне видалення через 5 секунд
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 5000);
  }

  /**
   * Конвертація технічної помилки в дружнє повідомлення
   */
  getUserMessage(errorData) {
    const msg = errorData.message.toLowerCase();
    
    // Спеціальні повідомлення для відомих помилок
    if (msg.includes('rate limit')) {
      return '⏱️ Занадто багато запитів. Будь ласка, зачекайте хвилину.';
    }
    if (msg.includes('xss') || msg.includes('injection')) {
      return '🔒 Виявлено небезпечне введення. Перевірте свої дані.';
    }
    if (msg.includes('firebase') || msg.includes('network')) {
      return '🌐 Помилка з\'єднання. Перевірте інтернет-з\'єднання.';
    }
    if (msg.includes('validation')) {
      return '✓ Будь ласка, перевірте введені дані.';
    }
    if (msg.includes('not found')) {
      return '🔍 Не вдалося знайти запитаний ресурс.';
    }
    if (msg.includes('permission') || msg.includes('unauthorized')) {
      return '🔐 У вас немає доступу до цього ресурсу.';
    }
    
    // Базова повідомлення
    return '😞 Щось пішло не так. Спробуйте ще раз або зв\'яжіться з підтримкою.';
  }

  /**
   * Створення безпечної помилки з кодом
   */
  createSafeError(message, code = 'UNKNOWN') {
    const error = new Error(message);
    error.code = code;
    error.timestamp = new Date().toISOString();
    return error;
  }

  /**
   * Обгортка для async функцій
   */
  async wrapAsync(fn, context) {
    try {
      return await fn();
    } catch (error) {
      this.handle(error, context);
      throw error;
    }
  }

  /**
   * Обгортка для синхронних функцій
   */
  wrapSync(fn, context) {
    try {
      return fn();
    } catch (error) {
      this.handle(error, context);
      throw error;
    }
  }

  /**
   * Генерація унікального ID для помилки
   */
  generateId() {
    return `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Отримання статистики помилок
   */
  getStatistics() {
    const errors = this.getStoredErrors();
    const contexts = {};
    const codes = {};
    
    errors.forEach(err => {
      contexts[err.context] = (contexts[err.context] || 0) + 1;
      codes[err.code] = (codes[err.code] || 0) + 1;
    });
    
    return {
      total: errors.length,
      byContext: contexts,
      byCode: codes,
      latest: errors.slice(-10)
    };
  }
}

// Створюємо глобальний інстанс
export const errorHandler = new ErrorHandler();

// Також експортуємо клас для тестування
export default ErrorHandler;

// Глобальна обробка необроблених помилок
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    errorHandler.handle(event.error, 'Uncaught Error', {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    errorHandler.handle(event.reason, 'Unhandled Promise Rejection', {
      promise: event.promise
    });
  });
}
