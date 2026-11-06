(function () {
  'use strict';
  const init = () => {
    const header = document.querySelector('header');
    if (!header || document.querySelector('.ghi-site-nav')) return;
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Kyiv', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
    const data = Object.fromEntries(parts.map(part => [part.type, part.value]));
    const md = Number(data.month) * 100 + Number(data.day);
    const harvestOpen = md >= 911 && md <= 1120;
    const current = location.pathname.split('/').pop() || 'index.html';
    const nav = document.createElement('nav');
    nav.className = 'ghi-site-nav';
    nav.setAttribute('aria-label', 'Головна навігація');
    nav.innerHTML = `
      <a href="index.html" data-page="index.html">Головна</a>
      <a href="sauces.html" data-page="sauces.html">🔥 Соуси</a>
      <details class="ghi-nav-dropdown">
        <summary>🌱 Насіння</summary>
        <div class="ghi-nav-menu">
          <a href="seedsandseedlings.html">🌶️ Супергострі перці</a>
          <a href="tomatoes.html">🍅 Томати</a>
          <a href="vegetable-seeds.html">🫑 Овочі</a>
        </div>
      </details>
      ${harvestOpen ? '<a href="fresh-peppers.html" data-page="fresh-peppers.html">🌶️ Врожай Пекла</a>' : ''}
      <a href="blog.html" data-page="blog.html">Нотатки</a>
      <a href="faq.html" data-page="faq.html">FAQ</a>
    `;
    nav.querySelectorAll('[data-page]').forEach(link => {
      if (link.dataset.page === current) link.setAttribute('aria-current', 'page');
    });
    header.insertAdjacentElement('afterend', nav);
    const style = document.createElement('style');
    style.textContent = `
      .ghi-site-nav{position:relative;z-index:30;display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:8px 22px;max-width:1200px;margin:12px auto 24px;padding:12px 18px;border-top:1px solid rgba(255,110,55,.28);border-bottom:1px solid rgba(255,110,55,.28);background:rgba(12,9,7,.78);border-radius:8px}
      .ghi-site-nav>a,.ghi-nav-dropdown>summary{display:block;color:var(--text-color,#eee);font:600 .94rem/1.4 inherit;text-decoration:none;padding:5px 2px;cursor:pointer;list-style:none}
      .ghi-nav-dropdown>summary::-webkit-details-marker{display:none}
      .ghi-nav-dropdown>summary:after{content:'⌄';margin-left:7px;color:var(--primary-orange,#f60)}
      .ghi-site-nav a:hover,.ghi-nav-dropdown>summary:hover,.ghi-site-nav [aria-current=page]{color:var(--primary-orange,#ff6b35)}
      .ghi-nav-dropdown{position:relative}
      .ghi-nav-menu{position:absolute;top:100%;left:0;min-width:210px;display:grid;gap:4px;padding:10px;background:#17110d;border:1px solid rgba(255,110,55,.35);border-radius:8px;box-shadow:0 12px 28px rgba(0,0,0,.45)}
      .ghi-nav-menu a{color:#eee;text-decoration:none;padding:8px 10px;border-radius:5px}
      .ghi-nav-menu a:hover{background:rgba(255,110,55,.12)}
      @media(max-width:640px){.ghi-site-nav{justify-content:flex-start;gap:6px 14px;margin:8px 10px 18px;padding:10px 12px}.ghi-site-nav>a,.ghi-nav-dropdown>summary{font-size:.86rem}.ghi-nav-menu{left:auto;right:0}}
    `;
    document.head.appendChild(style);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();