// backend/server.js

const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

// --- 1. IMPORT ROUTES (ADD MATCH ROUTES) ---
const authRoutes = require('./routes/user.routes.js');
const tournamentRoutes = require('./routes/tournamentRoutes');
const managerRoutes = require('./routes/managerRoutes');
const matchRoutes = require('./routes/matchRoutes'); // <<< NEW IMPORT

// Load environment variables from .env file
dotenv.config();

const app = express();

// --- 2. MIDDLEWARE SETUP ---
app.use(express.json());
app.use(cors());

// --- 3. ROUTE DEFINITIONS ---
app.use('/api/auth', authRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/matches', matchRoutes); // <<< NEW MOUNT POINT

// A simple test route
app.get('/', (req, res) => {
    res.send('Welcome to the GameOn API!');
});

// Set the port from your .env file or default to 5000
const PORT = process.env.PORT || 5000;

// --- 4. MONGODB CONNECTION & SERVER START ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('MongoDB connected successfully. 🚀');
        app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch(err => {
        console.error('MongoDB connection error: Check your MONGO_URI in .env file.', err);
        process.exit(1);
    });