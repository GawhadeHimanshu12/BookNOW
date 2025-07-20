const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const sendEmail = require('../utils/sendEmail');

const generateToken = (user) => {
    const payload = {
        user: {
            id: user.id, 
            role: user.role 
        }
    };

    return jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: '5h' } 
    );
};

exports.registerUser = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { name, email, password, role, organizationName } = req.body;
    try {
        let user = await User.findOne({ email: email.toLowerCase() });
        if (user) return res.status(400).json({ errors: [{ msg: 'User with this email already exists' }] });
        const finalRole = (role === 'organizer') ? 'organizer' : 'user';
        const isApproved = (finalRole === 'user');
        user = new User({ name, email: email.toLowerCase(), password, role: finalRole, isApproved: isApproved, organizationName: finalRole === 'organizer' ? organizationName : undefined });
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();
        const token = generateToken(user);
        res.status(201).json({ token, role: user.role, isApproved: user.isApproved });
    } catch (err) { console.error('Registration Error:', err.message); res.status(500).json({ errors: [{ msg: 'Server error during registration' }] }); }
};

exports.loginUser = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
        if (!user) return res.status(401).json({ errors: [{ msg: 'Invalid credentials' }] });
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ errors: [{ msg: 'Invalid credentials' }] });
        if (user.role === 'organizer' && !user.isApproved) return res.status(403).json({ errors: [{ msg: 'Organizer account pending approval' }] });
        const token = generateToken(user);
        res.status(200).json({ token, role: user.role });
    } catch (err) { console.error('Login Error:', err.message); res.status(500).json({ errors: [{ msg: 'Server error during login' }] }); }
};
exports.getMe = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
             return res.status(401).json({ msg: 'Not authorized, user context missing' });
        }
        const user = await User.findById(req.user.id).select('-password');
        if (!user) return res.status(404).json({ msg: 'User not found' });
        res.status(200).json(user);
    } catch (err) { console.error('GetMe Error:', err.message); res.status(500).json({ msg: 'Server error fetching user profile' }); }
};

exports.forgotPassword = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    try {
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            console.log(`Forgot password attempt for non-existent email: ${email}`);
            return res.status(200).json({ success: true, data: 'Password reset email has been dispatched if an account with that email exists.' });
        }

        // Ensure the user model instance has the method defined
        if (typeof user.getResetPasswordToken !== 'function') {
             console.error(`FATAL ERROR: user.getResetPasswordToken is not a function on User model instance for ${user.email}`);
             return res.status(500).json({ msg: 'Server configuration error [FP01].'});
        }

        const resetToken = user.getResetPasswordToken();
        await user.save({ validateBeforeSave: false }); 

        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/resetpassword/${resetToken}`;

        const message = `<h2>Password Reset Request</h2><p>You requested a password reset for your BookNOW account associated with ${user.email}.</p><p>Please click on the following link, or paste it into your browser to complete the process within 10 minutes:</p><p><a href="${resetUrl}" target="_blank">${resetUrl}</a></p><p>If you did not request this, please ignore this email and your password will remain unchanged.</p><hr><p>Thank you,<br>The BookNOW Team</p>`;

        try {
            console.log(`Attempting to send password reset email to ${user.email}...`);
            await sendEmail({
                to: user.email,
                subject: 'BookNOW - Password Reset Request',
                html: message,
                text: `Please use this link to reset your password: ${resetUrl}`
            });

            res.status(200).json({ success: true, data: 'Password reset email dispatched successfully.' });

        } catch (emailError) {
            console.error('Email sending error during forgot password:', emailError);

            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save({ validateBeforeSave: false });
            return res.status(500).json({ msg: 'Email could not be sent. Please try again.' });
        }

    } catch (err) {
        console.error('Forgot Password Error (Outside Email):', err.message);
        res.status(500).json({ msg: 'Server error processing request' });
    }
};


exports.resetPassword = async (req, res) => {
     const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    // Hash the incoming plain token from URL param to match stored hash
    let resetPasswordToken;
    try {
        resetPasswordToken = crypto
            .createHash('sha256')
            .update(req.params.resettoken) // Get plain token from URL param
            .digest('hex');
    } catch (hashError) {
         console.error("Error hashing reset token:", hashError);
         return res.status(400).json({ msg: 'Invalid token format.' });
    }


    try {
        // Find user by the HASHED token & check expiry
        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() } // Token is valid and not expired
        });

        if (!user) {
            return res.status(400).json({ msg: 'Invalid or expired reset token' });
        }

        // Set new password from request body
        user.password = req.body.password;

        // Clear the reset token fields
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        // Hash the new password before saving
         const salt = await bcrypt.genSalt(10);
         user.password = await bcrypt.hash(user.password, salt);

        // Save user with new password
        await user.save(); // Runs validation (e.g., password length)

        res.status(200).json({ success: true, msg: 'Password reset successful' });

    } catch (err) {
         console.error('Reset Password Error:', err.message);
         if (err.name === 'ValidationError') {
             return res.status(400).json({ msg: `Validation failed: ${err.message}` });
         }
         res.status(500).json({ msg: 'Server error' });
    }
};
