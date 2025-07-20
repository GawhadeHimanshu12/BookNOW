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
        
    },
    endDate: { 
        type: Date,
        
    },
    imageUrl: { 
        type: String,
        match: [/^(http|https):\/\/[^ "]+$/, 'Please use a valid URL']
    },
    tags: [{ 
        type: String,
        trim: true,
        lowercase: true
    }],
    organizerInfo: { 
        name: { type: String, trim: true },
        contact: { type: String, trim: true }
        
        
    },
    
    
    
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


EventSchema.index({ category: 1 });        
EventSchema.index({ 'address.city': 1 }); 
EventSchema.index({ tags: 1 });           
EventSchema.index({ startDate: 1 });      
EventSchema.index({ status: 1 });         
module.exports = mongoose.model('Event', EventSchema);