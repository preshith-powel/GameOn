// backend/models/Team.js - FULL UPDATED CODE (Add isReady Field)

const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    managerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', 
        required: true,
        unique: true
    },
    roster: [{
        playerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Player'
        },
        isCaptain: {
            type: Boolean,
            default: false
        }
    }],
    tournaments: [{
        tournamentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Tournament'
        }
    }],
    // --- NEW FIELD ADDED ---
    isReady: {
        type: Boolean,
        default: false // Default to not ready
    }
    // -----------------------
}, {
    timestamps: true
});

const Team = mongoose.model('Team', teamSchema);

module.exports = Team;