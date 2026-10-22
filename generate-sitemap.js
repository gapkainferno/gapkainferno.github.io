const fs = require('fs');
const path = require('path');

// Налаштування
const BASE_URL = 'https://gapkainferno.github.io';
const PRODUCTS_FILE = path.join(__dirname, '../products.js');
const SITEMAP_FILE = path.join(__dirname, '../sitemap.xml');
const DATE = new Date().toISOString().split('T')[0];

// 1. Зчитуємо продукти
const content = fs.readFileSync(PRODUCTS_FILE, 'utf8');

// Збираємо ключі товарів першого рівня та пропускаємо тимчасово приховані товари.
const productEntries = [...content.matchAll(/^ {0,4}"([^"]+)"\s*:\s*\{/gm)];
const productIds = productEntries.flatMap((entry, index) => {
    const end = productEntries[index + 1]?.index ?? content.length;
    const productSource = content.slice(entry.index, end);
    return /\bisHidden\s*:\s*true\b/.test(productSource) ? [] : [entry[1]];
});

// 2. Шаблон XML
let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" 
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  
  <!-- СТАТИЧНІ СТОРІНКИ -->
  <url>
    <loc>${BASE_URL}/index.html</loc>
    <lastmod>${DATE}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${BASE_URL}/sauces.html</loc>
    <lastmod>${DATE}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${BASE_URL}/seedsandseedlings.html</loc>
    <lastmod>${DATE}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${BASE_URL}/otherseeds.html</loc>
    <lastmod>${DATE}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${BASE_URL}/fresh-peppers.html</loc>
    <lastmod>${DATE}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${BASE_URL}/blog.html</loc>
    <lastmod>${DATE}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>

  <!-- ДИНАМІЧНІ ТОВАРИ -->
`;

productIds.forEach(id => {
    xml += `  <url>
    <loc>${BASE_URL}/product.html?id=${id}</loc>
    <lastmod>${DATE}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>\n`;
});

xml += `</urlset>`;

// 3. Записуємо файл
fs.writeFileSync(SITEMAP_FILE, xml);
console.log(`✅ Sitemap оновлено: ${productIds.length} товарів додано.`);