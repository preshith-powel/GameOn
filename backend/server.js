// backend/server.js

const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
// const http = require('http'); // 💡 REMOVED: Socket.IO dependencies
// const { Server } = require("socket.io"); // 💡 REMOVED

// --- IMPORT ROUTES ---
const authRoutes = require('./routes/user.routes.js');
const tournamentRoutes = require('./routes/tournamentRoutes');
const managerRoutes = require('./routes/managerRoutes');
const matchRoutes = require('./routes/matchRoutes');

// Load environment variables from .env file
dotenv.config();

const app = express();
// const server = http.createServer(app); // 💡 REMOVED: HTTP server wrapper

// 💡 REMOVED: Socket.IO initialization block

// 💡 REMOVED: Middleware for attaching 'io' to 'req'

// --- MIDDLEWARE SETUP ---
// 💡 FIXED: Set general CORS origin to match your frontend port 5173
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

// 💡 REMOVED: Socket.IO connection handler (io.on('connection', ...))

// Set the port from your .env file or default to 5000
const PORT = process.env.PORT || 5000;

// --- MONGODB CONNECTION & SERVER START ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('MongoDB connected successfully. 🚀');
        // 💡 Server listens directly on the Express app now
        app.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 
    })
    .catch(err => {
        console.error('MongoDB connection error: Check your MONGO_URI in .env file.', err);
        process.exit(1);
    });