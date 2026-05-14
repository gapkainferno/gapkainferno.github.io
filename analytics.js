// ════════════════════════════════════════════════════════════════
// 📊 GLOBAL ANALYTICS MODULE — Firebase + Google Tag Manager
// Единая точка подключения всех аналитических сервисов
// ════════════════════════════════════════════════════════════════

// 1. Google Tag Manager (gtag.js) — инициализация
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-9CL9XT7H4D');

// 2. Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBoScvps08gY0fGPNNi-Ms_6J3uCRoh_6U",
  authDomain: "gapkas-homestead-inferno.firebaseapp.com",
  databaseURL: "https://gapkas-homestead-inferno-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "gapkas-homestead-inferno",
  storageBucket: "gapkas-homestead-inferno.firebasestorage.app",
  messagingSenderId: "598710636413",
  appId: "1:598710636413:web:b8edf854d8e8ba2a274614",
  measurementId: "G-9CL9XT7H4D"
};

// 3. Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAnalytics, logEvent } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";

try {
  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
  
  console.log('✅ Firebase Analytics initialized');
  
  // Global function for tracking custom events
  window.trackEvent = (eventName, eventParams = {}) => {
    try {
      logEvent(analytics, eventName, eventParams);
      gtag('event', eventName, eventParams);
    } catch (error) {
      console.error('❌ Analytics event error:', error);
    }
  };
  
  // Track page view
  window.trackPageView = (pageName) => {
    gtag('event', 'page_view', {
      page_title: pageName,
      page_path: window.location.pathname
    });
  };
  
  // Track product view
  window.trackProductView = (productId, productName, price) => {
    window.trackEvent('view_item', {
      items: [{
        item_id: productId,
        item_name: productName,
        price: price
      }]
    });
  };
  
  // Track add to cart
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
  
  // Track checkout
  window.trackCheckout = (cartTotal, itemCount) => {
    window.trackEvent('begin_checkout', {
      value: cartTotal,
      currency: 'UAH',
      items: [{
        quantity: itemCount
      }]
    });
  };
  
} catch (error) {
  console.warn('⚠️ Firebase Analytics init failed:', error);
  
  // Fallback: использовать только gtag
  window.trackEvent = (eventName, eventParams = {}) => {
    gtag('event', eventName, eventParams);
  };
  
  window.trackPageView = (pageName) => {
    gtag('event', 'page_view', {
      page_title: pageName,
      page_path: window.location.pathname
    });
  };
  
  window.trackProductView = () => console.warn('Firebase disabled');
  window.trackAddToCart = () => console.warn('Firebase disabled');
  window.trackCheckout = () => console.warn('Firebase disabled');
}

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
