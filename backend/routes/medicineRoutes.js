const express = require('express');
const router = express.Router();
const Medicine = require('../models/Medicine');
const AuditLog = require('../models/AuditLog');
const { authorizeSeniorAccess } = require('../middleware/authMiddleware');

// GET /api/medicines/:seniorId (Protected with authorizeSeniorAccess)
router.get('/:seniorId', authorizeSeniorAccess, async (req, res) => {
  try {
    const medicines = await Medicine.find({ seniorId: req.params.seniorId }).sort({ time: 1 });
    const takenCount = medicines.filter(m => m.status === 'taken').length;
    const adherenceRate = medicines.length > 0 ? Math.round((takenCount / medicines.length) * 100) : 100;

    return res.status(200).json({
      success: true,
      data: {
        medicines,
        total: medicines.length,
        takenCount,
        adherenceRate
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/medicines (Protected with authorizeSeniorAccess)
router.post('/', authorizeSeniorAccess, async (req, res) => {
  try {
    const { seniorId = 'S102', name, dosage, time, frequency = 'Daily', instructions } = req.body;
    if (!name || !dosage || !time) {
      return res.status(400).json({ success: false, message: 'Name, dosage, and time are required' });
    }

    const medicine = await Medicine.create({
      seniorId,
      name,
      dosage,
      time,
      frequency,
      instructions: instructions || 'Take with water as directed',
      status: 'pending'
    });

    if (req.user) {
      AuditLog.logEvent({
        action: 'MEDICATION_UPDATED',
        actor: req.user.email,
        actorRole: req.user.role,
        seniorId,
        targetType: 'Medicine',
        targetId: medicine._id,
        metadata: { name, dosage, time }
      });
    }

    return res.status(201).json({ success: true, data: medicine });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/medicines/:id/status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body; // 'taken' | 'missed' | 'pending'
    if (!['taken', 'missed', 'pending'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid medicine status' });
    }

    const update = { status };
    if (status === 'taken') {
      update.lastTakenDate = new Date();
    }

    const medicine = await Medicine.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!medicine) return res.status(404).json({ success: false, message: 'Medicine not found' });

    return res.status(200).json({ success: true, data: medicine });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/medicines/:id
router.delete('/:id', async (req, res) => {
  try {
    await Medicine.findByIdAndDelete(req.params.id);
    return res.status(200).json({ success: true, message: 'Medicine removed' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
