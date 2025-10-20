// backend/models/User.js - FINAL CODE (username is NOT unique)

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema({
    username: {
        type: String,
        required: true,
        // *** FIX: Removed unique: true to allow multiple users to share a name ***
    },
    uniqueId: {
        type: String,
        required: true,
        unique: true // <-- This remains the unique login identifier
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['admin', 'coordinator', 'manager', 'spectator'],
        default: 'spectator'
    }
}, {
    timestamps: true
});

// Middleware to hash password before saving (Remains the same)
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Method for secure login comparison (Remains the same)
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;