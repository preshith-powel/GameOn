// backend/models/Tournament.js - UPDATED CODE (Fixed sport enum and added coordinatorId)

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
        // FIX 1: Aligned the sport list with your project (includes 'multi')
        enum: ['football', 'cricket', 'badminton', 'volleyball', 'multi', 'other'], 
        trim: true
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
        // FIX: Mongoose Model Names (Singular, Capitalized)
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
    // FIX 2: NEW FIELD to assign responsibility for running the tournament
    coordinatorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // Can be assigned later by the Admin
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