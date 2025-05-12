const express = require('express');
const {
    getReviewsForMovie, 
    getMyReviews,
    createReview,      
    updateReview,
    deleteReview
} = require('../controllers/reviewController');
const authMiddleware = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware'); 
const { check } = require('express-validator');

const router = express.Router({ mergeParams: true }); 


const reviewValidation = [
    check('rating', 'Rating is required and must be a number between 1 and 5').isFloat({ min: 1, max: 5 }),
    check('comment').optional().trim().escape().isLength({ max: 500 }).withMessage('Comment cannot exceed 500 characters')
];





router.route('/')
    .get(getReviewsForMovie)    
    .post(                      
        authMiddleware,         
        reviewValidation,       
        createReview            
     );





const standaloneRouter = express.Router();




standaloneRouter.get('/me', authMiddleware, getMyReviews);





standaloneRouter.put(
    '/:reviewId',
    authMiddleware, 
    reviewValidation, 
    updateReview    
);




standaloneRouter.delete(
    '/:reviewId',
    authMiddleware, 
    deleteReview    
);



module.exports = { movieReviewRouter: router, reviewManagementRouter: standaloneRouter };