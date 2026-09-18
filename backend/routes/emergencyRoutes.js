const express = require('express');
const router = express.Router();
const Emergency = require('../models/Emergency');
const HealthEvent = require('../models/HealthEvent');
const {
  processHealthEvent,
  acceptEmergency,
  markEnRoute,
  markArrived,
  resolveEmergency,
  reassessEmergency
} = require('../services/emergencyService');
const { telemetryLimiter } = require('../middleware/rateLimiter');

// POST /api/emergency/health-event
router.post('/health-event', telemetryLimiter, async (req, res) => {
  try {
    const { seniorId, eventId, deviceId, heartRate, spo2, motionState, fallDetected, eventType, timestamp } = req.body;

    // Validate payload
    if (heartRate === undefined || spo2 === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required health telemetry fields: heartRate and spo2 are required'
      });
    }

    const result = await processHealthEvent({
      seniorId: seniorId || 'S102',
      eventId,
      deviceId: deviceId || 'DEV-WATCH-S102',
      heartRate: Number(heartRate),
      spo2: Number(spo2),
      motionState: motionState || 'active',
      fallDetected: Boolean(fallDetected),
      eventType: eventType || 'routine',
      timestamp: timestamp || new Date()
    });

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('[IRIS Route Error] /health-event:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to process health event'
    });
  }
});

const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/authMiddleware');

function extractAuthInfo(req) {
  try {
    const auth = req.headers['authorization'];
    if (auth && auth.startsWith('Bearer ')) {
      const decoded = jwt.decode(auth.split(' ')[1]);
      return { hasToken: true, seniorId: decoded ? decoded.seniorId : null };
    }
  } catch (_) {}
  return { hasToken: false, seniorId: null };
}

// GET /api/emergency/active
router.get('/active', async (req, res) => {
  try {
    const authInfo = extractAuthInfo(req);
    // If user is authenticated but has no linked senior, do NOT leak S102 data
    if (authInfo.hasToken && !authInfo.seniorId && !req.query.seniorId) {
      return res.status(200).json({
        success: true,
        data: null
      });
    }

    const seniorId = req.query.seniorId || authInfo.seniorId || 'S102';
    const emergency = await Emergency.findOne({ seniorId, active: true }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: emergency || null
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/emergency/history
router.get('/history', async (req, res) => {
  try {
    const authInfo = extractAuthInfo(req);
    if (authInfo.hasToken && !authInfo.seniorId && !req.query.seniorId) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }

    const seniorId = req.query.seniorId || authInfo.seniorId || 'S102';
    const emergencies = await Emergency.find({ seniorId }).sort({ createdAt: -1 }).limit(10);
    return res.status(200).json({ success: true, data: emergencies });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/emergency/:id
router.get('/:id', async (req, res) => {
  try {
    const emergency = await Emergency.findById(req.params.id);
    if (!emergency) return res.status(404).json({ success: false, message: 'Emergency not found' });
    return res.status(200).json({ success: true, data: emergency });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/emergency/:id/accept
router.post('/:id/accept', async (req, res) => {
  try {
    const emergency = await acceptEmergency(req.params.id, req.body.caretakerId);
    return res.status(200).json({ success: true, data: emergency });
  } catch (error) {
    return res.status(error.statusCode || 400).json({ success: false, message: error.message });
  }
});

// POST /api/emergency/:id/decline
router.post('/:id/decline', async (req, res) => {
  try {
    const reason = req.body.reason || 'Primary caretaker unavailable';
    const emergency = await reassessEmergency(req.params.id, reason);
    return res.status(200).json({ success: true, data: emergency });
  } catch (error) {
    return res.status(error.statusCode || 400).json({ success: false, message: error.message });
  }
});

// POST /api/emergency/:id/en-route
router.post('/:id/en-route', async (req, res) => {
  try {
    const emergency = await markEnRoute(req.params.id, req.body.caretakerId);
    return res.status(200).json({ success: true, data: emergency });
  } catch (error) {
    return res.status(error.statusCode || 400).json({ success: false, message: error.message });
  }
});

// POST /api/emergency/:id/arrived
router.post('/:id/arrived', async (req, res) => {
  try {
    const emergency = await markArrived(req.params.id, req.body.caretakerId);
    return res.status(200).json({ success: true, data: emergency });
  } catch (error) {
    return res.status(error.statusCode || 400).json({ success: false, message: error.message });
  }
});

// POST /api/emergency/:id/resolve
router.post('/:id/resolve', async (req, res) => {
  try {
    const emergency = await resolveEmergency(req.params.id, req.body.resolutionNotes);
    return res.status(200).json({ success: true, data: emergency });
  } catch (error) {
    return res.status(error.statusCode || 400).json({ success: false, message: error.message });
  }
});

// POST /api/emergency/:id/reassess
router.post('/:id/reassess', async (req, res) => {
  try {
    const emergency = await reassessEmergency(req.params.id, req.body.reason || 'Manual reassessment requested');
    return res.status(200).json({ success: true, data: emergency });
  } catch (error) {
    return res.status(error.statusCode || 400).json({ success: false, message: error.message });
  }
});

// POST /api/emergency/reset - Reset active emergencies for clean demo
router.post('/reset', async (req, res) => {
  try {
    await Emergency.updateMany({ active: true }, { active: false, status: 'resolved', resolutionNotes: 'Reset for demo session' });
    return res.status(200).json({ success: true, message: 'All active emergencies reset' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
