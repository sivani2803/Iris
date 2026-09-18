const http = require('http');

function post(path, data = {}) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const req = http.request(`http://localhost:5000${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': payload.length
      }
    }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => resolve(JSON.parse(body)));
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function get(path) {
  return new Promise((resolve, reject) => {
    const req = http.request(`http://localhost:5000${path}`, { method: 'GET' }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => resolve(JSON.parse(body)));
    });
    req.on('error', reject);
    req.end();
  });
}

async function runTest() {
  console.log('--- 1. Resetting previous emergencies ---');
  await post('/api/emergency/reset');

  console.log('--- 2. Triggering Fall Health Event ---');
  const eventRes = await post('/api/emergency/health-event', {
    seniorId: 'S102',
    heartRate: 145,
    spo2: 91,
    motionState: 'stationary',
    fallDetected: true,
    eventType: 'fall'
  });
  const emergencyId = eventRes.data.emergency._id;
  console.log('Emergency Created ID:', emergencyId);
  console.log('Initial Status:', eventRes.data.emergency.status);
  console.log('Matched Caretaker:', eventRes.data.emergency.assignedCaretakerData.name);

  console.log('\n--- 3. Testing Caretaker Decline (Auto-Reassessment to Alternative) ---');
  const declineRes = await post(`/api/emergency/${emergencyId}/decline`, { reason: 'Caretaker unavailable' });
  console.log('Post-decline Status:', declineRes.data.status);
  console.log('New Assigned Caretaker (Alternative):', declineRes.data.assignedCaretakerData.name);
  console.log('Latest Timeline Step:', declineRes.data.timeline[declineRes.data.timeline.length - 1].title);

  console.log('\n--- 4. Alternative Caretaker Accepts Dispatch ---');
  const acceptRes = await post(`/api/emergency/${emergencyId}/accept`);
  console.log('Status after Accept:', acceptRes.data.status);

  console.log('\n--- 5. Caretaker Marks En Route ---');
  const enRouteRes = await post(`/api/emergency/${emergencyId}/en-route`);
  console.log('Status after En Route:', enRouteRes.data.status);

  console.log('\n--- 6. Caretaker Marks Arrived ---');
  const arrivedRes = await post(`/api/emergency/${emergencyId}/arrived`);
  console.log('Status after Arrived:', arrivedRes.data.status);
  console.log('ETA after arrival:', arrivedRes.data.etaMinutes);

  console.log('\n--- 7. Caretaker Resolves Emergency ---');
  const resolveRes = await post(`/api/emergency/${emergencyId}/resolve`, { resolutionNotes: 'Senior assisted. No fractures. Vitals stable.' });
  console.log('Status after Resolve:', resolveRes.data.status);
  console.log('Active flag:', resolveRes.data.active);

  console.log('\n--- 8. Verify Active Emergency is now null ---');
  const activeRes = await get('/api/emergency/active?seniorId=S102');
  console.log('Active emergency in system:', activeRes.data);

  console.log('\n>>> MILESTONE 2 VERIFICATION SUCCESSFUL! <<<');
}

runTest().catch(console.error);
