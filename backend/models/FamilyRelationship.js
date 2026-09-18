const mongoose = require('mongoose');

const familyRelationshipSchema = new mongoose.Schema({
  familyUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  seniorId: {
    type: String,
    required: true,
    index: true
  },
  seniorUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  relationship: {
    type: String,
    enum: ['Daughter', 'Son', 'Spouse', 'Grandchild', 'Sibling', 'Guardian', 'Other'],
    default: 'Other'
  },
  accessLevel: {
    type: String,
    enum: ['FULL_CARE', 'EMERGENCY_ONLY', 'VIEW_ONLY'],
    default: 'FULL_CARE'
  },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'REVOKED'],
    default: 'APPROVED',
    index: true
  },
  inviteCode: {
    type: String,
    trim: true
  },
  emergencyContactPreference: {
    type: String,
    enum: ['PHONE', 'SMS', 'PUSH'],
    default: 'PHONE'
  },
  approvedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

familyRelationshipSchema.index({ familyUserId: 1, seniorId: 1 }, { unique: true });

module.exports = mongoose.model('FamilyRelationship', familyRelationshipSchema);
