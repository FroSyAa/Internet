const redisClient = require('../config/redis');

const CART_TTL = 24 * 60 * 60;

const getCart = async (req, res) => {
  try {
    const cartKey = `cart:${req.userId}`;
    const cart = await redisClient.get(cartKey);

    if (!cart) {
      return res.json({ items: [], total: 0 });
    }

    const cartData = JSON.parse(cart);
    res.json(cartData);
  } catch (error) {
    console.error('Cart retrieval error:', error);
    res.status(500).json({ error: 'Ошибка получения корзины' });
  }
};

const addToCart = async (req, res) => {
  try {
    const { productId, productName, price, quantity = 1 } = req.body;

    if (!productId || !productName || !price) {
      return res.status(400).json({ error: 'Неверные данные товара' });
    }

    const cartKey = `cart:${req.userId}`;
    const existingCart = await redisClient.get(cartKey);
    
    let cart = existingCart ? JSON.parse(existingCart) : { items: [], total: 0 };

    const existingItemIndex = cart.items.findIndex(item => item.productId === productId);

    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      cart.items.push({ productId, productName, price, quantity });
    }

    cart.total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    await redisClient.setEx(cartKey, CART_TTL, JSON.stringify(cart));

    res.json({ message: 'Товар добавлен в корзину', cart });
  } catch (error) {
    console.error('Cart addition error:', error);
    res.status(500).json({ error: 'Ошибка добавления в корзину' });
  }
};

const updateCartItem = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    if (!productId || quantity < 0) {
      return res.status(400).json({ error: 'Неверные данные' });
    }

    const cartKey = `cart:${req.userId}`;
    const existingCart = await redisClient.get(cartKey);

    if (!existingCart) {
      return res.status(404).json({ error: 'Корзина пуста' });
    }

    let cart = JSON.parse(existingCart);

    if (quantity === 0) {
      cart.items = cart.items.filter(item => item.productId !== productId);
    } else {
      const itemIndex = cart.items.findIndex(item => item.productId === productId);
      if (itemIndex > -1) {
        cart.items[itemIndex].quantity = quantity;
      }
    }

    cart.total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    if (cart.items.length === 0) {
      await redisClient.del(cartKey);
      return res.json({ message: 'Корзина очищена', cart: { items: [], total: 0 } });
    }

    await redisClient.setEx(cartKey, CART_TTL, JSON.stringify(cart));

    res.json({ message: 'Корзина обновлена', cart });
  } catch (error) {
    console.error('Cart update error:', error);
    res.status(500).json({ error: 'Ошибка обновления корзины' });
  }
};

const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;

    const cartKey = `cart:${req.userId}`;
    const existingCart = await redisClient.get(cartKey);

    if (!existingCart) {
      return res.status(404).json({ error: 'Корзина пуста' });
    }

    let cart = JSON.parse(existingCart);
    cart.items = cart.items.filter(item => item.productId !== parseInt(productId));
    cart.total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    if (cart.items.length === 0) {
      await redisClient.del(cartKey);
      return res.json({ message: 'Корзина очищена', cart: { items: [], total: 0 } });
    }

    await redisClient.setEx(cartKey, CART_TTL, JSON.stringify(cart));

    res.json({ message: 'Товар удален из корзины', cart });
  } catch (error) {
    console.error('Cart item removal error:', error);
    res.status(500).json({ error: 'Ошибка удаления из корзины' });
  }
};

const clearCart = async (req, res) => {
  try {
    const cartKey = `cart:${req.userId}`;
    await redisClient.del(cartKey);

    res.json({ message: 'Корзина очищена' });
  } catch (error) {
    console.error('Cart clear error:', error);
    res.status(500).json({ error: 'Ошибка очистки корзины' });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
};
