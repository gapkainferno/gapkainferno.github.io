// ════════════════════════════════════════════════════════════════
// 📊 GLOBAL ANALYTICS MODULE — Firebase + Google Tag Manager
// Единая точка подключения всех аналитических сервисов
// ════════════════════════════════════════════════════════════════

// 1. Google Tag Manager (gtag.js) — инициализация
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-9CL9XT7H4D');

// 2. Централізована Firebase конфігурація
import { FIREBASE_CONFIG } from './config/firebase-config.js';

// 3. Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAnalytics, logEvent } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";

const isLocalDevelopment = ['localhost', '127.0.0.1'].includes(window.location.hostname);
let firebaseAnalytics = null;

if (!isLocalDevelopment) {
  try {
    const app = initializeApp(FIREBASE_CONFIG);
    firebaseAnalytics = getAnalytics(app);
    console.log('✅ Firebase Analytics initialized');
  } catch (error) {
    console.warn('⚠️ Firebase Analytics init failed:', error);
  }
}

window.trackEvent = (eventName, eventParams = {}) => {
  if (firebaseAnalytics) {
    try {
      logEvent(firebaseAnalytics, eventName, eventParams);
    } catch (error) {
      console.error('❌ Analytics event error:', error);
    }
  }
  gtag('event', eventName, eventParams);
};

window.trackPageView = (pageName) => {
  gtag('event', 'page_view', {
    page_title: pageName,
    page_path: window.location.pathname
  });
};

window.trackProductView = (productId, productName, price) => {
  window.trackEvent('view_item', {
    items: [{
      item_id: productId,
      item_name: productName,
      price: price
    }]
  });
};

window.trackAddToCart = (productId, productName, price, quantity) => {
  window.trackEvent('add_to_cart', {
    items: [{
      item_id: productId,
      item_name: productName,
      price: price,
      quantity: quantity
    }]
  });
};

window.trackCheckout = (cartTotal, itemCount) => {
  window.trackEvent('begin_checkout', {
    value: cartTotal,
    currency: 'UAH',
    items: [{
      quantity: itemCount
    }]
  });
};

// 4. Auto-track outbound links
document.addEventListener('click', (e) => {
  const link = e.target.closest('a');
  if (link && link.href && !link.href.includes(window.location.hostname)) {
    window.trackEvent('outbound_click', {
      destination_url: link.href
    });
  }
});

// 5. Track page visibility
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    window.trackEvent('page_hidden');
  } else {
    window.trackEvent('page_visible');
  }
});
