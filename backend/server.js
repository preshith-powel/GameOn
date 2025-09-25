// backend/server.js

const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

// --- 1. IMPORT ROUTES ---
const authRoutes = require('./routes/user.routes.js'); // Handles Login/Register
const tournamentRoutes = require('./routes/tournamentRoutes'); // Handles Tournament Admin tasks
const managerRoutes = require('./routes/managerRoutes'); // Handles Manager/Team tasks

// Load environment variables from .env file
dotenv.config();

const app = express();

// --- 2. MIDDLEWARE SETUP ---
// Allows the app to parse JSON bodies from requests
app.use(express.json());

// Enables CORS for all requests (allows frontend to talk to backend)
app.use(cors());

// --- 3. ROUTE DEFINITIONS ---
// Base route for authentication
app.use('/api/auth', authRoutes);

// Base route for tournament management
app.use('/api/tournaments', tournamentRoutes);

// Base route for manager and team actions
app.use('/api/manager', managerRoutes);

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
        // Start the server after a successful database connection
        app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch(err => {
        console.error('MongoDB connection error: Check your MONGO_URI in .env file.', err);
        process.exit(1); // Exit process with failure code
    });