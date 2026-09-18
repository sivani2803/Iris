const Emergency = require('../models/Emergency');
const HealthEvent = require('../models/HealthEvent');
const Caretaker = require('../models/Caretaker');
const Assignment = require('../models/Assignment');
const Device = require('../models/Device');
const AuditLog = require('../models/AuditLog');
const mlRiskClient = require('./mlRiskClient');
const { evaluateRisk } = require('./riskService');
const { findBestResponder } = require('./matchingService');
const { escalateToEmergencyServices } = require('./emergencyEscalationService');

let ioInstance = null;

function setIO(io) {
  ioInstance = io;
}

function broadcast(event, data) {
  if (ioInstance) {
    ioInstance.emit(event, data);
  }
}

/**
 * Strict Emergency State Machine Transition Matrix
 */
const VALID_TRANSITIONS = {
  detected: ['analyzing', 'assigned', 'reassessing', 'cancelled'],
  analyzing: ['assigned', 'reassessing', 'cancelled'],
  assigned: ['acknowledged', 'reassessing', 'cancelled'],
  reassessing: ['assigned', 'en_route', 'cancelled'],
  acknowledged: ['en_route', 'reassessing', 'cancelled'],
  en_route: ['arrived', 'cancelled'],
  arrived: ['resolved', 'cancelled'],
  resolved: [], // Terminal state
  cancelled: [] // Terminal state
};

function validateTransition(currentStatus, targetStatus) {
  const allowed = VALID_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(targetStatus)) {
    const err = new Error(`Invalid emergency state transition from '${currentStatus}' to '${targetStatus}'. Allowed transitions: [${allowed.join(', ') || 'None (Terminal State)'}]`);
    err.statusCode = 400;
    throw err;
  }
}

/**
 * Ingest health event from smartwatch or phone simulator
 * Enforces eventId idempotency and registers device telemetry heartbeat
 */
