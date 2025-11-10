const API_URL = '/api';

let categories = [];
let categoryProducts = {};

document.addEventListener('DOMContentLoaded', () => {
    console.log('Страница загружена, начинаю загрузку категорий...');
    loadCategories();
    setupEventListeners();
});

// ИСПРАВЛЕНО: функция добавляет /images/ только если его нет в пути
function normalizeImagePath(imagePath) {
    if (!imagePath) return null;
    
    // Если путь уже начинается с /images/, возвращаем как есть
    if (imagePath.startsWith('/images/')) {
        return imagePath;
    }
    
    // Если путь начинается с /, убираем его
    const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
    
    // Добавляем /images/ префикс
    return `/images/${cleanPath}`;
}

async function loadCategories() {
    try {
        console.log('Запрос категорий:', `${API_URL}/categories`);
        const response = await fetch(`${API_URL}/categories`);
        console.log('Статус ответа:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const categoriesData = await response.json();
        console.log('Категории получены:', categoriesData);
        
        categories = categoriesData.map(cat => typeof cat === 'object' ? cat.name : cat);
        console.log('Названия категорий:', categories);
        
        await loadAllCategoryProducts();
        displayCategories(categoriesData);
    } catch (error) {
        console.error('Ошибка загрузки категорий:', error);
        showError('Не удалось загрузить категории. Проверьте что backend запущен и доступен.');
    }
}

async function loadAllCategoryProducts() {
    try {
        const promises = categories.map(async (categoryName) => {
            console.log('Загрузка товаров для категории:', categoryName);
            const response = await fetch(`${API_URL}/products?category=${encodeURIComponent(categoryName)}`);
            const products = await response.json();
            console.log(`Товары для ${categoryName}:`, products.length);
            categoryProducts[categoryName] = products;
        });
        await Promise.all(promises);
    } catch (error) {
        console.error('Ошибка загрузки товаров категорий:', error);
    }
}

function displayCategories(categoriesData) {
    const grid = document.getElementById('categories-grid');
    
    if (!grid) {
        console.error('Элемент categories-grid не найден!');
        return;
    }
    
    if (!categoriesData || categoriesData.length === 0) {
        console.warn('Категории пусты');
        grid.innerHTML = '<p style="text-align: center; grid-column: 1/-1; color: var(--text-dim);">Категории не найдены</p>';
        return;
    }
    
    console.log('Отображаю категории:', categoriesData);
    
    grid.innerHTML = categoriesData.map(categoryData => {
        const categoryName = typeof categoryData === 'object' ? categoryData.name : categoryData;
        
        // ИСПРАВЛЕНО: правильная нормализация пути к изображению категории
        const rawImagePath = (typeof categoryData === 'object' && categoryData.image_path) 
            ? categoryData.image_path 
            : null;
        const categoryImage = normalizeImagePath(rawImagePath) || '/images/categories/default.png';
        
        console.log(`Категория ${categoryName}, путь:`, rawImagePath, '-> нормализованный:', categoryImage);
        
        const products = categoryProducts[categoryName] || [];
        const productCount = products.length;
        const first5Products = products.slice(0, 5);
        
        return `
            <a href="/category.html?category=${encodeURIComponent(categoryName)}" class="category-card">
                <div class="category-image-wrapper">
                    <img src="${categoryImage}" 
                         alt="${categoryName}" 
                         class="category-image"
                         onerror="console.error('Category image failed:', this.src); this.style.display='none';">
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
    
    console.log('Категории отображены успешно');
}

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

function showError(message) {
    const grid = document.getElementById('categories-grid');
    if (grid) {
        grid.innerHTML = `<p style="text-align: center; grid-column: 1/-1; color: var(--primary);">${message}</p>`;
    }
}

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