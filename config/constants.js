/**
 * ═══════════════════════════════════════════════════════════════
 * APPLICATION CONSTANTS - Single Source for All Config Values
 * ═══════════════════════════════════════════════════════════════
 * Централізація всіх hardcoded значень в одному місці
 * Видалення 200+ LOC hardcoded констант зі всього кодо
 */

// ── HEAT LEVELS (для семян і соусів) ──
export const HEAT_LEVELS = {
  "1": { shu: "1k-50k", width: "25%", label: "Мила" },
  "2": { shu: "50k-500k", width: "50%", label: "Помірна" },
  "3": { shu: "500k-1M", width: "75%", label: "Висока" },
  "4": { shu: "1M-2.2M+", width: "100%", label: "Екстремальна" }
};

// ── SEARCH CONFIGURATION ──
export const SEARCH_CONFIG = {
  MIN_QUERY_LENGTH: 2,
  MAX_QUERY_LENGTH: 100,
  MAX_RESULTS: 8,
  DEBOUNCE_MS: 300
};

// ── DELIVERY OPTIONS ──
export const DELIVERY_OPTIONS = [
  { value: 'np-branch', label: 'Нова Пошта (Відділення)' },
  { value: 'np-parcel', label: 'Нова Пошта (Поштомат)' },
  { value: 'ukrposhta', label: 'Укрпошта' },
  { value: 'np-courier', label: 'Нова Пошта (Адресна доставка)' }
];

// ── PAYMENT OPTIONS ──
export const PAYMENT_OPTIONS = [
  { value: 'prepay', label: 'Онлайн оплата (передоплата)' },
  { value: 'cod', label: 'Накладений платіж (післяплата)' }
];

// ── PRODUCT CATEGORIES ──
export const CATEGORIES = {
  seeds: {
    name: 'seeds',
    label: 'Насіння суперхотів',
    url: 'seedsandseedlings.html',
    icon: '🌶️'
  },
  sauces: {
    name: 'sauces',
    label: 'Крафтові соуси',
    url: 'sauces.html',
    icon: '🔥'
  },
  otherseeds: {
    name: 'otherseeds',
    label: 'Інше насіння',
    url: 'otherseeds.html',
    icon: '🌱'
  },
  'fresh-peppers': {
    name: 'fresh-peppers',
    label: 'Свіжі перці',
    url: 'fresh-peppers.html',
    icon: '🫑'
  },
  poultry: {
    name: 'poultry',
    label: 'Яйця',
    url: 'orpington-eggs.html',
    icon: '🐓'
  }
};

// ── RATE LIMITING ──
export const RATE_LIMITS = {
  checkout: { max: 2, windowMs: 60000 },      // 2 per minute
  addToCart: { max: 20, windowMs: 60000 },    // 20 per minute
  search: { max: 60, windowMs: 60000 },       // 60 per minute
  submit: { minInterval: 30000 }              // 30 seconds between submits
};

// ── UI/UX TIMEOUTS ──
export const TIMEOUTS = {
  notificationDuration: 5000,     // Notification auto-close
  debounceSearch: 300,             // Search input debounce
  cartUpdateDelay: 150,            // Cart animation delay
  modaltransition: 250             // Modal open/close
};

// ── API ENDPOINTS ──
export const API_ENDPOINTS = {
  submitOrder: '/api/orders',
  uploadImage: '/api/upload',
  getNPCities: '/api/novaposhta/cities',
  getNPBranches: '/api/novaposhta/branches'
};

// ── ERROR MESSAGES (User-friendly) ──
export const ERROR_MESSAGES = {
  INVALID_EMAIL: 'Будь ласка, введіть корректну email адресу',
  INVALID_PHONE: 'Будь ласка, введіть коректний номер телефону',
  INVALID_NAME: 'Будь ласка, введіть ваше ім\'я',
  CART_EMPTY: 'Ваш кошик порожній',
  PRODUCT_NOT_FOUND: 'Товар не знайдено',
  NETWORK_ERROR: 'Помилка з\'єднання. Перевірте інтернет',
  RATE_LIMIT: '⏱️ Занадто багато запитів. Зачекайте хвилину',
  UNKNOWN_ERROR: '😞 Щось пішло не так. Спробуйте ще раз'
};

// ── SUCCESS MESSAGES ──
export const SUCCESS_MESSAGES = {
  ADDED_TO_CART: '✅ Товар добавлен в кошик',
  ORDER_SUBMITTED: '✅ Замовлення успішно оформлено',
  COPIED: '✅ Скопійовано в буфер обміну'
};

// ── ANALYTICS EVENT NAMES ──
export const ANALYTICS_EVENTS = {
  PAGE_VIEW: 'page_view',
  VIEW_ITEM: 'view_item',
  ADD_TO_CART: 'add_to_cart',
  REMOVE_FROM_CART: 'remove_from_cart',
  BEGIN_CHECKOUT: 'begin_checkout',
  PURCHASE: 'purchase',
  SEARCH: 'search',
  FILTER: 'filter'
};

// ── STORAGE KEYS ──
export const STORAGE_KEYS = {
  CART: 'gapka_cart',
  THEME: 'hs_theme',
  ERRORS: '_app_errors',
  USER_PREF: 'user_preferences'
};

// ── FEATURE FLAGS ──
export const FEATURE_FLAGS = {
  ENABLE_WISHLIST: false,
  ENABLE_REVIEWS: true,
  ENABLE_CHAT: false,
  ENABLE_AFFILIATE: false,
  ENABLE_SUBSCRIPTIONS: false
};

// Export all as default object too
export const CONFIG = {
  HEAT_LEVELS,
  SEARCH_CONFIG,
  DELIVERY_OPTIONS,
  PAYMENT_OPTIONS,
  CATEGORIES,
  RATE_LIMITS,
  TIMEOUTS,
  API_ENDPOINTS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  ANALYTICS_EVENTS,
  STORAGE_KEYS,
  FEATURE_FLAGS
};

export default CONFIG;