async function processHealthEvent(eventData) {
  const {
    seniorId = 'S102',
    eventId,
    deviceId = 'DEV-WATCH-S102',
    heartRate = 72,
    spo2 = 98,
    motionState = 'active',
    fallDetected = false,
    eventType = 'routine',
    timestamp = new Date()
  } = eventData;

  // 1. Idempotency Check: Return existing event if eventId was previously processed
  if (eventId) {
    const existingEvent = await HealthEvent.findOne({ eventId });
    if (existingEvent) {
      let existingEmergency = null;
      if (existingEvent.emergencyId) {
        existingEmergency = await Emergency.findById(existingEvent.emergencyId);
      }
      return {
        healthEvent: existingEvent,
        riskAnalysis: {
          score: existingEvent.riskScore,
          riskLevel: existingEvent.riskLevel,
          isEmergency: existingEvent.isEmergency,
          summary: 'Duplicate event (cached idempotent result)',
          factors: ['Idempotent event replay acknowledged']
        },
        emergency: existingEmergency,
        duplicate: true
      };
    }
  }

  // 2. Device Authenticity & Ownership Verification (Phase 9 & 10)
  if (deviceId) {
    const registeredDevice = await Device.findOne({ deviceId });
    if (registeredDevice) {
      if (registeredDevice.status === 'revoked') {
        const err = new Error('Device has been permanently revoked. Telemetry transmission rejected.');
        err.statusCode = 403;
        throw err;
      }
      if (registeredDevice.seniorId && registeredDevice.seniorId !== seniorId) {
        const err = new Error(`Device ownership mismatch: Device '${deviceId}' is registered to '${registeredDevice.seniorId}', not '${seniorId}'. Spoofed telemetry rejected.`);
        err.statusCode = 403;
        throw err;
      }
      registeredDevice.lastSeen = new Date();
      await registeredDevice.save();
    }
  }

  // 3. Evaluate Risk via Hardened ML Client (Circuit Breaker + Deterministic Heuristic Fallback)
  const riskAnalysis = await mlRiskClient.evaluateRisk({
    seniorId,
    heartRate,
    spo2,
    motionState,
    fallDetected,
    eventType,
    timestamp
  });

  // 4. Persist HealthEvent with traceability
  const healthEvent = await HealthEvent.create({
    seniorId,
    eventId: eventId || undefined,
    deviceId,
    timestamp,
    heartRate,
    spo2,
    motionState,
    fallDetected,
    eventType,
    riskScore: riskAnalysis.score,
    riskLevel: riskAnalysis.riskLevel,
    isEmergency: riskAnalysis.isEmergency
  });

  // 5. Always broadcast real-time telemetry to dashboards
  broadcast('telemetry_update', {
    seniorId,
    eventId: healthEvent.eventId,
    deviceId: healthEvent.deviceId,
    heartRate,
    spo2,
    motionState,
    fallDetected,
    eventType,
    timestamp: healthEvent.timestamp,
    riskLevel: riskAnalysis.riskLevel
  });

  let emergency = null;

  // 6. Create or update Emergency if Risk warrants it
  if (riskAnalysis.isEmergency) {
    let activeEmergency = await Emergency.findOne({ seniorId, active: true });

    if (!activeEmergency) {
      emergency = new Emergency({
        seniorId,
        status: 'detected',
        riskScore: riskAnalysis.score,
        riskLevel: riskAnalysis.riskLevel,
        summary: riskAnalysis.summary,
        triggerEvent: {
          heartRate,
          spo2,
          motionState,
          fallDetected,
          eventType,
          timestamp: healthEvent.timestamp
        },
        timeline: [
          {
            status: 'detected',
            timestamp: new Date(),
            title: 'Emergency Detected',
            description: `${eventType === 'fall' || fallDetected ? 'Fall impact' : 'Severe health anomaly'} detected by smartwatch sensors.`,
            actor: 'Smartwatch Sensor'
          },
          {
            status: 'analyzing',
            timestamp: new Date(),
            title: 'IRIS Risk Engine Analyzing',
            description: `Calculated prototype risk score ${riskAnalysis.score} (${riskAnalysis.riskLevel}). ${riskAnalysis.factors.join(', ')}.`,
            actor: 'IRIS Risk Engine'
          }
        ]
      });

      // Find best responder
      const matchResult = await findBestResponder(emergency);
      if (matchResult) {
        const caretaker = matchResult.caretaker;
        emergency.assignedCaretaker = caretaker._id;
        emergency.assignedCaretakerData = {
          name: caretaker.name,
          phone: caretaker.phone,
          skills: caretaker.skills,
          distanceKm: caretaker.distanceKm,
          etaMinutes: caretaker.etaMinutes,
          rating: caretaker.rating
        };
        emergency.matchedReasons = matchResult.reasons;
        emergency.etaMinutes = caretaker.etaMinutes;
        emergency.status = 'assigned';

        emergency.timeline.push({
          status: 'assigned',
          timestamp: new Date(),
          title: `Responder Matched: ${caretaker.name}`,
          description: `Dispatched alert to nearest certified responder (~${caretaker.etaMinutes} min away).`,
          actor: 'IRIS Matching Engine'
        });

        await Assignment.create({
          emergencyId: emergency._id,
          caretakerId: caretaker._id,
          status: 'pending'
        });
      }

      await emergency.save();
      healthEvent.emergencyId = emergency._id;
      await healthEvent.save();

      // Audit Log
      AuditLog.create({
        action: 'EMERGENCY_CREATED',
        actor: 'IRIS Risk Engine',
        actorRole: 'system',
        seniorId,
        targetType: 'Emergency',
        targetId: emergency._id.toString(),
        metadata: {
          riskScore: riskAnalysis.score,
          riskLevel: riskAnalysis.riskLevel,
          assignedCaretaker: emergency.assignedCaretakerData?.name
        }
      }).catch(err => console.warn('[AuditLog] Notice:', err.message));

      broadcast('emergency_created', emergency);
      broadcast('health_alert', {
        type: 'health_alert',
        seniorId,
        emergencyId: emergency._id,
        heartRate,
        spo2,
        fallDetected,
        risk: riskAnalysis.riskLevel,
        status: emergency.status,
        caretaker: emergency.assignedCaretakerData,
        timeline: emergency.timeline
      });
    } else {
      // Update existing active emergency with latest telemetry
      activeEmergency.triggerEvent = {
        heartRate,
        spo2,
        motionState,
        fallDetected,
        eventType,
        timestamp: healthEvent.timestamp
      };
      if (riskAnalysis.score > activeEmergency.riskScore) {
        activeEmergency.riskScore = riskAnalysis.score;
        activeEmergency.riskLevel = riskAnalysis.riskLevel;
      }
      activeEmergency.timeline.push({
        status: activeEmergency.status,
        timestamp: new Date(),
        title: 'Sensor Update Received',
        description: `HR: ${heartRate} BPM, SpO2: ${spo2}%, Movement: ${motionState}.`,
        actor: 'Smartwatch'
      });
      await activeEmergency.save();
      emergency = activeEmergency;
      broadcast('emergency_updated', emergency);
    }
  }

  return {
    healthEvent,
    riskAnalysis,
    emergency
  };
}

