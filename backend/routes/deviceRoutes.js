const express = require('express');
const router = express.Router();
const Device = require('../models/Device');
const AuditLog = require('../models/AuditLog');
const { authenticateToken, authorizeSeniorAccess, requireRole } = require('../middleware/authMiddleware');

// GET /api/devices (List devices for senior)
router.get('/', authenticateToken, authorizeSeniorAccess, async (req, res) => {
  try {
    const seniorId = req.query.seniorId || req.user.seniorId || 'S102';
    const devices = await Device.find({ seniorId }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: devices });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/devices/register (Register a new wearable/gateway)
router.post('/register', authenticateToken, async (req, res) => {
  try {
    const { deviceId, deviceType = 'wearable', modelName, seniorId } = req.body;

    if (!deviceId) {
      return res.status(400).json({ success: false, message: 'deviceId is required' });
    }

    const targetSeniorId = seniorId || req.user.seniorId || 'S102';

    let device = await Device.findOne({ deviceId });
    if (device) {
      if (device.status === 'revoked') {
        return res.status(400).json({ success: false, message: 'This device identifier has been permanently revoked.' });
      }
      device.status = 'active';
      device.seniorId = targetSeniorId;
      device.lastSeen = new Date();
      await device.save();
    } else {
      device = await Device.create({
        deviceId,
        deviceType,
        modelName: modelName || 'IRIS Smartwatch Sense',
        seniorId: targetSeniorId,
        status: 'active',
        lastSeen: new Date()
      });
    }

    AuditLog.logEvent({
      action: 'DEVICE_REGISTERED',
      actor: req.user.email,
      actorRole: req.user.role,
      seniorId: targetSeniorId,
      targetType: 'Device',
      targetId: device._id,
      metadata: { deviceId, deviceType }
    });

    return res.status(201).json({ success: true, data: device });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/devices/:id/revoke (Revoke device credentials)
router.post('/:id/revoke', authenticateToken, async (req, res) => {
  try {
    const device = await Device.findOne({
      $or: [{ _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null }, { deviceId: req.params.id }]
    });

    if (!device) {
      return res.status(404).json({ success: false, message: 'Device not found' });
    }

    // Role check: Only admin, or senior/family owning the device can revoke
    if (req.user.role !== 'admin' && req.user.seniorId !== device.seniorId) {
      return res.status(403).json({ success: false, message: 'Unauthorized to revoke this device' });
    }

    device.status = 'revoked';
    await device.save();

    AuditLog.logEvent({
      action: 'DEVICE_REVOKED',
      actor: req.user.email,
      actorRole: req.user.role,
      seniorId: device.seniorId,
      targetType: 'Device',
      targetId: device._id,
      metadata: { deviceId: device.deviceId }
    });

    return res.status(200).json({ success: true, message: `Device ${device.deviceId} has been revoked.` });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
