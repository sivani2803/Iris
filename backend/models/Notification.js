const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipientRole: { type: String, enum: ['senior', 'family', 'caretaker', 'all'], default: 'all' },
  seniorId: { type: String, default: 'S102' },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['alert', 'health', 'medicine', 'appointment', 'system'], default: 'alert' },
  read: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
