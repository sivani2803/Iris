const mongoose = require('mongoose');

const participationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    seniorName: { type: String, default: '' },
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    organizationName: { type: String, default: '' },
    activityName: { type: String, required: true },
    activityIcon: { type: String, default: '📋' },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'completed', 'cancelled'],
        default: 'pending',
        index: true
    },
    message: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Participation', participationSchema);
