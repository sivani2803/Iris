const express = require('express');
const router = express.Router();
const { getChatResponse } = require('../services/geminiService');
const { aiLimiter } = require('../middleware/rateLimiter');
const AuditLog = require('../models/AuditLog');

// POST /api/ai/chat (Phase 20: AI Security & Rate Limiting)
router.post('/chat', aiLimiter, async (req, res) => {
  try {
    const { message, language = 'en', seniorId = 'S102' } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    // Input Sanitization (Cap message length to prevent prompt overflow)
    const sanitizedMessage = String(message).slice(0, 500).trim();

    const result = await getChatResponse(sanitizedMessage, language, seniorId);

    // Audit AI query metadata without storing full sensitive health text
    AuditLog.logEvent({
      action: 'AI_INTERACTION',
      actor: req.user?.email || 'Senior Citizen',
      actorRole: req.user?.role || 'senior',
      seniorId,
      targetType: 'AI_Assistant',
      metadata: { urgency: result.urgency, language, length: sanitizedMessage.length }
    });

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('[IRIS Route Error] /ai/chat:', error);
    return res.status(500).json({ success: false, message: 'AI Care Assistant unavailable' });
  }
});

// POST /api/ai/triage (Structured language-independent request parsing)
router.post('/triage', aiLimiter, async (req, res) => {
  try {
    const { text, language = 'en' } = req.body;
    const lower = (text || '').toLowerCase();

    const isEmergency = lower.includes('chest') || lower.includes('fall') || lower.includes('unconscious') || lower.includes('stroke') || lower.includes('గుండె') || lower.includes('పడిపో');
    const isMobility = lower.includes('walk') || lower.includes('dizzy') || lower.includes('knee') || lower.includes('wheelchair') || lower.includes('నడవలే');

    const structured = {
      request_type: isEmergency ? 'emergency' : 'health_query',
      incident: lower.includes('fall') ? 'fall' : lower.includes('chest') ? 'cardiac_alert' : 'symptom_inquiry',
      severity: isEmergency ? 'critical' : lower.includes('dizzy') ? 'moderate' : 'low',
      mobility_required: isMobility,
      medical_assistance: isEmergency || lower.includes('doctor') || lower.includes('pill'),
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
