// backend/models/Team.js - FINAL CORRECTED CODE (Added 'other' to sportType enum)

const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    // FIX 1: CRITICAL FIELD ADDED to link the team to one of your five sports
    sportType: {
        type: String,
        required: true,
        // FIX: Added 'other' for consistency with Tournament model
        enum: ['football', 'cricket', 'badminton', 'volleyball', 'multi', 'other'], 
        trim: true
    },
    managerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', 
        required: true,
        // Removed: unique: true, to allow one manager to control multiple teams
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
    isReady: {
        type: Boolean,
        default: false // Set to true by the Manager once the roster is complete
    }
}, {
    timestamps: true
});

const Team = mongoose.model('Team', teamSchema);

module.exports = Team;