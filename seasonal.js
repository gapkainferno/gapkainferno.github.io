(function () {
    'use strict';
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Kyiv', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
    const data = Object.fromEntries(parts.map(part => [part.type, part.value]));
    const monthDay = Number(data.month) * 100 + Number(data.day);
    if (monthDay >= 911 && monthDay <= 1120) return;
    document.querySelectorAll('a[href="fresh-peppers.html"], a[href="./fresh-peppers.html"]').forEach(link => {
        const item = link.closest('li');
        if (item) item.remove(); else link.remove();
    });
})();