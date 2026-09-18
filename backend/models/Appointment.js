const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  seniorId: { type: String, required: true, default: 'S102' },
  doctor: { type: String, required: true },
  specialty: { type: String, required: true },
  date: { type: String, required: true }, // e.g. "22 Sept"
  time: { type: String, required: true }, // e.g. "10:30 AM"
  location: { type: String, default: 'City Hospital, Jubilee Hills' },
  notes: { type: String, default: 'Routine cardiovascular checkup and ECG review.' },
  status: { type: String, enum: ['upcoming', 'completed', 'rescheduled', 'cancelled'], default: 'upcoming' }
}, { timestamps: true });

module.exports = mongoose.model('Appointment', appointmentSchema);
