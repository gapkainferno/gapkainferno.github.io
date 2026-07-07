(function () {
  const PUBLIC_HOST = 'gapkainferno.github.io';
  const isTranslatePage = () => window.location.href.includes('translate.google.com');
  const isEnglishBrowser = () => {
    const lang = (navigator.language || navigator.userLanguage || '').toLowerCase();
    return lang.startsWith('en');
  };
  const getPublicUrl = () => {
    if (window.location.protocol === 'file:') {
      const fileName = window.location.pathname.split('/').pop() || 'index.html';
      return `https://${PUBLIC_HOST}/${fileName}`;
    }
    return window.location.href;
  };
  const shouldAutoOpen = () => {
    if (isTranslatePage()) return false;
    if (window.location.protocol === 'file:') return false;
    const alreadyOpened = sessionStorage.getItem('translate-auto-opened');
    return isEnglishBrowser() && !alreadyOpened;
  };
  const buildTranslateUrl = () => {
    const currentUrl = encodeURIComponent(getPublicUrl());
    return `https://translate.google.com/translate?hl=en&sl=uk&tl=en&u=${currentUrl}`;
  };

  const style = document.createElement('style');
  style.textContent = `
    #translate-button {
      position: fixed;
      left: 16px;
      top: 16px;
      z-index: 9998;
      background: linear-gradient(135deg, #ff4500, #ff7a1a);
      color: #fff;
      border: none;
      border-radius: 999px;
      padding: 10px 14px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
      cursor: pointer;
      font-weight: 700;
      font-size: 14px;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      text-decoration: none;
    }
    body.has-sale-banner #translate-button {
      top: 64px;
    }
    #translate-button:hover {
      transform: translateY(-1px);
    }
  `;
  document.head.appendChild(style);

  const button = document.createElement('button');
  button.id = 'translate-button';
  button.type = 'button';
  button.innerHTML = '🌐 English version';
  button.addEventListener('click', () => {
    window.location.assign(buildTranslateUrl());
  });
  document.body.appendChild(button);

  if (shouldAutoOpen()) {
    sessionStorage.setItem('translate-auto-opened', '1');
    window.setTimeout(() => {
      window.location.assign(buildTranslateUrl());
    }, 400);
  }
})();
