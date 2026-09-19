const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { getChatResponse } = require('../services/geminiService');
const { classifyIntent, INTENTS } = require('../services/aiClassifier');
const { aiLimiter } = require('../middleware/rateLimiter');
const { JWT_SECRET } = require('../middleware/authMiddleware');
const { verifyFirebaseIdToken } = require('../config/firebase');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

/**
 * Optional authentication middleware:
 * Hydrates req.user if a valid Bearer token is provided, without failing unauthenticated requests.
 */
async function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return next();

  // 1. Try IRIS JWT
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.userId) {
      const user = await User.findById(decoded.userId).select('-passwordHash');
      if (user && user.status !== 'DISABLED' && user.status !== 'SUSPENDED' && user.isActive !== false) {
        req.user = user;
        return next();
      }
    }
  } catch (_) {
    // 2. Try Firebase ID Token
    try {
      const firebaseUser = await verifyFirebaseIdToken(token);
      if (firebaseUser && firebaseUser.uid) {
        const user = await User.findOne({ firebaseUid: firebaseUser.uid }).select('-passwordHash');
        if (user && user.status !== 'DISABLED' && user.status !== 'SUSPENDED' && user.isActive !== false) {
          req.user = user;
          return next();
        }
      }
    } catch (_) {}
  }

  next();
}

// POST /api/ai/chat (Context-aware, grounded, non-hallucinating AI endpoint)
router.post('/chat', aiLimiter, optionalAuth, async (req, res) => {
  try {
    const { message, language = 'en', seniorId = null, isDemo = false } = req.body;

    if (!message || String(message).trim() === '') {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    // Input sanitization
    const sanitizedMessage = String(message).slice(0, 500).trim();

    // Determine if demo mode is explicitly requested or user is an explicit demo account
    const isDemoAccount = Boolean(
      req.user && (
        req.user.email === 'senior@iris.care' || 
        req.user.email === 'family@iris.care' || 
        req.user.email === 'caretaker@iris.care'
      )
    );
    const isDemoMode = Boolean(isDemoAccount || (Boolean(isDemo) && !req.user));

    // Call grounded chat response pipeline with server-verified identity
    const result = await getChatResponse(sanitizedMessage, language, {
      user: req.user || null,
      isDemoMode,
      seniorId: isDemoMode ? 'S102' : (req.user ? seniorId : null)
    });

    // Audit AI query metadata
    AuditLog.logEvent({
      action: 'AI_INTERACTION',
      actor: req.user?.email || (isDemoMode ? 'Demo Evaluator' : 'Guest User'),
      actorRole: req.user?.role || (isDemoMode ? 'demo' : 'guest'),
      seniorId: req.user?.seniorId || (isDemoMode ? 'S102' : 'none'),
      targetType: 'AI_Assistant',
      metadata: { urgency: result.urgency, language, length: sanitizedMessage.length, isDemo: isDemoMode }
    });

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('[IRIS Route Error] /ai/chat:', error);
    return res.status(500).json({ success: false, message: 'AI Care Assistant unavailable' });
  }
});

// POST /api/ai/triage (Structured language-independent clinical request parsing)
router.post('/triage', aiLimiter, async (req, res) => {
  try {
    const { text, language = 'en' } = req.body;
    const sanitized = String(text || '').trim();
    const classification = classifyIntent(sanitized, language);
    const lower = sanitized.toLowerCase();

    const isEmergency = classification.urgency === 'CRITICAL' ||
      classification.intent === INTENTS.EMERGENCY_SYMPTOM ||
      classification.intent === INTENTS.SELF_HARM ||
      (classification.intent === INTENTS.FALL_INCIDENT && classification.hitHead) ||
      lower.includes('chest') || lower.includes('fall') || lower.includes('unconscious') || lower.includes('stroke') || lower.includes('గుండె') || lower.includes('పడిపో');

    const isMobility = classification.intent === INTENTS.FALL_INCIDENT ||
      lower.includes('walk') || lower.includes('dizzy') || lower.includes('knee') || lower.includes('wheelchair') || lower.includes('నడవలే');

    const incidentType = classification.intent === INTENTS.FALL_INCIDENT || lower.includes('fall')
      ? 'fall'
      : (classification.isChestDiscomfort || lower.includes('chest') ? 'cardiac_alert' : 'symptom_inquiry');

    const structured = {
      request_type: isEmergency ? 'emergency' : 'health_query',
      incident: incidentType,
      severity: isEmergency ? 'critical' : classification.urgency === 'HIGH' ? 'high' : lower.includes('dizzy') ? 'moderate' : 'low',
      mobility_required: isMobility,
      medical_assistance: isEmergency || lower.includes('doctor') || lower.includes('pill') || classification.intent === INTENTS.MEDICATION_QUESTION,
      response_required: isEmergency ? 'immediate' : 'standard_observation',
      source_language: language,
      timestamp: new Date().toISOString()
    };

    return res.status(200).json({ success: true, data: structured });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
