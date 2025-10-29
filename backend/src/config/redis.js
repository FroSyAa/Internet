const redis = require('redis');

const redisClient = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
  }
});

redisClient.on('error', (err) => console.error('Redis Error:', err));
redisClient.on('connect', () => console.log('Redis подключен'));

(async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    console.error('Ошибка подключения к Redis:', error);
  }
})();

module.exports = redisClient;