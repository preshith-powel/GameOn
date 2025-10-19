// backend/routes/userRoutes.js - FINAL CORRECTED CODE (JWT Refactor)

const express = require('express');
const router = express.Router();
const User = require('../models/User.js'); 
const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler'); 
const { admin } = require('../middleware/auth'); 

// Utility to promisify jwt.sign for use with async/await
const signToken = (payload) => {
    return new Promise((resolve, reject) => {
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
            if (err) return reject(err);
            resolve(token);
        });
    });
};


// --- ROUTE 1: User Registration (Public) ---
router.post('/register', asyncHandler(async (req, res) => {
    const { username, uniqueId, password, role } = req.body;

    if (!username || !uniqueId || !password) {
        res.status(400);
        throw new Error('Please enter all required fields: username, unique ID, and password.');
    }
    
    let user = await User.findOne({ uniqueId });
    if (user) {
        res.status(400);
        throw new Error('Unique ID already exists');
    }
    
    user = new User({ username, uniqueId, password, role });
    await user.save(); 
    
    const payload = {
        user: { id: user.id, role: user.role, username: user.username }
    };
    
    // FIX: Use the promise-based utility
    const token = await signToken(payload);

    res.status(201).json({ token }); 
}));

// --- ROUTE 2: User Login (Public) ---
router.post('/login', asyncHandler(async (req, res) => {
    // Note: Assumes the login request body sends 'uniqueId' and 'password'
    const { uniqueId, password } = req.body; 
    
    if (!uniqueId || !password) {
        res.status(400);
        throw new Error('Please provide Unique ID and Password.');
    }

    let user = await User.findOne({ uniqueId }); 
    
    if (!user) { 
        res.status(400);
        throw new Error('Invalid Unique ID or Password');
    }
    
    const isMatch = await user.matchPassword(password); 
    
    if (!isMatch) { 
        res.status(400);
        throw new Error('Invalid Unique ID or Password');
    }
    
    const payload = { user: { id: user.id, role: user.role, username: user.username } };
    
    // FIX: Use the promise-based utility
    const token = await signToken(payload);

    res.json({ 
        token, 
        user: { 
            id: user.id,
            username: user.username, 
            role: user.role
        } 
    }); 
}));

// ------------------------------------------------------------------
// --- ADMIN-ONLY ROUTES ---
// ------------------------------------------------------------------

router.get('/coordinators', admin, asyncHandler(async (req, res) => {
    const coordinators = await User.find({ role: 'coordinator' }).select('-password');
    if (!coordinators || coordinators.length === 0) { 
        res.status(404);
        throw new Error('No coordinators found.');
    }
    res.json(coordinators);
}));

router.put('/demote/:uniqueId', admin, asyncHandler(async (req, res) => {
    const { uniqueId } = req.params;
    const { newRole } = req.body; 

    let user = await User.findOne({ uniqueId });

    if (!user) { 
        res.status(404);
        throw new Error('User not found.');
    }
    if (user.role === 'admin' && newRole !== 'admin') { 
        res.status(403);
        throw new Error('Cannot demote another Admin user.');
    }
    if (!['admin', 'coordinator', 'manager', 'spectator'].includes(newRole)) { 
        res.status(400);
        throw new Error('Invalid role provided.');
    }

    user.role = newRole;
    await user.save(); 

    res.json({ msg: `${user.username} successfully assigned role: ${newRole}`, user: { id: user.id, username: user.username, role: user.role } });
}));

module.exports = router;