const mongoose = require('mongoose');

const healthEventSchema = new mongoose.Schema({
  seniorId: { type: String, required: true, index: true },
  eventId: { type: String, index: true, sparse: true },
  deviceId: { type: String, default: 'DEV-WATCH-S102' },
  timestamp: { type: Date, default: Date.now },
  heartRate: { type: Number, required: true },
  spo2: { type: Number, required: true },
  motionState: { type: String, enum: ['active', 'stationary', 'walking', 'resting'], default: 'active' },
  fallDetected: { type: Boolean, default: false },
  eventType: { type: String, enum: ['routine', 'fall', 'abnormal_heart_rate', 'low_spo2', 'manual_sos', 'no_response'], default: 'routine' },
  riskScore: { type: Number, default: 0 },
  riskLevel: { type: String, enum: ['NORMAL', 'WATCH', 'HIGH', 'CRITICAL'], default: 'NORMAL' },
  isEmergency: { type: Boolean, default: false },
  emergencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Emergency' }
}, { timestamps: true });

module.exports = mongoose.model('HealthEvent', healthEventSchema);
