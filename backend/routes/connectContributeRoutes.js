const express = require('express');
const router = express.Router();
const Organization = require('../models/Organization');
const Participation = require('../models/Participation');
const { authenticateToken } = require('../middleware/authMiddleware');

// GET /api/connect-contribute/organizations — List organizations (optional ?category= filter)
router.get('/organizations', async (req, res) => {
    try {
        const filter = { isActive: true };
        if (req.query.category) {
            filter.category = req.query.category;
        }
        const organizations = await Organization.find(filter).sort({ name: 1 });
        res.json({ success: true, data: organizations });
    } catch (err) {
        console.error('[Connect&Contribute] Error fetching organizations:', err.message);
        res.status(500).json({ success: false, message: 'Failed to fetch organizations.' });
    }
});

// GET /api/connect-contribute/organizations/:id — Get single organization
router.get('/organizations/:id', async (req, res) => {
    try {
        const org = await Organization.findById(req.params.id);
        if (!org) {
            return res.status(404).json({ success: false, message: 'Organization not found.' });
        }
        res.json({ success: true, data: org });
    } catch (err) {
        console.error('[Connect&Contribute] Error fetching organization:', err.message);
        res.status(500).json({ success: false, message: 'Failed to fetch organization.' });
    }
});

// POST /api/connect-contribute/participate — Create participation request (authenticated)
router.post('/participate', authenticateToken, async (req, res) => {
    try {
        const { organizationId, organizationName, activityName, activityIcon, message } = req.body;

        if (!organizationId || !activityName) {
            return res.status(400).json({ success: false, message: 'Organization ID and activity name are required.' });
        }

        const participation = await Participation.create({
            userId: req.user._id,
            seniorName: req.user.name || '',
            organizationId,
            organizationName: organizationName || '',
            activityName,
            activityIcon: activityIcon || '📋',
            message: message || '',
            status: 'pending'
        });

        console.log(`[Connect&Contribute] Participation created: ${req.user.name} → ${organizationName} (${activityName})`);

        res.status(201).json({ success: true, data: participation });
    } catch (err) {
        console.error('[Connect&Contribute] Error creating participation:', err.message);
        res.status(500).json({ success: false, message: 'Failed to create participation request.' });
    }
});

// GET /api/connect-contribute/my-participations — Get logged-in user's participations
router.get('/my-participations', authenticateToken, async (req, res) => {
    try {
        const participations = await Participation.find({ userId: req.user._id })
            .sort({ createdAt: -1 })
            .populate('organizationId', 'name category image');
        res.json({ success: true, data: participations });
    } catch (err) {
        console.error('[Connect&Contribute] Error fetching participations:', err.message);
        res.status(500).json({ success: false, message: 'Failed to fetch participations.' });
    }
});

module.exports = router;