/**
 * Caretaker accepts emergency dispatch
 */
async function acceptEmergency(emergencyId, caretakerId) {
  const emergency = await Emergency.findById(emergencyId);
  if (!emergency) {
    const err = new Error('Emergency not found');
    err.statusCode = 404;
    throw err;
  }

  validateTransition(emergency.status, 'acknowledged');

  emergency.status = 'acknowledged';
  emergency.timeline.push({
    status: 'acknowledged',
    timestamp: new Date(),
    title: 'Responder Acknowledged',
    description: `${emergency.assignedCaretakerData?.name || 'Caretaker'} confirmed receipt and accepted the dispatch.`,
    actor: emergency.assignedCaretakerData?.name || 'Caretaker'
  });

  await emergency.save();

  AuditLog.create({
    action: 'EMERGENCY_ACKNOWLEDGED',
    actor: emergency.assignedCaretakerData?.name || 'Caretaker',
    actorRole: 'caretaker',
    seniorId: emergency.seniorId,
    targetType: 'Emergency',
    targetId: emergency._id.toString(),
    metadata: { status: 'acknowledged' }
  }).catch(e => console.warn('[AuditLog] Notice:', e.message));

  broadcast('emergency_updated', emergency);
  return emergency;
}

/**
 * Caretaker marks en route
 */
async function markEnRoute(emergencyId, caretakerId) {
  const emergency = await Emergency.findById(emergencyId);
  if (!emergency) {
    const err = new Error('Emergency not found');
    err.statusCode = 404;
    throw err;
  }

  validateTransition(emergency.status, 'en_route');

  emergency.status = 'en_route';
  emergency.timeline.push({
    status: 'en_route',
    timestamp: new Date(),
    title: 'Responder En Route',
    description: `${emergency.assignedCaretakerData?.name || 'Caretaker'} is actively traveling to senior location. ETA: ${emergency.etaMinutes} min.`,
    actor: emergency.assignedCaretakerData?.name || 'Caretaker'
  });

  await emergency.save();

  AuditLog.create({
    action: 'EMERGENCY_EN_ROUTE',
    actor: emergency.assignedCaretakerData?.name || 'Caretaker',
    actorRole: 'caretaker',
    seniorId: emergency.seniorId,
    targetType: 'Emergency',
    targetId: emergency._id.toString(),
    metadata: { etaMinutes: emergency.etaMinutes }
  }).catch(e => console.warn('[AuditLog] Notice:', e.message));

  broadcast('emergency_updated', emergency);
  return emergency;
}

/**
 * Caretaker arrives on scene
 */
async function markArrived(emergencyId, caretakerId) {
  const emergency = await Emergency.findById(emergencyId);
  if (!emergency) {
    const err = new Error('Emergency not found');
    err.statusCode = 404;
    throw err;
  }

  validateTransition(emergency.status, 'arrived');

  emergency.status = 'arrived';
  emergency.etaMinutes = 0;
  emergency.timeline.push({
    status: 'arrived',
    timestamp: new Date(),
    title: 'Responder Arrived on Scene',
    description: `${emergency.assignedCaretakerData?.name || 'Caretaker'} has arrived at senior villa. Initiating direct visual and vitals check.`,
    actor: emergency.assignedCaretakerData?.name || 'Caretaker'
  });

  await emergency.save();

  AuditLog.create({
    action: 'EMERGENCY_ARRIVED',
    actor: emergency.assignedCaretakerData?.name || 'Caretaker',
    actorRole: 'caretaker',
    seniorId: emergency.seniorId,
    targetType: 'Emergency',
    targetId: emergency._id.toString(),
    metadata: { etaMinutes: 0 }
  }).catch(e => console.warn('[AuditLog] Notice:', e.message));

  broadcast('emergency_updated', emergency);
  return emergency;
}

/**
 * Resolve emergency
 */
