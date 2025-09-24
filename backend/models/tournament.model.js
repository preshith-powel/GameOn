const mongoose = require('mongoose');

const tournamentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  type: { // football, cricket, etc.
    type: String,
    required: true
  },
  format: { // single elimination, round robin, etc.
    type: String,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  venue: {
    type: String
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
  // We will add more fields for fixtures, scores, etc. later
});

const Tournament = mongoose.model('Tournament', tournamentSchema);
module.exports = Tournament;
