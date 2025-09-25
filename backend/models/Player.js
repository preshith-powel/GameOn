// backend/models/Player.js

const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    contactInfo: {
        type: String,
        required: false, // Optional but good for communication
    },
    // Stats will be dynamic based on the sport, but we start with a general structure
    stats: {
        wins: { type: Number, default: 0 },
        losses: { type: Number, default: 0 },
        goals: { type: Number, default: 0 }, // For Football/Soccer
        assists: { type: Number, default: 0 }, // For Football/Soccer
        runs: { type: Number, default: 0 }, // For Cricket
        wickets: { type: Number, default: 0 }, // For Cricket
        // Add other core stats here
    },
    // The team this player is currently registered with
    teamId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
        required: false // Player may be a free agent initially
    }
}, {
    timestamps: true
});

const Player = mongoose.model('Player', playerSchema);

module.exports = Player;