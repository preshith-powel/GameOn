const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  tournamentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tournament'
  },
  managerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  players: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
});

const Team = mongoose.model('Team', teamSchema);
module.exports = Team;
