/**
 * ═══════════════════════════════════════════════════════════════
 * INITIALIZATION MODULE - Load All Services & Modules
 * ═══════════════════════════════════════════════════════════════
 * Точка входу для ініціалізації всіх сервісів і модулів
 * Забезпечує правильний порядок завантаження залежностей
 * 
 * ВИКОРИСТАННЯ: <script type="module" src="modules/init.js"></script>
 */

import { FIREBASE_CONFIG } from '/config/firebase-config.js';
import { CONFIG } from '/config/constants.js';
import { sanitize } from '/utils/sanitizer.js';
import { errorHandler } from '/utils/error-handler.js';
import { themeManager } from '/modules/theme-manager.js';
import { cartService } from '/services/cart-service.js';

console.log('═══════════════════════════════════════════════════════════════');
console.log('🚀 GAPKA HOMESTEAD INFERNO - INITIALIZATION');
console.log('═══════════════════════════════════════════════════════════════');

// ─────────────────────────────────────────────────────────────────
// 1. ГЛОБАЛЬНА ЕКСПОРТАЦІЯ ОСНОВНИХ СЕРВІСІВ
// ─────────────────────────────────────────────────────────────────

window.app = {
  config: CONFIG,
  sanitize: sanitize,
  errorHandler: errorHandler,
  themeManager: themeManager,
  cartService: cartService,
  version: '1.0.0',
  buildDate: new Date().toISOString()
};

console.log('✅ Core services exported to window.app');

// ─────────────────────────────────────────────────────────────────
// 2. НАЛАШТУВАННЯ ГЛОБАЛЬНОГО ОБРОБНИКА ПОМИЛОК
// ─────────────────────────────────────────────────────────────────

window.addEventListener('error', (event) => {
  errorHandler.handle(event.error, 'Uncaught Error', {
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno
  });
});

window.addEventListener('unhandledrejection', (event) => {
  errorHandler.handle(event.reason, 'Unhandled Promise Rejection');
});

console.log('✅ Global error handlers configured');

// ─────────────────────────────────────────────────────────────────
// 3. ІНІЦІАЛІЗАЦІЯ ТЕМИ
// ─────────────────────────────────────────────────────────────────

// Очікуємо завантаження DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    themeManager.autoApply();
    console.log('✅ Theme manager initialized');
  });
} else {
  themeManager.autoApply();
  console.log('✅ Theme manager initialized');
}

// ─────────────────────────────────────────────────────────────────
// 4. ЗАВАНТАЖЕННЯ КОШИКА
// ─────────────────────────────────────────────────────────────────

cartService.load();
console.log(`✅ Cart service loaded (${cartService.getItemCount()} items)`);

// ─────────────────────────────────────────────────────────────────
// 5. ЗАЛИШКОВІ ГЛОБАЛЬНІ ФУНКЦІЇ (для зворотної сумісності)
// ─────────────────────────────────────────────────────────────────

/**
 * Безпечне додавання товару в кошик
 * Пропонується: Використовувати cartService.add() замість цього
 */
window.addToCartSafe = (productId, product, quantity = 1) => {
  try {
    if (cartService.add(productId, product, quantity)) {
      window.app.errorHandler.showNotification({
        message: '✅ Товар добавлен в кошик'
      });
      return true;
    }
  } catch (error) {
    window.app.errorHandler.handle(error, 'addToCartSafe');
  }
  return false;
};

/**
 * Показування помилки користувачу
 */
window.showError = (message) => {
  const error = new Error(message);
  window.app.errorHandler.handle(error, 'User Error');
};

/**
 * Показування успіху
 */
window.showSuccess = (message) => {
  console.log('✅', message);
  // TODO: Додати toast нотифікацію
};

console.log('✅ Legacy global functions loaded');

// ─────────────────────────────────────────────────────────────────
// 6. ДІАГНОСТИКА (тільки в розробці)
// ─────────────────────────────────────────────────────────────────

if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  window.app.debug = {
    // Отримати статистику помилок
    getErrors: () => {
      const errors = errorHandler.getStoredErrors();
      console.table(errors);
      return errors;
    },
    // Отримати статистику кошика
    getCartStats: () => {
      const stats = cartService.getStatistics();
      console.table(stats);
      return stats;
    },
    // Отримати поточну тему
    getTheme: () => themeManager.getCurrent(),
    // Очистити помилки
    clearErrors: () => errorHandler.clearStoredErrors(),
    // Очистити кошик
    clearCart: () => cartService.clear()
  };
  
  console.log('🔧 Debug tools available as window.app.debug.*');
}

// ─────────────────────────────────────────────────────────────────
// 7. ЛОГУВАННЯ ІНІЦІАЛІЗАЦІЇ
// ─────────────────────────────────────────────────────────────════

console.log('═══════════════════════════════════════════════════════════════');
console.log('✅ INITIALIZATION COMPLETE');
console.log('═══════════════════════════════════════════════════════════════');
console.log(`📦 Loaded modules: themeManager, cartService, errorHandler`);
console.log(`🔧 Available as: window.app`);
console.log(`📝 Version: ${window.app.version}`);
console.log('═══════════════════════════════════════════════════════════════');

// Експортуємо для ES модулів
export { themeManager, cartService, errorHandler, CONFIG };
