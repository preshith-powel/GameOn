// backend/models/Event.js

const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    eventName: {
        type: String,
        required: true,
        trim: true
    },
    tournamentName: {
        type: String,
        required: true,
        trim: true
    },
    venue: {
        type: String,
        required: false,
        trim: true
    }
}, {
    timestamps: true
});

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;
