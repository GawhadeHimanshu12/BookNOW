// server/routes/bookingRoutes.js

const express = require('express');
const {
    createBooking,
    getMyBookings,
    getBookingById,
    cancelBooking,
    cancelPendingBooking 
} = require('../controllers/bookingController');
const authMiddleware = require('../middleware/authMiddleware');
const { check } = require('express-validator');

const router = express.Router();

// --- Validation Rules ---
const createBookingValidation = [
    check('showtimeId', 'Showtime ID is required').isMongoId(),
    check('seats', 'Seats must be an array of strings').isArray({ min: 1 }),
    check('seats.*', 'Each seat must be a non-empty string').not().isEmpty().trim().escape()
];

// --- Route Definitions ---
router.post(
    '/',
    authMiddleware,
    createBookingValidation,
    createBooking
);

router.get(
    '/me',
    authMiddleware,
    getMyBookings
);

router.get(
    '/:id',
    authMiddleware,
    getBookingById
);

router.put(
    '/:id/cancel',
    authMiddleware,
    cancelBooking
);

router.put(
    '/:id/cancel-pending',
    authMiddleware,
    cancelPendingBooking 
);


module.exports = router;