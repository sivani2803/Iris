const express = require('express');
const router = express.Router();
const Caretaker = require('../models/Caretaker');

// GET /api/caretakers
router.get('/', async (req, res) => {
  try {
    const caretakers = await Caretaker.find().sort({ distanceKm: 1 });
    return res.status(200).json({ success: true, data: caretakers });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/caretakers/:id
router.get('/:id', async (req, res) => {
  try {
    const caretaker = await Caretaker.findById(req.params.id);
    if (!caretaker) return res.status(404).json({ success: false, message: 'Caretaker not found' });
    return res.status(200).json({ success: true, data: caretaker });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/caretakers/:id/availability
router.patch('/:id/availability', async (req, res) => {
  try {
    const caretaker = await Caretaker.findByIdAndUpdate(
      req.params.id,
      { availability: req.body.availability },
      { new: true }
    );
    return res.status(200).json({ success: true, data: caretaker });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
