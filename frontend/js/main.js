const API_URL = '/api';

let categories = [];
let categoryProducts = {};

// Загрузка категорий при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    loadCategories();
    setupEventListeners();
});

// Загружает список всех категорий с сервера и отображает их на странице
async function loadCategories() {
    try {
        const response = await fetch(`${API_URL}/categories`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const categoriesData = await response.json();
        categories = categoriesData.map(cat => typeof cat === 'object' ? cat.name : cat);

        await loadAllCategoryProducts();
        displayCategories(categoriesData);
    } catch (error) {
        console.error('Ошибка загрузки категорий:', error);
        showError('Не удалось загрузить категории. Проверьте что backend запущен и доступен.');
    }
}

// Загружает товары для всех категорий параллельно
async function loadAllCategoryProducts() {
    try {
        const promises = categories.map(async (categoryName) => {
            const response = await fetch(`${API_URL}/products?category=${encodeURIComponent(categoryName)}`);
            const products = await response.json();
            categoryProducts[categoryName] = products;
        });
        await Promise.all(promises);
    } catch (error) {
        console.error('Ошибка загрузки товаров категорий:', error);
    }
}

// Отображает карточки категорий на странице с превью первых 5 товаров
function displayCategories(categoriesData) {
    const grid = document.getElementById('categories-grid');

    if (!grid) {
        console.error('Элемент categories-grid не найден!');
        return;
    }

    if (!categoriesData || categoriesData.length === 0) {
        grid.innerHTML = '<p style="text-align: center; grid-column: 1/-1; color: var(--text-dim);">Категории не найдены</p>';
        return;
    }

    grid.innerHTML = categoriesData.map(categoryData => {
        const categoryName = typeof categoryData === 'object' ? categoryData.name : categoryData;
        const categoryImage = (typeof categoryData === 'object' && categoryData.image_path) ? categoryData.image_path : '/images/categories/default.png';
        const products = categoryProducts[categoryName] || [];
        const productCount = products.length;
        const first5Products = products.slice(0, 5);

        return `
            <a href="/category.html?category=${encodeURIComponent(categoryName)}" class="category-card">
                <div class="category-image-wrapper">
                    <img src="${categoryImage}"
                         alt="${categoryName}"
                         class="category-image"
                         onerror="this.style.display='none';">
                </div>
                <div class="category-info">
                    <h3 class="category-name">${categoryName}</h3>
                    <p class="category-count">${productCount} ${pluralize(productCount, 'мотоцикл', 'мотоцикла', 'мотоциклов')}</p>
                </div>
                <div class="category-hover-info">
                    <div class="category-hover-title">Топ товары:</div>
                    ${first5Products.length > 0 ?
                        first5Products.map(product => `
                            <div class="category-hover-product">
                                • ${product.product_name}
                            </div>
                        `).join('')
                        : '<div class="category-hover-product">Товары отсутствуют</div>'
                    }
                </div>
            </a>
        `;
    }).join('');
}

// Склоняет слово в зависимости от числа (например: 1 мотоцикл, 2 мотоцикла, 5 мотоциклов)
function pluralize(count, one, two, five) {
    let n = Math.abs(count);
    n %= 100;
    if (n >= 5 && n <= 20) {
        return five;
    }
    n %= 10;
    if (n === 1) {
        return one;
    }
    if (n >= 2 && n <= 4) {
        return two;
    }
    return five;
}

// Отображает сообщение об ошибке на странице
function showError(message) {
    const grid = document.getElementById('categories-grid');
    if (grid) {
        grid.innerHTML = `<p style="text-align: center; grid-column: 1/-1; color: var(--primary);">${message}</p>`;
    }
}

// Устанавливает обработчики событий для плавной прокрутки по якорным ссылкам
function setupEventListeners() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}