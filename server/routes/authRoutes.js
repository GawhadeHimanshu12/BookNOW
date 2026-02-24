// server/routes/authRoutes.js
// Purpose: Defines the API routes related to authentication (register, login, get profile).

const express = require('express');
const passport = require('passport');
const { 
    registerUser,
    loginUser,
    getMe,
    forgotPassword,
    resetPassword,
    googleCallback,
    checkEmail,           // OTP function
    sendLoginOtp,         // OTP function
    verifyOtpAndLogin     // OTP function
} = require('../controllers/authController');
const { check } = require('express-validator'); 
const authMiddleware = require('../middleware/authMiddleware'); 

const router = express.Router();

// --- Validation Rules ---
// FIX: Added { gmail_remove_dots: false } to all normalizeEmail() calls
const registerValidationRules = [
    check('name', 'Name is required').not().isEmpty().trim().escape(),
    check('email', 'Please include a valid email').isEmail().normalizeEmail({ gmail_remove_dots: false }),
    check('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
    check('role', 'Invalid role specified').optional().isIn(['user', 'organizer']), 
    check('organizationName', 'Organization name is required for organizers')
        .if(check('role').equals('organizer')) 
        .not().isEmpty().trim().escape(),
];

const loginValidationRules = [
    check('email', 'Please include a valid email').isEmail().normalizeEmail({ gmail_remove_dots: false }),
    check('password', 'Password is required').exists() 
];

const forgotPasswordValidation = [
    check('email', 'Please include a valid email').isEmail().normalizeEmail({ gmail_remove_dots: false })
];

const resetPasswordValidation = [
    check('password', 'Password must be at least 6 characters').isLength({ min: 6 })
];

// --- Route Definitions ---

// NEW OTP ROUTES
router.post('/check-email', checkEmail);
router.post('/send-otp', sendLoginOtp);
router.post('/verify-otp', verifyOtpAndLogin);

// Existing Routes
router.post('/register', registerValidationRules, registerUser);
router.post('/login', loginValidationRules, loginUser);
router.get('/me', authMiddleware, getMe); 
router.post('/forgotpassword', forgotPasswordValidation, forgotPassword);
router.put('/resetpassword/:resettoken', resetPasswordValidation, resetPassword);

router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}));

router.get('/google/callback', passport.authenticate('google'), googleCallback);

module.exports = router;