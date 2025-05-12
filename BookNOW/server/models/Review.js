const mongoose = require('mongoose');

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
    createdAt: {
        type: Date,
        default: Date.now
    }
});



ReviewSchema.index({ movie: 1, user: 1 }, { unique: true });



ReviewSchema.statics.calculateAverageRating = async function(movieId) {
    console.log(`Calculating average rating for movie: ${movieId}`);
    const Movie = mongoose.model('Movie'); 

    
    const stats = await this.aggregate([
        {
            $match: { movie: movieId } 
        },
        {
            $group: {
                _id: '$movie', 
                numberOfReviews: { $sum: 1 }, 
                averageRating: { $avg: '$rating' } 
            }
        }
    ]);

    
    try {
        if (stats.length > 0) {
            
            await Movie.findByIdAndUpdate(movieId, {
                numberOfReviews: stats[0].numberOfReviews,
                
                averageRating: Math.round(stats[0].averageRating * 10) / 10
            });
            console.log(`Updated movie ${movieId} rating stats:`, stats[0]);
        } else {
            
            await Movie.findByIdAndUpdate(movieId, {
                numberOfReviews: 0,
                averageRating: 0 
            });
             console.log(`Reset rating stats for movie ${movieId}`);
        }
    } catch (err) {
        console.error(`Error updating movie rating stats for ${movieId}:`, err);
    }
};



ReviewSchema.post('save', function() {
    
    this.constructor.calculateAverageRating(this.movie);
});



ReviewSchema.pre('remove', function(next) {
    
    this._movieIdToRemove = this.movie;
    next();
});
ReviewSchema.post('remove', function() {
     
     if (this._movieIdToRemove) {
        this.constructor.calculateAverageRating(this._movieIdToRemove);
     }
});







module.exports = mongoose.model('Review', ReviewSchema);