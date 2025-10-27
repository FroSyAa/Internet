const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { uploadCategory } = require('../middleware/uploads');
const adminAuth = require('../middleware/adminAuth');

router.get('/', categoryController.getAllCategories);
router.get('/names', categoryController.getCategoryNames);
router.get('/:id', categoryController.getCategoryById);
router.post('/', adminAuth.requireAuth, uploadCategory, categoryController.createCategory);
router.put('/:id', adminAuth.requireAuth, uploadCategory, categoryController.updateCategory);
router.delete('/:id', adminAuth.requireAuth, categoryController.deleteCategory);

module.exports = router;