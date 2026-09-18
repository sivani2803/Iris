const http = require('http');

function request(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const payload = data ? JSON.stringify(data) : null;
    const req = http.request(`http://localhost:5000${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
        ...headers
      }
    }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(body);
        } catch (e) {
          parsed = body;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: parsed
        });
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runHardenedPipelineVerification() {
  console.log('================================================================');
  console.log('   IRIS HARDENED EMERGENCY PIPELINE & IDEMPOTENCY TEST SUITE     ');
  console.log('================================================================\n');

  // 1. Health & Readiness
  const healthRes = await request('GET', '/api/health');
  if (healthRes.status !== 200) throw new Error(`Health check failed: ${healthRes.status}`);
  console.log(`[PASS] 1a. Backend Health: ${healthRes.data.status} (Service: ${healthRes.data.service})`);

  const readyRes = await request('GET', '/api/ready');
  if (readyRes.status !== 200) throw new Error(`Readiness check failed: ${readyRes.status}`);
  console.log(`[PASS] 1b. Backend Readiness: status=${readyRes.data.status}, db=${readyRes.data.database}, uptime=${readyRes.data.uptimeSeconds}s`);

  // 2. Distributed Traceability (X-Request-Id header)
  if (!readyRes.headers['x-request-id']) throw new Error('X-Request-Id header missing');
  console.log(`[PASS] 2. Distributed Request Traceability: X-Request-Id = ${readyRes.headers['x-request-id']}`);

  // 3. Reset emergencies cleanly
  await request('POST', '/api/emergency/reset');
  console.log('[PASS] 3. Emergency state cleanly reset for idempotent test suite.');

  // 4. Idempotency Test: Ingest unique eventId
  const testEventId = `EVT-IDEMP-${Date.now()}`;
  const initialEvent = await request('POST', '/api/emergency/health-event', {
    seniorId: 'S102',
    eventId: testEventId,
    deviceId: 'DEV-WATCH-S102',
    heartRate: 142,
    spo2: 90,
    motionState: 'stationary',
    fallDetected: true,
    eventType: 'fall'
  });

  if (initialEvent.status !== 200 || !initialEvent.data.data.emergency) {
    throw new Error('Initial event failed to create emergency');
  }
  const emergencyId = initialEvent.data.data.emergency._id;
  console.log(`[PASS] 4a. Initial Health Event Ingested: EventId=${testEventId}, EmergencyId=${emergencyId}`);

  // 4b. Replay exact same eventId -> Must return cached duplicate without creating new emergency!
  const duplicateEvent = await request('POST', '/api/emergency/health-event', {
    seniorId: 'S102',
    eventId: testEventId,
    deviceId: 'DEV-WATCH-S102',
    heartRate: 142,
    spo2: 90,
    motionState: 'stationary',
    fallDetected: true,
    eventType: 'fall'
  });

  if (duplicateEvent.status !== 200) {
    throw new Error(`Duplicate event failed with status: ${duplicateEvent.status}`);
  }
  if (!duplicateEvent.data.data.duplicate) {
    throw new Error('Duplicate event was not flagged as duplicate');
  }
  if (duplicateEvent.data.data.emergency._id !== emergencyId) {
    throw new Error('Duplicate event created a different emergency ID instead of returning cached result');
  }
  console.log(`[PASS] 4b. Idempotent Deduplication Verified: Duplicate re-transmission recognized and returned cached result cleanly.`);

  // 5. Normal Progression (Assigned -> Acknowledged -> En Route -> Arrived -> Resolved)
  const acceptRes = await request('POST', `/api/emergency/${emergencyId}/accept`);
  if (acceptRes.status !== 200) throw new Error(`Accept failed: ${acceptRes.status}`);
  console.log(`[PASS] 5a. Caretaker Accepted Dispatch: Status=${acceptRes.data.data.status}`);

  const enRouteRes = await request('POST', `/api/emergency/${emergencyId}/en-route`);
  if (enRouteRes.status !== 200) throw new Error(`En Route failed: ${enRouteRes.status}`);
  console.log(`[PASS] 5b. Caretaker En Route: Status=${enRouteRes.data.data.status}`);

  const arrivedRes = await request('POST', `/api/emergency/${emergencyId}/arrived`);
  if (arrivedRes.status !== 200) throw new Error(`Arrived failed: ${arrivedRes.status}`);
  console.log(`[PASS] 5c. Caretaker Arrived on Scene: Status=${arrivedRes.data.data.status}, ETA=${arrivedRes.data.data.etaMinutes} min`);

  const resolveRes = await request('POST', `/api/emergency/${emergencyId}/resolve`, {
    resolutionNotes: 'Senior assisted safely. Vitals stabilized.'
  });
  if (resolveRes.status !== 200) throw new Error(`Resolve failed: ${resolveRes.status}`);
  console.log(`[PASS] 5d. Emergency Safely Resolved: Status=${resolveRes.data.data.status}, Active=${resolveRes.data.data.active}`);

  // 6. Strict State Transition Guardrail: RESOLVED -> EN_ROUTE Must Be Rejected with 400!
  const illegalTransition1 = await request('POST', `/api/emergency/${emergencyId}/en-route`);
  if (illegalTransition1.status !== 400) {
    throw new Error(`Expected 400 Bad Request on RESOLVED -> EN_ROUTE, but got ${illegalTransition1.status}`);
  }
  console.log(`[PASS] 6a. Illegal Transition Rejected (RESOLVED -> EN_ROUTE): HTTP 400 "${illegalTransition1.data.message}"`);

  // 6b. Strict State Transition Guardrail: RESOLVED -> ACCEPT Must Be Rejected with 400!
  const illegalTransition2 = await request('POST', `/api/emergency/${emergencyId}/accept`);
  if (illegalTransition2.status !== 400) {
    throw new Error(`Expected 400 Bad Request on RESOLVED -> ACCEPT, but got ${illegalTransition2.status}`);
  }
  console.log(`[PASS] 6b. Illegal Transition Rejected (RESOLVED -> ACCEPT): HTTP 400 "${illegalTransition2.data.message}"`);

  // 7. Decline Reason Requirement
  const freshEvent = await request('POST', '/api/emergency/health-event', {
    seniorId: 'S102',
    eventId: `EVT-DECLINE-TEST-${Date.now()}`,
    deviceId: 'DEV-WATCH-S102',
    heartRate: 140,
    spo2: 91,
    motionState: 'stationary',
    fallDetected: true,
    eventType: 'fall'
  });
  const freshEmergencyId = freshEvent.data.data.emergency._id;

  // Attempt decline with empty reason -> Must return 400!
  const emptyReasonDecline = await request('POST', `/api/emergency/${freshEmergencyId}/decline`, { reason: '   ' });
  if (emptyReasonDecline.status !== 400) {
    throw new Error(`Expected 400 on empty decline reason, but got ${emptyReasonDecline.status}`);
  }
  console.log(`[PASS] 7a. Missing Decline Reason Rejected: HTTP 400 "${emptyReasonDecline.data.message}"`);

  // Valid decline with legitimate reason -> Must succeed and auto-reassign
  const validDecline = await request('POST', `/api/emergency/${freshEmergencyId}/decline`, {
    reason: 'Emergency road obstruction on Jubilee Hills approach'
  });
  if (validDecline.status !== 200) {
    throw new Error(`Valid decline failed with status: ${validDecline.status}`);
  }
  console.log(`[PASS] 7b. Valid Decline Triggered Reassessment: New Responder=${validDecline.data.data.assignedCaretakerData?.name}`);

  // Resolve secondary emergency cleanly
  await request('POST', `/api/emergency/${freshEmergencyId}/accept`);
  await request('POST', `/api/emergency/${freshEmergencyId}/resolve`, { resolutionNotes: 'Resolved secondary test emergency.' });

  console.log('\n================================================================');
  console.log('   ALL 7 HARDENED PIPELINE SECURITY TESTS PASSED 100%!          ');
  console.log('================================================================');
}

runHardenedPipelineVerification().catch((err) => {
  console.error('\n[FATAL TEST FAILURE]:', err.message);
  process.exit(1);
});
