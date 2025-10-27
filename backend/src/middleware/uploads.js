const multer = require('multer');
const path = require('path');
const fs = require('fs');

const categoryStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = '/app/frontend-images/categories';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const productStorage = multer.diskStorage({
  destination: async function (req, file, cb) {
    try {
      const pool = require('../config/database');
      const productId = req.params.id;
      
      if (!productId) {
        return cb(new Error('Product ID not found'));
      }
      
      const result = await pool.query('SELECT product_name FROM products WHERE id = $1', [productId]);
      
      if (result.rows.length === 0) {
        return cb(new Error('Product not found'));
      }
      
      let productName = result.rows[0].product_name;
      
      productName = productName
        .replace(/[^a-zA-Z0-9а-яА-Я]/g, '_')
        .replace(/\s+/g, '_')
        .toLowerCase();
      
      const uploadPath = '/app/frontend-images/bikes/' + productName;
      
      console.log('Upload path:', uploadPath);
      
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: function (req, file, cb) {
    const uniqueName = 'image_' + Date.now() + '_' + Math.round(Math.random() * 1E9) + '.png';
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Только изображения (JPEG, PNG, GIF, WEBP)'));
  }
};

const uploadCategory = multer({
  storage: categoryStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter
}).single('image');

const uploadProductImages = multer({
  storage: productStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter
}).array('images', 10);

module.exports = {
  uploadCategory,
  uploadProductImages
};