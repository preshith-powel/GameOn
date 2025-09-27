// backend/models/Tournament.js - FULL UPDATED CODE

const mongoose = require('mongoose');

const tournamentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    sport: {
        type: String,
        required: true,
        enum: ['football', 'cricket', 'badminton', 'volleyball', 'basketball', 'table tennis', 'esports', 'other']
    },
    format: {
        type: String,
        required: true,
        enum: ['single elimination', 'round robin', 'group stage']
    },
    // DATES: Now set to required: false, controlled by frontend logic
    startDate: {
        type: Date,
        required: false 
    },
    endDate: {
        type: Date,
        required: false
    },
    // PARTICIPANTS
    participantsType: {
        type: String,
        // *** FIX: Changed to Mongoose Model Names (Singular, Capitalized) to fix 500 Error ***
        enum: ['Player', 'Team'], 
        required: true
    },
    maxParticipants: { // Total number of teams OR total number of players
        type: Number,
        required: true,
        min: 2
    },
    playersPerTeam: { // Only for team tournaments
        type: Number,
        required: false,
        min: 1
    },
    liveScoreEnabled: {
        type: Boolean,
        default: false
    },
    venueType: {
        type: String,
        enum: ['off', 'single', 'multi'],
        default: 'off'
    },
    venues: [{
        type: String
    }],
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'ongoing', 'completed'],
        default: 'pending'
    },
    winner: {
        type: String
    },
    // Links to registered Teams or Players
    registeredParticipants: [{
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'participantsType' 
    }]
}, {
    timestamps: true
});

const Tournament = mongoose.model('Tournament', tournamentSchema);

module.exports = Tournament;