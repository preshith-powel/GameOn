// backend/models/Team.js - FULL UPDATED CODE (Removed unique constraint from managerId)

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
    // For multi-sport: assign players per event per tournament
    eventAssignments: [{
        tournamentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Tournament',
            required: true
        },
        eventName: {
            type: String,
            required: true
        },
        playerIds: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Player'
        }]
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