const axios = require('axios');

class MLRiskClient {
  constructor() {
    this.mlEndpoint = process.env.ML_SERVICE_URL || 'http://localhost:8000/v1/anomaly/predict';
    this.timeoutMs = 800; // 800ms strict SLA
    
    // Circuit Breaker State Machine
    this.state = 'CLOSED'; // 'CLOSED' | 'OPEN' | 'HALF-OPEN'
    this.failureCount = 0;
    this.failureThreshold = 3;
    this.cooldownPeriodMs = 30000; // 30s cooldown before half-open probe
    this.lastStateChange = Date.now();
  }

  /**
   * Deterministic Fallback Heuristic
   * Clinical safety rule engine executed when ML microservice fails, times out, or circuit is OPEN.
   */
  evaluateDeterministicFallback(telemetry, failureReason) {
    const hr = Number(telemetry.heartRate) || 72;
    const spo2 = Number(telemetry.spo2) || 98;
    const motion = (telemetry.motionState || 'active').toLowerCase();
    const fall = Boolean(telemetry.fallDetected);
    const eventType = (telemetry.eventType || '').toLowerCase();

    let riskLevel = 'NORMAL';
    let riskScore = 15;
    const triggerReasons = [`[FAIL-SAFE HEURISTIC ENGAGED: ${failureReason}]`];

    // Acute Rule 1: Fall impact accompanied by immobility
    if (fall || eventType === 'fall') {
      if (motion === 'stationary') {
        riskLevel = 'CRITICAL';
        riskScore = 95;
        triggerReasons.push('Fall impact signature detected with post-event lack of movement');
      } else {
        riskLevel = 'HIGH';
        riskScore = 75;
        triggerReasons.push('Fall impact signature detected with lingering motion');
      }
    }
    // Acute Rule 2: Cardio-respiratory divergence (Hypoxia + Tachycardia)
    else if (spo2 < 92 && hr > 130) {
      riskLevel = 'CRITICAL';
      riskScore = 92;
      triggerReasons.push(`Severe cardio-respiratory divergence (SpO2 ${spo2}% < 92% and HR ${hr} > 130 BPM)`);
    }
    // Rule 3: Isolated severe hypoxia
    else if (spo2 < 90) {
      riskLevel = 'HIGH';
      riskScore = 75;
      triggerReasons.push(`Critically depressed oxygen saturation (${spo2}%)`);
    }
    // Rule 4: Isolated severe tachycardia or bradycardia
    else if (hr > 140 || hr < 45) {
      riskLevel = 'HIGH';
      riskScore = 70;
      triggerReasons.push(`Extreme heart rate excursion (${hr} BPM)`);
    }
    // Rule 5: Manual SOS
    else if (eventType === 'manual_sos') {
      riskLevel = 'CRITICAL';
      riskScore = 90;
      triggerReasons.push('Manual senior emergency trigger on wearable');
    }

    return {
      score: riskScore,
      riskLevel,
      isEmergency: riskScore >= 60,
      summary: riskScore >= 80
        ? 'Critical health pattern detected — immediate responder dispatch required'
        : riskScore >= 60
        ? 'Possible emergency detected — rapid responder coordination initiated'
        : 'Vitals within expected prototype baseline',
      evaluatedBy: 'DETERMINISTIC_SAFETY_HEURISTIC',
      confidence: 1.0,
      circuitState: this.state,
      factors: triggerReasons,
      disclaimer: 'IRIS provides prototype risk evaluation and is not a substitute for professional medical advice.'
    };
  }

  /**
   * Main Risk Evaluation Entrypoint
   */
  async evaluateRisk(telemetry) {
    const now = Date.now();

    // 1. Circuit Breaker Open Check
    if (this.state === 'OPEN') {
      if (now - this.lastStateChange > this.cooldownPeriodMs) {
        this.state = 'HALF-OPEN';
        console.warn('[ML CLIENT] Circuit Breaker entering HALF-OPEN probe state.');
      } else {
        return this.evaluateDeterministicFallback(telemetry, 'CIRCUIT_BREAKER_OPEN');
      }
    }

    // 2. Attempt remote Python/ML microservice inference
    try {
      const response = await axios.post(
        this.mlEndpoint,
        {
          senior_id: telemetry.seniorId || 'S102',
          heart_rate: telemetry.heartRate,
          spo2: telemetry.spo2,
          motion_state: telemetry.motionState,
          fall_detected: telemetry.fallDetected,
          timestamp: telemetry.timestamp || new Date().toISOString()
        },
        { timeout: this.timeoutMs }
      );

      // On successful probe in HALF-OPEN, close circuit
      if (this.state === 'HALF-OPEN') {
        this.state = 'CLOSED';
        this.failureCount = 0;
        console.log('[ML CLIENT] Circuit Breaker recovered: State CLOSED.');
      }

      const mlData = response.data;
      const score = Number(mlData.anomaly_score) || 85;
      const riskLevel = mlData.classification || (score >= 80 ? 'CRITICAL' : score >= 60 ? 'HIGH' : 'NORMAL');

      return {
        score,
        riskLevel,
        isEmergency: score >= 60,
        summary: mlData.summary || 'Anomaly detected by temporal inference model',
        evaluatedBy: 'PYTORCH_ENSEMBLE_SERVICE',
        confidence: mlData.confidence || 0.94,
        circuitState: this.state,
        factors: mlData.feature_attributions || ['Temporal heart-rate vector drift', 'Spatial accelerometer variance'],
        disclaimer: 'IRIS provides general evaluation and is not a substitute for professional medical advice.'
      };
    } catch (err) {
      this.failureCount++;
      const isTimeout = err.code === 'ECONNABORTED' || err.message?.includes('timeout');
      const errReason = isTimeout ? 'ML_INFERENCE_TIMEOUT (>800ms)' : `ML_SERVER_UNREACHABLE (${err.code || 'CONN_REFUSED'})`;

      if (this.failureCount >= this.failureThreshold && this.state !== 'OPEN') {
        this.state = 'OPEN';
        this.lastStateChange = Date.now();
        console.error(`[ML CLIENT] Circuit Breaker TRIPPED to OPEN after ${this.failureCount} consecutive failures.`);
      }

      return this.evaluateDeterministicFallback(telemetry, errReason);
    }
  }
}

module.exports = new MLRiskClient();
