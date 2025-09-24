const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  tournamentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tournament',
    required: true
  },
  teams: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  }],
  scores: {
    teamA: Number,
    teamB: Number
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
});

const Match = mongoose.model('Match', matchSchema);
module.exports = Match;
