// File: /server/routes/scanRoutes.js

const express = require('express');
const { validateBookingQR } = require('../controllers/bookingController'); 
const authMiddleware = require('../middleware/authMiddleware'); 
const { isOrganizerOrAdmin } = require('../middleware/roleMiddleware'); 
const { check } = require('express-validator');

const router = express.Router();

// --- Validation Rules ---
const validateScanValidation = [
    check('qrCodeData', 'QR Code Data is required').not().isEmpty().trim()
];

// --- Route Definition ---
router.post(
    '/validate',
    authMiddleware,        
    isOrganizerOrAdmin,  
    validateScanValidation, 
    validateBookingQR     
);


module.exports = router;