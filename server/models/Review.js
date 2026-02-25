// File: /server/models/Review.js

const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
    _id: false, 
    user: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reason: {
        type: String,
        required: [true, 'A reason for reporting is required.'],
        trim: true,
        maxlength: [200, 'Reason cannot be more than 200 characters']
    },
    status: {
        type: String,
        enum: ['pending', 'resolved'],
        default: 'pending'
    },
    reportedAt: {
        type: Date,
        default: Date.now
    }
});

const ReviewSchema = new mongoose.Schema({
    rating: {
        type: Number,
        min: 1,
        max: 5, 
        required: [true, 'Please provide a rating between 1 and 5']
    },
    comment: {
        type: String,
        trim: true,
        maxlength: [500, 'Comment cannot be more than 500 characters'] 
    },
    user: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    movie: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Movie',
        required: true
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    dislikes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    reports: [ReportSchema],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// --- Indexes ---
ReviewSchema.index({ movie: 1, user: 1 }, { unique: true });

ReviewSchema.statics.calculateAverageRating = async function(movieId) {
    const Movie = mongoose.model('Movie');
    const stats = await this.aggregate([
        { $match: { movie: movieId } },
        { $group: {
            _id: '$movie',
            numberOfReviews: { $sum: 1 },
            averageRating: { $avg: '$rating' }
        }}
    ]);

    try {
        if (stats.length > 0) {
            await Movie.findByIdAndUpdate(movieId, {
                numberOfReviews: stats[0].numberOfReviews,
                averageRating: Math.round(stats[0].averageRating * 10) / 10
            });
        } else {
            await Movie.findByIdAndUpdate(movieId, {
                numberOfReviews: 0,
                averageRating: 0
            });
        }
    } catch (err) {
        console.error(`Error updating movie rating stats for ${movieId}:`, err);
    }
};

// --- Middleware Hooks ---
ReviewSchema.post('save', function() {
    this.constructor.calculateAverageRating(this.movie);
});

ReviewSchema.pre('deleteOne', { document: true, query: false }, function(next) {
    this._movieIdToRemove = this.movie;
    next();
});

ReviewSchema.post('deleteOne', { document: true, query: false }, function() {
     if (this._movieIdToRemove) {
        this.constructor.calculateAverageRating(this._movieIdToRemove);
     }
});

module.exports = mongoose.model('Review', ReviewSchema);