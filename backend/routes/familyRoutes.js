const express = require('express');
const router = express.Router();
const FamilyCheckIn = require('../models/FamilyCheckIn');
const { authorizeSeniorAccess } = require('../middleware/authMiddleware');

// GET /api/family/check-ins/:seniorId (Protected with authorizeSeniorAccess)
router.get('/check-ins/:seniorId', authorizeSeniorAccess, async (req, res) => {
  try {
    const checkIns = await FamilyCheckIn.find({ seniorId: req.params.seniorId }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: checkIns });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/family/check-ins (Protected with authorizeSeniorAccess)
router.post('/check-ins', authorizeSeniorAccess, async (req, res) => {
  try {
    const {
      seniorId = 'S102',
      familyMemberName = 'Ananya Sharma',
      relationship = 'Daughter',
      scheduledDay = 'Sunday',
      scheduledTime = '7:00 PM',
      title = 'Weekly family video call'
    } = req.body;

    const checkIn = await FamilyCheckIn.create({
      seniorId,
      familyMemberName,
      relationship,
      scheduledDay,
      scheduledTime,
      title,
      status: 'scheduled',
      callLink: `https://iris.care/call/room-s102-${Date.now()}`
    });

    return res.status(201).json({ success: true, data: checkIn });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/family/activities (Community Engagement)
router.get('/activities', (req, res) => {
  const activities = [
    {
      id: 'act-1',
      title: 'Morning Walk & Laughter Group',
      time: '10:00 AM',
      location: 'Madhapur Community Park',
      category: 'Fitness & Social',
      coordinator: 'Sita Raman',
      participantsCount: 8,
      status: 'upcoming'
    },
    {
      id: 'act-2',
      title: 'Gardening & Herb Circle',
      time: '04:00 PM',
      location: 'Green Valley Enclave Clubhouse',
      category: 'Hobbies',
      coordinator: 'Dr. Ramesh Babu',
      participantsCount: 6,
      status: 'upcoming'
    },
    {
      id: 'act-3',
      title: 'Storytelling & Carnatic Music Session',
      time: '06:00 PM',
      location: 'Online / Iris Audio Room',
      category: 'Culture & Mentoring',
      coordinator: 'Savitri Devi & Friends',
      participantsCount: 14,
      status: 'upcoming'
    }
  ];

  return res.status(200).json({ success: true, data: activities });
});

module.exports = router;
