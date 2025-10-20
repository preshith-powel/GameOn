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
        enum: ['football', 'badminton', 'volleyball', 'kabaddi', 'multi-sport', 'chess', 'hockey', 'carroms']
    },
    format: {
        type: String,
        required: true,
        enum: ['single elimination', 'round robin', 'group stage', 'aggregate scoring']
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
        required: function() { return this.participantsType === 'Team' && this.sport !== 'multi-sport'; },
        // Allow 0 for multi-sport (teams don't need a fixed roster size). For normal team tournaments enforce min 1.
        validate: {
            validator: function(v) {
                // If it's a Team tournament and NOT multi-sport, require at least 1 player
                if (this.participantsType === 'Team' && this.sport !== 'multi-sport') {
                    return typeof v === 'number' && v >= 1;
                }
                // Otherwise allow 0 or undefined
                return typeof v === 'number' && v >= 0 || typeof v === 'undefined';
            },
            message: 'playersPerTeam must be at least 1 for team tournaments (except multi-sport where 0 is allowed).'
        }
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
    numEvents: {
        type: Number,
        required: function() { return this.sport === 'multi-sport'; },
        min: 1
    },
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