// backend/middleware/auth.js - FULL UPDATED CODE (Final Auth Export Fix)

const jwt = require('jsonwebtoken');

// Middleware 1: Protects the route and verifies the JWT token
const protect = (req, res, next) => {
    const token = req.header('x-auth-token');

    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user;
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};

// Middleware 2: Returns a function that checks for a specific role
const checkRole = (roles) => (req, res, next) => {
    if (typeof roles === 'string') {
        roles = [roles];
    }
    
    if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).json({ 
            msg: `Access denied: Role must be one of: ${roles.join(', ')}`
        });
    }
    next();
};

// --- FINAL EXPORT: Stable definition of all middleware functions ---
module.exports = {
    protect,
    checkRole,
    admin: [protect, checkRole('admin')] 
};