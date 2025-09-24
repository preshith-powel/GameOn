const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  role: {
    type: String,
    required: true,
    enum: ['admin', 'coordinator', 'manager', 'spectator']
  },
  // We can add more fields later like stats, game history, etc.
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
module.exports = User;
