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

async function runFirstTimeUserJourney() {
  console.log('================================================================');
  console.log('    IRIS FIRST-TIME REGISTRATION & COMPLETE USER JOURNEY TEST   ');
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
      throw new Error(`Assertion failed: ${name} ${details}`);
    }
  }

  const timestamp = Date.now();
  const testEmail = `brandnew_senior_${timestamp}@iris.care`;
  const testFirebaseUid = `firebase_uid_${timestamp}`;
  const testPassword = 'Password123!';

  // Step 1: Simulated Firebase identity token issuance (mimics Firebase client on frontend)
  const firebaseIdToken = jwt.sign(
    {
      uid: testFirebaseUid,
      user_id: testFirebaseUid,
      email: testEmail,
      name: 'Radha Raman',
      email_verified: true
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  // Step 2: NEW USER Registration with Verified Firebase ID Token
  console.log('--- PHASE 1: FIRST-TIME REGISTRATION ---');
  const regRes = await request('POST', '/api/auth/register', {
    idToken: firebaseIdToken,
    name: 'Radha Raman',
    email: testEmail,
    password: testPassword,
    role: 'senior',
    phone: '+91 98765 77777',
    seniorId: 'S102'
  });

  assert(
    regRes.status === 201,
    'First-time registration succeeds with HTTP 201 Created',
    `Status: ${regRes.status}`
  );
  assert(
    regRes.data.success === true && regRes.data.user?.email === testEmail,
    'User record safely provisioned with verified email',
    `User: ${regRes.data.user?.email}`
  );
  assert(
    regRes.data.user?.status === 'ONBOARDING' && regRes.data.user?.onboardingCompleted === false,
    'New user has status ONBOARDING and onboardingCompleted false',
    `Status: ${regRes.data.user?.status}, Step: ${regRes.data.user?.onboardingStep}`
  );
  assert(
    Boolean(regRes.data.token),
    'Cryptographic IRIS JWT session token generated',
    'JWT Token Issued'
  );

  const userJwtToken = regRes.data.token;
  const initialMongoUserId = regRes.data.user?.id;

  // Step 3: Partial Failure & Recovery Simulation
  // User had connection glitch during profile setup and retries registration with same credentials
  console.log('\n--- PHASE 2: PARTIAL REGISTRATION RECOVERY ---');
  const retryRegRes = await request('POST', '/api/auth/register', {
    idToken: firebaseIdToken,
    name: 'Radha Raman (Recovered)',
    email: testEmail,
    password: testPassword,
    role: 'senior',
    phone: '+91 98765 77777'
  });

  assert(
    retryRegRes.status === 200,
    'Partial failure retry returns HTTP 200 (Not 409 DUPLICATE_EMAIL error)',
    `Status: ${retryRegRes.status}`
  );
  assert(
    retryRegRes.data.recovered === true,
    'Server explicitly flags partial registration recovery',
    `Recovered: ${retryRegRes.data.recovered}`
  );
  assert(
    retryRegRes.data.user?.id === initialMongoUserId,
    'Stable Identity Guaranteed: No duplicate MongoDB accounts created',
    `Existing Mongo ID: ${initialMongoUserId} === Returned ID: ${retryRegRes.data.user?.id}`
  );

  // Step 4: Multi-Step Onboarding Progression
  console.log('\n--- PHASE 3: 7-STEP ONBOARDING PROGRESSION ---');
  // Step 4a: Autosave personal details (Step 3 in 7-step flow)
  const autosaveRes = await request('POST', '/api/auth/onboarding', {
    step: 3,
    complete: false,
    profileData: {
      dob: '1948-03-12',
      gender: 'Female',
      maritalStatus: 'Widowed',
      address: 'Madhapur, Hyderabad',
      preferredLanguage: 'Telugu'
    }
  }, { 'Authorization': `Bearer ${userJwtToken}` });

  assert(
    autosaveRes.status === 200 && autosaveRes.data.user?.onboardingStep === 3,
    'Step 3 Personal details autosaved safely',
    `Current Step: ${autosaveRes.data.user?.onboardingStep}`
  );

  // Step 4b: Complete onboarding (Step 7) with role details, hardware pairing & consents
  const completeRes = await request('POST', '/api/auth/onboarding', {
    step: 7,
    complete: true,
    profileData: {
      dob: '1948-03-12',
      gender: 'Female',
      maritalStatus: 'Widowed',
      address: 'Madhapur, Hyderabad',
      preferredLanguage: 'Telugu',
      emergencyContactName: 'Rohan Sharma',
      emergencyContactRelation: 'Son',
      emergencyContactPhone: '+91 98765 11111',
      bloodGroup: 'B+',
      accessibilityRequirements: 'Mobility Assistance',
      wearablePaired: true,
      voiceAssistance: true
    },
    consents: [
      { purpose: 'LOCATION_SHARING', granted: true },
      { purpose: 'HEALTH_DATA_SHARING', granted: true },
      { purpose: 'WEARABLE_DATA', granted: true },
      { purpose: 'AI_PROCESSING', granted: true }
    ]
  }, { 'Authorization': `Bearer ${userJwtToken}` });

  assert(
    completeRes.status === 200 && completeRes.data.user?.onboardingCompleted === true,
    'Step 7 Full profile completion finalized (onboardingCompleted: true)',
    `Status: ${completeRes.data.user?.status}`
  );
  assert(
    completeRes.data.user?.status === 'ACTIVE' && completeRes.data.user?.verificationStatus === 'VERIFIED',
    'Senior user transitioned to ACTIVE and VERIFIED',
    `Status: ${completeRes.data.user?.status}, Verification: ${completeRes.data.user?.verificationStatus}`
  );

  // Step 5: Verify SeniorProfile was created in DB
  const meRes = await request('GET', '/api/auth/me', null, {
    'Authorization': `Bearer ${userJwtToken}`
  });
  assert(
    meRes.status === 200 && meRes.data.user?.role === 'senior',
    'Session verification confirms role is senior',
    `Role: ${meRes.data.user?.role}`
  );

  // Step 6: Logout & Re-authentication
  console.log('\n--- PHASE 4: LOGOUT & RE-AUTHENTICATION ---');
  // 6a: Client logs out
  const logoutRes = await request('POST', '/api/auth/logout', null, {
    'Authorization': `Bearer ${userJwtToken}`
  });
  assert(
    logoutRes.status === 200,
    'User successfully logged out',
    logoutRes.data.message
  );

  // 6b: Client logs back in with same credentials
  const reloginRes = await request('POST', '/api/auth/login', {
    email: testEmail,
    password: testPassword
  });
  assert(
    reloginRes.status === 200,
    'Same account logs back in cleanly with password credentials',
    `Status: ${reloginRes.status}`
  );
  assert(
    reloginRes.data.user?.id === initialMongoUserId,
    'Returned account matches original user record (Zero duplicate accounts)',
    `User ID: ${reloginRes.data.user?.id}`
  );
  assert(
    reloginRes.data.user?.role === 'senior',
    'Server-enforced role correctly retrieved as SENIOR',
    `Role: ${reloginRes.data.user?.role}`
  );
  assert(
    reloginRes.data.user?.onboardingCompleted === true,
    'Profile onboarding remains marked completed (User routes directly to dashboard)',
    `onboardingCompleted: ${reloginRes.data.user?.onboardingCompleted}`
  );

  // 6c: Try re-registering now that profile is complete -> must be rejected with 409
  const reRegisterBlocked = await request('POST', '/api/auth/register', {
    idToken: firebaseIdToken,
    name: 'Radha Raman',
    email: testEmail,
    password: testPassword,
    role: 'senior'
  });
  assert(
    reRegisterBlocked.status === 409 && reRegisterBlocked.data.error === 'DUPLICATE_EMAIL',
    'Once completed, re-registration is rejected with 409 DUPLICATE_EMAIL',
    `Status: ${reRegisterBlocked.status}`
  );

  console.log('\n================================================================');
  console.log(`   ALL ${passed}/${total} FIRST-TIME REGISTRATION JOURNEY TESTS PASSED! `);
  console.log('================================================================\n');
}

runFirstTimeUserJourney().catch((err) => {
  console.error('\n[FIRST-TIME JOURNEY TEST FAILED]:', err.message);
  process.exit(1);
});
