/**
 * IRIS AI Context & Authorization Pipeline
 * 
 * Guarantees that AI context is:
 * 1. Strictly authorized through server-side identity resolution (never trusting frontend seniorId).
 * 2. Completely free of leaked seed/demo data for real authenticated users and guests.
 * 3. Minimal and strictly relevant to the user's classified intent.
 * 4. Time-aware for wearable/vitals data (never treating stale or baseline numbers as current).
 * 5. Respectful of patient privacy and consent settings.
 */

const User = require('../models/User');
const SeniorProfile = require('../models/SeniorProfile');
const HealthEvent = require('../models/HealthEvent');
const Medicine = require('../models/Medicine');
const Appointment = require('../models/Appointment');
const FamilyRelationship = require('../models/FamilyRelationship');
const Consent = require('../models/Consent');
const { normalizeRole } = require('../middleware/authMiddleware');
const { INTENTS } = require('./aiClassifier');

/**
 * Builds a minimal, verified, authorized context for the AI prompt.
 * 
 * @param {object} options
 * @param {object} [options.user] Authenticated MongoDB User document
 * @param {boolean} [options.isDemoMode] Explicit demo mode trigger
 * @param {string} [options.requestedSeniorId] Optional frontend seniorId (verified server-side)
 * @param {object} options.intentResult Classification result from aiClassifier
 * @returns {Promise<object>} Authorized context object
 */
