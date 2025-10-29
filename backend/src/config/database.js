// Подключение либы
const { Pool } = require('pg');

// Создание клиента ПГ
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || 'admin123',
  database: process.env.DB_NAME || 'motorcycle_shop',
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
});

pool.on('error', (err) => {
  console.error('❌ Ошибка подключения к БД:', err.message);
});

const connectWithRetry = async (retries = 10, delay = 3000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const client = await pool.connect();
      console.log('Подключено к базе данных PostgreSQL');
      
      const result = await client.query('SELECT COUNT(*) FROM products');
      console.log(`Товаров в базе данных: ${result.rows[0].count}`);
      
      client.release();
      return true;
    } catch (err) {
      console.log(`Попытка подключения к PostgreSQL ${i + 1}/${retries}...`);
      console.error(`Ошибка: ${err.message}`);
      
      if (i < retries - 1) {
        console.log(`Повторная попытка через ${delay / 1000} секунд...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        console.error('Не удалось подключиться к PostgreSQL после всех попыток');
        console.error('Проверьте настройки подключения к БД');
        throw err;
      }
    }
  }
};

connectWithRetry().catch(err => {
  console.error('Критическая ошибка подключения к БД:', err.message);
});

module.exports = pool;