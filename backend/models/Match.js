// backend/models/Match.js - FINAL CORRECTED CODE (Fixed refPath)

const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
    tournamentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tournament',
        required: true
    },
    
    // FIX 1 & 2: Added sport type for specific logic and display
    sportType: {
        type: String,
        required: true,
        enum: ['football', 'cricket', 'badminton', 'volleyball', 'multi', 'other'],
        trim: true
    },

    // FIX 3: Reworked participants array to be flexible (Player or Team) and hold rich score data
    participants: [{
        entityId: { 
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'participantModel' // <-- CORRECTED: Points to the local field in this sub-document
        },
        participantModel: { // Stores the model name ('Team' or 'Player')
            type: String,
            required: true,
            enum: ['Team', 'Player']
        },
        // Score data is an object that can hold sport-specific details (goals, sets, innings, etc.)
        scoreData: { 
            type: mongoose.Schema.Types.Mixed, // Allows flexible data structure
            default: {}
        },
        isWinner: {
            type: Boolean,
            default: false
        }
    }],

    // FIX 3: Added winnerId for easy match winner lookup
    winnerId: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
    },
    
    coordinatorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    
    status: {
        type: String,
        enum: ['scheduled', 'in-progress', 'completed', 'rescheduled', 'cancelled'],
        default: 'scheduled'
    },
    date: Date,
    time: String,
    venue: String
}, {
    timestamps: true
});

const Match = mongoose.model('Match', matchSchema);
module.exports = Match;