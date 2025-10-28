const API_URL = '/api';

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const errorMessage = document.getElementById('error-message');

  errorMessage.textContent = '';

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (!response.ok) {
      errorMessage.textContent = data.error || 'Ошибка входа';
      return;
    }

    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));

    window.location.href = '/';
  } catch (error) {
    console.error('Ошибка входа:', error);
    errorMessage.textContent = 'Ошибка входа. Попробуйте позже.';
  }
});
