const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  name: { type: String, required: true },
  icon: { type: String, default: '📋' },
  description: { type: String, default: '' },
  schedule: { type: String, default: '' }
}, { _id: false });

const organizationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: {
    type: String,
    enum: ['orphanage', 'old_age_home', 'charitable_trust', 'ngo', 'community_center'],
    required: true,
    index: true
  },
  description: { type: String, default: '' },
  image: { type: String, default: '🏠' },
  location: {
    address: { type: String, default: '' },
    city: { type: String, default: '' },
    lat: { type: Number },
    lng: { type: Number }
  },
  contactPhone: { type: String, default: '' },
  contactEmail: { type: String, default: '' },
  activities: [activitySchema],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Organization', organizationSchema);
