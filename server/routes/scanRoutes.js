const express = require('express');
const { validateBookingQR } = require('../controllers/bookingController'); 
const authMiddleware = require('../middleware/authMiddleware'); 
const { isOrganizerOrAdmin } = require('../middleware/roleMiddleware'); 
const { check } = require('express-validator');

const router = express.Router();
const validateScanValidation = [
    
    check('bookingRefId', 'Booking Reference ID is required').not().isEmpty().trim().escape()
];

router.post(
    '/validate',
    authMiddleware,         
    isOrganizerOrAdmin,     
    validateScanValidation, 
    validateBookingQR       
);

module.exports = router;