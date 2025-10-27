const pool = require('../config/database');
const path = require('path');
const fs = require('fs').promises;

exports.getAllCategories = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM categories ORDER BY name'
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Categories retrieval error:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
};

exports.getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM categories WHERE id = $1', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Категория не найдена' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Category retrieval error:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
};

exports.createCategory = async (req, res) => {
    try {
        const { name } = req.body;
        
        if (!name) {
            return res.status(400).json({ error: 'Название категории обязательно' });
        }
        
        const existing = await pool.query('SELECT * FROM categories WHERE name = $1', [name]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ error: 'Категория с таким именем уже существует' });
        }
        
        let image_path = null;
        if (req.file) {
            image_path = `/images/categories/${req.file.filename}`;
        }
        
        const result = await pool.query(
            'INSERT INTO categories (name, image_path) VALUES ($1, $2) RETURNING *',
            [name, image_path]
        );
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Category creation error:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
};

exports.updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        
        if (!name) {
            return res.status(400).json({ error: 'Название категории обязательно' });
        }
        
        const existing = await pool.query('SELECT * FROM categories WHERE id = $1', [id]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ error: 'Категория не найдена' });
        }
        
        let image_path = existing.rows[0].image_path;
        if (req.file) {
            if (existing.rows[0].image_path) {
                const oldImagePath = path.join('/app/frontend-images', existing.rows[0].image_path);
                try {
                    await fs.unlink(oldImagePath);
                } catch (err) {
                    console.log('Old image not found or already deleted');
                }
            }
            image_path = `/images/categories/${req.file.filename}`;
        }
        
        const result = await pool.query(
            'UPDATE categories SET name = $1, image_path = $2 WHERE id = $3 RETURNING *',
            [name, image_path, id]
        );
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Category update error:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
};

exports.deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        
        const existing = await pool.query('SELECT * FROM categories WHERE id = $1', [id]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ error: 'Категория не найдена' });
        }
        
        const productsInCategory = await pool.query(
            'SELECT COUNT(*) as count FROM products WHERE category = $1',
            [existing.rows[0].name]
        );
        
        if (parseInt(productsInCategory.rows[0].count) > 0) {
            return res.status(400).json({ 
                error: `Невозможно удалить категорию. В ней ${productsInCategory.rows[0].count} товар(ов)` 
            });
        }
        
        if (existing.rows[0].image_path) {
            const imagePath = path.join(__dirname, '../../../frontend/public', existing.rows[0].image_path);
            try {
                await fs.unlink(imagePath);
            } catch (err) {
                console.log('Image file not found or already deleted');
            }
        }
        
        await pool.query('DELETE FROM categories WHERE id = $1', [id]);
        
        res.json({ message: 'Категория успешно удалена' });
    } catch (error) {
        console.error('Category deletion error:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
};

exports.getCategoryNames = async (req, res) => {
    try {
        const result = await pool.query('SELECT name FROM categories ORDER BY name');
        const names = result.rows.map(row => row.name);
        res.json(names);
    } catch (error) {
        console.error('Category names retrieval error:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
};