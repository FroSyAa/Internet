const pool = require('../config/database');
const redisClient = require('../config/redis');

const createOrder = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const cartKey = `cart:${req.userId}`;
    const cartData = await redisClient.get(cartKey);

    if (!cartData) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Корзина пуста' });
    }

    const cart = JSON.parse(cartData);

    if (cart.items.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Корзина пуста' });
    }

    const orderResult = await client.query(
      'INSERT INTO orders (user_id, total_amount, status) VALUES ($1, $2, $3) RETURNING *',
      [req.userId, cart.total, 'completed']
    );

    const order = orderResult.rows[0];

    for (const item of cart.items) {
      await client.query(
        'INSERT INTO order_items (order_id, product_id, product_name, price, quantity) VALUES ($1, $2, $3, $4, $5)',
        [order.id, item.productId, item.productName, item.price, item.quantity]
      );
    }

    await redisClient.del(cartKey);

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Заказ успешно создан',
      order: {
        id: order.id,
        totalAmount: order.total_amount,
        status: order.status,
        createdAt: order.created_at,
        items: cart.items
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Order creation error:', error);
    res.status(500).json({ error: 'Ошибка создания заказа' });
  } finally {
    client.release();
  }
};

const getOrders = async (req, res) => {
  try {
    const ordersResult = await pool.query(
      'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
      [req.userId]
    );

    const orders = await Promise.all(
      ordersResult.rows.map(async (order) => {
        const itemsResult = await pool.query(
          'SELECT * FROM order_items WHERE order_id = $1',
          [order.id]
        );

        return {
          id: order.id,
          totalAmount: order.total_amount,
          status: order.status,
          createdAt: order.created_at,
          items: itemsResult.rows
        };
      })
    );

    res.json({ orders });
  } catch (error) {
    console.error('Orders retrieval error:', error);
    res.status(500).json({ error: 'Ошибка получения заказов' });
  }
};

const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const orderResult = await pool.query(
      'SELECT * FROM orders WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Заказ не найден' });
    }

    const order = orderResult.rows[0];

    const itemsResult = await pool.query(
      'SELECT * FROM order_items WHERE order_id = $1',
      [order.id]
    );

    res.json({
      order: {
        id: order.id,
        totalAmount: order.total_amount,
        status: order.status,
        createdAt: order.created_at,
        items: itemsResult.rows
      }
    });
  } catch (error) {
    console.error('Order retrieval error:', error);
    res.status(500).json({ error: 'Ошибка получения заказа' });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const ordersResult = await pool.query(`
      SELECT o.*, u.username 
      FROM orders o 
      LEFT JOIN users u ON o.user_id = u.id 
      ORDER BY o.created_at DESC
    `);

    const orders = await Promise.all(
      ordersResult.rows.map(async (order) => {
        const itemsResult = await pool.query(
          'SELECT * FROM order_items WHERE order_id = $1',
          [order.id]
        );

        return {
          id: order.id,
          user_id: order.user_id,
          username: order.username,
          total_amount: order.total_amount,
          status: order.status,
          created_at: order.created_at,
          items: itemsResult.rows
        };
      })
    );

    res.json(orders);
  } catch (error) {
    console.error('Orders retrieval error:', error);
    res.status(500).json({ error: 'Ошибка получения заказов' });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Некорректный статус' });
    }

    const result = await pool.query(
      'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Заказ не найден' });
    }

    res.json({
      message: 'Статус обновлен',
      order: result.rows[0]
    });
  } catch (error) {
    console.error('Status update error:', error);
    res.status(500).json({ error: 'Ошибка обновления статуса' });
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus
};
