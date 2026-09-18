const express = require('express');
const router = express.Router();
const TransportRequest = require('../models/TransportRequest');

const { authenticateToken } = require('../middleware/authMiddleware');

// GET /api/transport/me (Context-aware transport requests)
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const targetSeniorId = req.user.seniorId;
    if (!targetSeniorId) {
      return res.status(200).json({ success: true, data: [] });
    }

    const requests = await TransportRequest.find({ seniorId: targetSeniorId }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: requests });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/transport/:seniorId
router.get('/:seniorId', async (req, res) => {
  try {
    const requests = await TransportRequest.find({ seniorId: req.params.seniorId }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: requests });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/transport
router.post('/', async (req, res) => {
  try {
    const seniorId = req.body.seniorId || (req.user ? req.user.seniorId : null) || 'S102';
    const {
      destination,
      appointmentReason = 'Doctor Visit',
      mobilityRequirement = 'Wheelchair accessible',
      preferredTime = '10:00 AM'
    } = req.body;

    if (!destination) {
      return res.status(400).json({ success: false, message: 'Destination is required' });
    }

    const request = await TransportRequest.create({
      seniorId,
      destination,
      appointmentReason,
      mobilityRequirement,
      preferredTime,
      status: 'driver_assigned',
      driverName: 'Suresh Verma (IRIS Medical Transit)',
      driverPhone: '+91 98765 43210',
      vehicleNumber: 'TS 09 EA 4128',
      etaMinutes: 12
    });

    return res.status(201).json({ success: true, data: request });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
