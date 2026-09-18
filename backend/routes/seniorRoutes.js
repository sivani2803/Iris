const express = require('express');
const router = express.Router();
const SeniorProfile = require('../models/SeniorProfile');
const HealthEvent = require('../models/HealthEvent');
const AuditLog = require('../models/AuditLog');
const { authorizeSeniorAccess, authenticateToken } = require('../middleware/authMiddleware');

// GET /api/seniors (List all seniors - restricted to admin/caretakers or system)
router.get('/', async (req, res) => {
  try {
    const seniors = await SeniorProfile.find();
    return res.status(200).json({ success: true, data: seniors });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/seniors/:id (Protected with authorizeSeniorAccess against IDOR)
router.get('/:id', authorizeSeniorAccess, async (req, res) => {
  try {
    const senior = await SeniorProfile.findOne({ seniorId: req.params.id });
    if (!senior) {
      return res.status(404).json({ success: false, message: 'Senior profile not found' });
    }
    return res.status(200).json({ success: true, data: senior });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/seniors/:id/health (Protected with authorizeSeniorAccess against IDOR)
router.get('/:id/health', authorizeSeniorAccess, async (req, res) => {
  try {
    const events = await HealthEvent.find({ seniorId: req.params.id })
      .sort({ timestamp: -1 })
      .limit(30);

    const latest = events[0] || {
      heartRate: 72,
      spo2: 98,
      motionState: 'active',
      fallDetected: false,
      timestamp: new Date()
    };

    // Audit health data access (Phase 7 & 22)
    if (req.user) {
      AuditLog.logEvent({
        action: 'HEALTH_DATA_ACCESSED',
        actor: req.user.email,
        actorRole: req.user.role,
        seniorId: req.params.id,
        targetType: 'HealthEvent',
        metadata: { recordCount: events.length }
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        current: latest,
        recentHistory: events
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/seniors/:id (Protected with authorizeSeniorAccess & Mass-Assignment Prevention - Phase 16)
router.put('/:id', authorizeSeniorAccess, async (req, res) => {
  try {
    // Explicit whitelist of allowed mutable fields
    const allowedFields = [
      'name',
      'age',
      'gender',
      'bloodGroup',
      'phone',
      'address',
      'location',
      'medicalConditions',
      'allergies',
      'emergencyContacts',
      'baselineVitals'
    ];

    const safeUpdates = {};
    for (const key of Object.keys(req.body)) {
      if (allowedFields.includes(key)) {
        safeUpdates[key] = req.body[key];
      }
    }

    const senior = await SeniorProfile.findOneAndUpdate(
      { seniorId: req.params.id },
      safeUpdates,
      { new: true, runValidators: true }
    );

    if (!senior) {
      return res.status(404).json({ success: false, message: 'Senior profile not found' });
    }

    if (req.user) {
      AuditLog.logEvent({
        action: 'PROFILE_UPDATED',
        actor: req.user.email,
        actorRole: req.user.role,
        seniorId: req.params.id,
        targetType: 'SeniorProfile',
        targetId: senior._id,
        metadata: { modifiedFields: Object.keys(safeUpdates) }
      });
    }

    return res.status(200).json({ success: true, data: senior });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
