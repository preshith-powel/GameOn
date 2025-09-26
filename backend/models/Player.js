// backend/models/Player.js

const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
    // ... (Your existing schema fields remain here) ...
    name: {
        type: String,
        required: true,
        trim: true
    },
    contactInfo: {
        type: String,
        required: false,
    },
    stats: {
        // ... (Your existing stats fields) ...
        wins: { type: Number, default: 0 },
        losses: { type: Number, default: 0 },
        goals: { type: Number, default: 0 },
        assists: { type: Number, default: 0 },
        runs: { type: Number, default: 0 },
        wickets: { type: Number, default: 0 },
    },
    teamId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
        required: false
    }
}, {
    timestamps: true
});

// --- NEW STATIC METHOD ADDED FOR PLAYER/TEAM OWNER CHECK ---
playerSchema.statics.checkOwner = async function (playerId, managerUserId) {
    const player = await this.findById(playerId).populate('teamId');
    
    if (!player) {
        return { error: 'Player not found.' };
    }

    // Ensure the player is linked to a team
    if (!player.teamId) {
        return { error: 'Player is not linked to a team.' };
    }

    // Check if the team's managerId matches the requesting managerUserId
    if (player.teamId.managerId.toString() !== managerUserId.toString()) {
        return { error: 'Unauthorized: You do not manage this player or team.' };
    }

    return { player: player };
};
// -----------------------------------------------------------

const Player = mongoose.model('Player', playerSchema);
module.exports = Player;