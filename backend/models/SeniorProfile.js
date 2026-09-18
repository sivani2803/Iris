const mongoose = require('mongoose');

const seniorProfileSchema = new mongoose.Schema({
  seniorId: { type: String, required: true, unique: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  name: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String },
  bloodGroup: { type: String },
  phone: { type: String },
  avatar: { type: String },
  address: { type: String },
  location: {
    lat: { type: Number, default: 17.4435 },
    lng: { type: Number, default: 78.3772 },
    area: { type: String, default: 'Madhapur, Hyderabad' }
  },
  medicalConditions: [{ type: String }],
  allergies: [{ type: String }],
  emergencyContacts: [
    {
      name: String,
      relation: String,
      phone: String,
      isPrimary: Boolean
    }
  ],
  baselineVitals: {
    restingHeartRate: { type: Number, default: 72 },
    typicalSpo2: { type: Number, default: 98 }
  },
  watchConnected: { type: Boolean, default: true },
  lastSeen: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('SeniorProfile', seniorProfileSchema);
