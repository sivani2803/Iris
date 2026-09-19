const express = require('express');
const router = express.Router();
const FamilyCheckIn = require('../models/FamilyCheckIn');
const FamilyRelationship = require('../models/FamilyRelationship');
const SeniorProfile = require('../models/SeniorProfile');
const AuditLog = require('../models/AuditLog');
const { authorizeSeniorAccess, authenticateToken } = require('../middleware/authMiddleware');

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

// POST /api/family/connect
// Secure mechanism to connect a family member to a senior via invitation authorization
router.post('/connect', authenticateToken, async (req, res) => {
  try {
    const { seniorId, inviteCode, relationship = 'Other' } = req.body;

    if (!seniorId) {
      return res.status(400).json({ success: false, message: 'seniorId is required' });
    }

    const senior = await SeniorProfile.findOne({ seniorId });
    if (!senior) {
      return res.status(404).json({ success: false, message: 'Senior profile not found' });
    }

    const validCode = 'IRIS-' + senior.seniorId;
    const providedCode = (inviteCode || '').trim().toUpperCase();

    // Enforce authorization check: must supply valid invite code (e.g. IRIS-S102 or CARE-2026)
    if (providedCode !== validCode && providedCode !== 'CARE-2026') {
      AuditLog.logEvent({
        action: 'SECURITY_VIOLATION',
        actor: req.user.email,
        actorRole: req.user.role,
        seniorId,
        targetType: 'SeniorProfile',
        metadata: { reason: 'INVALID_SENIOR_INVITE_CODE', attemptedCode: inviteCode },
        ipAddress: req.ip || '127.0.0.1'
      });

      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN_INVALID_INVITE_CODE',
        message: 'Invalid senior invitation code. Connection authorization rejected.'
      });
    }

    const relRecord = await FamilyRelationship.findOneAndUpdate(
      { familyUserId: req.user._id, seniorId },
      {
        familyUserId: req.user._id,
        seniorId,
        relationship,
        status: 'APPROVED',
        accessLevel: 'FULL_CARE',
        approvedAt: new Date()
      },
      { upsert: true, new: true }
    );

    req.user.seniorId = seniorId;
    await req.user.save();

    AuditLog.logEvent({
      action: 'FAMILY_CONNECTED_TO_SENIOR',
      actor: req.user.email,
      actorRole: req.user.role,
      seniorId,
      targetType: 'FamilyRelationship',
      targetId: relRecord._id,
      metadata: { relationship },
      ipAddress: req.ip || '127.0.0.1'
    });

    return res.status(200).json({
      success: true,
      message: `Successfully connected to senior ${senior.name} (${seniorId})`,
      data: relRecord
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/family/my-seniors (List seniors authorized for this family user)
router.get('/my-seniors', authenticateToken, async (req, res) => {
  try {
    const relationships = await FamilyRelationship.find({
      familyUserId: req.user._id,
      status: 'APPROVED'
    });

    const seniorIds = relationships.map(r => r.seniorId);
    if (req.user.seniorId && !seniorIds.includes(req.user.seniorId)) {
      seniorIds.push(req.user.seniorId);
    }

    const seniors = await SeniorProfile.find({ seniorId: { $in: seniorIds } });
    return res.status(200).json({ success: true, data: seniors });
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
      coordinator: 'Community Cultural Group',
      participantsCount: 14,
      status: 'upcoming'
    }
  ];

  return res.status(200).json({ success: true, data: activities });
});

module.exports = router;
