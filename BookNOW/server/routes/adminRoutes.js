const express = require('express');
const {
    getAllUsers,
    getUserById,
    approveOrganizer,
    updateUser,
    deleteUser,
    getAllPromoCodes,
    getPromoCodeById, 
    createPromoCode, 
    updatePromoCode, 
    deletePromoCode,  
    getAllBookings, 
    getBookingByIdAdmin,
    getPlatformStats,
    getAllReviewsAdmin,
    getAllCitiesAdmin, 
    createCity, 
    updateCity, 
    deleteCity,
    cancelAnyBookingAdmin
} = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware'); 
const { isAdmin } = require('../middleware/roleMiddleware'); 
const { check } = require('express-validator'); 

const router = express.Router();



router.use(authMiddleware); 
router.use(isAdmin); 







router.get('/users', getAllUsers);




router.get('/users/:id', getUserById);




router.put('/organizers/:id/approve', approveOrganizer);





const updateUserValidation = [ 
    check('name').optional().notEmpty().trim().escape().withMessage('Name cannot be empty if provided'),
    check('role').optional().isIn(['user', 'organizer', 'admin']).withMessage('Invalid role'),
    check('isApproved').optional().isBoolean().withMessage('isApproved must be true or false')
];
router.put('/users/:id', updateUserValidation, updateUser);





router.delete('/users/:id', deleteUser);



const createPromoCodeValidation = [
    check('code', 'Code is required').not().isEmpty().trim(),
    check('discountType', 'Discount type must be "percentage" or "fixed"').isIn(['percentage', 'fixed']),
    check('discountValue', 'Discount value must be a non-negative number').isFloat({ gt: -0.01 }),
    check('description').optional().isString().trim().escape(),
    check('minPurchaseAmount').optional().isFloat({ gt: -0.01 }).withMessage('Min purchase must be non-negative'),
    check('maxDiscountAmount').optional({nullable: true}).isFloat({ gt: -0.01 }).withMessage('Max discount must be non-negative'),
    check('validFrom').optional({nullable: true}).isISO8601().toDate().withMessage('Invalid Valid From date'),
    check('validUntil').optional({nullable: true}).isISO8601().toDate().withMessage('Invalid Valid Until date'),
    check('maxUses').optional({nullable: true}).isInt({ gt: 0 }).withMessage('Max uses must be a positive integer'),
    check('isActive').optional().isBoolean()
];


const updatePromoCodeValidation = [
    
    
    check('discountType').optional().isIn(['percentage', 'fixed']).withMessage('Discount type must be "percentage" or "fixed"'),
    check('discountValue').optional().isFloat({ gt: -0.01 }).withMessage('Discount value must be non-negative'),
    check('description').optional().isString().trim().escape(),
    check('minPurchaseAmount').optional().isFloat({ gt: -0.01 }).withMessage('Min purchase must be non-negative'),
    check('maxDiscountAmount').optional({nullable: true}).isFloat({ gt: -0.01 }).withMessage('Max discount must be non-negative'), 
    check('validFrom').optional({nullable: true}).isISO8601().toDate().withMessage('Invalid Valid From date'), 
    check('validUntil').optional({nullable: true}).isISO8601().toDate().withMessage('Invalid Valid Until date'), 
    check('maxUses').optional({nullable: true}).isInt({ gt: 0 }).withMessage('Max uses must be a positive integer'), 
    check('isActive').optional().isBoolean()
];


const cityValidation = [
    check('name', 'City name is required').not().isEmpty().trim(),
    check('state', 'State is required').not().isEmpty().trim(),
    check('isActive').optional().isBoolean()
];
const cityUpdateValidation = [ 
    check('name').optional().notEmpty().trim().withMessage('Name cannot be empty'),
    check('state').optional().notEmpty().trim().withMessage('State cannot be empty'),
    check('isActive').optional().isBoolean()
];


router.get('/promocodes', getAllPromoCodes);


router.get('/promocodes/:id', getPromoCodeById);


router.post('/promocodes', createPromoCodeValidation, createPromoCode);


router.put('/promocodes/:id', updatePromoCodeValidation, updatePromoCode); 


router.delete('/promocodes/:id', deletePromoCode);






router.get('/bookings', getAllBookings);




router.get('/bookings/:id', getBookingByIdAdmin);










router.get('/stats', getPlatformStats);






router.get('/reviews', getAllReviewsAdmin);




router.get('/cities', getAllCitiesAdmin);




router.post('/cities', cityValidation, createCity);




router.put('/cities/:id', cityUpdateValidation, updateCity);




router.delete('/cities/:id', deleteCity);






router.put('/bookings/:id/cancel', cancelAnyBookingAdmin);



module.exports = router;