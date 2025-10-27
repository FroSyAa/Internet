const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');

router.post('/login', adminAuth.login);
router.post('/logout', adminAuth.logout);
router.get('/check', adminAuth.checkAuth);

module.exports = router;