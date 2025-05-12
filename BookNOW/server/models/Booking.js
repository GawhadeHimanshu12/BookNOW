const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
    bookingRefId: {
        type: String,
        required: true,
        unique: true, 
        index: true,  
        maxlength: 10 
    },
    user: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    showtime: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Showtime',
        required: true,
        index: true
    },
    seats: [{ 
        type: String,
        required: [true, 'At least one seat must be selected']
    }],
    totalAmount: { 
        type: Number,
        required: true,
        min: 0
    },
    originalAmount: { 
        type: Number,
    },
    promoCodeApplied: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PromoCode',
    },
    discountAmount: { 
        type: Number,
        default: 0
    },
    status: { 
        type: String,
        
        enum: ['PaymentPending', 'Confirmed', 'Cancelled', 'CheckedIn', 'PaymentFailed'],
        default: 'PaymentPending' 
        
    },
    
    
    razorpayOrderId: { type: String, index: true },
    razorpayPaymentId: { type: String, index: true },
    razorpaySignature: { type: String },
    
    bookingTime: { 
        type: Date,
        default: Date.now
    },
    paymentId: { 
        type: String,
    },
    isCheckedIn: {
        type: Boolean,
        default: false
    },
    checkInTime: {
        type: Date
    },
    checkedInBy: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
});


BookingSchema.index({ user: 1, bookingTime: -1 });

BookingSchema.index({ razorpayOrderId: 1 });
BookingSchema.index({ razorpayPaymentId: 1 });


module.exports = mongoose.model('Booking', BookingSchema);
