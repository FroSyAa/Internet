// Базовый URL для API запросов
const API_URL = '/api';

// Загружает и отображает содержимое корзины текущего пользователя
async function loadCart() {
  const cartContent = document.getElementById('cart-content');

  if (!auth.isAuthenticated()) {
    cartContent.innerHTML = `
      <div class="cart-empty">
        <h3>Войдите, чтобы добавлять товары в корзину</h3>
        <a href="/login.html" class="auth-button">Войти</a>
      </div>
    `;
    return;
  }

  try {
    const response = await auth.fetchWithAuth(`${API_URL}/cart`);
    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      cartContent.innerHTML = `
        <div class="cart-empty">
          <h3>Корзина пуста</h3>
          <a href="/#categories" class="auth-button">Перейти к каталогу</a>
        </div>
      `;
      return;
    }

    displayCart(data);
  } catch (error) {
    console.error('Ошибка загрузки корзины:', error);
    cartContent.innerHTML = `
      <div class="cart-empty">
        <h3>Ошибка загрузки корзины</h3>
      </div>
    `;
  }
}

// Отображает товары корзины с кнопками управления количеством и общей суммой
function displayCart(cartData) {
  const cartContent = document.getElementById('cart-content');
  
  const itemsHtml = cartData.items.map(item => `
    <div class="cart-item">
      <div class="cart-item-info">
        <div class="cart-item-name">${item.productName}</div>
        <div class="cart-item-price">${item.price.toLocaleString('ru-RU')} ₽</div>
      </div>
      <div class="cart-item-controls">
        <button class="quantity-btn" onclick="updateQuantity(${item.productId}, ${item.quantity - 1})">-</button>
        <span class="cart-item-quantity">${item.quantity}</span>
        <button class="quantity-btn" onclick="updateQuantity(${item.productId}, ${item.quantity + 1})">+</button>
        <button class="remove-btn" onclick="removeItem(${item.productId})">Удалить</button>
      </div>
    </div>
  `).join('');

  cartContent.innerHTML = `
    <div class="cart-items">
      ${itemsHtml}
    </div>
    <div class="cart-summary">
      <div class="cart-total">Итого: ${cartData.total.toLocaleString('ru-RU')} ₽</div>
      <button class="checkout-btn" onclick="checkout()">Оформить заказ</button>
    </div>
  `;
}

// Обновляет количество товара в корзине
async function updateQuantity(productId, newQuantity) {
  try {
    const response = await auth.fetchWithAuth(`${API_URL}/cart/update`, {
      method: 'PUT',
      body: JSON.stringify({ productId, quantity: newQuantity })
    });

    if (response.ok) {
      loadCart();
      updateCartBadge();
    }
  } catch (error) {
    console.error('Ошибка обновления корзины:', error);
  }
}

// Удаляет товар из корзины по ID
async function removeItem(productId) {
  try {
    const response = await auth.fetchWithAuth(`${API_URL}/cart/${productId}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      loadCart();
      updateCartBadge();
    }
  } catch (error) {
    console.error('Ошибка удаления товара:', error);
  }
}

// Оформляет заказ из текущей корзины и перенаправляет на страницу заказов
async function checkout() {
  try {
    const response = await auth.fetchWithAuth(`${API_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      window.location.href = '/orders.html';
    } else {
      const data = await response.json();
      console.error('Ошибка оформления заказа:', data.error || 'Неизвестная ошибка');
    }
  } catch (error) {
    console.error('Ошибка оформления заказа:', error);
  }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
  loadCart();
});
