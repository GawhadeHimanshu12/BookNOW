const express = require('express');
const {
    getOrganizerDashboardStats,
    getMyVenues,
    getMyShowtimes,
    getMyVenueBookings,
    updateMyProfile
} = require('../controllers/organizerController');
const authMiddleware = require('../middleware/authMiddleware'); 
const { isOrganizer } = require('../middleware/roleMiddleware'); 
const { check } = require('express-validator');

const router = express.Router();


router.use(authMiddleware); 
router.use(isOrganizer);    







router.get('/dashboard', getOrganizerDashboardStats);




router.get('/venues', getMyVenues);




router.get('/showtimes', getMyShowtimes);




router.get('/bookings', getMyVenueBookings);




const profileUpdateValidation = [
    check('name').optional().notEmpty().trim().escape().withMessage('Name cannot be empty'),
    check('organizationName').optional().notEmpty().trim().escape().withMessage('Organization name cannot be empty')
];
router.put('/profile', profileUpdateValidation, updateMyProfile);







module.exports = router;