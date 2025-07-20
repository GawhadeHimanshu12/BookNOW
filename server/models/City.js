const mongoose = require('mongoose');

const CitySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a city name'],
        trim: true,
        unique: true, 
        index: true
    },
    state: {
        type: String,
        required: [true, 'Please provide the state'],
        trim: true
    },
    isActive: { 
        type: Boolean,
        default: true,
        index: true
    },
    
    
    
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('City', CitySchema);