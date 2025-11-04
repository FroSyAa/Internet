// Простая аутентификация администратора
// В продакшене использовать настоящую аутентификацию с хешированными паролями

const ADMIN_CREDENTIALS = {
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD || 'admin123'
};

// Store active sessions (in production, use Redis or proper session store)
const activeSessions = new Set();

exports.login = (req, res) => {
    const { username, password } = req.body;
    
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        // Create a simple session token
        const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        activeSessions.add(sessionToken);
        
        res.json({
            success: true,
            message: 'Успешный вход',
            token: sessionToken
        });
    } else {
        res.status(401).json({
            success: false,
            message: 'Неверный логин или пароль'
        });
    }
};

exports.logout = (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
        activeSessions.delete(token);
    }
    
    res.json({
        success: true,
        message: 'Вы вышли из системы'
    });
};

exports.checkAuth = (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token && activeSessions.has(token)) {
        res.json({
            authenticated: true,
            username: ADMIN_CREDENTIALS.username
        });
    } else {
        res.status(401).json({
            authenticated: false,
            message: 'Не авторизован'
        });
    }
};

exports.requireAuth = (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token && activeSessions.has(token)) {
        next();
    } else {
        res.status(401).json({
            error: 'Требуется авторизация'
        });
    }
};
