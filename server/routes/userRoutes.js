// server/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { 
    getUserProfile, 
    updateUserProfile, 
    updatePassword 
} = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const { check } = require('express-validator');

// --- Validation Rules ---
const profileUpdateValidation = [
    check('name', 'Name is required').not().isEmpty().trim().escape(),
    check('email', 'Please include a valid email').optional().isEmail().normalizeEmail(),
];

const passwordUpdateValidation = [
    check('currentPassword', 'Current password is required').exists(),
    check('newPassword', 'New password must be at least 6 characters').isLength({ min: 6 })
];

// --- Routes ---
router.get('/profile', authMiddleware, getUserProfile);
router.put(
    '/profile',
    authMiddleware,
    profileUpdateValidation,
    updateUserProfile 
);

router.put(
    '/update-password',
    authMiddleware,
    passwordUpdateValidation,
    updatePassword
);

module.exports = router;