// server/models/User.js
// Purpose: Defines the schema for the User collection in MongoDB using Mongoose.

const crypto = require('crypto');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); 

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a name']
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        unique: true, // Ensure email addresses are unique
        match: [ // Basic email format validation
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please provide a valid email'
        ]
    },
    password: {
        type: String,
        minlength: [6, 'Password must be at least 6 characters'],
        select: false // Prevent password from being returned in queries by default
    },
    googleId: {
        type: String
    },
    role: {
        type: String,
        enum: ['user', 'organizer', 'admin'], 
        default: 'user' 
    },
    // --- NEW: Email Verification Flag ---
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    // --- Organizer Specific Fields (Populated only if role is 'organizer') ---
    organizationName: {
        type: String,
    },
    managedVenues: [{ 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Venue' 
    }],
    isApproved: { 
        type: Boolean,
        default: false
    },
    // --- End Organizer Specific Fields ---
    createdAt: { 
        type: Date,
        default: Date.now
    },
    resetPasswordToken: String,   
    resetPasswordExpire: Date
});

UserSchema.methods.getResetPasswordToken = function() {
    const resetToken = crypto.randomBytes(20).toString('hex');

    this.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes in milliseconds

    return resetToken;
};

module.exports = mongoose.model('User', UserSchema);