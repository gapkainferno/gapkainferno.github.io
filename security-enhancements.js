/**
 * ═══════════════════════════════════════════════════════════════
 * SECURITY ENHANCEMENTS MODULE v2.0
 * ═══════════════════════════════════════════════════════════════
 * Простіший формат - всі модулі визначені як window.МОДУЛЬ
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 1️⃣ RATE LIMITING
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
window.RateLimiter = (() => {
    const requests = new Map();
    const limits = {
        checkout: { max: 3, windowMs: 60000 },
        addToCart: { max: 30, windowMs: 10000 },
        search: { max: 30, windowMs: 60000 }
    };

    return {
        check(action) {
            if (!requests.has(action)) {
                requests.set(action, []);
            }
            const timestamps = requests.get(action);
            const now = Date.now();
            const limit = limits[action];
            if (!limit) return true;
            
            const validTimestamps = timestamps.filter(ts => now - ts < limit.windowMs);
            if (validTimestamps.length >= limit.max) {
                console.warn(`⚠️ Rate limit exceeded for: ${action}`);
                return false;
            }
            
            validTimestamps.push(now);
            requests.set(action, validTimestamps);
            return true;
        },
        
        reset(action) {
            if (requests.has(action)) {
                requests.delete(action);
            }
        }
    };
})();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 2️⃣ SECURE STORAGE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 2️⃣ CLIENT STORAGE NOTE
// Browser storage is not encrypted by this site. Do not store passwords,
// payment credentials, or sensitive personal data in localStorage.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
window.SecurityMonitor = (() => {
    const logs = [];
    
    window.addEventListener('error', (e) => {
        logs.push({
            type: 'error',
            message: e.message,
            timestamp: new Date().toISOString()
        });
    });

    return {
        log(action, details = {}) {
            logs.push({
                action,
                details,
                timestamp: new Date().toISOString()
            });
        },
        
        getLogs() {
            return logs.slice(-50);
        }
    };
})();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ИНИЦИАЛИЗАЦИЯ
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
console.log('✅ Security modules initialized');
console.log('Available: window.RateLimiter, window.SecurityMonitor');
