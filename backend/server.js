// backend/server.js

const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

// --- IMPORT MIDDLEWARE ---
const { errorHandler } = require('./middleware/error'); // NEW: Import centralized error handler

// --- IMPORT ROUTES ---
const authRoutes = require('./routes/userRoutes.js');
const tournamentRoutes = require('./routes/tournamentRoutes');
const managerRoutes = require('./routes/managerRoutes');
const matchRoutes = require('./routes/matchRoutes');

// Load environment variables from .env file
dotenv.config();

const app = express();

// --- MIDDLEWARE SETUP ---
// FIXED: Set general CORS origin to match your frontend port 5173
app.use(cors({ origin: "http://localhost:5173" })); 
app.use(express.json());


// --- ROUTE DEFINITIONS ---
app.use('/api/auth', authRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/matches', matchRoutes);

// A simple test route
app.get('/', (req, res) => {
    res.send('Welcome to the GameOn API!');
});

// --- ERROR HANDLING MIDDLEWARE ---

// 1. Catch 404 Not Found and forward to error handler
app.use((req, res, next) => {
    // Create a new error object for any routes that weren't matched above
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error); // Pass the error to the next error-handling middleware
});

// 2. Centralized Error Handler (Must be defined with 4 arguments: err, req, res, next)
app.use(errorHandler);


// Set the port from your .env file or default to 5000
const PORT = process.env.PORT || 5000;

// --- MONGODB CONNECTION & SERVER START ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('MongoDB connected successfully. 🚀');
        // Server listens directly on the Express app now
        app.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 
    })
    .catch(err => {
        console.error('MongoDB connection error: Check your MONGO_URI in .env file.', err);
        process.exit(1);
    });