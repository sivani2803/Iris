const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  deviceType: {
    type: String,
    enum: ['wearable', 'simulator', 'mobile_gateway'],
    default: 'wearable'
  },
  seniorId: {
    type: String,
    required: true,
    default: 'S102',
    index: true
  },
  status: {
    type: String,
    enum: ['paired', 'active', 'disconnected', 'revoked'],
    default: 'paired'
  },
  batteryLevel: {
    type: Number,
    min: 0,
    max: 100,
    default: 94
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  firmwareVersion: {
    type: String,
    default: '1.2.0'
  },
  modelName: {
    type: String,
    default: 'IRIS Watch Sense v1'
  }
}, { timestamps: true });

module.exports = mongoose.model('Device', deviceSchema);
