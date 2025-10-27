const express = require('express');
const cors = require('cors');
const path = require('path');
const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/authRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const adminRoutes = require('./routes/adminRoutes');
const categoryRoutes = require('./routes/categoryRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/images', express.static(path.join(__dirname, '../../frontend/public/images')));

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.get('/api', (req, res) => {
  res.json({ 
    message: 'API is running',
    version: '3.0.0'
  });
});

app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);

app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    res.status(404).json({ error: 'Route not found' });
  } else {
    res.status(404).send('Not found');
  }
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  if (req.path.startsWith('/api')) {
    res.status(500).json({ error: err.message || 'Internal server error' });
  } else {
    res.status(500).send('Internal server error');
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend server started on port ${PORT}`);
  console.log(`API available at: http://localhost:${PORT}/api`);
});