async function resolveEmergency(emergencyId, resolutionNotes = 'Senior stabilized. Vitals normalized.') {
  const emergency = await Emergency.findById(emergencyId);
  if (!emergency) {
    const err = new Error('Emergency not found');
    err.statusCode = 404;
    throw err;
  }

  validateTransition(emergency.status, 'resolved');

  emergency.status = 'resolved';
  emergency.active = false;
  emergency.resolvedAt = new Date();
  emergency.resolutionNotes = resolutionNotes;
  emergency.timeline.push({
    status: 'resolved',
    timestamp: new Date(),
    title: 'Emergency Safely Resolved',
    description: `Incident resolved: ${resolutionNotes}. Family notified. Closed-loop cycle complete.`,
    actor: emergency.assignedCaretakerData?.name || 'Care Network'
  });

  await emergency.save();

  AuditLog.create({
    action: 'EMERGENCY_RESOLVED',
    actor: emergency.assignedCaretakerData?.name || 'Care Network',
    actorRole: 'caretaker',
    seniorId: emergency.seniorId,
    targetType: 'Emergency',
    targetId: emergency._id.toString(),
    metadata: { resolutionNotes }
  }).catch(e => console.warn('[AuditLog] Notice:', e.message));

  broadcast('emergency_updated', emergency);
  broadcast('emergency_resolved', { emergencyId: emergency._id, seniorId: emergency.seniorId });
  return emergency;
}

/**
 * Reassess & switch to alternative responder
 * Triggered if caretaker declines, or does not respond
 */
async function reassessEmergency(emergencyId, reason = 'No response / declined by primary responder') {
  if (!reason || typeof reason !== 'string' || !reason.trim()) {
    const err = new Error('A valid reason is required for caretaker decline / emergency reassessment');
    err.statusCode = 400;
    throw err;
  }

  const emergency = await Emergency.findById(emergencyId);
  if (!emergency) {
    const err = new Error('Emergency not found');
    err.statusCode = 404;
    throw err;
  }

  validateTransition(emergency.status, 'reassessing');

  const previousCaretakerName = emergency.assignedCaretakerData?.name || 'Primary Caretaker';
  const previousCaretakerId = emergency.assignedCaretaker;

  emergency.status = 'reassessing';
  emergency.timeline.push({
    status: 'reassessing',
    timestamp: new Date(),
    title: 'IRIS Autonomous Reassessment Triggered',
    description: `${reason}. Engaging fail-safe secondary escalation protocol.`,
    actor: 'IRIS Workflow Engine'
  });

  AuditLog.create({
    action: 'EMERGENCY_REASSESS_TRIGGERED',
    actor: previousCaretakerName,
    actorRole: 'caretaker',
    seniorId: emergency.seniorId,
    targetType: 'Emergency',
    targetId: emergency._id.toString(),
    metadata: { reason, previousCaretakerId: previousCaretakerId?.toString() }
  }).catch(e => console.warn('[AuditLog] Notice:', e.message));

  // Find best alternative excluding previous caretaker
  const altMatch = await findBestResponder(emergency, previousCaretakerId);

  if (altMatch) {
    const altCaretaker = altMatch.caretaker;
    emergency.alternateCaretaker = altCaretaker._id;
    emergency.assignedCaretaker = altCaretaker._id;
    emergency.assignedCaretakerData = {
      name: altCaretaker.name,
      phone: altCaretaker.phone,
      skills: altCaretaker.skills,
      distanceKm: altCaretaker.distanceKm,
      etaMinutes: altCaretaker.etaMinutes,
      rating: altCaretaker.rating
    };
    emergency.matchedReasons = altMatch.reasons;
    emergency.etaMinutes = altCaretaker.etaMinutes;
    emergency.status = 'assigned';

    emergency.timeline.push({
      status: 'assigned',
      timestamp: new Date(),
      title: `Alternative Responder Assigned: ${altCaretaker.name}`,
      description: `Immediate reassignment successful. Backup specialist alerted (~${altCaretaker.etaMinutes} min away).`,
      actor: 'IRIS Matching Engine'
    });

    AuditLog.create({
      action: 'CARETAKER_REASSIGNED',
      actor: 'IRIS Matching Engine',
      actorRole: 'system',
      seniorId: emergency.seniorId,
      targetType: 'Emergency',
      targetId: emergency._id.toString(),
      metadata: { newCaretaker: altCaretaker.name, etaMinutes: altCaretaker.etaMinutes }
    }).catch(e => console.warn('[AuditLog] Notice:', e.message));
  } else {
    // Level 3 Direct Fail-Safe: Escalate to EMS 108
    return await escalateToEmergencyServices(emergencyId, 'All designated caretakers exhausted or unavailable');
  }

  await emergency.save();
  broadcast('emergency_updated', emergency);
  return emergency;
}

module.exports = {
  setIO,
  processHealthEvent,
  acceptEmergency,
  markEnRoute,
  markArrived,
  resolveEmergency,
  reassessEmergency,
  escalateToEmergencyServices,
  validateTransition
};
