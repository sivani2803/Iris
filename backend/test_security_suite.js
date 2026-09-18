const http = require('http');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'iris-prod-access-token-secret-e2e-2026';

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

async function runSecurityTestSuite() {
  console.log('================================================================');
  console.log('   IRIS PRODUCTION SECURITY & IDENTITY HARDENING TEST SUITE     ');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, name, details = '') {
    total++;
    if (condition) {
      passed++;
      console.log(`[PASS] ${total}. ${name} ${details ? '(' + details + ')' : ''}`);
    } else {
      console.error(`[FAIL] ${total}. ${name} ${details ? '(' + details + ')' : ''}`);
      throw new Error(`Security assertion failed: ${name}`);
    }
  }

  // 1. Security HTTP Headers
  const healthRes = await request('GET', '/api/health');
  assert(
    healthRes.headers['x-content-type-options'] === 'nosniff',
    'HTTP Security Header: nosniff enforced'
  );
  assert(
    healthRes.headers['x-frame-options'] === 'DENY',
    'HTTP Security Header: clickjacking DENY enforced'
  );
  assert(
    Boolean(healthRes.headers['x-request-id']),
    'Distributed Request Traceability: X-Request-Id UUID present',
    healthRes.headers['x-request-id']
  );

  // 2. Unauthenticated Request Rejection
  const unauthRes = await request('GET', '/api/auth/me');
  assert(
    unauthRes.status === 401,
    'Unauthenticated Protected Endpoint Rejected',
    `Status ${unauthRes.status}`
  );

  // 3. Expired Token Rejection
  const expiredToken = jwt.sign(
    { userId: '507f1f77bcf86cd799439011', email: 'test@iris.care', role: 'family' },
    JWT_SECRET,
    { expiresIn: '-10s' } // Expired 10 seconds ago
  );
  const expiredRes = await request('GET', '/api/auth/me', null, {
    'Authorization': `Bearer ${expiredToken}`
  });
  assert(
    expiredRes.status === 401 && (expiredRes.data.error === 'TOKEN_EXPIRED' || expiredRes.data.message?.includes('expired')),
    'Expired Token Cryptographic Rejection',
    `Status ${expiredRes.status}`
  );

  // 4. Tampered / Invalid Token Rejection
  const tamperedToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalidpayload.tamperedsignature';
  const tamperedRes = await request('GET', '/api/auth/me', null, {
    'Authorization': `Bearer ${tamperedToken}`
  });
  assert(
    tamperedRes.status === 403 || tamperedRes.status === 401,
    'Tampered Cryptographic Token Rejected',
    `Status ${tamperedRes.status}`
  );

  // 5. Privilege Escalation Blocked During Registration
  const maliciousReg = await request('POST', '/api/auth/register', {
    name: 'Attacker',
    email: `attacker_${Date.now()}@hacker.io`,
    password: 'Password123!',
    role: 'admin' // Attempting to self-assign ADMIN
  });
  assert(
    maliciousReg.status === 403,
    'Privilege Escalation Blocked: Self-Assigned ADMIN Denied',
    maliciousReg.data.message
  );

  // 6. Safe User Registration & Login
  const testEmail = `valid_family_${Date.now()}@iris.care`;
  const regRes = await request('POST', '/api/auth/register', {
    name: 'Valid Family',
    email: testEmail,
    password: 'Password123!',
    role: 'family',
    seniorId: 'S102'
  });
  assert(
    regRes.status === 201 && regRes.data.user.role === 'family',
    'Safe Role Registration Permitted',
    `User: ${regRes.data.user.email} (Role: ${regRes.data.user.role})`
  );
  const userToken = regRes.data.token;

  // 7. Cross-Senior IDOR / BOLA Prevention
  const idorAttempt = await request('GET', '/api/seniors/S999/health', null, {
    'Authorization': `Bearer ${userToken}`
  });
  assert(
    idorAttempt.status === 403,
    'Anti-IDOR Gatekeeper: Cross-Senior Health Access Blocked',
    `Status ${idorAttempt.status} (${idorAttempt.data.error || idorAttempt.data.message})`
  );

  // 8. Authorized Access to Linked Senior
  const validSeniorAccess = await request('GET', '/api/seniors/S102/health', null, {
    'Authorization': `Bearer ${userToken}`
  });
  assert(
    validSeniorAccess.status === 200,
    'Authorized Access to Linked Senior Health Data Allowed',
    `Status ${validSeniorAccess.status}`
  );

  // 9. Mass-Assignment Tampering Prevention
  const massAssignAttempt = await request('PUT', '/api/seniors/S102', {
    name: 'Savitri Devi',
    age: 74,
    role: 'super_admin', // Malicious field
    status: 'compromised', // Malicious field
    seniorId: 'MALICIOUS_OVERWRITE' // Malicious field
  }, {
    'Authorization': `Bearer ${userToken}`
  });
  assert(
    massAssignAttempt.status === 200,
    'Profile Update Succeeded for Whitelisted Fields'
  );
  assert(
    massAssignAttempt.data.data.seniorId === 'S102' && massAssignAttempt.data.data.role === undefined,
    'Mass-Assignment Guard: Unauthorized Fields Stripped'
  );

  // 10. Device Registration & Revocation
  const testDeviceId = `DEV-TEST-${Date.now()}`;
  const registerDeviceRes = await request('POST', '/api/devices/register', {
    deviceId: testDeviceId,
    deviceType: 'wearable',
    seniorId: 'S102'
  }, {
    'Authorization': `Bearer ${userToken}`
  });
  assert(
    registerDeviceRes.status === 201,
    'Device Registered Successfully',
    `DeviceId: ${testDeviceId}`
  );

  // Revoke device
  const revokeRes = await request('POST', `/api/devices/${testDeviceId}/revoke`, {}, {
    'Authorization': `Bearer ${userToken}`
  });
  assert(
    revokeRes.status === 200,
    'Device Revocation Executed',
    revokeRes.data.message
  );

  // Attempt to submit health telemetry from revoked device -> Must be rejected with 403!
  const revokedTelemetry = await request('POST', '/api/emergency/health-event', {
    seniorId: 'S102',
    deviceId: testDeviceId,
    eventId: `EVT-REVOKED-${Date.now()}`,
    heartRate: 140,
    spo2: 90,
    motionState: 'stationary',
    fallDetected: true,
    eventType: 'fall'
  });
  assert(
    revokedTelemetry.status === 403,
    'Revoked Device Telemetry Rejected',
    `Status ${revokedTelemetry.status}: ${revokedTelemetry.data.message}`
  );

  // 11. Device Ownership Anti-Spoofing Check
  // DEV-WATCH-S102 belongs to S102. Attempting to submit for S999 must be rejected!
  const spoofAttempt = await request('POST', '/api/emergency/health-event', {
    seniorId: 'S999', // Spoofed target
    deviceId: 'DEV-WATCH-S102', // Belongs to S102
    eventId: `EVT-SPOOF-${Date.now()}`,
    heartRate: 130,
    spo2: 92,
    fallDetected: true,
    eventType: 'fall'
  });
  assert(
    spoofAttempt.status === 403,
    'Device Ownership Spoofing Blocked (DEV-WATCH-S102 claiming S999)',
    `Status ${spoofAttempt.status}: ${spoofAttempt.data.message}`
  );

  // 12. Non-Admin Access to Audit Logs Blocked
  const auditLogsForbidden = await request('GET', '/api/auth/admin/audit-logs', null, {
    'Authorization': `Bearer ${userToken}`
  });
  assert(
    auditLogsForbidden.status === 403,
    'Non-Admin Access to Audit Logs Strictly Forbidden',
    `Status ${auditLogsForbidden.status}`
  );

  // 13. Admin Access to Real Audit Logs Allowed
  const adminLogin = await request('POST', '/api/auth/login', {
    email: 'admin@iris.care',
    password: 'Password123!'
  });
  const adminToken = adminLogin.data.token;
  const adminAuditRes = await request('GET', '/api/auth/admin/audit-logs', null, {
    'Authorization': `Bearer ${adminToken}`
  });
  assert(
    adminAuditRes.status === 200 && Array.isArray(adminAuditRes.data.data?.recentAuditEvents),
    'Admin Access to Real Audit Logs Verified',
    `Found ${adminAuditRes.data.data?.recentAuditEvents?.length || 0} audit logs`
  );

  // 14. Emergency Transition State Machine Integrity
  // Create active emergency cleanly
  const validEmergencyEvent = await request('POST', '/api/emergency/health-event', {
    seniorId: 'S102',
    deviceId: 'DEV-WATCH-S102',
    eventId: `EVT-FSM-${Date.now()}`,
    heartRate: 145,
    spo2: 88,
    motionState: 'stationary',
    fallDetected: true,
    eventType: 'fall'
  });
  const emergencyId = validEmergencyEvent.data.data.emergency._id;

  // Accept -> En Route -> Arrived -> Resolved
  await request('POST', `/api/emergency/${emergencyId}/accept`);
  await request('POST', `/api/emergency/${emergencyId}/en-route`);
  await request('POST', `/api/emergency/${emergencyId}/arrived`);
  await request('POST', `/api/emergency/${emergencyId}/resolve`, { resolutionNotes: 'Safe resolution' });

  // Attempt illegal transition on resolved emergency
  const illegalTransition = await request('POST', `/api/emergency/${emergencyId}/en-route`);
  assert(
    illegalTransition.status === 400,
    'Illegal Emergency Transition (RESOLVED -> EN_ROUTE) Rejected with 400',
    illegalTransition.data.message
  );

  console.log('\n================================================================');
  console.log(`   ALL ${passed}/${total} SECURITY & IDENTITY ASSERTIONS PASSED 100%!  `);
  console.log('================================================================\n');
}

runSecurityTestSuite().catch((err) => {
  console.error('\n[SECURITY TEST SUITE FAILURE]:', err.message);
  process.exit(1);
});
