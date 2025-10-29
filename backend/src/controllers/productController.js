const pool = require('../config/database');
const path = require('path');
const fs = require('fs').promises;

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

exports.deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const images = await pool.query(
            'SELECT image_path FROM product_images WHERE product_id = $1',
            [id]
        );
        
        for (const img of images.rows) {
            const relativePath = img.image_path.replace(/^\/images\//, '');
            const imagePath = path.join('/app/frontend-images', relativePath);
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
        const imagePath = path.join('/app/frontend-images', relativePath);
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