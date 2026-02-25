// server/controllers/authController.js

const User = require('../models/User');
const Otp = require('../models/Otp'); 
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const sendEmail = require('../utils/sendEmail'); 

// --- Helper Function to Generate JWT ---
const generateToken = (user) => {
    const payload = {
        user: {
            id: user.id, 
            role: user.role 
        }
    };
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' });
};

// --- Helper to Generate 6-Digit Numeric OTP ---
const generateNumericOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// --- Check Email Exists Controller (For Login Step 1) ---
exports.checkEmail = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(200).json({ exists: false });
        }
        return res.status(200).json({ exists: true, isEmailVerified: user.isEmailVerified });
    } catch (err) {
        console.error('Check Email Error:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// --- Register User Controller (Sends OTP) ---
exports.registerUser = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    
    const { name, email, password, role, organizationName } = req.body;
    
    try {
        let user = await User.findOne({ email: email.toLowerCase() });
        if (user) return res.status(400).json({ errors: [{ msg: 'User with this email already exists' }] });
        
        const finalRole = (role === 'organizer') ? 'organizer' : 'user';
        const isApproved = (finalRole === 'user');
        
        user = new User({ 
            name, 
            email: email.toLowerCase(), 
            password, 
            role: finalRole, 
            isApproved: isApproved, 
            organizationName: finalRole === 'organizer' ? organizationName : undefined,
            isEmailVerified: false 
        });
        
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();
        
        // Generate and Send OTP
        const otp = generateNumericOTP();
        await Otp.create({ email: user.email, otp });

        const message = `Your Email Verification OTP for BookNOW is: ${otp}. This code expires in 5 minutes.`;
        await sendEmail({
            to: user.email,
            subject: 'Verify your BookNOW Account',
            text: message,
            html: `<h3>Welcome to BookNOW!</h3><p>Your verification code is: <strong>${otp}</strong></p><p>This code expires in 5 minutes.</p>`
        });

        res.status(201).json({ msg: 'Registration successful. Please verify OTP sent to your email.', email: user.email });
    } catch (err) { 
        console.error('Registration Error:', err.message); 
        res.status(500).json({ errors: [{ msg: 'Server error during registration' }] }); 
    }
};

// --- Send Login OTP Controller ---
exports.sendLoginOtp = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) return res.status(404).json({ msg: 'User not found' });

        const otp = generateNumericOTP();
        await Otp.deleteMany({ email: email.toLowerCase() });
        await Otp.create({ email: email.toLowerCase(), otp });

        await sendEmail({
            to: user.email,
            subject: 'BookNOW Login OTP',
            text: `Your Login OTP is: ${otp}`,
            html: `<h3>BookNOW Login</h3><p>Your OTP for login is: <strong>${otp}</strong></p><p>This code expires in 5 minutes.</p>`
        });

        res.status(200).json({ msg: 'OTP sent successfully' });
    } catch (err) {
        console.error('Send OTP Error:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// --- Verify OTP & Login Controller ---
exports.verifyOtpAndLogin = async (req, res) => {
    const { email, otp } = req.body;
    try {
        const validOtp = await Otp.findOne({ email: email.toLowerCase(), otp });
        if (!validOtp) {
            return res.status(400).json({ errors: [{ msg: 'Invalid or expired OTP' }] });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) return res.status(404).json({ msg: 'User not found' });

        if (!user.isEmailVerified) {
            user.isEmailVerified = true;
            await user.save();
        }

        await Otp.deleteOne({ _id: validOtp._id });

        if (user.role === 'organizer' && !user.isApproved) {
            return res.status(403).json({ errors: [{ msg: 'Organizer account verified but pending admin approval' }] });
        }

        const token = generateToken(user);
        res.status(200).json({ token, role: user.role, isApproved: user.isApproved });
    } catch (err) {
        console.error('Verify OTP Error:', err);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// --- Login User Controller (Password) ---
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
    } catch (err) { 
        console.error('Login Error:', err.message); 
        res.status(500).json({ errors: [{ msg: 'Server error during login' }] }); 
    }
};


// --- Get Logged-in User Controller ---
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

// --- Google Auth Callback Controller ---
exports.googleCallback = (req, res) => {
    const token = generateToken(req.user);
    res.redirect(`${process.env.FRONTEND_URL}?token=${token}`);
};


// --- Forgot Password Controller ---
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

        if (typeof user.getResetPasswordToken !== 'function') {
             console.error(`FATAL ERROR: user.getResetPasswordToken is not a function on User model instance for ${user.email}`);
             return res.status(500).json({ msg: 'Server configuration error [FP01].'});
        }

        const resetToken = user.getResetPasswordToken(); 
        await user.save({ validateBeforeSave: false }); 

        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/resetpassword/${resetToken}`;

        const message = `<h2>Password Reset Request</h2><p>You requested a password reset for your BookNOW account associated with ${user.email}.</p><p>Please click on the following link, or paste it into your browser to complete the process within 10 minutes:</p><p><a href="${resetUrl}" target="_blank">${resetUrl}</a></p><p>If you did not request this, please ignore this email and your password will remain unchanged.</p><hr><p>Thank you,<br>The BookNOW Team</p>`;

        try {
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


// --- Reset Password Controller ---
exports.resetPassword = async (req, res) => {
     const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    let resetPasswordToken;
    try {
        resetPasswordToken = crypto
            .createHash('sha256')
            .update(req.params.resettoken) 
            .digest('hex');
    } catch (hashError) {
         console.error("Error hashing reset token:", hashError);
         return res.status(400).json({ msg: 'Invalid token format.' });
    }

    try {
        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() } 
        });

        if (!user) {
            return res.status(400).json({ msg: 'Invalid or expired reset token' });
        }

        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

         const salt = await bcrypt.genSalt(10);
         user.password = await bcrypt.hash(user.password, salt);

        await user.save(); 

        res.status(200).json({ success: true, msg: 'Password reset successful' });

    } catch (err) {
         console.error('Reset Password Error:', err.message);
         if (err.name === 'ValidationError') {
             return res.status(400).json({ msg: `Validation failed: ${err.message}` });
         }
         res.status(500).json({ msg: 'Server error' });
    }
};