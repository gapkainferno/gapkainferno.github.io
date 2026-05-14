/**
 * ═══════════════════════════════════════════════════════════════
 * PERFORMANCE OPTIMIZATION MODULE
 * ═══════════════════════════════════════════════════════════════
 * 
 * Оптимізація завантаження, кешування, та покращення Web Vitals
 * - Lazy loading для зображень
 * - Кешування на клієнті
 * - Debouncing для подій
 * - Оптимізація DOM операцій
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 1️⃣ УТИЛІТИ ДЛЯ ОПТИМІЗАЦІЇ АСИНХРОННИХ ОПЕРАЦІЙ
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const OptimizationUtils = (() => {
    // Debounce для event listenersів
    const debounce = (func, wait = 300) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    };

    // Throttle для частих подій
    const throttle = (func, limit = 100) => {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    };

    // Request Animation Frame helper
    const onNextFrame = (callback) => {
        return requestAnimationFrame(callback);
    };

    return { debounce, throttle, onNextFrame };
})();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 2️⃣ IMAGE LAZY LOADING З INTERSECTION OBSERVER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const LazyImageLoader = (() => {
    let observer = null;

    const init = () => {
        if ('IntersectionObserver' in window && !observer) {
            const options = {
                root: null,
                rootMargin: '50px',
                threshold: 0.01
            };

            observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        
                        // Завантажуємо зображення
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.dataset.src = '';
                        }
                        
                        if (img.dataset.srcset) {
                            img.srcset = img.dataset.srcset;
                            img.dataset.srcset = '';
                        }
                        
                        img.classList.add('image-loaded');
                        observer.unobserve(img);
                    }
                });
            }, options);

            // Спостерігаємо за всіма лінивими зображеннями
            document.querySelectorAll('img[loading="lazy"]').forEach(img => {
                observer.observe(img);
            });
        }
    };

    return {
        init,
        observe(element) {
            if (observer && element) {
                observer.observe(element);
            }
        }
    };
})();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 3️⃣ КЛІЄНТСЬКЕ КЕШУВАННЯ
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const CacheManager = (() => {
    const DEFAULT_TTL = 3600000; // 1 година в мілісекундах
    const cache = new Map();

    return {
        set(key, value, ttl = DEFAULT_TTL) {
            const expiresAt = Date.now() + ttl;
            cache.set(key, { value, expiresAt });
        },

        get(key) {
            const item = cache.get(key);
            
            if (!item) return null;
            
            if (Date.now() > item.expiresAt) {
                cache.delete(key);
                return null;
            }
            
            return item.value;
        },

        has(key) {
            return this.get(key) !== null;
        },

        delete(key) {
            cache.delete(key);
        },

        clear() {
            cache.clear();
        },

        // Функціональний кеш для результатів функцій
        memoize(func, ttl = DEFAULT_TTL) {
            return function(...args) {
                const key = func.name + JSON.stringify(args);
                const cached = CacheManager.get(key);
                
                if (cached !== null) {
                    return cached;
                }
                
                const result = func.apply(this, args);
                CacheManager.set(key, result, ttl);
                return result;
            };
        }
    };
})();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 4️⃣ ПАКЕТНІ DOM ОНОВЛЕННЯ
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const BatchDOMUpdater = (() => {
    let scheduled = false;
    const updates = [];

    const flush = () => {
        if (updates.length === 0) {
            scheduled = false;
            return;
        }

        // Виконуємо всі оновлення в одному батчі
        requestAnimationFrame(() => {
            updates.forEach(update => update());
            updates.length = 0;
            scheduled = false;
        });
    };

    return {
        schedule(update) {
            updates.push(update);
            
            if (!scheduled) {
                scheduled = true;
                flush();
            }
        },

        flush
    };
})();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 5️⃣ МОНІТОРИНГ ВЕБ МЕТРИК
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const WebVitalsMonitor = (() => {
    const metrics = {
        fcp: null,  // First Contentful Paint
        lcp: null,  // Largest Contentful Paint
        cls: null,  // Cumulative Layout Shift
        fid: null   // First Input Delay
    };

    const init = () => {
        // Ловимо Largest Contentful Paint
        if ('PerformanceObserver' in window) {
            try {
                const observer = new PerformanceObserver((entryList) => {
                    const entries = entryList.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    metrics.lcp = lastEntry.renderTime || lastEntry.loadTime;
                });
                
                observer.observe({ entryTypes: ['largest-contentful-paint'] });
            } catch (e) {
                console.debug('LCP observer not supported');
            }

            // Ловимо First Input Delay
            try {
                const observer = new PerformanceObserver((entryList) => {
                    const entries = entryList.getEntries();
                    entries.forEach(entry => {
                        metrics.fid = entry.processingDuration;
                    });
                });
                
                observer.observe({ entryTypes: ['first-input'] });
            } catch (e) {
                console.debug('FID observer not supported');
            }
        }

        // Ловимо Cumulative Layout Shift
        if ('LayoutShift' in window) {
            let cls = 0;
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (!entry.hadRecentInput) {
                        cls += entry.value;
                    }
                }
                metrics.cls = cls;
            });

            try {
                observer.observe({ entryTypes: ['layout-shift'] });
            } catch (e) {
                console.debug('CLS observer not supported');
            }
        }
    };

    return {
        init,
        getMetrics() {
            return { ...metrics };
        },
        log() {
            console.group('📊 Web Vitals');
            console.log('LCP (Largest Contentful Paint):', metrics.lcp, 'ms');
            console.log('FID (First Input Delay):', metrics.fid, 'ms');
            console.log('CLS (Cumulative Layout Shift):', metrics.cls);
            console.groupEnd();
        }
    };
})();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 6️⃣ ОПТИМІЗАЦІЯ SCROLLING ПОДІЙ
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const ScrollOptimizer = (() => {
    const handlers = new Map();
    let ticking = false;

    const onScroll = () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                handlers.forEach((handler, key) => {
                    handler();
                });
                ticking = false;
            });
            ticking = true;
        }
    };

    return {
        addListener(name, callback) {
            handlers.set(name, callback);
            
            if (handlers.size === 1) {
                window.addEventListener('scroll', onScroll, { passive: true });
            }
        },

        removeListener(name) {
            handlers.delete(name);
            
            if (handlers.size === 0) {
                window.removeEventListener('scroll', onScroll);
            }
        }
    };
})();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 7️⃣ ГЛОБАЛЬНА ІНІЦІАЛІЗАЦІЯ
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const PerformanceOptimizer = (() => {
    const init = () => {
        console.log('🚀 Performance Optimization Module Initialized');
        
        // Ініціалізуємо ліниве завантаження зображень
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                LazyImageLoader.init();
                WebVitalsMonitor.init();
            });
        } else {
            LazyImageLoader.init();
            WebVitalsMonitor.init();
        }

        // Експортуємо утиліти глобально
        window.__OPTIMIZATION__ = {
            debounce: OptimizationUtils.debounce,
            throttle: OptimizationUtils.throttle,
            cache: CacheManager,
            batchDOM: BatchDOMUpdater,
            metrics: WebVitalsMonitor,
            scroll: ScrollOptimizer
        };
    };

    // Запускаємо при завантаженні
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    return { init };
})();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 8️⃣ ЗАПУСК МЕТРИК ЛОГУВАННЯ ЧЕРЕЗ 5 СЕКУНД
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

if (window.__OPTIMIZATION__?.metrics) {
    setTimeout(() => {
        window.__OPTIMIZATION__.metrics.log();
    }, 5000);
}
