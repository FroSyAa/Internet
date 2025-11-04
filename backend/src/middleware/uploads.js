const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Константы из переменных окружения
const IMAGES_CATEGORIES_PATH = process.env.IMAGES_CATEGORIES_PATH || '/app/frontend-images/categories';
const IMAGES_BIKES_PATH = process.env.IMAGES_BIKES_PATH || '/app/frontend-images/bikes';
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024; // 5MB по умолчанию
const MAX_IMAGES_COUNT = parseInt(process.env.MAX_IMAGES_COUNT) || 10;

const categoryStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = IMAGES_CATEGORIES_PATH;
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
      
      const uploadPath = IMAGES_BIKES_PATH + '/' + productName;
      
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
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: fileFilter
}).single('image');

const uploadProductImages = multer({
  storage: productStorage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: fileFilter
}).array('images', MAX_IMAGES_COUNT);

module.exports = {
  uploadCategory,
  uploadProductImages
};