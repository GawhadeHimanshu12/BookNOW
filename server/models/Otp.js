// server/models/Otp.js
const mongoose = require('mongoose');

const OtpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        index: true
    },
    otp: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 300 // Document automatically deletes after 300 seconds (5 minutes)
    }
});

module.exports = mongoose.model('Otp', OtpSchema);