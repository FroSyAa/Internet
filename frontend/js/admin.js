// Базовый URL для API запросов
const API_URL = '/api';

// Массив загруженных категорий
let categories = [];
// Массив загруженных товаров
let products = [];

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    loadCategories();
    loadProducts();
    setupForms();
});

// Переключает активную вкладку в админ-панели
function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.getElementById(`${tabName}-tab`).classList.add('active');
    event.target.classList.add('active');
}

// Загружает список всех категорий с сервера
async function loadCategories() {
    try {
        const response = await fetch(`${API_URL}/categories`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        categories = await response.json();
        updateCategorySelect();
        displayCategories();
    } catch (error) {
        console.error('Ошибка загрузки категорий:', error);
        showMessage('Ошибка загрузки категорий', 'error');
    }
}

// Загружает список всех товаров с сервера
async function loadProducts() {
    try {
        const response = await fetch(`${API_URL}/products`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        products = await response.json();
        displayProducts();
    } catch (error) {
        console.error('Ошибка загрузки товаров:', error);
        showMessage('Ошибка загрузки товаров', 'error');
    }
}

// Обновляет выпадающий список категорий в форме создания товара
function updateCategorySelect() {
    const select = document.getElementById('product-category');
    select.innerHTML = '<option value="">Выберите категорию</option>' + 
        categories.map(cat => `<option value="${cat.name}">${cat.name}</option>`).join('');
}

// Отображает список категорий с кнопками удаления
function displayCategories() {
    const list = document.getElementById('categories-list');
    
    if (categories.length === 0) {
        list.innerHTML = '<p style="color: var(--text-dim);">Категории отсутствуют</p>';
        return;
    }
    
    list.innerHTML = categories.map(cat => `
        <div class="list-item">
            <div class="category-item">
                ${cat.image_path ? 
                    `<img src="${cat.image_path}" alt="${cat.name}">` : 
                    '<div style="width: 80px; height: 80px; background: var(--dark); border-radius: 5px;"></div>'
                }
                <div class="list-item-info">
                    <h4>${cat.name}</h4>
                </div>
            </div>
            <div class="list-item-actions">
                <button onclick="deleteCategory(${cat.id})">Удалить</button>
            </div>
        </div>
    `).join('');
}

// Отображает список товаров с информацией о них и кнопками удаления
function displayProducts() {
    const list = document.getElementById('products-list');
    
    if (products.length === 0) {
        list.innerHTML = '<p style="color: var(--text-dim);">Товары отсутствуют</p>';
        return;
    }
    
    list.innerHTML = products.map(product => {
        const imageCount = product.images ? product.images.length : 0;
        return `
            <div class="list-item">
                <div class="list-item-info">
                    <h4>${product.product_name}</h4>
                    <p>Цена: ${product.price.toLocaleString()} ₽</p>
                    <p>Категория: ${product.category}</p>
                    <p>Изображений: ${imageCount}</p>
                </div>
                <div class="list-item-actions">
                    <button onclick="deleteProduct(${product.id})">Удалить</button>
                </div>
            </div>
        `;
    }).join('');
}

// Настраивает обработчики отправки форм для создания категорий и товаров
function setupForms() {
    document.getElementById('category-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('category-name').value;
        const imageFile = document.getElementById('category-image').files[0];
        
        const formData = new FormData();
        formData.append('name', name);
        if (imageFile) {
            formData.append('image', imageFile);
        }
        
        try {
            const response = await fetch(`${API_URL}/categories`, {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Ошибка создания категории');
            }
            
            showMessage('Категория создана', 'success');
            document.getElementById('category-form').reset();
            loadCategories();
        } catch (error) {
            console.error('Ошибка создания категории:', error);
            showMessage(error.message, 'error');
        }
    });
    
    document.getElementById('product-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const productData = {
            product_name: document.getElementById('product-name').value,
            price: document.getElementById('product-price').value,
            category: document.getElementById('product-category').value,
            description: document.getElementById('product-description').value,
            interest: document.getElementById('product-interest').value
        };
        
        try {
            const response = await fetch(`${API_URL}/products`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(productData)
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Ошибка создания товара');
            }
            
            const product = await response.json();
            
            const imageFiles = document.getElementById('product-images').files;
            if (imageFiles.length > 0) {
                const formData = new FormData();
                for (let i = 0; i < imageFiles.length; i++) {
                    formData.append('images', imageFiles[i]);
                }
                formData.append('product_name', productData.product_name);
                
                const uploadResponse = await fetch(`${API_URL}/products/${product.id}/images`, {
                    method: 'POST',
                    body: formData
                });
                
                if (!uploadResponse.ok) {
                    throw new Error('Ошибка загрузки изображений');
                }
            }
            
            showMessage('Товар создан', 'success');
            document.getElementById('product-form').reset();
            loadProducts();
        } catch (error) {
            console.error('Ошибка создания товара:', error);
            showMessage(error.message, 'error');
        }
    });
}

// Удаляет категорию по ID после подтверждения пользователя
async function deleteCategory(id) {
    if (!confirm('Удалить категорию?')) return;
    
    try {
        const response = await fetch(`${API_URL}/categories/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Ошибка удаления');
        }
        
        showMessage('Категория удалена', 'success');
        loadCategories();
    } catch (error) {
        console.error('Ошибка удаления категории:', error);
        showMessage(error.message, 'error');
    }
}

// Удаляет товар по ID после подтверждения пользователя
async function deleteProduct(id) {
    if (!confirm('Удалить товар?')) return;
    
    try {
        const response = await fetch(`${API_URL}/products/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Ошибка удаления');
        }
        
        showMessage('Товар удален', 'success');
        loadProducts();
    } catch (error) {
        console.error('Ошибка удаления товара:', error);
        showMessage(error.message, 'error');
    }
}

// Показывает временное уведомление на странице (success или error)
function showMessage(text, type) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = 'block';
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 3000);
}
