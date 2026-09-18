/**
 * IRIS Prototype Risk Engine
 * IMPORTANT: Prototype/demo heuristic evaluation only.
 * This is NOT a medical diagnosis tool.
 */

function evaluateRisk(event) {
  let score = 0;
  const factors = [];

  const heartRate = Number(event.heartRate) || 72;
  const spo2 = Number(event.spo2) || 98;
  const motionState = (event.motionState || 'active').toLowerCase();
  const fallDetected = Boolean(event.fallDetected);
  const eventType = (event.eventType || '').toLowerCase();

  // 1. Fall Detected (+40)
  if (fallDetected || eventType === 'fall') {
    score += 40;
    factors.push('Fall impact signature detected by sensor accelerometer');
  }

  // 2. Stationary / No Movement (+20)
  if (motionState === 'stationary') {
    score += 20;
    factors.push('Lack of movement observed following event');
  }

  // 3. Unusual Heart Rate (+20)
  if (heartRate > 115 || heartRate < 50) {
    score += 20;
    factors.push(`Unusual heart rate detected (${heartRate} BPM)`);
  }

  // 4. Low SpO2 (+20)
  if (spo2 < 93) {
    score += 20;
    factors.push(`Low blood oxygen saturation detected (${spo2}% SpO2)`);
  }

  // 5. Manual SOS (+40)
  if (eventType === 'manual_sos') {
    score += 40;
    factors.push('Manual emergency SOS triggered by user on smartwatch');
  }

  // 6. No Response (+30)
  if (eventType === 'no_response') {
    score += 30;
    factors.push('User did not respond to smartwatch haptic confirmation');
  }

  // Risk Classification
  let riskLevel = 'NORMAL';
  let isEmergency = false;
  let summary = 'Vitals within expected prototype baseline';

  if (score >= 80) {
    riskLevel = 'CRITICAL';
    isEmergency = true;
    summary = 'Critical health pattern detected — immediate responder dispatch required';
  } else if (score >= 60) {
    riskLevel = 'HIGH';
    isEmergency = true;
    summary = 'Possible emergency detected — rapid responder coordination initiated';
  } else if (score >= 30) {
    riskLevel = 'WATCH';
    isEmergency = false;
    summary = 'Unusual health pattern detected — heightened observation recommended';
  } else {
    riskLevel = 'NORMAL';
    isEmergency = false;
    summary = 'Normal baseline vitals';
  }

  return {
    score,
    riskLevel,
    isEmergency,
    summary,
    factors,
    disclaimer: 'IRIS provides prototype risk evaluation and is not a substitute for professional medical advice.'
  };
}

module.exports = { evaluateRisk };
