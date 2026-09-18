const mongoose = require('mongoose');

const familyCheckInSchema = new mongoose.Schema({
  seniorId: { type: String, required: true, default: 'S102' },
  familyMemberName: { type: String, required: true },
  relationship: { type: String, default: 'Daughter' },
  scheduledDay: { type: String, default: 'Sunday' },
  scheduledTime: { type: String, default: '7:00 PM' },
  title: { type: String, default: 'Weekly family call' },
  status: { type: String, enum: ['scheduled', 'in_progress', 'completed', 'rescheduled'], default: 'scheduled' },
  callLink: { type: String, default: 'https://iris.care/call/room-s102-family' }
}, { timestamps: true });

module.exports = mongoose.model('FamilyCheckIn', familyCheckInSchema);
