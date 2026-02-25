// server/routes/venueRoutes.js

const express = require('express');
const {
    getVenues,
    getVenueById,
    createVenue,
    updateVenue,
    deleteVenue
} = require('../controllers/venueController');
const authMiddleware = require('../middleware/authMiddleware');
const { isOrganizerOrAdmin, isAdmin } = require('../middleware/roleMiddleware'); // Use existing role middleware
const { check, body } = require('express-validator'); // Import check/body for validation

const router = express.Router();

// --- Validation Rules ---
const venueValidationRules = [
    check('name', 'Venue name is required').not().isEmpty().trim(),
    check('address.street', 'Street address is required').not().isEmpty().trim(),
    check('address.city', 'City is required').not().isEmpty().trim(),
    check('address.state', 'State is required').not().isEmpty().trim(),
    check('address.zipCode', 'Zip code is required').not().isEmpty().isPostalCode('IN'), 
    check('screens', 'At least one screen is required').isArray({ min: 1 }),
    check('screens.*.name', 'Each screen must have a name').not().isEmpty().trim(),
    check('screens.*.capacity', 'Each screen must have a numeric capacity > 0').isInt({ gt: 0 }),
    check('facilities').optional().isArray(),
    check('facilities.*').optional().isString().trim(),
    check('isActive').optional().isBoolean()
];

// --- Public Routes ---

router.get('/', getVenues);
router.get('/:id', authMiddleware, getVenueById);


// --- Protected Routes ---
router.post(
    '/',
    authMiddleware,       
    isOrganizerOrAdmin,    
    venueValidationRules,   
    createVenue             
);

router.put(
    '/:id',
    authMiddleware,       

    [ check('name', 'Venue name is required').optional().not().isEmpty().trim(), ],
    updateVenue            
);

router.delete(
    '/:id',
    authMiddleware,        
    isOrganizerOrAdmin,
    deleteVenue             
);


module.exports = router;