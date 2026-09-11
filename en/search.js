/**
 * search.js — English version for en/ folder
 * Product search functionality
 */

document.addEventListener('DOMContentLoaded', () => {
    initSearch();
});

function initSearch() {
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    
    if (!searchInput || !searchResults) return;
    
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim().toLowerCase();
        const safeQuery = query.substring(0, 100);
        
        if (safeQuery.length < 2) {
            searchResults.style.display = 'none';
            searchResults.innerHTML = '';
            return;
        }
        
        const results = searchProducts(safeQuery);
        displaySearchResults(results, searchResults);
    });
    
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-container')) {
            searchResults.style.display = 'none';
        }
    });
    
    searchInput.addEventListener('focus', (e) => {
        if (e.target.value.trim().length >= 2) {
            searchResults.style.display = 'block';
        }
    });
}

function searchProducts(query) {
    if (typeof allProducts === 'undefined') return [];
    
    const results = [];
    const lowerQuery = query.toLowerCase().trim();

    Object.keys(allProducts).forEach(id => {
        const product = allProducts[id];
        
        const nameMatch = product.name && product.name.toLowerCase().includes(query);
        const altNameMatch = product.searchName && product.searchName.toLowerCase().includes(lowerQuery);
        const flavorMatch = product.isFlavor && product.isFlavor.toLowerCase().includes(lowerQuery);
        
        let categoryMatch = false;
        if (product.category) {
            const categoryNames = {
                'seeds': 'seeds, superhot',
                'sauces': 'sauce, sauces',
                'seedlings': 'seedlings'
            };
            const categoryName = categoryNames[product.category] || product.category;
            categoryMatch = categoryName.toLowerCase().includes(query);
        }
        
        if (nameMatch || categoryMatch || altNameMatch || flavorMatch) {
            results.push({
                id: id,
                ...product,
                matchPriority: (nameMatch || altNameMatch || flavorMatch) ? 1 : 2
            });
        }
    });
    
    results.sort((a, b) => a.matchPriority - b.matchPriority);
    
    return results.slice(0, 8);
}

function displaySearchResults(results, container) {
    if (results.length === 0) {
        container.innerHTML = '<div class="search-no-results" style="padding: 15px; text-align: center; color: #888;">Nothing found 😕</div>';
        container.style.display = 'block';
        return;
    }
    
    const categoryNames = {
        'seeds': '🌶️ Seeds',
        'sauces': '🔥 Sauces',
        'seedlings': '🌱 Seedlings'
    };
    
    const sanitizedResults = results.map(item => ({
        ...item,
        rawCategory: item.category,
        name: String(item.name),
        category: categoryNames[item.category] || item.category,
        price: isNaN(item.price) ? 0 : item.price
    }));
    
    container.innerHTML = sanitizedResults.map(item => {
        const isInStock = item.inStock !== false;
        const safeId = encodeURIComponent(item.id);
        const safeImageSrc = item.images && item.images[0] ? encodeURI(item.images[0]) : '';
        const isLocked = typeof window.isProductLocked === 'function' && window.isProductLocked(item);
        const itemHref = isLocked ? '#' : `product.html?id=${safeId}`;
        const itemClass = isLocked ? 'search-result-item is-locked-search' : 'search-result-item';
        const lockedStyle = isLocked ? 'opacity: 0.72; cursor: not-allowed;' : '';
        const lockedBadge = isLocked ? '<span style="color: #ffaa33; font-size: 10px; margin-left: 5px;">(COMING SOON)</span>' : '';
        
        return `
    <a href="${itemHref}" class="${itemClass}" data-locked="${isLocked ? 'true' : 'false'}" style="${lockedStyle}">
        <div class="search-result-img" style="${isInStock && !isLocked ? '' : 'filter: grayscale(1); opacity: 0.7;'}">
            <img src="${safeImageSrc}" alt="${item.name}">
        </div>
        <div class="search-result-info">
            <div class="search-result-name">
                ${item.name} ${isInStock ? '' : '<span style="color: #ff4444; font-size: 10px; margin-left: 5px;">(UNAVAILABLE)</span>'}
            </div>
            ${lockedBadge ? `<div class="search-result-category" style="color: #ffaa33;">${lockedBadge}</div>` : ''}
            <div class="search-result-category">${item.category}</div>
        </div>
        ${isLocked ? '' : `<div class="search-result-price">${item.price} ₴</div>`}
    </a>
`;
    }).join('');

    container.querySelectorAll('.search-result-item[data-locked="true"]').forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const message = typeof window.getLockedCategoryAlert === 'function'
                ? window.getLockedCategoryAlert()
                : 'This section is temporarily unavailable.';
            alert(message);
        });
    });
    
    container.style.display = 'block';
}