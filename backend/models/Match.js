const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  tournamentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tournament',
    required: true
  },
  participantsType: {
    type: String,
    enum: ['Player', 'Team'],
    required: true
  },
  teams: [{
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'participantsType'
  }],
  scores: [
    {
      teamId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'participantsType',
        required: true
      },
      score: {
        type: Number,
        required: true,
        default: 0
      }
    }
  ],
  winner: { // To store the ID of the winning team/player in case of a tie-breaker
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'participantsType',
    required: false
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
  round: {
    type: String,
    required: false
  },
  group: {
    type: String,
    required: false
  },
  scheduledTime: {
    type: Date,
    required: false
  },
  date: Date,
  time: String,
  venue: String,
  isBye: { // New field to indicate if this is a BYE match
    type: Boolean,
    default: false
  }
});

const Match = mongoose.model('Match', matchSchema);
module.exports = Match;
