// backend/middleware/auth.js

const jwt = require('jsonwebtoken');

// Middleware to protect routes and verify the JWT token
exports.protect = (req, res, next) => {
    // Get the token from the request header
    const token = req.header('x-auth-token');

    // Check if no token is provided
    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    // Verify the token
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user;
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};

// Middleware to check if the user is an admin
exports.admin = (req, res, next) => {
    // First, run the protect middleware to ensure the user is logged in
    exports.protect(req, res, () => {
        // Now, check if the user's role is 'admin'
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied: You are not an admin' });
        }
        // If the user is an admin, proceed to the next middleware or route handler
        next();
    });
};