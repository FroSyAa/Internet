// Базовый URL для API запросов
const API_URL = '/api';

// Загружает и отображает историю заказов текущего пользователя
async function loadOrders() {
  const ordersContent = document.getElementById('orders-content');

  if (!auth.isAuthenticated()) {
    ordersContent.innerHTML = `
      <div class="orders-empty">
        <h3>Войдите, чтобы посмотреть заказы</h3>
        <a href="/login.html" class="auth-button">Войти</a>
      </div>
    `;
    return;
  }

  try {
    const response = await auth.fetchWithAuth(`${API_URL}/orders`);
    const data = await response.json();

    if (!data.orders || data.orders.length === 0) {
      ordersContent.innerHTML = `
        <div class="orders-empty">
          <h3>У вас пока нет заказов</h3>
          <a href="/#categories" class="auth-button">Перейти к каталогу</a>
        </div>
      `;
      return;
    }

    displayOrders(data.orders);
  } catch (error) {
    console.error('Ошибка загрузки заказов:', error);
    ordersContent.innerHTML = `
      <div class="orders-empty">
        <h3>Ошибка загрузки заказов</h3>
      </div>
    `;
  }
}

// Отображает список заказов с деталями и датой оформления
function displayOrders(orders) {
  const ordersContent = document.getElementById('orders-content');
  
  const ordersHtml = orders.map(order => {
    const date = new Date(order.createdAt).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const itemsHtml = order.items.map(item => `
      <div class="order-item">
        <div>
          <div class="order-item-name">${item.product_name}</div>
          <div class="order-item-details">${item.quantity} x ${item.price.toLocaleString('ru-RU')} ₽</div>
        </div>
        <div>${(item.quantity * item.price).toLocaleString('ru-RU')} ₽</div>
      </div>
    `).join('');

    return `
      <div class="order-card">
        <div class="order-header">
          <div class="order-id">Заказ от ${date}</div>
        </div>
        <div class="order-items">
          ${itemsHtml}
        </div>
        <div class="order-total">Итого: ${order.totalAmount.toLocaleString('ru-RU')} ₽</div>
      </div>
    `;
  }).join('');

  ordersContent.innerHTML = ordersHtml;
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
  loadOrders();
});
