/**
 * ═══════════════════════════════════════════════════════════════
 * THEME MANAGER - Consolidated Theme Logic
 * ═══════════════════════════════════════════════════════════════
 * Єдине джерело правди для всієї логіки тем
 * Поєднує логіку з: theme-switcher.js, product-page.js, catalog.js
 * Усунення 300+ LOC дублювання
 */

class ThemeManager {
  constructor() {
    // Визначення доступних тем
    this.THEMES = {
      seeds: 'seeds-page',
      sauces: 'sauces-page',
      otherseeds: 'otherseeds-page',
      'fresh-peppers': 'fresh-peppers-page',
      poultry: 'poultry-page'
    };

    // URL фрагменти що включають назви тем
    this.URL_MAP = {
      'seedsandseedlings': 'seeds',
      'sauces': 'sauces',
      'otherseeds': 'otherseeds',
      'superhots': 'seeds',
      'fresh-peppers': 'fresh-peppers',
      'poultry': 'poultry'
    };

    this.currentTheme = null;
    this.observers = [];

    console.log('🎨 ThemeManager ініціалізовано');
  }

  /**
   * Застосування теми з нотифікацією спостерігачів
   * @param {string} key - Ключ теми (e.g., 'seeds', 'sauces')
   * @returns {boolean} Успіх
   */
  apply(key) {
    if (!this.THEMES[key]) {
      console.warn(`⚠️ Невідома тема: ${key}`);
      return false;
    }

    // Якщо тема вже застосована - не повторюємо
    if (this.currentTheme === key) {
      return true;
    }

    try {
      // Видаляємо старі теми
      Object.values(this.THEMES).forEach(cls => {
        document.body.classList.remove(cls);
      });

      // Додаємо нову тему
      const themeClass = this.THEMES[key];
      document.body.classList.add(themeClass);
      this.currentTheme = key;

      // Зберігаємо налаштування
      sessionStorage.setItem('hs_theme', key);

      // Нотифікуємо спостерігачів
      this.notifyObservers({
        action: 'changed',
        theme: key,
        themeClass: themeClass
      });

      console.log(`✅ Тема застосована: ${key}`);
      return true;
    } catch (error) {
      console.error(`❌ Помилка при застосуванні теми ${key}:`, error);
      return false;
    }
  }

  /**
   * Отримання теми з URL
   * Пріоритет: 
   * 1. ID товару (якщо на сторінці товару)
   * 2. URL фрагменти
   * @returns {string|null} Ключ теми або null
   */
  getFromUrl() {
    const url = window.location.href.toLowerCase();
    const params = new URLSearchParams(window.location.search);

    // 1. Перевіряємо ID товару (найвищий пріоритет)
    const productId = params.get('id');
    if (productId && typeof allProducts !== 'undefined' && allProducts[productId]) {
      const product = allProducts[productId];
      const category = product.category || product.rawCategory;
      
      if (category && this.THEMES[category]) {
        console.log(`🔍 Тема з товару: ${productId} -> ${category}`);
        return category;
      }
    }

    // 2. Перевіряємо URL на наявність ключових слів
    for (const [fragment, key] of Object.entries(this.URL_MAP)) {
      if (url.includes(fragment)) {
        console.log(`🔍 Тема з URL: ${fragment} -> ${key}`);
        return key;
      }
    }

    return null;
  }

  /**
   * Отримання збереженої залежності користувача
   * @returns {string|null}
   */
  getSavedPreference() {
    const saved = sessionStorage.getItem('hs_theme');
    if (saved && this.THEMES[saved]) {
      console.log(`💾 Збережена тема: ${saved}`);
      return saved;
    }
    return null;
  }

  /**
   * Отримання теми з об'єкту товару
   * Використовується на сторінці деталей товару
   * @param {Object} product - Об'єкт товару
   * @returns {string|null}
   */
  getFromProduct(product) {
    if (!product) return null;

    const category = product.category || product.rawCategory;
    if (category && this.THEMES[category]) {
      console.log(`📦 Тема з товару: ${category}`);
      return category;
    }

    return null;
  }

  /**
   * Автоматичне визначення та застосування теми
   * Пріоритет: URL (товар) > Збережена залежність > За замовчуванням (seeds)
   * Це основна функція ініціалізації
   */
  autoApply() {
    // 1. Спочатку пробуємо отримати з URL
    let themeKey = this.getFromUrl();

    // 2. Потім зі збереженої залежності
    if (!themeKey) {
      themeKey = this.getSavedPreference();
    }

    // 3. За замовчуванням - seeds
    themeKey = themeKey || 'seeds';

    // Застосовуємо тему
    this.apply(themeKey);
  }

  /**
   * Отримання поточної теми
   * @returns {string|null}
   */
  getCurrent() {
    return this.currentTheme;
  }

  /**
   * Отримання CSS класу поточної теми
   * @returns {string|null}
   */
  getCurrentClass() {
    if (!this.currentTheme) return null;
    return this.THEMES[this.currentTheme];
  }

  /**
   * Підписування на зміни теми
   * @param {Function} callback - Функція зворотного дзвінка
   */
  subscribe(callback) {
    if (typeof callback !== 'function') {
      console.warn('⚠️ Callback має бути функцією');
      return;
    }

    this.observers.push(callback);
    console.log(`📡 Спостерігач зареєстрований (всього: ${this.observers.length})`);
  }

  /**
   * Скасування підписки на зміни теми
   * @param {Function} callback - Функція для видалення
   */
  unsubscribe(callback) {
    const index = this.observers.indexOf(callback);
    if (index > -1) {
      this.observers.splice(index, 1);
      console.log(`📡 Спостерігач видалений (залишилось: ${this.observers.length})`);
    }
  }

  /**
   * Внутрішня нотифікація спостерігачів
   */
  notifyObservers(data) {
    this.observers.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('❌ Помилка в спостерігачі теми:', error);
      }
    });
  }

  /**
   * Отримання списку всіх доступних тем
   * @returns {Object} Карта тем
   */
  getAvailableThemes() {
    return { ...this.THEMES };
  }

  /**
   * Очищення та скидання до дефолту
   */
  reset() {
    sessionStorage.removeItem('hs_theme');
    this.currentTheme = null;
    Object.values(this.THEMES).forEach(cls => {
      document.body.classList.remove(cls);
    });
    console.log('🔄 ThemeManager скидано до дефолту');
  }
}

// Створюємо глобальний інстанс
export const themeManager = new ThemeManager();

// Автоматична ініціалізація при завантаженні DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    themeManager.autoApply();
  });
} else {
  themeManager.autoApply();
}

export default ThemeManager;
