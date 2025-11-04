const pool = require('../config/database');
const path = require('path');
const fs = require('fs').promises;

// Базовый путь к изображениям из переменных окружения
const IMAGES_PATH = process.env.IMAGES_PATH || '/app/frontend-images';

// Получает все товары или фильтрует по категории; возвращает товары с массивом изображений
exports.getAllProducts = async (req, res) => {
    try {
        const { category } = req.query;
        
        let query = `
            SELECT p.*, 
                   (SELECT pi2.image_path FROM product_images pi2 WHERE pi2.product_id = p.id ORDER BY pi2.display_order LIMIT 1) AS image_url,
                   COALESCE(json_agg(
                       json_build_object('id', pi.id, 'image_path', pi.image_path, 'display_order', pi.display_order)
                       ORDER BY pi.display_order
                   ) FILTER (WHERE pi.id IS NOT NULL), '[]') as images
            FROM products p
            LEFT JOIN product_images pi ON p.id = pi.product_id
        `;
        
        let params = [];
        
        if (category) {
            query += ' WHERE p.category = $1';
            params.push(category);
        }
        
        query += ' GROUP BY p.id ORDER BY p.id';
        
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Products retrieval error:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
};

// Получает товар по ID со всеми связанными изображениями
exports.getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(`
            SELECT p.*, 
                   (SELECT pi2.image_path FROM product_images pi2 WHERE pi2.product_id = p.id ORDER BY pi2.display_order LIMIT 1) AS image_url,
                   COALESCE(json_agg(
                       json_build_object('id', pi.id, 'image_path', pi.image_path, 'display_order', pi.display_order)
                       ORDER BY pi.display_order
                   ) FILTER (WHERE pi.id IS NOT NULL), '[]') as images
            FROM products p
            LEFT JOIN product_images pi ON p.id = pi.product_id
            WHERE p.id = $1
            GROUP BY p.id
        `, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Товар не найден' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Product retrieval error:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
};

// Возвращает список всех категорий (название и путь к изображению)
exports.getCategories = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT name, image_path FROM categories ORDER BY name'
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Categories retrieval error:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
};

// Создает новый товар без изображений (изображения загружаются отдельно через uploadImages)
exports.createProduct = async (req, res) => {
    try {
        const { product_name, price, description, category, interest } = req.body;
        
        const result = await pool.query(
            'INSERT INTO products (product_name, price, description, category, interest) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [product_name, price, description, category, interest]
        );
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Product creation error:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
};

// Обновляет данные товара (название, цену, описание и т.д.)
exports.updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { product_name, price, description, category, interest } = req.body;
        
        const result = await pool.query(
            'UPDATE products SET product_name = $1, price = $2, description = $3, category = $4, interest = $5 WHERE id = $6 RETURNING *',
            [product_name, price, description, category, interest, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Товар не найден' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Product update error:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
};

// Удаляет товар вместе со всеми связанными изображениями (файлы удаляются с диска)
exports.deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const images = await pool.query(
            'SELECT image_path FROM product_images WHERE product_id = $1',
            [id]
        );
        
        for (const img of images.rows) {
            const relativePath = img.image_path.replace(/^\/images\//, '');
            const imagePath = path.join(IMAGES_PATH, relativePath);
            try {
                await fs.unlink(imagePath);
            } catch (err) {
                console.log('Image file not found or already deleted:', imagePath);
            }
        }
        
        const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Товар не найден' });
        }
        
        res.json({ message: 'Товар успешно удален' });
    } catch (error) {
        console.error('Product deletion error:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
};

/**
 * Загружает изображения для товара (до MAX_IMAGES_COUNT штук)
 * Создает безопасное имя папки из названия товара и сохраняет пути в БД
 */
exports.uploadImages = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'Файлы не загружены' });
        }
        
        const product = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
        if (product.rows.length === 0) {
            return res.status(404).json({ error: 'Товар не найден' });
        }
        
        const productName = product.rows[0].product_name;
        const safeProductName = productName
            .replace(/[^a-zA-Z0-9а-яА-Я]/g, '_')
            .replace(/\s+/g, '_')
            .toLowerCase();
        
        const uploadedImages = [];
        
        for (let i = 0; i < req.files.length; i++) {
            const file = req.files[i];
            const imagePath = `/images/bikes/${safeProductName}/${file.filename}`;
            
            const result = await pool.query(
                'INSERT INTO product_images (product_id, image_path, display_order) VALUES ($1, $2, $3) RETURNING *',
                [id, imagePath, i]
            );
            
            uploadedImages.push(result.rows[0]);
        }
        
        res.json({
            message: 'Изображения успешно загружены',
            imagesCount: uploadedImages.length,
            images: uploadedImages
        });
    } catch (error) {
        console.error('Image upload error:', error);
        res.status(500).json({ error: 'Ошибка сервера: ' + error.message });
    }
};

// Получает все изображения товара в порядке отображения
exports.getProductImages = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'SELECT * FROM product_images WHERE product_id = $1 ORDER BY display_order',
            [id]
        );
        
        res.json({ images: result.rows });
    } catch (error) {
        console.error('Images retrieval error:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
};

// Удаляет конкретное изображение товара по ID (файл удаляется с диска, запись из БД)
exports.deleteProductImage = async (req, res) => {
    try {
        const { imageId } = req.params;
        
        const image = await pool.query(
            'SELECT * FROM product_images WHERE id = $1',
            [imageId]
        );
        
        if (image.rows.length === 0) {
            return res.status(404).json({ error: 'Изображение не найдено' });
        }
        
        const relativePath = image.rows[0].image_path.replace(/^\/images\//, '');
        const imagePath = path.join(IMAGES_PATH, relativePath);
        try {
            await fs.unlink(imagePath);
        } catch (err) {
            console.log('Image file not found or already deleted:', imagePath);
        }
        
        await pool.query('DELETE FROM product_images WHERE id = $1', [imageId]);
        
        res.json({ message: 'Изображение успешно удалено' });
    } catch (error) {
        console.error('Image deletion error:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
};