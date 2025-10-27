const API_URL = '/api';

let products = [];
let categories = [];
let currentFilter = 'all';

document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    loadCategories();
    setupEventListeners();
});

// Загрузка всех товаров
async function loadProducts() {
    try {
        const response = await fetch(`${API_URL}/products`);
        products = await response.json();
        displayProducts();
    } catch (error) {
        console.error('Ошибка загрузки товаров:', error);
        showError('Не удалось загрузить товары');
    }
}

// Загрузка категорий
async function loadCategories() {
    try {
        const response = await fetch(`${API_URL}/products/categories`);
        categories = await response.json();
        createFilterButtons();
    } catch (error) {
        console.error('Ошибка загрузки категорий:', error);
    }
}

function createFilterButtons() {
    const container = document.querySelector('.filter-buttons');
    
    categories.forEach(category => {
        const btn = document.createElement('button');
        btn.className = 'filter-btn';
        const categoryName = typeof category === 'object' ? category.name : category;
        btn.textContent = categoryName;
        btn.dataset.category = categoryName;
        btn.onclick = () => filterByCategory(categoryName);
        container.appendChild(btn);
    });
}

// Отображение товаров
function displayProducts(filteredProducts = products) {
    const grid = document.getElementById('products-grid');
    
    if (filteredProducts.length === 0) {
        grid.innerHTML = '<p style="text-align: center; grid-column: 1/-1; color: var(--text-dim);">Товары не найдены</p>';
        return;
    }
    
    grid.innerHTML = filteredProducts.map(product => `
        <div class="product-card" onclick="showProductDetails(${product.id})">
            <div class="product-image">
                ${product.image_url ? 
                    `<img src="${product.image_url}" alt="${product.product_name}" onerror="this.style.display='none'; this.parentElement.innerHTML='🏍️'">` 
                    : '🏍️'
                }
            </div>
            <div class="product-info">
                <div class="product-category">${product.category}</div>
                <h3 class="product-name">${product.product_name}</h3>
                <p class="product-description">${truncateText(product.description, 80)}</p>
                <div class="product-price">${formatPrice(product.price)} ₽</div>
            </div>
            <div class="product-interest">
                ${product.interest}
            </div>
        </div>
    `).join('');
}

// Фильтрация по категории
function filterByCategory(category) {
    currentFilter = category;
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.category === category || (category === 'all' && !btn.dataset.category)) {
            btn.classList.add('active');
        }
    });
    
    if (category === 'all') {
        displayProducts(products);
    } else {
        const filtered = products.filter(p => p.category === category);
        displayProducts(filtered);
    }
}

// Показать детали товара в модальном окне
async function showProductDetails(id) {
    try {
        const response = await fetch(`${API_URL}/products/${id}`);
        const product = await response.json();
        
        const modalBody = document.getElementById('modal-body');
        modalBody.innerHTML = `
            <div style="text-align: center;">
                <div style="font-size: 6rem; margin: 1rem 0;">🏍️</div>
                <div style="color: var(--accent); font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">${product.category}</div>
                <h2 style="margin: 0.5rem 0; color: var(--text-light);">${product.product_name}</h2>
                
                <div style="background: var(--secondary); padding: 1.5rem; border-radius: 10px; margin: 1.5rem 0; text-align: left;">
                    <h3 style="color: var(--primary); margin-bottom: 1rem;">Характеристики:</h3>
                    <p style="color: var(--text-light); line-height: 1.8; white-space: pre-line;">${product.interest}</p>
                </div>
                
                <p style="text-align: left; margin: 1rem 0; line-height: 1.6; color: var(--text-dim);">${product.description}</p>
                
                <div style="font-size: 2.5rem; color: var(--primary); font-weight: 900; margin: 1.5rem 0;">
                    ${formatPrice(product.price)} ₽
                </div>
                
                <button class="filter-btn active" style="width: 100%; padding: 1rem; font-size: 1rem;">
                    Связаться с нами
                </button>
            </div>
        `;
        
        document.getElementById('modal').style.display = 'block';
    } catch (error) {
        console.error('Ошибка загрузки деталей:', error);
        showError('Не удалось загрузить информацию о товаре');
    }
}

// Форматирование цены
function formatPrice(price) {
    return new Intl.NumberFormat('ru-RU').format(price);
}

// Сокращение текста
function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// Показать ошибку
function showError(message) {
    console.error(message);
}

// Настройка обработчиков событий
function setupEventListeners() {
    document.querySelector('.modal-close').onclick = () => {
        document.getElementById('modal').style.display = 'none';
    };
    
    window.onclick = (event) => {
        const modal = document.getElementById('modal');
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
    
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
    
    const allBtn = document.querySelector('.filter-btn[data-category="all"]');
    if (allBtn) {
        allBtn.onclick = () => filterByCategory('all');
    }
}
