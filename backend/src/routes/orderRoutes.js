const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus
} = require('../controllers/orderController');
const authMiddleware = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

router.get('/admin/all', adminAuth.requireAuth, getAllOrders);
router.put('/:id/status', adminAuth.requireAuth, updateOrderStatus);

router.post('/', authMiddleware, createOrder);
router.get('/', authMiddleware, getOrders);
router.get('/:id', authMiddleware, getOrderById);

module.exports = router;