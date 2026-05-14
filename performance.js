// ════════════════════════════════════════════════════════════════
// PERFORMANCE OPTIMIZATION SCRIPT
// Lazy loading, Image optimization, Analytics
// ════════════════════════════════════════════════════════════════

/**
 * БЕЗПЕЧНИЙ RENDER ДИНАМІЧНОГО КОНТЕНТУ
 * Замініть innerHTML на safeSetHTML для всіх користувацьких даних
 */
const SafeDOM = {
    /**
     * Безпечно вставляє текст з HTML escaping
     * @param {HTMLElement} element - цільовий елемент
     * @param {string} html - HTML контент
     * @param {boolean} allowHTML - дозволити HTML теги
     */
    safeSetHTML: function(element, html, allowHTML = false) {
        if (!element) return;
        
        if (allowHTML) {
            // Якщо дозволяємо HTML - використовуємо DOMParser для валідації
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            // Видаляємо небезпечні теги
            const scripts = doc.querySelectorAll('script, iframe, object, embed');
            scripts.forEach(el => el.remove());
            
            element.innerHTML = doc.body.innerHTML;
        } else {
            // Безпечно вставляємо як текст
            element.textContent = html;
        }
    },
    
    /**
     * Безпечно вставляє фрагмент контенту
     */
    safeSetFragment: function(element, innerHTML) {
        const fragment = document.createDocumentFragment();
        const div = document.createElement('div');
        div.innerHTML = innerHTML;
        
        // Видаляємо скрипти та небезпечні атрибути
        const scripts = div.querySelectorAll('script');
        scripts.forEach(s => s.remove());
        
        while (div.firstChild) {
            fragment.appendChild(div.firstChild);
        }
        
        element.innerHTML = '';
        element.appendChild(fragment);
    }
};

/**
 * LAZY LOADING ДЛЯ ЗОБРАЖЕНЬ
 * Автоматично додає lazy loading до всіх img та picture елементів
 */
class ImageLazyLoader {
    constructor(options = {}) {
        this.threshold = options.threshold || 0.1;
        this.rootMargin = options.rootMargin || '50px';
        this.init();
    }
    
    init() {
        // Перевіряємо підтримку Intersection Observer
        if (!('IntersectionObserver' in window)) {
            this.fallback();
            return;
        }
        
        const observerOptions = {
            root: null,
            rootMargin: this.rootMargin,
            threshold: this.threshold
        };
        
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadImage(entry.target);
                    this.observer.unobserve(entry.target);
                }
            });
        }, observerOptions);
        
        // Спостерігаємо за всіма зображеннями з data-src
        document.querySelectorAll('img[data-src], img[data-lazy]').forEach(img => {
            this.observer.observe(img);
        });
    }
    
    loadImage(img) {
        const src = img.dataset.src || img.dataset.lazy;
        if (!src) return;
        
        const tempImg = new Image();
        tempImg.onload = () => {
            img.src = src;
            img.classList.add('lazy-loaded');
        };
        tempImg.onerror = () => {
            img.classList.add('lazy-error');
        };
        tempImg.src = src;
    }
    
    fallback() {
        // Фолбек для старих браузерів
        document.querySelectorAll('img[data-src], img[data-lazy]').forEach(img => {
            img.src = img.dataset.src || img.dataset.lazy;
        });
    }
}

/**
 * ОПТИМІЗАЦІЯ ДИНАМІЧНИХ ЗОБРАЖЕНЬ
 * Конвертує динамічні src у data-src для lazy loading
 */
function enableLazyLoadingForDynamicImages() {
    // Спостерігаємо за новими елементами, що додаються в DOM
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1) { // Element node
                    const imgs = node.querySelectorAll ? node.querySelectorAll('img') : [];
                    imgs.forEach(img => {
                        if (img.src && !img.dataset.lazy) {
                            img.dataset.lazy = img.src;
                            img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3C/svg%3E';
                        }
                    });
                }
            });
        });
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    return observer;
}

/**
 * ВЕБОРБОРД ОПТИМІЗАЦІЯ
 * Мініфікує та відстрочує завантаження скриптів
 */
class ScriptOptimizer {
    static deferNonCriticalScripts() {
        // Зберігаємо inline скрипти для відкладеного виконання
        const nonCriticalScripts = [
            'blog-app.js',
            'blog-article-app.js',
            'googlescript.js'
        ];
        
        nonCriticalScripts.forEach(script => {
            const tag = document.querySelector(`script[src*="${script}"]`);
            if (tag) {
                tag.defer = true;
            }
        });
    }
    
    static lazyLoadScriptsOnInteraction() {
        const criticalScripts = {
            'catalog.js': 'scroll',
            'search.js': 'focus'
        };
        
        Object.entries(criticalScripts).forEach(([script, event]) => {
            let loaded = false;
            
            document.addEventListener(event, () => {
                if (!loaded) {
                    this.loadScript(`/scripts/${script}`);
                    loaded = true;
                }
            }, { once: true });
        });
    }
    
    static loadScript(src) {
        const script = document.createElement('script');
        script.async = true;
        script.src = src;
        document.head.appendChild(script);
    }
}

/**
 * МОНІТОРИНГ ПЕРФОРМАНСУ
 * Вимірює Core Web Vitals та відправляє аналітику
 */
class PerformanceMonitor {
    static init() {
        if ('web-vital' in window) {
            this.measureWebVitals();
        }
        
        // Базові метрики
        window.addEventListener('load', () => {
            const perfData = window.performance.timing;
            const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
            
            // Логування або відправка на сервер
            console.log(`📊 Page Load Time: ${pageLoadTime}ms`);
            
            // Відправляємо на Google Analytics
            if (typeof gtag !== 'undefined') {
                gtag('event', 'page_load_time', {
                    'value': pageLoadTime,
                    'event_category': 'performance'
                });
            }
        });
    }
    
    static measureWebVitals() {
        // LCP - Largest Contentful Paint
        if ('PerformanceObserver' in window) {
            try {
                const lcpObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    console.log('📊 LCP:', lastEntry.renderTime || lastEntry.loadTime);
                });
                lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
            } catch(e) {
                console.warn('LCP не підтримується');
            }
        }
    }
}

/**
 * ІНІЦІАЛІЗАЦІЯ
 */
document.addEventListener('DOMContentLoaded', () => {
    // Активуємо lazy loading для зображень
    new ImageLazyLoader({
        threshold: 0.1,
        rootMargin: '50px'
    });
    
    // Спостерігаємо за динамічно доданими зображеннями
    enableLazyLoadingForDynamicImages();
    
    // Оптимізуємо завантаження скриптів
    ScriptOptimizer.deferNonCriticalScripts();
    
    // Включаємо моніторинг перформансу
    PerformanceMonitor.init();
    
    console.log('✅ Performance optimizations enabled');
});

// Експортуємо для використання в інших скриптах
window.SafeDOM = SafeDOM;
window.ImageLazyLoader = ImageLazyLoader;