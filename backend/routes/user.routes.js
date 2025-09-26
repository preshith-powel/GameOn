// backend/routes/user.routes.js - FULL UPDATED CODE (Final Login Logic)

const express = require('express');
const router = express.Router();
const User = require('../models/User.js'); 
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

router.post('/register', async (req, res) => {
    const { username, uniqueId, password, role } = req.body;
    try {
        let user = await User.findOne({ uniqueId });
        if (user) {
            return res.status(400).json({ msg: 'Unique ID already exists' });
        }
        
        user = await User.findOne({ username });
        if (user) {
             return res.status(400).json({ msg: 'Username already exists' });
        }

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
        if (err.code === 11000) {
            return res.status(400).json({ msg: 'Unique ID or Username already exists.' });
        }
        res.status(500).send('Server Error');
    }
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body; 
    
    try {
        let user = await User.findOne({ uniqueId: username }); 
        
        if (!user) {
            return res.status(400).json({ msg: 'Invalid Unique ID or Password' });
        }
        
        const isMatch = await user.matchPassword(password); 
        
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid Unique ID or Password' });
        }
        
        const payload = {
            user: { 
                id: user.id, 
                role: user.role,
                username: user.username 
            } 
        };
        
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
            if (err) throw err;
            
            res.json({ 
                token, 
                user: { 
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

module.exports = router;