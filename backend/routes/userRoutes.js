// backend/routes/userRoutes.js - FINAL CODE (Allows Duplicate Usernames)

const express = require('express');
const router = express.Router();
const User = require('../models/User.js'); 
const jwt = require('jsonwebtoken');
const { admin } = require('../middleware/auth'); 

// --- ROUTE 1: User Registration (Public) ---
router.post('/register', async (req, res) => {
    const { username, uniqueId, password, role } = req.body;
    try {
        // 1. CHECK ONLY FOR UNIQUE ID DUPLICATION (Correct)
        let user = await User.findOne({ uniqueId });
        if (user) {
            return res.status(400).json({ msg: 'Unique ID already exists' });
        }
        
        // 2. *** REMOVED: Redundant username duplication check ***

        user = new User({ username, uniqueId, password, role });
        await user.save(); 
        
        const payload = {
            user: { id: user.id, role: user.role, username: user.username }
        };
        
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
            if (err) throw err;
            res.json({ token });
        });
    } catch (err) {
        console.error(err.message);
        if (err.code === 11000) { // Catches Mongo uniqueness error on uniqueId
            return res.status(400).json({ msg: 'Unique ID already exists.' });
        }
        res.status(500).send('Server Error');
    }
});

// --- ROUTE 2: User Login (Public) ---
router.post('/login', async (req, res) => {
    const { username, password } = req.body; 
    
    try {
        let user = await User.findOne({ uniqueId: username }); 
        
        if (!user) { return res.status(400).json({ msg: 'Invalid Unique ID or Password' }); }
        
        const isMatch = await user.matchPassword(password); 
        
        if (!isMatch) { return res.status(400).json({ msg: 'Invalid Unique ID or Password' }); }
        
        const payload = { user: { id: user.id, role: user.role, username: user.username } };
        
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
            if (err) throw err;
            
            res.json({ 
                token, 
                user: { 
                    id: user.id,
                    username: user.username, 
                    role: user.role
                } 
            }); 
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// ------------------------------------------------------------------
// --- ADMIN-ONLY ROUTES (Remains the same) ---
// ------------------------------------------------------------------

router.get('/coordinators', admin, async (req, res) => {
    try {
        const coordinators = await User.find({ role: 'coordinator' }).select('-password');
        if (!coordinators || coordinators.length === 0) { return res.status(404).json({ msg: 'No coordinators found.' }); }
        res.json(coordinators);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

router.put('/demote/:uniqueId', admin, async (req, res) => {
    const { uniqueId } = req.params;
    const { newRole } = req.body; 

    try {
        let user = await User.findOne({ uniqueId });

        if (!user) { return res.status(404).json({ msg: 'User not found.' }); }
        if (user.role === 'admin' && newRole !== 'admin') { return res.status(403).json({ msg: 'Cannot demote another Admin user.' }); }
        if (!['admin', 'coordinator', 'manager', 'spectator'].includes(newRole)) { return res.status(400).json({ msg: 'Invalid role provided.' }); }

        user.role = newRole;
        await user.save(); 

        res.json({ msg: `${user.username} successfully assigned role: ${newRole}`, user });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;