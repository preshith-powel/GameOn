// backend/routes/user.routes.js - FULL UPDATED CODE

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
            user: { id: user.id, role: user.role, username: user.username } // Include username in token
        };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
            if (err) throw err;
            res.json({ token });
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// UPDATED LOGIN ROUTE: Now uses Unique ID instead of Username
router.post('/login', async (req, res) => {
    // We expect 'uniqueId' from the frontend form, but it's sent as 'username' in the current setup.
    // We will still read it as 'username' for ease, but we'll use it to query the 'uniqueId' field.
    const { username, password } = req.body; 
    
    try {
        // Find user by their uniqueId (the new login credential)
        let user = await User.findOne({ uniqueId: username }); 
        
        if (!user) {
            return res.status(400).json({ msg: 'Invalid Unique ID or Password' });
        }
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid Unique ID or Password' });
        }
        
        // Pass username in the token for the welcome message
        const payload = {
            user: { id: user.id, role: user.role, username: user.username } 
        };
        
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
            if (err) throw err;
            res.json({ token, user: { username: user.username, role: user.role } }); // Return username for immediate use
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;