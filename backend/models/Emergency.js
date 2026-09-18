const mongoose = require('mongoose');

const emergencySchema = new mongoose.Schema({
  seniorId: { type: String, required: true, default: 'S102' },
  status: {
    type: String,
    enum: [
      'detected',
      'analyzing',
      'responder_search',
      'assigned',
      'acknowledged',
      'en_route',
      'arrived',
      'resolved',
      'reassessing'
    ],
    default: 'detected'
  },
  riskScore: { type: Number, required: true },
  riskLevel: { type: String, enum: ['NORMAL', 'WATCH', 'HIGH', 'CRITICAL'], required: true },
  summary: { type: String, default: 'Possible emergency detected' },
  triggerEvent: {
    heartRate: Number,
    spo2: Number,
    motionState: String,
    fallDetected: Boolean,
    eventType: String,
    timestamp: Date
  },
  assignedCaretaker: { type: mongoose.Schema.Types.ObjectId, ref: 'Caretaker' },
  assignedCaretakerData: {
    name: String,
    phone: String,
    skills: [String],
    distanceKm: Number,
    etaMinutes: Number,
    rating: Number
  },
  alternateCaretaker: { type: mongoose.Schema.Types.ObjectId, ref: 'Caretaker' },
  matchedReasons: [{ type: String }],
  etaMinutes: { type: Number, default: 6 },
  timeline: [
    {
      status: String,
      timestamp: { type: Date, default: Date.now },
      title: String,
      description: String,
      actor: { type: String, default: 'System' }
    }
  ],
  active: { type: Boolean, default: true },
  resolvedAt: { type: Date },
  resolutionNotes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Emergency', emergencySchema);
