// backend/models/Player.js - FINAL CORRECTED CODE (Added statusCode to error returns)

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
        wins: { type: Number, default: 0 },
        losses: { type: Number, default: 0 },
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
        // FIX: Return explicit 404 Not Found
        return { error: 'Player not found.', statusCode: 404 }; 
    }

    // Ensure the player is linked to a team
    if (!player.teamId) {
        // FIX: Return 400 Bad Request if the player object is structurally invalid
        return { error: 'Player is not linked to a team.', statusCode: 400 }; 
    }

    // Check if the team's managerId matches the requesting managerUserId
    if (player.teamId.managerId.toString() !== managerUserId.toString()) {
        // FIX: Return 403 Forbidden/Unauthorized
        return { error: 'Unauthorized: You do not manage this player or team.', statusCode: 403 }; 
    }

    return { player: player };
};
// -----------------------------------------------------------

const Player = mongoose.model('Player', playerSchema);
module.exports = Player;