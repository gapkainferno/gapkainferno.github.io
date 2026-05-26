/**
 * ═══════════════════════════════════════════════════════════════
 * FIREBASE CONFIGURATION - Single Source of Truth
 * ═══════════════════════════════════════════════════════════════
 * Централізована конфігурація Firebase для всіх модулів
 * Використовується: analytics.js, blog-article-app.js, та інші сервіси
 */

export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBoScvps08gY0fGPNNi-Ms_6J3uCRoh_6U",
  authDomain: "gapkas-homestead-inferno.firebaseapp.com",
  databaseURL: "https://gapkas-homestead-inferno-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "gapkas-homestead-inferno",
  storageBucket: "gapkas-homestead-inferno.firebasestorage.app",
  messagingSenderId: "598710636413",
  appId: "1:598710636413:web:b8edf854d8e8ba2a274614",
  measurementId: "G-9CL9XT7H4D"
};

/**
 * Безпечна ініціалізація Firebase
 * Обробляє дублювання та помилки ініціалізації
 */
export async function initializeFirebaseApp() {
  try {
    // Перевіряємо, чи Firebase вже ініціалізовано
    if (window.firebase && window.firebase.apps.length > 0) {
      console.log('✅ Firebase вже ініціалізовано');
      return window.firebase.app();
    }

    // Динамічний імпорт Firebase (якщо потрібно)
    if (typeof initializeApp !== 'undefined') {
      const app = initializeApp(FIREBASE_CONFIG);
      console.log('✅ Firebase app ініціалізовано успішно');
      return app;
    }

    throw new Error('initializeApp function not available');
  } catch (error) {
    // Обробка дублювання (app вже ініціалізовано)
    if (error.code === 'app/duplicate-app') {
      console.warn('⚠️ Firebase app вже ініціалізовано, використовуємо існуючий');
      return window.firebase?.app();
    }
    
    console.error('❌ Firebase ініціалізація не вдалася:', error);
    throw error;
  }
}

/**
 * Глобальна точка доступу до конфігурації
 */
export default FIREBASE_CONFIG;
