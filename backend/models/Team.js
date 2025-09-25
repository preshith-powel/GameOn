// backend/models/Team.js

const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    // The manager is linked to a User document (Manager Role)
    managerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', 
        required: true,
        unique: true // A manager can only manage one team directly
    },
    // The players on the team's current roster
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
    // The tournament the team is registered for (can be many)
    tournaments: [{
        tournamentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Tournament'
        }
    }]
}, {
    timestamps: true
});

const Team = mongoose.model('Team', teamSchema);

module.exports = Team;