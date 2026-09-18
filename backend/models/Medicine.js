const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  seniorId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  dosage: { type: String, required: true },
  time: { type: String, required: true }, // e.g. "08:00 AM"
  frequency: { type: String, default: 'Daily' },
  instructions: { type: String, default: 'Take with warm water after breakfast' },
  status: { type: String, enum: ['pending', 'taken', 'missed'], default: 'pending' },
  lastTakenDate: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Medicine', medicineSchema);
