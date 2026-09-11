(function () {
  const STORAGE_KEY = 'site_lang_pref';

  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn('language-switcher: localStorage unavailable', e);
  }

  const url = new URL(window.location.href);
  const parts = url.pathname.split('/').filter(Boolean);
  const enIndex = parts.indexOf('en');

  if (enIndex !== -1) {
    parts.splice(enIndex, 1);
    url.pathname = '/' + (parts.join('/') || 'index.html');
    window.location.replace(url.href);
  }
})();
