const mongoose = require('mongoose');

const consentSchema = new mongoose.Schema({
  seniorId: {
    type: String,
    required: true,
    index: true,
    default: 'S102'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  userEmail: {
    type: String,
    trim: true,
    lowercase: true
  },
  purpose: {
    type: String,
    required: true,
    enum: [
      'WEARABLE_DATA',
      'HEALTH_DATA_SHARING',
      'FAMILY_ACCESS',
      'CAREGIVER_ACCESS',
      'LOCATION_SHARING',
      'AI_PROCESSING',
      'NOTIFICATIONS',
      'VOICE_PROCESSING'
    ],
    index: true
  },
  granted: {
    type: Boolean,
    required: true,
    default: true
  },
  version: {
    type: String,
    default: '1.0'
  },
  source: {
    type: String,
    default: 'onboarding_portal'
  },
  grantedAt: {
    type: Date,
    default: Date.now
  },
  revokedAt: {
    type: Date
  }
}, { timestamps: true });

consentSchema.index({ seniorId: 1, purpose: 1 });

module.exports = mongoose.model('Consent', consentSchema);
