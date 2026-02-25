// File: /server/routes/paymentRoutes.js

const express = require('express');
const { createOrder, verifyPayment } = require('../controllers/paymentController');
const authMiddleware = require('../middleware/authMiddleware');
const { check } = require('express-validator');

const router = express.Router();

router.use(authMiddleware);
const orderValidation = [
    check('bookingId', 'Booking ID is required').isMongoId(),
];

const verificationValidation = [
    check('razorpay_order_id', 'Razorpay Order ID is required').not().isEmpty(),
    check('razorpay_payment_id', 'Razorpay Payment ID is required').not().isEmpty(),
    check('razorpay_signature', 'Razorpay Signature is required').not().isEmpty(),
    check('bookingId', 'Original Booking ID is required').isMongoId(),
];

router.post('/create-order', orderValidation, createOrder);
router.post('/verify', verificationValidation, verifyPayment);

module.exports = router;