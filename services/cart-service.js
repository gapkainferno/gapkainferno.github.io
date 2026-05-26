/**
 * ═══════════════════════════════════════════════════════════════
 * CART SERVICE - Modular Shopping Cart Management
 * ═══════════════════════════════════════════════════════════════
 * Конкретизує всю логіку кошика в одному класі
 * Замінює розпорошену глобальну логіку з cart.js
 */

import { STORAGE_KEYS, RATE_LIMITS } from '/config/constants.js';

class CartService {
  constructor(storage = localStorage) {
    this.storage = storage;
    this.items = [];
    this.observers = [];
    this.lastModified = null;
    this.rateLimiter = {
      lastSubmit: 0,
      minInterval: RATE_LIMITS.submit.minInterval
    };
    
    this.load();
    console.log('🛒 CartService ініціалізовано');
  }

  /**
   * Додавання товару в кошик
   * @param {string} productId - ID товару
   * @param {Object} product - Об'єкт товару (ім'я, ціна, зображення)
   * @param {number} quantity - Кількість (за замовч. 1)
   * @returns {boolean} Успіх
   */
  add(productId, product, quantity = 1) {
    // Валідація
    if (!productId || !product) {
      console.warn('⚠️ Invalid product or productId');
      return false;
    }

    if (quantity < 1 || !Number.isInteger(quantity)) {
      console.warn('⚠️ Invalid quantity:', quantity);
      return false;
    }

    try {
      // Шукаємо існуючий товар
      const existingItem = this.items.find(item => item.productId === productId);

      if (existingItem) {
        // Збільшуємо кількість
        existingItem.quantity += quantity;
      } else {
        // Додаємо новий товар
        this.items.push({
          productId,
          name: product.name,
          price: Number(product.price),
          image: product.image,
          quantity,
          addedAt: new Date().toISOString()
        });
      }

      this.save();
      this.notifyObservers({ action: 'add', productId, quantity });
      console.log(`✅ Товар добавлен: ${productId} (кількість: ${quantity})`);
      return true;
    } catch (error) {
      console.error('❌ Error adding to cart:', error);
      return false;
    }
  }

