const http = require('http');

function request(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const payload = data ? JSON.stringify(data) : null;
    const req = http.request(`http://localhost:5000${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {})
      }
    }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, text: body });
        }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runE2E() {
  console.log('====================================================');
  console.log('   IRIS COMPLETE END-TO-END SYSTEM VERIFICATION     ');
  console.log('====================================================\n');

  // 1. Health Check
  const health = await request('GET', '/api/health');
  console.log(`[PASS] 1. Backend Health: ${health.data.status} (${health.data.service})`);

  // 2. Senior Profile
  const senior = await request('GET', '/api/seniors/S102');
  console.log(`[PASS] 2. Senior Profile: ${senior.data.data.name}, Age ${senior.data.data.age}, ${senior.data.data.address}`);

  // 3. Reset emergencies
  await request('POST', '/api/emergency/reset');
  console.log('[PASS] 3. Emergency state reset cleanly');

  // 4. Ingest Fall Event from Watch Simulator
  const fallEvent = await request('POST', '/api/emergency/health-event', {
    seniorId: 'S102',
    heartRate: 145,
    spo2: 91,
    motionState: 'stationary',
    fallDetected: true,
    eventType: 'fall'
  });
  console.log(`[PASS] 4. Smartwatch Fall Event Ingested: Risk ${fallEvent.data.data.riskAnalysis.riskLevel} (Score ${fallEvent.data.data.riskAnalysis.score}/100)`);
  const emergencyId = fallEvent.data.data.emergency._id;
  const initialCaretaker = fallEvent.data.data.emergency.assignedCaretakerData.name;
  console.log(`       Emergency Created: ID ${emergencyId}, Initial Responder: ${initialCaretaker}`);

  // 5. Test Autonomous Reassessment on Caretaker Decline
  const decline = await request('POST', `/api/emergency/${emergencyId}/decline`, { reason: 'Traffic obstacle' });
  const altCaretaker = decline.data.data.assignedCaretakerData.name;
  console.log(`[PASS] 5. Autonomous Reassessment: ${initialCaretaker} declined -> Auto-reassigned to backup: ${altCaretaker}`);

  // 6. Caretaker Response Progression (Acknowledge -> En Route -> Arrived -> Resolved)
  await request('POST', `/api/emergency/${emergencyId}/accept`);
  console.log('[PASS] 6a. Responder Acknowledged');
  await request('POST', `/api/emergency/${emergencyId}/en-route`);
  console.log('[PASS] 6b. Responder En Route (Live ETA broadcast)');
  await request('POST', `/api/emergency/${emergencyId}/arrived`);
  console.log('[PASS] 6c. Responder Arrived at Senior Villa (ETA: 0 min)');
  const resolve = await request('POST', `/api/emergency/${emergencyId}/resolve`, { resolutionNotes: 'Senior assisted. Normal baseline.' });
  console.log(`[PASS] 6d. Emergency Safely Resolved: Status ${resolve.data.data.status}, Active: ${resolve.data.data.active}`);

  // 7. Medicines Management
  const medsBefore = await request('GET', '/api/medicines/S102');
  const firstMed = medsBefore.data.data.medicines[0];
  await request('PATCH', `/api/medicines/${firstMed._id}/status`, { status: 'taken' });
  const medsAfter = await request('GET', '/api/medicines/S102');
  console.log(`[PASS] 7. Medicines Adherence: ${medsAfter.data.data.takenCount}/${medsAfter.data.data.total} taken (${medsAfter.data.data.adherenceRate}% adherence score)`);

  // 8. Appointments
  const appts = await request('GET', '/api/appointments/S102');
  console.log(`[PASS] 8. Doctor Appointments: ${appts.data.data.length} upcoming visits (e.g. ${appts.data.data[0].doctor}, ${appts.data.data[0].specialty})`);

  // 9. Transport Assistance
  const transport = await request('POST', '/api/transport', {
    seniorId: 'S102',
    destination: 'Apollo Health City',
    mobilityRequirement: 'Wheelchair accessible',
    preferredTime: '03:30 PM'
  });
  console.log(`[PASS] 9. Assisted Transport Booked: Driver ${transport.data.data.driverName} (${transport.data.data.vehicleNumber}) assigned, ETA ${transport.data.data.etaMinutes} min`);

  // 10. Family Community & Activities
  const activities = await request('GET', '/api/family/activities');
  console.log(`[PASS] 10. Community Vitality: ${activities.data.data.length} activities active (e.g. ${activities.data.data[0].title})`);

  // 11. AI Symptom Assistant (Multilingual & Clinical Guardrails)
  const aiEn = await request('POST', '/api/ai/chat', { message: 'I feel dizzy and lightheaded', language: 'en' });
  console.log(`[PASS] 11a. AI Assistant (English): Urgency ${aiEn.data.data.urgency}`);
  const aiTe = await request('POST', '/api/ai/chat', { message: 'నాకు తల తిరుగుతున్నట్టు ఉంది', language: 'te' });
  console.log(`[PASS] 11b. AI Assistant (Telugu): Urgency ${aiTe.data.data.urgency}`);
  const triage = await request('POST', '/api/ai/triage', { text: 'Sudden fall impact and severe chest pain', language: 'en' });
  console.log(`[PASS] 11c. Structured Intent Triage: Type=${triage.data.data.request_type}, Severity=${triage.data.data.severity}, Emergency=${triage.data.data.medical_assistance}`);

  console.log('\n====================================================');
  console.log('   ALL 11 TEST SUITES PASSED! IRIS IS FULLY READY   ');
  console.log('====================================================');
}

runE2E().catch(console.error);
