const mongoose = require('mongoose');

const economySchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    cash: { type: Number, default: 0 },
    bank: { type: Number, default: 0 },
    storeCredits: { type: Number, default: 0 },
    purchasedItems: { type: [String], default: [] }, // Tracks purchased items
    validatedProducts: { type: [String], default: [] }, // Tracks validated products
    redeemedCodes: { type: [String], default: [] } // Tracks redeemed promo codes
});

// Check if the model already exists before creating it
const Economy = mongoose.models.Economy || mongoose.model('Economy', economySchema);

module.exports = Economy;
