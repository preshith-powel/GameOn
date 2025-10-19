// backend/models/User.js - FINAL CORRECTED CODE (Added trim: true for consistency)

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema({
    username: {
        type: String,
        required: true,
        trim: true, // FIX: Automatically removes leading/trailing spaces
    },
    uniqueId: {
        type: String,
        required: true,
        unique: true,
        trim: true, // FIX: Ensures the login ID is clean
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['admin', 'coordinator', 'manager', 'spectator'],
        default: 'spectator',
        trim: true, // FIX: Keeps role data clean
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