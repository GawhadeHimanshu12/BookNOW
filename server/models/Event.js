// server/models/Event.js

const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add an event title'],
        trim: true,
        unique: true
    },
    description: {
        type: String,
        required: [true, 'Please add a description']
    },
    category: { 
        type: String,
        required: [true, 'Please specify a category'],
        trim: true,
        index: true
    },
    eventLanguage: {
        type: String,
        trim: true
    },
    venue: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Venue',
    },
    address: { 
        street: { type: String, trim: true },
        city: { type: String, trim: true },
        state: { type: String, trim: true },
        zipCode: { type: String, trim: true },
    },
    startDate: { 
        type: Date,
        required: [true, 'Please specify the start date and time'],
        index: true
    },
    endDate: { 
        type: Date,
    },
    imageUrl: { 
        type: String,
        validate: {
            validator: function(v) {
                if (!v) return true; 
                return /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i.test(v);
            },
            message: 'Please use a valid URL'
        }
    },
    tags: [{ 
        type: String,
        trim: true,
        lowercase: true
    }],
    
    status: { 
        type: String,
        enum: ['Scheduled', 'Postponed', 'Cancelled', 'Completed'],
        default: 'Scheduled'
    },
     organizer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

EventSchema.index({ title: 'text', description: 'text' });

EventSchema.index({ status: 1, startDate: 1 });
EventSchema.index({ 'address.city': 1, status: 1 });

module.exports = mongoose.models.Event || mongoose.model('Event', EventSchema);