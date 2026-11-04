#!/usr/bin/env node
// Build the server-side order catalog from the same source used by the storefront.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'products.js'), 'utf8');
const sandbox = {
  window: {},
  document: {
    readyState: 'loading',
    addEventListener() {},
    querySelector() { return null; }
  },
  console: { log() {}, warn() {}, error() {} }
};
vm.createContext(sandbox);
vm.runInContext(source, sandbox, { filename: 'products.js', timeout: 5000 });
const products = vm.runInContext('allProducts', sandbox);
const bundles = vm.runInContext('orderBundles || {}', sandbox);

const cartSource = fs.readFileSync(path.join(root, 'cart.js'), 'utf8');
const saleMatch = cartSource.match(/const SALE_SETTINGS\s*=\s*(\{[\s\S]*?\n\});/);
if (!saleMatch) throw new Error('Could not read SALE_SETTINGS from cart.js');
const saleSettings = vm.runInNewContext('(' + saleMatch[1] + ')', {}, { timeout: 1000 });

const catalog = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  sale: {
    isActive: saleSettings.isActive === true,
    discountPercent: Math.min(Math.max(Number(saleSettings.discountPercent) || 0, 0), 90),
    deadline: saleSettings.deadline || ''
  },
  products: {},
  bundles: {}
};

for (const [id, p] of Object.entries(products)) {
  const versions = {};
  for (const [key, version] of Object.entries(p.seedVersions || {})) {
    versions[key] = {
      label: String(version.label || key),
      price: Number(version.price),
      inStock: version.inStock !== false
    };
  }
  catalog.products[id] = {
    name: String(p.name || id),
    category: String(p.category || ''),
    price: Number(p.price),
    inStock: p.inStock !== false,
    allowSale: p.allowSale === true,
    isHidden: p.isHidden === true,
    variants: versions
  };
}
for (const [id, b] of Object.entries(bundles)) {
  const includedProductIds = Array.isArray(b.includedProductIds) ? b.includedProductIds.map(String) : [];
  const includedProductsAvailable = includedProductIds.every(productId => {
    const product = products[productId];
    return product && product.category === 'sauces' && product.inStock !== false && product.isHidden !== true;
  });
  catalog.bundles[id] = {
    name: String(b.name || id),
    price: Number(b.price),
    inStock: b.inStock === true && includedProductsAvailable,
    allowSale: b.allowSale === true,
    includedProductIds
  };
}

const out = path.join(root, 'order-catalog.json');
fs.writeFileSync(out, JSON.stringify(catalog, null, 2) + '\n');
console.log('Generated order-catalog.json:', Object.keys(catalog.products).length, 'products,', Object.keys(catalog.bundles).length, 'bundles');
