const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { uploadProductImages } = require('../middleware/uploads');
const adminAuth = require('../middleware/adminAuth');

router.get('/categories', productController.getCategories);
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);
router.get('/:id/images', productController.getProductImages);
router.post('/', adminAuth.requireAuth, productController.createProduct);
router.post('/:id/images', adminAuth.requireAuth, uploadProductImages, productController.uploadImages);
router.put('/:id', adminAuth.requireAuth, productController.updateProduct);
router.delete('/:id', adminAuth.requireAuth, productController.deleteProduct);
router.delete('/images/:imageId', adminAuth.requireAuth, productController.deleteProductImage);

module.exports = router;