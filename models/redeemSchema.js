const mongoose = require('mongoose');

// Define the schema for redeem codes
const redeemCodeSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    valid: { type: Date, required: true }, // Change from Boolean to Date
    credit: { type: Number, required: true },
    totalRedeem: { type: Number, default: 0 },
});

// Create the model for redeem codes
const RedeemCode = mongoose.model('RedeemCode', redeemCodeSchema);

module.exports = RedeemCode;
