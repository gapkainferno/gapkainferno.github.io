import { sanitize } from './utils/sanitizer.js';

// Додаємо DOMPurify для санітізації (якщо не підключено глобально)
if (typeof DOMPurify === 'undefined') {
    console.warn('DOMPurify не знайдено. Підключіть: <script src="https://cdn.jsdelivr.net/npm/dompurify@3/dist/purify.min.js"></script>');
}

document.addEventListener('DOMContentLoaded', () => {
    initSearch();
});

function initSearch() {
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    
    if (!searchInput || !searchResults) return;
    
    // Пошук при введенні тексту
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim().toLowerCase();
        
        // Обмежуємо довжину запиту для безпеки (до 100 символів)
        const safeQuery = query.substring(0, 100);
        
        // Якщо менше 2 символів - ховаємо результати
        if (safeQuery.length < 2) {
            searchResults.style.display = 'none';
            searchResults.innerHTML = '';
            return;
        }
        
        // Шукаємо товари
        const results = searchProducts(safeQuery);
        
        // Показуємо результати
        displaySearchResults(results, searchResults);
    });
    
    // Закриття результатів при кліку поза пошуком
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-container')) {
            searchResults.style.display = 'none';
        }
    });
    
    // Показуємо результати при фокусі (якщо є текст)
    searchInput.addEventListener('focus', (e) => {
        if (e.target.value.trim().length >= 2) {
            searchResults.style.display = 'block';
        }
    });
}

// Функція пошуку товарів
function searchProducts(query) {
    if (typeof allProducts === 'undefined') return [];
    
    const results = [];
    const lowerQuery = query.toLowerCase().trim(); // Очищаємо запит від зайвих пробілів

    Object.keys(allProducts).forEach(id => {
        const product = allProducts[id];
        
        // Шукаємо по назві
        const nameMatch = product.name.toLowerCase().includes(query);

        // 2. ШУКАЄМО ПО ПРИХОВАНІЙ НАЗВІ (searchName)
        const altNameMatch = product.searchName && product.searchName.toLowerCase().includes(lowerQuery);
        
        // 3. НОВЕ: Пошук за смаковим тегом
        const flavorMatch = product.isFlavor && product.isFlavor.toLowerCase().includes(lowerQuery);

        // Шукаємо по категорії
        let categoryMatch = false;
        if (product.category) {
            // Перекладаємо категорії для пошуку
            const categoryNames = {
                'seeds': 'насіння, seeds',
                'sauces': 'соус, соуси, sauces',
                'seedlings': 'розсада'
            };
            const categoryName = categoryNames[product.category] || product.category;
            categoryMatch = categoryName.toLowerCase().includes(query);
        }
        
        // Додаємо до результатів якщо знайшли збіг
        if (nameMatch || categoryMatch || altNameMatch || flavorMatch) {
            results.push({
                id: id,
                ...product,
                // Визначаємо пріоритет для сортування: назви вище за категорії
                matchPriority: (nameMatch || altNameMatch || flavorMatch) ? 1 : 2
            });
        }
    });
    
    // Сортуємо: спочатку збіги по назві, потім по категорії
    results.sort((a, b) => a.matchPriority - b.matchPriority);
    
    // Обмежуємо до 8 результатів
    return results.slice(0, 8);
}

// функція відображення результатів 
function displaySearchResults(results, container) {
    if (results.length === 0) {
        container.innerHTML = '<div class="search-no-results" style="padding: 15px; text-align: center; color: #888;">Нічого не знайдено 😕</div>';
        container.style.display = 'block';
        return;
    }
    
    const categoryNames = {
        'seeds': '🌶️ Насіння',
        'sauces': '🔥 Соус',
        'seedlings': '🌱 Розсада'
    };
    
    // ✅ IMPROVED: Безпечна санітізація результатів за допомогою нашого модуля
    const sanitizedResults = results.map(item => ({
        ...item,
        rawCategory: item.category,
        name: sanitize.text(item.name),  // Повна XSS защита
        category: sanitize.text(categoryNames[item.category] || item.category),
        price: isNaN(item.price) ? 0 : item.price // Перевіряємо, що ціна - число
    }));
    
    container.innerHTML = sanitizedResults.map(item => {
        // Перевіряємо наявність
        const isInStock = item.inStock !== false;
        
        // Санітізуємо URL для безпеки
        const safeId = encodeURIComponent(item.id);
        const safeImageSrc = item.images && item.images[0] ? encodeURI(item.images[0]) : '';
        const isLocked = typeof window.isProductLocked === 'function' && window.isProductLocked(item);
        const itemHref = isLocked ? '#' : `product.html?id=${safeId}`;
        const itemClass = isLocked ? 'search-result-item is-locked-search' : 'search-result-item';
        const lockedStyle = isLocked ? 'opacity: 0.72; cursor: not-allowed;' : '';
        const lockedBadge = isLocked ? '<span style="color: #ffaa33; font-size: 10px; margin-left: 5px;">(НЕЗАБАРОМ)</span>' : '';
        
        return `
    <a href="${itemHref}" class="${itemClass}" data-locked="${isLocked ? 'true' : 'false'}" style="${lockedStyle}">
        <div class="search-result-img" style="${isInStock && !isLocked ? '' : 'filter: grayscale(1); opacity: 0.7;'}">
            <img src="${safeImageSrc}" alt="${item.name}">
        </div>
        <div class="search-result-info">
            <div class="search-result-name">
                ${item.name} ${isInStock ? '' : '<span style="color: #ff4444; font-size: 10px; margin-left: 5px;">(ОЧІКУЄТЬСЯ)</span>'}
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
                : 'Цей розділ тимчасово недоступний.';

            alert(message);
        });
    });
    
    container.style.display = 'block';
}
