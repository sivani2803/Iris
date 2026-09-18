const mongoose = require('mongoose');

const transportRequestSchema = new mongoose.Schema({
  seniorId: { type: String, required: true, index: true },
  destination: { type: String, required: true },
  appointmentReason: { type: String, default: 'Hospital Visit' },
  mobilityRequirement: { type: String, enum: ['Wheelchair accessible', 'Walking assistance', 'Standard'], default: 'Wheelchair accessible' },
  preferredTime: { type: String, required: true },
  status: { type: String, enum: ['requested', 'driver_assigned', 'en_route', 'completed'], default: 'driver_assigned' },
  driverName: { type: String, default: 'Suresh Verma (IRIS Medical Transit)' },
  driverPhone: { type: String, default: '+91 98765 43210' },
  vehicleNumber: { type: String, default: 'TS 09 EA 4128' },
  etaMinutes: { type: Number, default: 12 }
}, { timestamps: true });

module.exports = mongoose.model('TransportRequest', transportRequestSchema);
