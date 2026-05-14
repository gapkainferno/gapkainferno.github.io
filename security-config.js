// ════════════════════════════════════════════════════════════════
// SECURITY CONFIGURATION
// API Keys should be moved to environment variables
// THIS FILE IS FOR DOCUMENTATION ONLY
// ════════════════════════════════════════════════════════════════

/**
 * ⚠️ CRITICAL: API Keys Management
 * 
 * DO NOT commit API keys to Git!
 * 
 * Instead, use environment variables:
 * 1. Create .env file (add to .gitignore)
 * 2. Use build tool or server-side proxy
 * 3. Load keys from secure configuration service
 */

// СТАРИЙ НЕБЕЗПЕЧНИЙ ПІДХІД (НЕ ВИКОРИСТОВУВАТИ):
// const BOT_TOKEN = '8532849974:AAG-JfB6E6_XfNggptnpygCrr0JqutvRhgA'; // ❌ EXPOSED!
// const GOOGLE_SCRIPT = 'https://script.google.com/macros/s/AKfycbyM4hOH...'; // ❌ VISIBLE!

/**
 * ПРАВИЛЬНИЙ ПІДХІД 1: Server-side Proxy
 */
const API_CONFIG = {
    // Всі запити йдуть на ваш сервер, а не безпосередньо до третьої сторони
    BASE_URL: '/api',
    
    // Endpoints вашого сервера
    ENDPOINTS: {
        SUBMIT_ORDER: '/api/orders/submit',      // Замість прямого запиту до Google Apps
        GET_NP_CITIES: '/api/novaposhta/cities',  // Замість прямого запиту до Nova Poshta
        SEND_EMAIL: '/api/email/send',            // Замість прямого Gmail запиту
        TELEGRAM_NOTIFY: '/api/telegram/notify'   // Замість прямого Telegram запиту
    },
    
    // Таймаути та retry
    TIMEOUT: 10000,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000
};

/**
 * ПРАВИЛЬНИЙ ПІДХІД 2: Environment Variables
 */
// В Node.js / Deno:
// const API_KEYS = {
//     TELEGRAM_BOT: process.env.TELEGRAM_BOT_TOKEN,
//     GOOGLE_SCRIPT: process.env.GOOGLE_APPS_SCRIPT_URL,
//     NOVA_POSHTA_KEY: process.env.NOVA_POSHTA_API_KEY
// };

/**
 * ПРАВИЛЬНИЙ ПІДХІД 3: .env файл (локально)
 */
// Файл: .env (НІКОЛИ НЕ ПУБЛІКУВАТИ В GIT!)
// ------------------------------------------
// VITE_API_URL=https://your-domain.com/api
// VITE_TELEGRAM_BOT_TOKEN=xxx
// VITE_GOOGLE_SCRIPT_URL=xxx
// .gitignore містить: .env, .env.local
// ------------------------------------------

/**
 * БЕЗПЕЧНИЙ API REQUEST КЛІЄНТ
 */
class SecureAPI {
    constructor(baseURL = API_CONFIG.BASE_URL) {
        this.baseURL = baseURL;
        this.timeout = API_CONFIG.TIMEOUT;
    }
    
    /**
     * Безпечна відправка даних
     * @param {string} endpoint - Endpoint на вашому сервері
     * @param {object} data - Дані для відправки
     * @param {object} options - Додаткові опції
     */
    async post(endpoint, data, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            ...options.headers
        };
        
        // Додаємо CSRF token якщо доступно
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
        if (csrfToken) {
            headers['X-CSRF-Token'] = csrfToken;
        }
        
        try {
            const response = await Promise.race([
                fetch(url, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(data),
                    credentials: 'same-origin', // Для cookies
                    ...options
                }),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Request timeout')), this.timeout)
                )
            ]);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('❌ API Error:', error);
            throw error;
        }
    }
    
    /**
     * Безпечна відправка файлів
     */
    async postFile(endpoint, formData, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const headers = {
            'X-Requested-With': 'XMLHttpRequest',
            ...options.headers
        };
        
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
        if (csrfToken) {
            headers['X-CSRF-Token'] = csrfToken;
        }
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: formData,
                credentials: 'same-origin',
                ...options
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('❌ Upload Error:', error);
            throw error;
        }
    }
}

/**
 * RATE LIMITING
 * Імплементація знаходиться в security-enhancements.js
 * window.RateLimiter ініціалізується там з методом check()
 */

/**
 * INPUT VALIDATION & SANITIZATION
 */
class InputValidator {
    /**
     * Валідує email
     */
    static validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email) && email.length <= 254;
    }
    
    /**
     * Валідує телефон
     */
    static validatePhone(phone) {
        const cleaned = phone.replace(/\D/g, '');
        return cleaned.length >= 10 && cleaned.length <= 15;
    }
    
    /**
     * Видаляє HTML теги та спеціальні символи
     */
    static sanitize(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    /**
     * Валідує це безпечна URL
     */
    static isSafeURL(url) {
        try {
            const parsed = new URL(url);
            return ['http:', 'https:'].includes(parsed.protocol);
        } catch {
            return false;
        }
    }
}

/**
 * ПОТОЧНА ІНТЕГРАЦІЯ (For Backward Compatibility)
 * Використовуйте SecureAPI замість прямих fetch запитів
 */
const secureAPI = new SecureAPI();
// const rateLimiter - ініціалізується в security-enhancements.js

// Експортуємо для використання
window.SecureAPI = SecureAPI;
window.secureAPI = secureAPI;
window.InputValidator = InputValidator;
window.API_CONFIG = API_CONFIG;
// window.RateLimiter ініціалізується в security-enhancements.js