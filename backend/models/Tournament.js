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
        enum: ['football', 'cricket', 'badminton', 'volleyball', 'kabaddi', 'multi-sport']
    },
    format: {
        type: String,
        required: true,
        enum: ['single elimination', 'round robin', 'group stage', 'aggregate scoring']
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
    }],
    
    // Multi-sport specific fields
    events: [{
        eventName: {
            type: String,
            required: false
        },
        pointsFirst: {
            type: Number,
            default: 10
        },
        pointsSecond: {
            type: Number,
            default: 7
        },
        pointsThird: {
            type: Number,
            default: 5
        },
        playersPerEvent: {
            type: Number,
            required: false
        },
        eventVenue: {
            type: String,
            required: false
        },
        status: {
            type: String,
            enum: ['pending', 'ongoing', 'completed'],
            default: 'pending'
        }
    }],

    // Group Stage specific fields
    numGroups: {
        type: Number,
        min: 1,
        required: function() { return this.format === 'group stage'; }
    },
    teamsPerGroup: {
        type: Number,
        min: 2,
        required: function() { return this.format === 'group stage'; }
    },
    roundRobinMatchesPerGroup: {
        type: Number,
        min: 1,
        max: 2,
        required: function() { return this.format === 'group stage'; }
    },
    winnersPerGroup: {
        type: Number,
        min: 1,
        required: function() { return this.format === 'group stage'; },
        validate: {
            validator: function(v) {
                return v < this.teamsPerGroup; // Winners must be less than teams per group
            },
            message: 'Winners per group must be less than teams per group.'
        }
    },
    
    // Points system for multi-sport
    pointsSystem: {
        type: String,
        enum: ['point-total'],
        default: 'point-total'
    },
    
    // Team points for leaderboard
    teamPoints: [{
        teamId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Team'
        },
        totalPoints: {
            type: Number,
            default: 0
        }
    }]
}, {
    timestamps: true
});

const Tournament = mongoose.model('Tournament', tournamentSchema);

module.exports = Tournament;