  /**
   * Видалення товару з кошика
   * @param {string} productId - ID товару
   * @returns {boolean} Успіх
   */
  remove(productId) {
    try {
      const initialLength = this.items.length;
      this.items = this.items.filter(item => item.productId !== productId);

      if (this.items.length !== initialLength) {
        this.save();
        this.notifyObservers({ action: 'remove', productId });
        console.log(`✅ Товар видалено: ${productId}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Error removing from cart:', error);
      return false;
    }
  }

  /**
   * Оновлення кількості товару
   * @param {string} productId - ID товару
   * @param {number} quantity - Нова кількість
   * @returns {boolean} Успіх
   */
  updateQuantity(productId, quantity) {
    try {
      if (quantity < 0) {
        return this.remove(productId);
      }

      const item = this.items.find(item => item.productId === productId);
      if (!item) return false;

      item.quantity = quantity;
      this.save();
      this.notifyObservers({ action: 'update', productId, quantity });
      return true;
    } catch (error) {
      console.error('❌ Error updating cart:', error);
      return false;
    }
  }

  /**
   * Очищення кошика
   * @returns {boolean} Успіх
   */
  clear() {
    try {
      this.items = [];
      this.save();
      this.notifyObservers({ action: 'clear' });
      console.log('✅ Кошик очищено');
      return true;
    } catch (error) {
      console.error('❌ Error clearing cart:', error);
      return false;
    }
  }

  /**
   * Отримання всіх товарів в кошику
   * @returns {Array} Масив товарів
   */
  getItems() {
    return [...this.items];  // Return copy to prevent external mutations
  }

  /**
   * Отримання кількості товарів
   * @returns {number}
   */
  getItemCount() {
    return this.items.length;
  }

  /**
   * Отримання загальної кількості одиниць
   * @returns {number}
   */
  getTotalQuantity() {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  /**
   * Розрахунок загальної ціни
   * @returns {number} Сума в грн
   */
  getTotal() {
    return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  /**
   * Розрахунок суми без акцій
   * @returns {number} Базова сума
   */
  getBaseTotal() {
    return this.getTotal();
  }

  /**
   * Перевірка чи товар в кошику
   * @param {string} productId - ID товару
   * @returns {boolean}
   */
  contains(productId) {
    return this.items.some(item => item.productId === productId);
  }

  /**
   * Отримання товару з кошика
   * @param {string} productId - ID товару
   * @returns {Object|null}
   */
  getItem(productId) {
    return this.items.find(item => item.productId === productId) || null;
  }

  /**
   * Валідація кошика перед оформленням
   * @returns {Object} { valid: boolean, error?: string }
   */
  validate() {
    if (this.items.length === 0) {
      return { valid: false, error: 'Кошик порожній' };
    }

    // Перевіряємо що всі товари мають необхідні поля
    for (const item of this.items) {
      if (!item.productId || !item.price || !item.quantity) {
        return { valid: false, error: 'Невалідний товар в кошику' };
      }

      if (item.price < 0 || item.quantity < 1) {
        return { valid: false, error: 'Невалідна ціна або кількість' };
      }
    }

    return { valid: true };
  }

  /**
   * Перевірка можливості оформлення (rate limiting)
   * @returns {boolean}
   */
  canSubmitOrder() {
    const now = Date.now();
    if (now - this.rateLimiter.lastSubmit < this.rateLimiter.minInterval) {
      console.warn('⏱️ Rate limit: замовлення занадто часто');
      return false;
    }
    this.rateLimiter.lastSubmit = now;
    return true;
  }

  /**
   * Підготовка до відправлення замовлення
   * @returns {Object} Дані замовлення з валідацією
   */
  prepareOrder() {
    const validation = this.validate();
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    if (!this.canSubmitOrder()) {
      throw new Error('Забагато спроб. Зачекайте.');
    }

    return {
      items: this.getItems(),
      total: this.getTotal(),
      itemCount: this.getTotalQuantity(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Збереження кошика в localStorage
   */
  save() {
    try {
      const data = {
        items: this.items,
        savedAt: new Date().toISOString()
      };
      this.storage.setItem(STORAGE_KEYS.CART, JSON.stringify(data));
      this.lastModified = new Date();
      console.log('💾 Кошик збережено');
    } catch (error) {
      console.error('❌ Error saving cart:', error);
    }
  }

  /**
   * Завантаження кошика з localStorage
   */
  load() {
    try {
      const data = this.storage.getItem(STORAGE_KEYS.CART);
      if (data) {
        const parsed = JSON.parse(data);
        this.items = Array.isArray(parsed.items) ? parsed.items : [];
        console.log(`✅ Кошик завантажено (${this.items.length} товарів)`);
      } else {
        this.items = [];
      }
    } catch (error) {
      console.error('❌ Error loading cart:', error);
      this.items = [];
    }
  }

  /**
   * Експорт кошика для обробки
   * @returns {Object}
   */
  export() {
    return {
      items: this.getItems(),
      total: this.getTotal(),
      itemCount: this.getTotalQuantity(),
      exportedAt: new Date().toISOString()
    };
  }

  /**
   * Імпорт кошика з зовнішніх даних
   * @param {Object} data - Дані кошика
   * @returns {boolean} Успіх
   */
  import(data) {
    try {
      if (!Array.isArray(data.items)) {
        throw new Error('Invalid data format');
      }

      this.items = data.items;
      this.save();
      this.notifyObservers({ action: 'import' });
      return true;
    } catch (error) {
      console.error('❌ Error importing cart:', error);
      return false;
    }
  }

  /**
   * Підписування на зміни кошика
   * @param {Function} callback
   */
  subscribe(callback) {
    if (typeof callback === 'function') {
      this.observers.push(callback);
    }
  }

  /**
   * Скасування підписки
   * @param {Function} callback
   */
  unsubscribe(callback) {
    const index = this.observers.indexOf(callback);
    if (index > -1) {
      this.observers.splice(index, 1);
    }
  }

  /**
   * Нотифікація спостерігачів про зміни
   */
  notifyObservers(data) {
    this.observers.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('❌ Error in cart observer:', error);
      }
    });
  }

  /**
   * Отримання статистики
   */
  getStatistics() {
    return {
      itemCount: this.getItemCount(),
      totalQuantity: this.getTotalQuantity(),
      total: this.getTotal(),
      averagePrice: this.getItemCount() > 0 ? this.getTotal() / this.getItemCount() : 0,
      lastModified: this.lastModified
    };
  }
}

// Створюємо глобальний інстанс
export const cartService = new CartService();

export default CartService;
