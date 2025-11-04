// Объект для управления аутентификацией пользователя
const auth = {
  // Получает JWT токен из localStorage
  getToken() {
    return localStorage.getItem('token');
  },

  // Сохраняет JWT токен в localStorage
  setToken(token) {
    localStorage.setItem('token', token);
  },

  // Удаляет JWT токен из localStorage
  removeToken() {
    localStorage.removeItem('token');
  },

  // Проверяет, авторизован ли пользователь
  isAuthenticated() {
    return !!this.getToken();
  },

  // Получает данные пользователя из localStorage
  getUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Сохраняет данные пользователя в localStorage
  setUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
  },

  // Удаляет данные пользователя из localStorage
  removeUser() {
    localStorage.removeItem('user');
  },

  // Выполняет выход пользователя: удаляет токен и данные, перенаправляет на главную
  logout() {
    this.removeToken();
    this.removeUser();
    window.location.href = '/';
  },

  // Выполняет fetch запрос с автоматическим добавлением Authorization заголовка
  async fetchWithAuth(url, options = {}) {
    const token = this.getToken();
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (response.status === 401) {
      this.logout();
      throw new Error('Unauthorized');
    }

    return response;
  }
};

// Обновляет меню пользователя в навигации: показывает имя и кнопку выхода или ссылки входа/регистрации
function updateUserMenu() {
  const userMenu = document.getElementById('user-menu');
  if (!userMenu) return;

  if (auth.isAuthenticated()) {
    const user = auth.getUser();
    userMenu.innerHTML = `
      <span class="user-name">👤 ${user?.username || 'Пользователь'}</span>
      <button onclick="auth.logout()" class="logout-btn">Выйти</button>
    `;
  } else {
    userMenu.innerHTML = `
      <a href="/login.html" class="login-link">Войти</a>
      <a href="/register.html" class="register-link">Регистрация</a>
    `;
  }
}

// Обновляет бейдж корзины: загружает количество товаров и отображает его
async function updateCartBadge() {
  const cartBadge = document.getElementById('cart-badge');
  if (!cartBadge) return;

  if (!auth.isAuthenticated()) {
    cartBadge.textContent = '0';
    cartBadge.style.display = 'none';
    return;
  }

  try {
    const response = await auth.fetchWithAuth('/api/cart');
    const data = await response.json();
    const totalItems = data.items ? data.items.reduce((sum, item) => sum + item.quantity, 0) : 0;
    cartBadge.textContent = totalItems;
    cartBadge.style.display = totalItems > 0 ? 'flex' : 'none';
  } catch (error) {
    console.error('Ошибка загрузки корзины:', error);
    cartBadge.textContent = '0';
    cartBadge.style.display = 'none';
  }
}

// Инициализация при загрузке страницы
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    updateUserMenu();
    updateCartBadge();
  });
} else {
  updateUserMenu();
  updateCartBadge();
}

// Экспортирует объекты и функции в глобальную область видимости для использования в других скриптах
window.auth = auth;
window.updateUserMenu = updateUserMenu;
window.updateCartBadge = updateCartBadge;