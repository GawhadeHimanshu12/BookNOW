const Review = require('../models/Review');
const Movie = require('../models/Movie');
const Booking = require('../models/Booking'); 
const Showtime = require('../models/Showtime'); 
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

exports.getReviewsForMovie = async (req, res) => {
    const movieId = req.params.movieId;

    if (!mongoose.Types.ObjectId.isValid(movieId)) {
        return res.status(400).json({ msg: 'Invalid Movie ID format' });
    }

    try {
        
        const movieExists = await Movie.findById(movieId);
        if (!movieExists) {
             return res.status(404).json({ msg: 'Movie not found' });
        }

        const reviews = await Review.find({ movie: movieId })
                                    .populate('user', 'name') 
                                    .sort({ createdAt: -1 });

        res.status(200).json(reviews);
    } catch (err) {
        console.error('Error fetching reviews for movie:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

exports.getMyReviews = async (req, res) => {
    const userId = req.user.id;
    try {
        const reviews = await Review.find({ user: userId })
                                    .populate('movie', 'title posterUrl') 
                                    .sort({ createdAt: -1 });
        res.status(200).json(reviews);
    } catch (err) {
        console.error('Error fetching user reviews:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

exports.createReview = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const movieId = req.params.movieId;
    const userId = req.user.id;
    const { rating, comment } = req.body;

    if (!mongoose.Types.ObjectId.isValid(movieId)) {
        return res.status(400).json({ msg: 'Invalid Movie ID format' });
    }

    try {
        
        const movieExists = await Movie.findById(movieId);
        if (!movieExists) {
             return res.status(404).json({ msg: 'Movie not found' });
        }

        
        const existingReview = await Review.findOne({ movie: movieId, user: userId });
        if (existingReview) {
            return res.status(400).json({ msg: 'You have already submitted a review for this movie' });
        }

        
        
        const showtimeIds = await Showtime.find({ movie: movieId }).distinct('_id');
        if (showtimeIds.length === 0) {
            
             return res.status(400).json({ msg: 'No showtimes found for this movie to verify booking.' });
        }
        
        const userBooking = await Booking.findOne({
            user: userId,
            showtime: { $in: showtimeIds },
            status: { $in: ['Confirmed', 'CheckedIn'] }
        });

        if (!userBooking) {
            return res.status(403).json({ msg: 'You must have a confirmed booking for this movie to leave a review.' });
        }

        
        const newReview = new Review({
            rating,
            comment,
            user: userId,
            movie: movieId
        });

        const review = await newReview.save(); 

        
        const populatedReview = await Review.findById(review._id).populate('user', 'name');

        res.status(201).json(populatedReview);

    } catch (err) {
        console.error('Error creating review:', err.message);
         
        if (err.code === 11000) {
             return res.status(400).json({ msg: 'You have already submitted a review for this movie (duplicate key).' });
        }
        res.status(500).json({ msg: 'Server error' });
    }
};

exports.updateReview = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const reviewId = req.params.reviewId;
    const userId = req.user.id;
    const { rating, comment } = req.body;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
        return res.status(400).json({ msg: 'Invalid Review ID format' });
    }

    try {
        let review = await Review.findById(reviewId);

        if (!review) {
            return res.status(404).json({ msg: 'Review not found' });
        }

        
        if (review.user.toString() !== userId) {
            return res.status(403).json({ msg: 'User not authorized to update this review' });
        }

        
        if (rating !== undefined) review.rating = rating;
        if (comment !== undefined) review.comment = comment;

        
        await review.save();

         
        const populatedReview = await Review.findById(review._id).populate('user', 'name');

        res.status(200).json(populatedReview);

    } catch (err) {
        console.error('Error updating review:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

exports.deleteReview = async (req, res) => {
    const reviewId = req.params.reviewId;
    const userId = req.user.id;
    const userRole = req.user.role;

     if (!mongoose.Types.ObjectId.isValid(reviewId)) {
        return res.status(400).json({ msg: 'Invalid Review ID format' });
    }

    try {
        const review = await Review.findById(reviewId);

        if (!review) {
            return res.status(404).json({ msg: 'Review not found' });
        }

        
        if (review.user.toString() !== userId && userRole !== 'admin') {
             return res.status(403).json({ msg: 'User not authorized to delete this review' });
        }

        
        await review.remove();

        res.status(200).json({ success: true, msg: 'Review deleted successfully' });

    } catch (err) {
         console.error('Error deleting review:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

exports.likeReview = async (req, res) => {
    const reviewId = req.params.reviewId;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
        return res.status(400).json({ msg: 'Invalid Review ID' });
    }

    try {
        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({ msg: 'Review not found' });
        }

        
        await Review.updateOne(
            { _id: reviewId },
            { 
                $pull: { dislikes: userId },
                $addToSet: { likes: userId } 
            }
        );

        const updatedReview = await Review.findById(reviewId);
        res.status(200).json({ likes: updatedReview.likes.length, dislikes: updatedReview.dislikes.length });

    } catch (err) {
        console.error('Error liking review:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

exports.dislikeReview = async (req, res) => {
    const reviewId = req.params.reviewId;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
        return res.status(400).json({ msg: 'Invalid Review ID' });
    }

    try {
        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({ msg: 'Review not found' });
        }

        
        await Review.updateOne(
            { _id: reviewId },
            { 
                $pull: { likes: userId },
                $addToSet: { dislikes: userId }
            }
        );

        const updatedReview = await Review.findById(reviewId);
        res.status(200).json({ likes: updatedReview.likes.length, dislikes: updatedReview.dislikes.length });

    } catch (err) {
        console.error('Error disliking review:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

exports.reportReview = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const reviewId = req.params.reviewId;
    const userId = req.user.id;
    const { reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
        return res.status(400).json({ msg: 'Invalid Review ID' });
    }

    try {
        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({ msg: 'Review not found' });
        }

        
        const hasReported = review.reports.some(report => report.user.toString() === userId);
        if (hasReported) {
            return res.status(400).json({ msg: 'You have already reported this review.' });
        }

        
        review.reports.push({ user: userId, reason: reason, status: 'pending' });
        await review.save();

        res.status(200).json({ msg: 'Review reported successfully. Our team will look into it.' });

    } catch (err) {
        console.error('Error reporting review:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};