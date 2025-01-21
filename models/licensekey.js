const mongoose = require('mongoose');

const licenseKeySchema = new mongoose.Schema({
    key: { type: String, required: true },
    product: { type: String, required: true },
    userId: { type: String, required: true },
    valid: { type: Boolean, default: true },
});

// Check if the model already exists in the mongoose models registry
const LicenseKey = mongoose.models.LicenseKey || mongoose.model('LicenseKey', licenseKeySchema);

module.exports = LicenseKey;
