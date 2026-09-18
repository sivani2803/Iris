const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  emergencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Emergency', required: true },
  caretakerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Caretaker', required: true },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'timeout'],
    default: 'pending'
  },
  assignedAt: { type: Date, default: Date.now },
  respondedAt: { type: Date },
  rejectionReason: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Assignment', assignmentSchema);
