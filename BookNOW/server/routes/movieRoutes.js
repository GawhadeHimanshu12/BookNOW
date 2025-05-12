const express = require('express');
const {
    getMovies,
    getMovieById,
    createMovie,
    updateMovie,
    deleteMovie
} = require('../controllers/movieController');
const authMiddleware = require('../middleware/authMiddleware'); 
const { isAdmin, isOrganizerOrAdmin } = require('../middleware/roleMiddleware'); 
const { check } = require('express-validator'); 

const router = express.Router();




const movieValidationRules = [
    check('title', 'Title is required').not().isEmpty().trim(),
    check('description', 'Description is required').not().isEmpty().trim(),
    check('releaseDate', 'Release date is required').isISO8601().toDate(), 
    check('duration', 'Duration must be a positive number').isInt({ gt: 0 }),
    check('movieLanguage', 'Language is required').not().isEmpty().trim(),
    check('genre', 'Genre is required and must be an array').isArray().notEmpty(),
    check('genre.*', 'Each genre must be a non-empty string').not().isEmpty().trim(), 
    check('posterUrl', 'Invalid Poster URL').optional({ checkFalsy: true }).isURL(),
    check('trailerUrl', 'Invalid Trailer URL').optional({ checkFalsy: true }).isURL(),
];







router.get('/', getMovies);




router.get('/:id', getMovieById);







router.post(
    '/',
    authMiddleware,         
    isOrganizerOrAdmin,     
    movieValidationRules,   
    createMovie             
);




router.put(
    '/:id',
    authMiddleware,
    isOrganizerOrAdmin,
    movieValidationRules, 
    updateMovie
);




router.delete(
    '/:id',
    authMiddleware,         
    isAdmin,                
    deleteMovie             
);


module.exports = router;