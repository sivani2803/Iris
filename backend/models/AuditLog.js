const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    index: true
  },
  actor: {
    type: String,
    default: 'System'
  },
  actorRole: {
    type: String,
    default: 'system'
  },
  seniorId: {
    type: String,
    default: 'S102',
    index: true
  },
  targetType: {
    type: String,
    required: true
  },
  targetId: {
    type: String
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String,
    default: '127.0.0.1'
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, { timestamps: true });

auditLogSchema.statics.logEvent = async function({ action, actor = 'System', actorRole = 'system', seniorId = 'S102', targetType, targetId, metadata = {}, ipAddress = '127.0.0.1' }) {
  try {
    return await this.create({
      action,
      actor,
      actorRole,
      seniorId,
      targetType: targetType || 'System',
      targetId: targetId ? targetId.toString() : undefined,
      metadata,
      ipAddress
    });
  } catch (err) {
    console.warn('[IRIS AuditLog] Failed to record audit log:', err.message);
    return null;
  }
};

module.exports = mongoose.model('AuditLog', auditLogSchema);
