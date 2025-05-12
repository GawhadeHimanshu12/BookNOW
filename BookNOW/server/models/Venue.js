const mongoose = require('mongoose');


const ScreenSchema = new mongoose.Schema({
    name: { 
        type: String,
        required: [true, 'Please provide a screen name'],
        trim: true
    },
    capacity: {
        type: Number,
        required: [true, 'Please provide the screen capacity']
    },
     
    seatLayout: {
        
        
        rows: [{
            _id: false, 
            rowId: { type: String, required: true }, 
            seats: [{
                _id: false, 
                seatNumber: { type: String, required: true }, 
                type: { 
                    type: String,
                    default: 'Normal',
                    enum: ['Normal', 'VIP', 'Premium', 'Recliner', 'Wheelchair', 'Unavailable'] 
                },
                
                
                
            }]
        }],
        
        
    }
    

});



const VenueSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a venue name'],
        trim: true,
        
    },
    address: {
        street: { type: String, required: true, trim: true },
        city: { type: String, required: true, trim: true, index: true }, 
        state: { type: String, required: true, trim: true },
        zipCode: { type: String, required: true, trim: true },
        
        
        
        
        
    },
    facilities: [{ 
        type: String,
        trim: true
    }],
    screens: [ScreenSchema], 
    organizer: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true 
    },
    isActive: { 
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});


VenueSchema.pre('save', async function(next) {
    const User = mongoose.model('User'); 
    const org = await User.findById(this.organizer);
    if (!org || org.role !== 'organizer' || !org.isApproved) {
        return next(new Error('Venue must be associated with an approved organizer.'));
    }
    next();
});
VenueSchema.index({ name: 'text', 'address.city': 'text', 'address.state': 'text' });

module.exports = mongoose.model('Venue', VenueSchema);

