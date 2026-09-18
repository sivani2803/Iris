const mongoose = require('mongoose');

const caretakerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String },
  avatar: { type: String, default: '' },
  availability: { type: Boolean, default: true },
  distanceKm: { type: Number, default: 2.1 },
  etaMinutes: { type: Number, default: 6 },
  skills: [{ type: String }],
  firstAidTrained: { type: Boolean, default: true },
  familiarityWithSenior: { type: Boolean, default: true },
  activeWorkload: { type: Number, default: 0 },
  rating: { type: Number, default: 4.9 },
  languages: [{ type: String }],
  isAlternative: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Caretaker', caretakerSchema);
