// server/models/PromoCode.js

const mongoose = require('mongoose');

const PromoCodeSchema = new mongoose.Schema({
    code: { 
        type: String,
        required: [true, 'Please provide a promo code'],
        unique: true,
        trim: true,
        uppercase: true, 
        index: true
    },
    discountType: {
        type: String,
        required: true,
        enum: ['percentage', 'fixed'] 
    },
    discountValue: {
        type: Number,
        required: [true, 'Please specify the discount value'],
        min: 0
    },
    description: {
        type: String,
        trim: true
    },
    minPurchaseAmount: { 
        type: Number,
        default: 0
    },
    maxDiscountAmount: { 
        type: Number,

    },
    validFrom: {
        type: Date,
    },
    validUntil: { 
        type: Date,
        index: true 
    },
    maxUses: { 
        type: Number,
        min: 1
    },
    uses: { 
        type: Number,
        default: 0
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

PromoCodeSchema.methods.isValid = function() {
    const now = new Date();
    let valid = this.isActive;

    if (this.validFrom && this.validFrom > now) {
        valid = false; 
    }
    if (this.validUntil && this.validUntil < now) {
        valid = false; 
    }
    if (this.maxUses && this.uses >= this.maxUses) {
        valid = false; 
    }
    return valid;
};

PromoCodeSchema.methods.calculateDiscount = function(originalAmount) {
    let discount = 0;
    if (!this.isValid()) return 0; 

    if (originalAmount < this.minPurchaseAmount) {
        return 0; 
    }

    if (this.discountType === 'percentage') {
        discount = originalAmount * (this.discountValue / 100);e
        if (this.maxDiscountAmount && discount > this.maxDiscountAmount) {
            discount = this.maxDiscountAmount;
        }
    } else if (this.discountType === 'fixed') {
        discount = this.discountValue;
        if (discount > originalAmount) {
             discount = originalAmount;
        }
    }

    return Math.round(discount * 100) / 100; 
};


module.exports = mongoose.model('PromoCode', PromoCodeSchema);