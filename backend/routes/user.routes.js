const express = require('express');
const router = express.Router();
const User = require('../models/user.model');

// POST route for user registration
router.post('/register', async (req, res) => {
  const { username, password, email, role } = req.body;

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' });
    }

    const newUser = new User({ username, password, email, role });
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully!' });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST route for user login
router.post('/login', async (req, res) => {
  const { username, password, role } = req.body;

  try {
    const user = await User.findOne({ username, password, role });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials or role' });
    }

    // You would typically return a token here for authentication
    res.status(200).json({ message: 'Login successful!', user });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
