const auth = {
  getToken() {
    return localStorage.getItem('token');
  },

  setToken(token) {
    localStorage.setItem('token', token);
  },

  removeToken() {
    localStorage.removeItem('token');
  },

  isAuthenticated() {
    return !!this.getToken();
  },

  getUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  setUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
  },

  removeUser() {
    localStorage.removeItem('user');
  },

  logout() {
    this.removeToken();
    this.removeUser();
    window.location.href = '/';
  },

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

// Экспортируем для использования в других скриптах
window.auth = auth;
window.updateUserMenu = updateUserMenu;
window.updateCartBadge = updateCartBadge;