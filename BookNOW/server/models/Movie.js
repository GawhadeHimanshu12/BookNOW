const mongoose = require('mongoose');

const MovieSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a movie title'],
        trim: true, 
        unique: true 
    },
    description: {
        type: String,
        required: [true, 'Please add a description']
    },
    releaseDate: {
        type: Date,
        required: [true, 'Please add a release date']
    },
    duration: {
        type: Number, 
        required: [true, 'Please add the duration in minutes']
    },
    movieLanguage: {
        type: String,
        required: [true, 'Please add the language'],
        trim: true
    },
    genre: [{ 
        type: String,
        required: [true, 'Please add at least one genre'],
        trim: true
    }],
    cast: [{ 
        type: String,
        trim: true
    }],
    crew: [{ 
        type: String,
        trim: true
    }],
    posterUrl: { 
        type: String,
        match: [/^(http|https):\/\/[^ "]+$/, 'Please use a valid URL for poster']
        
    },
    trailerUrl: { 
        type: String,
        match: [/^(http|https):\/\/[^ "]+$/, 'Please use a valid URL for trailer']
    },
    censorRating: {
        type: String, 
        trim: true
    },
    format: [{ 
        type: String,
        trim: true,
        
    }],
    averageRating: {
        type: Number,
        min: 0,
        max: 5, 
        default: 0
    },
    numberOfReviews: {
        type: Number,
        default: 0
    },

    addedBy: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});


MovieSchema.index({ title: 'text', description: 'text' },
     { default_language: 'english' }
); 


MovieSchema.index({ genre: 1 });      
MovieSchema.index({ movieLanguage: 1 });   
MovieSchema.index({ releaseDate: -1 });
MovieSchema.index({ averageRating: -1 });
module.exports = mongoose.model('Movie', MovieSchema);