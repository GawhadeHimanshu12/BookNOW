const express = require('express');
const {
    getVenues,
    getVenueById,
    createVenue,
    updateVenue,
    deleteVenue
} = require('../controllers/venueController');
const authMiddleware = require('../middleware/authMiddleware');
const { isOrganizerOrAdmin, isAdmin } = require('../middleware/roleMiddleware'); 
const { check, body } = require('express-validator'); 

const router = express.Router();


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






router.get('/', getVenues);




router.get('/:id', getVenueById);







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
    
    [ check('name', 'Venue name is required').optional().not().isEmpty().trim(), /* add other optional checks */],
    updateVenue             
);




router.delete(
    '/:id',
    authMiddleware,         
    deleteVenue             
);


module.exports = router;