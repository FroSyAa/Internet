const API_URL = '/api';

document.getElementById('register-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById('username').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirm-password').value;
  const errorMessage = document.getElementById('error-message');

  errorMessage.textContent = '';

  if (password !== confirmPassword) {
    errorMessage.textContent = 'Пароли не совпадают';
    return;
  }

  if (password.length < 6) {
    errorMessage.textContent = 'Пароль должен быть минимум 6 символов';
    return;
  }

  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      errorMessage.textContent = data.error || 'Ошибка регистрации';
      return;
    }

    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));

    window.location.href = '/';
  } catch (error) {
    console.error('Ошибка регистрации:', error);
    errorMessage.textContent = 'Ошибка регистрации. Попробуйте позже.';
  }
});
