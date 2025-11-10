const API_URL = '/api';

let products = [];
let currentCategory = '';
let currentProductImages = [];
let currentImageIndex = 0;

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    currentCategory = urlParams.get('category');
    
    if (!currentCategory) {
        window.location.href = '/';
        return;
    }
    
    document.getElementById('category-name').textContent = currentCategory;
    document.getElementById('category-title').textContent = currentCategory;
    document.getElementById('page-title').textContent = `${currentCategory} - moto-moto`;
    
    loadProducts();
    setupEventListeners();
});

async function loadProducts() {
    try {
        const response = await fetch(`${API_URL}/products?category=${encodeURIComponent(currentCategory)}`);
        products = await response.json();
        console.log('Loaded products:', products);
        displayProducts();
    } catch (error) {
        console.error('Ошибка загрузки товаров:', error);
        showError('Не удалось загрузить товары');
    }
}

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

function displayProducts() {
    const grid = document.getElementById('products-grid');
    
    if (products.length === 0) {
        grid.innerHTML = '<p style="text-align: center; grid-column: 1/-1; color: var(--text-dim);">Товары не найдены</p>';
        return;
    }
    
    grid.innerHTML = products.map(product => {
        // Берем первое изображение из массива images
        const firstImage = product.images && product.images.length > 0 
            ? normalizeImagePath(product.images[0].image_path)
            : null;
        
        console.log(`Product: ${product.product_name}, normalized image:`, firstImage);
        
        return `
            <div class="product-card" onclick="showProductDetails(${product.id})">
                <div class="product-image">
                    ${firstImage ? 
                        `<img src="${firstImage}" alt="${product.product_name}" 
                              onerror="console.error('Image load error:', this.src); this.style.display='none'; this.parentElement.innerHTML='🏍️'">` 
                        : '🏍️'
                    }
                </div>
                <div class="product-info">
                    <h3 class="product-name">${product.product_name}</h3>
                </div>
                <div class="product-hover-info">
                    <div class="product-hover-tagline">${product.description || ''}</div>
                    <div class="product-hover-specs">${product.interest || ''}</div>
                </div>
            </div>
        `;
    }).join('');
}

async function loadProductImages(productId) {
    try {
        const response = await fetch(`${API_URL}/products/${productId}/images`);
        const data = await response.json();
        // Нормализуем все пути изображений
        return data.images.map(img => normalizeImagePath(img.image_path)).filter(Boolean);
    } catch (error) {
        console.error('Ошибка загрузки изображений:', error);
        return [];
    }
}

async function showProductDetails(id) {
    try {
        const response = await fetch(`${API_URL}/products/${id}`);
        const product = await response.json();
        
        currentProductImages = await loadProductImages(id);
        currentImageIndex = 0;
        
        // Если нет загруженных изображений, но есть массив images в продукте
        if (currentProductImages.length === 0 && product.images && product.images.length > 0) {
            currentProductImages = product.images.map(img => normalizeImagePath(img.image_path)).filter(Boolean);
        }
        
        const modalBody = document.getElementById('modal-body');
        const addToCartBtn = auth.isAuthenticated() 
            ? `<button class="add-to-cart-btn" onclick="addToCart(${product.id}, '${product.product_name.replace(/'/g, "\\'")}', ${product.price})">
                Добавить в корзину
               </button>`
            : `<a href="/login.html" class="add-to-cart-btn">Войдите, чтобы добавить в корзину</a>`;
        
        const imageGalleryHTML = currentProductImages.length > 0 
            ? `<div class="image-gallery" id="image-gallery" onmousemove="handleGalleryMouseMove(event)">
                <img id="gallery-image" src="${currentProductImages[0]}" alt="${product.product_name}" 
                     onerror="this.style.display='none'; this.parentElement.innerHTML='<div style=\\'font-size: 6rem;\\'>🏍️</div>'">
                ${currentProductImages.length > 1 ? `<div class="image-indicator">${currentImageIndex + 1} / ${currentProductImages.length}</div>` : ''}
               </div>`
            : `<div style="font-size: 6rem; margin: 1rem 0;">🏍️</div>`;
        
        modalBody.innerHTML = `
            <div style="text-align: center;">
                ${imageGalleryHTML}
                <div style="color: var(--accent); font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-top: 1rem;">${product.category}</div>
                <h2 style="margin: 0.5rem 0; color: var(--text-light);">${product.product_name}</h2>
                
                <div style="background: var(--secondary); padding: 1.5rem; border-radius: 10px; margin: 1.5rem 0; text-align: left;">
                    <h3 style="color: var(--primary); margin-bottom: 1rem;">Характеристики:</h3>
                    <p style="color: var(--text-light); line-height: 1.8; white-space: pre-line;">${product.interest || 'Не указано'}</p>
                </div>
                
                <p style="text-align: left; margin: 1rem 0; line-height: 1.6; color: var(--text-dim);">${product.description || 'Описание отсутствует'}</p>
                
                <div style="font-size: 2.5rem; color: var(--primary); font-weight: 900; margin: 1.5rem 0;">
                    ${formatPrice(product.price)} ₽
                </div>
                
                ${addToCartBtn}
            </div>
        `;
        
        document.getElementById('modal').style.display = 'block';
    } catch (error) {
        console.error('Ошибка загрузки деталей:', error);
        showError('Не удалось загрузить информацию о товаре');
    }
}

function handleGalleryMouseMove(event) {
    if (currentProductImages.length <= 1) return;
    
    const gallery = event.currentTarget;
    const rect = gallery.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const galleryWidth = rect.width;
    
    const imageIndex = Math.floor((mouseX / galleryWidth) * currentProductImages.length);
    const clampedIndex = Math.max(0, Math.min(imageIndex, currentProductImages.length - 1));
    
    if (clampedIndex !== currentImageIndex) {
        currentImageIndex = clampedIndex;
        const galleryImage = document.getElementById('gallery-image');
        const indicator = gallery.querySelector('.image-indicator');
        
        if (galleryImage) {
            galleryImage.src = currentProductImages[currentImageIndex];
        }
        
        if (indicator) {
            indicator.textContent = `${currentImageIndex + 1} / ${currentProductImages.length}`;
        }
    }
}

async function addToCart(productId, productName, price) {
    try {
        const response = await auth.fetchWithAuth(`${API_URL}/cart/add`, {
            method: 'POST',
            body: JSON.stringify({
                productId,
                productName,
                price,
                quantity: 1
            })
        });

        if (response.ok) {
            updateCartBadge();
            document.getElementById('modal').style.display = 'none';
        } else {
            const data = await response.json();
            console.error('Ошибка:', data.error || 'Ошибка добавления в корзину');
        }
    } catch (error) {
        console.error('Ошибка добавления в корзину:', error);
    }
}

function formatPrice(price) {
    return new Intl.NumberFormat('ru-RU').format(price);
}

function showError(message) {
    console.error(message);
}

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
}