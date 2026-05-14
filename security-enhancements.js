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
        addToCart: { max: 10, windowMs: 10000 },
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
window.SecureStorage = (() => {
    const encryptSimple = (str, key = 'gapka-secure-2024') => {
        let encrypted = '';
        for (let i = 0; i < str.length; i++) {
            encrypted += String.fromCharCode(str.charCodeAt(i) ^ key.charCodeAt(i % key.length));
        }
        return btoa(encrypted);
    };

    const decryptSimple = (encoded, key = 'gapka-secure-2024') => {
        try {
            const encrypted = atob(encoded);
            let decrypted = '';
            for (let i = 0; i < encrypted.length; i++) {
                decrypted += String.fromCharCode(encrypted.charCodeAt(i) ^ key.charCodeAt(i % key.length));
            }
            return decrypted;
        } catch (e) {
            return null;
        }
    };

    return {
        set(key, value) {
            try {
                const encrypted = encryptSimple(JSON.stringify(value));
                localStorage.setItem(`secure_${key}`, encrypted);
            } catch (e) {
                console.error('Storage write failed:', e);
            }
        },
        
        get(key) {
            try {
                const encrypted = localStorage.getItem(`secure_${key}`);
                if (!encrypted) return null;
                const decrypted = decryptSimple(encrypted);
                return decrypted ? JSON.parse(decrypted) : null;
            } catch (e) {
                return null;
            }
        },
        
        remove(key) {
            localStorage.removeItem(`secure_${key}`);
        }
    };
})();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 3️⃣ SECURITY MONITOR
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
console.log('Available: window.RateLimiter, window.SecureStorage, window.SecurityMonitor');