async function buildAuthorizedAiContext({ user, isDemoMode = false, requestedSeniorId = null, intentResult }) {
  let authorizedSeniorId = null;
  let isDemoSession = false;
  let seniorProfile = null;
  let authorizedRole = 'guest';

  // 1. Resolve Authenticated Identity Server-Side
  if (user && user._id) {
    authorizedRole = normalizeRole(user.role);

    // Identify if user is an explicit demo account
    const isDemoEmail = user.email === 'senior@iris.care' || 
                        user.email === 'family@iris.care' || 
                        user.email === 'caretaker@iris.care';

    if (authorizedRole === 'senior') {
      if (isDemoEmail) {
        authorizedSeniorId = 'S102';
        isDemoSession = true;
      } else {
        authorizedSeniorId = user.seniorId && user.seniorId !== 'S102' ? user.seniorId : null;
        if (!authorizedSeniorId) {
          const found = await SeniorProfile.findOne({ userId: user._id });
          if (found && found.seniorId !== 'S102') {
            authorizedSeniorId = found.seniorId;
          }
        }
      }
    } else if (authorizedRole === 'family') {
      if (isDemoEmail) {
        authorizedSeniorId = 'S102';
        isDemoSession = true;
      } else {
        const rel = await FamilyRelationship.findOne({ familyUserId: user._id, status: 'APPROVED' });
        if (rel && rel.seniorId !== 'S102') {
          authorizedSeniorId = rel.seniorId;
        } else if (user.seniorId && user.seniorId !== 'S102') {
          authorizedSeniorId = user.seniorId;
        }
      }
    } else if (authorizedRole === 'caretaker') {
      if (isDemoEmail) {
        authorizedSeniorId = 'S102';
        isDemoSession = true;
      } else if (user.seniorId && user.seniorId !== 'S102') {
        authorizedSeniorId = user.seniorId;
      }
    } else if (authorizedRole === 'admin') {
      if (requestedSeniorId) {
        authorizedSeniorId = requestedSeniorId;
      } else if (user.seniorId) {
        authorizedSeniorId = user.seniorId;
      }
    }
  } else if (isDemoMode) {
    // Explicit demo request without user authentication (e.g. from Demo Console)
    authorizedSeniorId = 'S102';
    isDemoSession = true;
    authorizedRole = 'demo_user';
  }

  // 2. Retrieve Senior Profile ONLY if authorized
  if (authorizedSeniorId) {
    seniorProfile = await SeniorProfile.findOne({ seniorId: authorizedSeniorId });
  }

  // 3. Check Patient Consent for AI Processing
  let hasAiConsent = true;
  if (authorizedSeniorId && !isDemoSession) {
    const consentDoc = await Consent.findOne({ seniorId: authorizedSeniorId, purpose: 'AI_PROCESSING' });
    if (consentDoc && consentDoc.granted === false) {
      hasAiConsent = false;
    }
  }

  const context = {
    isAuthenticated: Boolean(user && user._id),
    isDemoMode: isDemoSession,
    userRole: authorizedRole,
    userName: user?.name || (isDemoSession ? 'Savitri Devi' : null),
    authorizedSeniorId,
    seniorName: seniorProfile?.name || (isDemoSession ? 'Savitri Devi' : null),
    seniorAge: seniorProfile?.age || null,
    hasAuthorizedRecords: Boolean(seniorProfile),
    hasConsent: hasAiConsent,
    relevantData: {}
  };

  const intent = intentResult?.intent;

  // If patient revoked AI consent, do not inject any personal health records into context
  if (!hasAiConsent) {
    context.consentNotice = 'Patient has not granted consent for AI processing of clinical records.';
    return context;
  }

  // 4. Selective, Intent-Driven Data Retrieval
  // Only query relevant collections — NEVER dump the entire database!

  // A. APPOINTMENT INQUIRY
  if (intent === INTENTS.APPOINTMENT_QUESTION) {
    if (authorizedSeniorId) {
      const appointments = await Appointment.find({
        seniorId: authorizedSeniorId,
        status: { $in: ['upcoming', 'scheduled'] }
      }).sort({ createdAt: -1 }).limit(3);

      context.relevantData.appointments = appointments.map(a => ({
        doctor: a.doctor,
        specialty: a.specialty,
        date: a.date,
        time: a.time,
        location: a.location,
        notes: a.notes
      }));
      context.relevantData.hasAppointments = appointments.length > 0;
    } else {
      context.relevantData.appointments = [];
      context.relevantData.hasAppointments = false;
    }
  }

  // B. MEDICATION INQUIRY
  if (intent === INTENTS.MEDICATION_QUESTION) {
    if (authorizedSeniorId) {
      const meds = await Medicine.find({ seniorId: authorizedSeniorId }).limit(5);
      context.relevantData.medicines = meds.map(m => ({
        name: m.name,
        dosage: m.dosage,
        time: m.time,
        frequency: m.frequency,
        instructions: m.instructions,
        status: m.status
      }));
      context.relevantData.hasMedicines = meds.length > 0;
    } else {
      context.relevantData.medicines = [];
      context.relevantData.hasMedicines = false;
    }
  }

  // C. WEARABLE / VITALS INQUIRY, ABNORMAL SIGNAL, & EMERGENCY SYMPTOMS
  if (
    intent === INTENTS.WEARABLE_VITALS_QUESTION || 
    intent === INTENTS.ABNORMAL_WEARABLE_SIGNAL || 
    intent === INTENTS.EMERGENCY_SYMPTOM
  ) {
    if (authorizedSeniorId) {
      const latestEvent = await HealthEvent.findOne({ seniorId: authorizedSeniorId }).sort({ timestamp: -1 });

      if (latestEvent && latestEvent.timestamp) {
        const eventTime = new Date(latestEvent.timestamp);
        const ageMs = Date.now() - eventTime.getTime();
        // Readings under 15 minutes are considered current; older readings are time-stamped as historical
        const isRecent = ageMs < 15 * 60 * 1000 && ageMs >= 0;

        context.relevantData.vitals = {
          source: 'smartwatch',
          measurementTime: eventTime.toISOString(),
          formattedTime: eventTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isRecent,
          ageMinutes: Math.max(0, Math.round(ageMs / 60000)),
          heartRate: latestEvent.heartRate,
          spo2: latestEvent.spo2,
          motionState: latestEvent.motionState,
          fallDetected: latestEvent.fallDetected,
          riskLevel: latestEvent.riskLevel
        };
        context.relevantData.hasRecentVitals = isRecent;
      } else {
        context.relevantData.vitals = null;
        context.relevantData.hasRecentVitals = false;
      }
    } else {
      context.relevantData.vitals = null;
      context.relevantData.hasRecentVitals = false;
    }
  }

  // D. CAREGIVER INQUIRY
  if (intent === INTENTS.CAREGIVER_REQUEST) {
    let caregiverInfo = null;

    if (authorizedSeniorId) {
      // 1. Check senior's verified emergency contacts first
      if (seniorProfile?.emergencyContacts && seniorProfile.emergencyContacts.length > 0) {
        const primary = seniorProfile.emergencyContacts.find(c => c.isPrimary) || seniorProfile.emergencyContacts[0];
        if (primary && primary.name) {
          caregiverInfo = {
            name: primary.name,
            relation: primary.relation || 'Primary Emergency Contact',
            phone: primary.phone || 'On file'
          };
        }
      }

      // 2. Check assigned caretaker in users
      if (!caregiverInfo) {
        const assignedCaretaker = await User.findOne({ role: 'caretaker', seniorId: authorizedSeniorId });
        if (assignedCaretaker) {
          caregiverInfo = {
            name: assignedCaretaker.name,
            relation: 'Assigned Caregiver',
            phone: assignedCaretaker.phone || 'On file'
          };
        }
      }

      // 3. Demo mode fallback only for explicit demo session on S102
      if (!caregiverInfo && isDemoSession && authorizedSeniorId === 'S102') {
        caregiverInfo = {
          name: 'Ravi Kumar',
          relation: 'Assigned Caregiver (Demo)',
          phone: '+91 98123 45678'
        };
      }
    }

    context.relevantData.caregiver = caregiverInfo;
    context.relevantData.hasCaregiver = Boolean(caregiverInfo);
  }

  // E. CANCER / SERIOUS DIAGNOSIS & AMBIGUOUS DYING DISTRESS
  if (intent === INTENTS.CANCER_SERIOUS_DIAGNOSIS || intent === INTENTS.AMBIGUOUS_DYING_DISTRESS) {
    context.relevantData.recordedConditions = seniorProfile?.medicalConditions || [];
    context.relevantData.hasRecordedCancer = context.relevantData.recordedConditions.some(
      c => /cancer|carcinoma|tumor|tumour|oncology/i.test(c)
    );
    // Note: Deliberately do NOT query vitals, medications, appointments, or caregivers for serious distress/cancer inquiries
  }

  return context;
}

module.exports = {
  buildAuthorizedAiContext
};
