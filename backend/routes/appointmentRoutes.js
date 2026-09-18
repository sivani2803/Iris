const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const AuditLog = require('../models/AuditLog');
const { authorizeSeniorAccess } = require('../middleware/authMiddleware');

// GET /api/appointments/:seniorId (Protected with authorizeSeniorAccess)
router.get('/:seniorId', authorizeSeniorAccess, async (req, res) => {
  try {
    const appointments = await Appointment.find({ seniorId: req.params.seniorId }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: appointments });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/appointments (Protected with authorizeSeniorAccess)
router.post('/', authorizeSeniorAccess, async (req, res) => {
  try {
    const {
      seniorId = 'S102',
      doctor,
      specialty,
      date,
      time,
      location = 'City Hospital, Jubilee Hills',
      notes
    } = req.body;

    if (!doctor || !specialty || !date || !time) {
      return res.status(400).json({ success: false, message: 'Doctor, specialty, date, and time are required' });
    }

    const appt = await Appointment.create({
      seniorId,
      doctor,
      specialty,
      date,
      time,
      location,
      notes: notes || 'Consultation & review',
      status: 'upcoming'
    });

    if (req.user) {
      AuditLog.logEvent({
        action: 'APPOINTMENT_UPDATED',
        actor: req.user.email,
        actorRole: req.user.role,
        seniorId,
        targetType: 'Appointment',
        targetId: appt._id,
        metadata: { doctor, specialty, date, time }
      });
    }

    return res.status(201).json({ success: true, data: appt });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/appointments/:id/reschedule
router.patch('/:id/reschedule', async (req, res) => {
  try {
    const { date, time } = req.body;
    const appt = await Appointment.findByIdAndUpdate(
      req.params.id,
      { date, time, status: 'rescheduled' },
      { new: true }
    );
    if (!appt) return res.status(404).json({ success: false, message: 'Appointment not found' });

    return res.status(200).json({ success: true, data: appt });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/appointments/:id
router.delete('/:id', async (req, res) => {
  try {
    await Appointment.findByIdAndDelete(req.params.id);
    return res.status(200).json({ success: true, message: 'Appointment removed' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
