const mongoose = require('mongoose');

const eventScoreSchema = new mongoose.Schema({
  tournamentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tournament',
    required: true
  },
  eventName: {
    type: String,
    required: true
  },
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  playerName: {
    type: String,
    required: true
  },
  score: {
    type: Number,
    default: 0
  },
  position: {
    type: Number,
    required: false // 1st, 2nd, 3rd, etc.
  },
  pointsEarned: {
    type: Number,
    default: 0
  },
  coordinatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['pending', 'completed'],
    default: 'pending'
  },
  venue: {
    type: String,
    required: false
  }
}, {
  timestamps: true
});

const EventScore = mongoose.model('EventScore', eventScoreSchema);
module.exports = EventScore;

