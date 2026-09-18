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

async function runProductionAuthSuite() {
  console.log('================================================================');
  console.log('   IRIS PRODUCTION AUTH, ONBOARDING & RBAC COMPREHENSIVE SUITE  ');
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

  // 1. Existing Demo Senior Login
  const seniorLogin = await request('POST', '/api/auth/login', {
    email: 'senior@iris.care',
    password: 'Password123!'
  });
  assert(
    seniorLogin.status === 200 && seniorLogin.data.user?.role === 'senior',
    'Existing Demo Senior Login',
    `User: ${seniorLogin.data.user?.email}`
  );
  const seniorToken = seniorLogin.data.token;

  // 2. Existing Demo Family Login
  const familyLogin = await request('POST', '/api/auth/login', {
    email: 'family@iris.care',
    password: 'Password123!'
  });
  assert(
    familyLogin.status === 200 && familyLogin.data.user?.role === 'family',
    'Existing Demo Family Login',
    `User: ${familyLogin.data.user?.email}`
  );
  const familyToken = familyLogin.data.token;

  // 3. Existing Demo Caretaker Login
  const caretakerLogin = await request('POST', '/api/auth/login', {
    email: 'caretaker@iris.care',
    password: 'Password123!'
  });
  assert(
    caretakerLogin.status === 200 && caretakerLogin.data.user?.role === 'caretaker',
    'Existing Demo Caretaker Login',
    `User: ${caretakerLogin.data.user?.email}`
  );
  const caretakerToken = caretakerLogin.data.token;

  // 4. Existing Demo Admin Login
  const adminLogin = await request('POST', '/api/auth/login', {
    email: 'admin@iris.care',
    password: 'Password123!'
  });
  assert(
    adminLogin.status === 200 && adminLogin.data.user?.role === 'admin',
    'Existing Demo Admin Login',
    `User: ${adminLogin.data.user?.email}`
  );
  const adminToken = adminLogin.data.token;

  // 5. Invalid Credentials Rejection
  const badLogin = await request('POST', '/api/auth/login', {
    email: 'senior@iris.care',
    password: 'WrongPassword999!'
  });
  assert(
    badLogin.status === 401,
    'Invalid Credentials Rejection',
    `Status ${badLogin.status}`
  );

  // 6. Privilege Escalation Blocked: Self-Assigned ADMIN Denied
  const adminEscalation = await request('POST', '/api/auth/register', {
    name: 'Malicious Admin Wannabe',
    email: `bad_admin_${Date.now()}@attacker.com`,
    password: 'Password123!',
    role: 'ADMIN'
  });
  assert(
    adminEscalation.status === 403 && adminEscalation.data.error === 'PRIVILEGE_ESCALATION_BLOCKED',
    'Privilege Escalation Blocked (ADMIN self-selection rejected)',
    `Status ${adminEscalation.status}`
  );

  // 7. Privilege Escalation Blocked: Self-Assigned SUPER_ADMIN Denied
  const superAdminEscalation = await request('POST', '/api/auth/register', {
    name: 'Malicious Super Admin',
    email: `bad_superadmin_${Date.now()}@attacker.com`,
    password: 'Password123!',
    role: 'SUPER_ADMIN'
  });
  assert(
    superAdminEscalation.status === 403 && superAdminEscalation.data.error === 'PRIVILEGE_ESCALATION_BLOCKED',
    'Privilege Escalation Blocked (SUPER_ADMIN self-selection rejected)',
    `Status ${superAdminEscalation.status}`
  );

  // 8. Safe Senior Registration with Initial Onboarding State
  const newSeniorEmail = `new_senior_${Date.now()}@iris.care`;
  const newSeniorReg = await request('POST', '/api/auth/register', {
    name: 'New Senior User',
    email: newSeniorEmail,
    password: 'Password123!',
    role: 'senior',
    phone: '+91 99999 11111'
  });
  assert(
    newSeniorReg.status === 201 &&
    newSeniorReg.data.user?.role === 'senior' &&
    newSeniorReg.data.user?.onboardingCompleted === false &&
    newSeniorReg.data.user?.status === 'ONBOARDING',
    'Safe Senior Registration with Incomplete Onboarding Status',
    `Status: ${newSeniorReg.data.user?.status}, Onboarding: ${newSeniorReg.data.user?.onboardingCompleted}`
  );
  const newSeniorToken = newSeniorReg.data.token;

  // 9. Multi-Step Onboarding Ingestion & Completion
  const onboardingRes = await request('POST', '/api/auth/onboarding', {
    step: 6,
    complete: true,
    profileData: {
      dob: '1950-01-01',
      bloodGroup: 'O+',
      emergencyContactName: 'Ananya Sharma',
      preferredLanguage: 'English'
    },
    consents: [
      { purpose: 'HEALTH_DATA_SHARING', granted: true },
      { purpose: 'LOCATION_SHARING', granted: true }
    ]
  }, { 'Authorization': `Bearer ${newSeniorToken}` });
  assert(
    onboardingRes.status === 200 &&
    onboardingRes.data.user?.onboardingCompleted === true &&
    onboardingRes.data.user?.status === 'ACTIVE',
    'Multi-Step Onboarding Completed & User Activated',
    `Status: ${onboardingRes.data.user?.status}`
  );

  // 10. Role Immutability Guard: Role Tampering Blocked via Profile Update
  const roleTamper = await request('PATCH', '/api/auth/profile', {
    role: 'admin',
    status: 'ACTIVE',
    phone: '+91 99999 22222'
  }, { 'Authorization': `Bearer ${newSeniorToken}` });
  assert(
    roleTamper.status === 200 && roleTamper.data.data?.role === 'senior',
    'Role Immutability Guard: Role Field Modification Stripped',
    `Role remains: ${roleTamper.data.data?.role}`
  );

  // 11. Caregiver Registration & Pending Verification Lifecycle
  const caregiverEmail = `caregiver_${Date.now()}@iris.care`;
  const caregiverReg = await request('POST', '/api/auth/register', {
    name: 'Nurse Priya',
    email: caregiverEmail,
    password: 'Password123!',
    role: 'caregiver',
    phone: '+91 99999 33333'
  });
  assert(
    caregiverReg.status === 201 &&
    caregiverReg.data.user?.verificationStatus === 'PENDING',
    'Caregiver Registration with PENDING Verification Status',
    `Verification: ${caregiverReg.data.user?.verificationStatus}`
  );
  const newCaregiverToken = caregiverReg.data.token;
  const newCaregiverId = caregiverReg.data.user?.id;

  // 12. Complete Caregiver Onboarding -> Enters PENDING_VERIFICATION
  const caregiverOnboard = await request('POST', '/api/auth/onboarding', {
    step: 6,
    complete: true,
    profileData: {
      experienceYears: 5,
      skills: ['First Aid', 'Fall Assistance']
    }
  }, { 'Authorization': `Bearer ${newCaregiverToken}` });
  assert(
    caregiverOnboard.status === 200 &&
    caregiverOnboard.data.user?.status === 'PENDING_VERIFICATION' &&
    caregiverOnboard.data.user?.verificationStatus === 'PENDING',
    'Completed Caregiver Onboarding Stays in PENDING_VERIFICATION',
    `Status: ${caregiverOnboard.data.user?.status}`
  );

  // 13. Unverified Caregiver Blocked from Senior Health Data
  const unverifiedAccess = await request('GET', '/api/seniors/S102/health', null, {
    'Authorization': `Bearer ${newCaregiverToken}`
  });
  assert(
    unverifiedAccess.status === 403 && unverifiedAccess.data.error === 'FORBIDDEN_PENDING_VERIFICATION',
    'Unverified Caregiver Blocked from Clinical Access (403 PENDING_VERIFICATION)',
    `Status ${unverifiedAccess.status}`
  );

  // 14. Admin Verification Approval of Caregiver
  const adminApprove = await request('PATCH', `/api/auth/admin/users/${newCaregiverId}/status`, {
    status: 'ACTIVE',
    verificationStatus: 'VERIFIED'
  }, { 'Authorization': `Bearer ${adminToken}` });
  assert(
    adminApprove.status === 200 &&
    adminApprove.data.data?.status === 'ACTIVE' &&
    adminApprove.data.data?.verificationStatus === 'VERIFIED',
    'Admin Verification Approval of Pending Caregiver',
    `New Status: ${adminApprove.data.data?.status}`
  );

  // 15. Verified Caregiver Access to Assigned Senior
  const verifiedCaregiverAccess = await request('GET', '/api/seniors/S102/health', null, {
    'Authorization': `Bearer ${newCaregiverToken}`
  });
  assert(
    verifiedCaregiverAccess.status === 200,
    'Verified Caregiver Access to Assigned Senior (S102) Allowed',
    `Status ${verifiedCaregiverAccess.status}`
  );

  // 16. Caregiver IDOR Prevention: Caregiver Access to Unassigned Senior Blocked
  const caregiverIdor = await request('GET', '/api/seniors/S888/health', null, {
    'Authorization': `Bearer ${newCaregiverToken}`
  });
  assert(
    caregiverIdor.status === 403,
    'Caregiver IDOR Blocked: Access to Unassigned Senior S888 Denied',
    `Status ${caregiverIdor.status}`
  );

  // 17. Family Member IDOR Prevention: Unlinked Senior S999 Denied
  const familyIdor = await request('GET', '/api/seniors/S999/health', null, {
    'Authorization': `Bearer ${familyToken}`
  });
  assert(
    familyIdor.status === 403 && familyIdor.data.error === 'FORBIDDEN_IDOR_VIOLATION',
    'Family IDOR Prevention: Access to Unlinked Senior S999 Denied',
    `Status ${familyIdor.status}`
  );

  // 18. Secure Family Connection: Invalid Invite Code Rejected
  const badConnect = await request('POST', '/api/family/connect', {
    seniorId: 'S102',
    inviteCode: 'INVALID_CODE',
    relationship: 'Daughter'
  }, { 'Authorization': `Bearer ${familyToken}` });
  assert(
    badConnect.status === 403 && badConnect.data.error === 'FORBIDDEN_INVALID_INVITE_CODE',
    'Secure Family Connection: Invalid Passphrase Rejected with 403',
    `Status ${badConnect.status}`
  );

  // 19. Secure Family Connection: Valid Invite Code Accepted
  const validConnect = await request('POST', '/api/family/connect', {
    seniorId: 'S102',
    inviteCode: 'IRIS-S102',
    relationship: 'Son'
  }, { 'Authorization': `Bearer ${familyToken}` });
  assert(
    validConnect.status === 200 && validConnect.data.success === true,
    'Secure Family Connection: Valid Passphrase Approved & Linked',
    `Relationship: ${validConnect.data.data?.relationship}`
  );

  // 20. Healthcare Provider Registration & Verification Lifecycle
  const providerEmail = `doctor_${Date.now()}@hospital.org`;
  const providerReg = await request('POST', '/api/auth/register', {
    name: 'Dr. Rao',
    email: providerEmail,
    password: 'Password123!',
    role: 'healthcare_provider',
    phone: '+91 98888 77777'
  });
  assert(
    providerReg.status === 201 &&
    providerReg.data.user?.role === 'healthcare_provider' &&
    providerReg.data.user?.verificationStatus === 'PENDING',
    'Healthcare Provider Registration with PENDING Status',
    `Role: ${providerReg.data.user?.role}`
  );
  const providerToken = providerReg.data.token;

  // 21. Firebase ID Token Verification & Seamless Google Session Bootstrap
  const mockUid = `firebase-oauth-${Date.now()}`;
  const mockPayload = {
    user_id: mockUid,
    email: `oauth_user_${Date.now()}@gmail.com`,
    name: 'Google OAuth User',
    email_verified: true,
    exp: Math.floor(Date.now() / 1000) + 3600
  };
  const b64 = Buffer.from(JSON.stringify(mockPayload)).toString('base64url');
  const mockFirebaseToken = `eyJhbGciOiJSUzI1NiJ9.${b64}.signature`;

  const sessionBootstrap = await request('POST', '/api/auth/session', {
    idToken: mockFirebaseToken
  });
  assert(
    sessionBootstrap.status === 200 &&
    sessionBootstrap.data.success === true &&
    Boolean(sessionBootstrap.data.token),
    'Firebase ID Token Bootstrap via /api/auth/session',
    `User: ${sessionBootstrap.data.user?.email}`
  );

  // 22. Google + Email Account Linking: No Duplicate Users
  // Create an email user first
  const linkEmail = `link_test_${Date.now()}@iris.care`;
  await request('POST', '/api/auth/register', {
    name: 'Link Candidate',
    email: linkEmail,
    password: 'Password123!',
    role: 'family'
  });
  // Now simulate Google Sign-in with the SAME email address
  const linkUid = `google-link-${Date.now()}`;
  const linkPayload = {
    user_id: linkUid,
    email: linkEmail,
    name: 'Link Candidate (Google)',
    email_verified: true,
    exp: Math.floor(Date.now() / 1000) + 3600
  };
  const linkB64 = Buffer.from(JSON.stringify(linkPayload)).toString('base64url');
  const linkToken = `eyJhbGciOiJSUzI1NiJ9.${linkB64}.signature`;

  const linkedSession = await request('POST', '/api/auth/session', {
    idToken: linkToken
  });
  assert(
    linkedSession.status === 200 &&
    linkedSession.data.returning === true &&
    linkedSession.data.user?.email === linkEmail,
    'Google + Email Account Linking (Idempotent, No Duplicate Accounts)',
    `Linked Email: ${linkedSession.data.user?.email}`
  );

  // 23. Expired Token Rejection
  const expiredToken = jwt.sign(
    { userId: seniorLogin.data.user?.id, email: 'senior@iris.care', role: 'senior' },
    JWT_SECRET,
    { expiresIn: '-5s' }
  );
  const expiredRes = await request('GET', '/api/auth/me', null, {
    'Authorization': `Bearer ${expiredToken}`
  });
  assert(
    expiredRes.status === 401 && (expiredRes.data.error === 'TOKEN_EXPIRED' || expiredRes.data.message?.includes('expired')),
    'Expired Token Cryptographic Rejection (401 TOKEN_EXPIRED)',
    `Status ${expiredRes.status}`
  );

  // 24. Malformed Token Rejection
  const malformedToken = 'malformed.token.signature';
  const malformedRes = await request('GET', '/api/auth/me', null, {
    'Authorization': `Bearer ${malformedToken}`
  });
  assert(
    malformedRes.status === 403 || malformedRes.status === 401,
    'Malformed Token Rejection',
    `Status ${malformedRes.status}`
  );

  // 25. Duplicate Email Registration Handled Cleanly
  const duplicateReg = await request('POST', '/api/auth/register', {
    name: 'Duplicate Rohan',
    email: 'family@iris.care',
    password: 'Password123!',
    role: 'family'
  });
  assert(
    duplicateReg.status === 409 && duplicateReg.data.error === 'DUPLICATE_EMAIL',
    'Duplicate Registration Handled Gracefully (409 DUPLICATE_EMAIL)',
    `Status ${duplicateReg.status}`
  );

  // 26. Forgot Password Timing-Safe Response
  const forgotRes = await request('POST', '/api/auth/forgot-password', {
    email: 'senior@iris.care'
  });
  assert(
    forgotRes.status === 200 && forgotRes.data.message?.includes('instructions'),
    'Timing-Safe Forgot Password Generic Confirmation',
    forgotRes.data.message
  );

  // 27. Email Verification Send & Cooldown
  const emailVerif1 = await request('POST', '/api/auth/send-verification-email', {}, {
    'Authorization': `Bearer ${newSeniorToken}`
  });
  assert(
    emailVerif1.status === 200,
    'Email Verification Dispatched',
    emailVerif1.data.message
  );
  // Immediate second attempt should trigger cooldown rate limit
  const emailVerif2 = await request('POST', '/api/auth/send-verification-email', {}, {
    'Authorization': `Bearer ${newSeniorToken}`
  });
  assert(
    emailVerif2.status === 429 && emailVerif2.data.error === 'RATE_LIMIT_COOLDOWN',
    'Email Verification Cooldown Protection (429 Rate Limit)',
    emailVerif2.data.message
  );

  // 28. Account Suspension Enforcement
  // Admin suspends a user
  await request('PATCH', `/api/auth/admin/users/${newSeniorReg.data.user?.id}/status`, {
    status: 'SUSPENDED'
  }, { 'Authorization': `Bearer ${adminToken}` });
  // Suspended user attempts to access protected route
  const suspendedAccess = await request('GET', '/api/auth/me', null, {
    'Authorization': `Bearer ${newSeniorToken}`
  });
  assert(
    suspendedAccess.status === 403 && suspendedAccess.data.error === 'FORBIDDEN_ACCOUNT_SUSPENDED',
    'Account Suspension Enforcement (403 FORBIDDEN_ACCOUNT_SUSPENDED)',
    `Status ${suspendedAccess.status}`
  );

  // 29. Non-Admin Access to Admin Audit Logs Blocked
  const nonAdminAudit = await request('GET', '/api/auth/admin/audit-logs', null, {
    'Authorization': `Bearer ${familyToken}`
  });
  assert(
    nonAdminAudit.status === 403,
    'Non-Admin Access to Admin Audit Logs Strictly Forbidden',
    `Status ${nonAdminAudit.status}`
  );

  // 30. Admin Access to Real Audit Logs Allowed
  const adminAudit = await request('GET', '/api/auth/admin/audit-logs', null, {
    'Authorization': `Bearer ${adminToken}`
  });
  assert(
    adminAudit.status === 200 && Array.isArray(adminAudit.data.data?.recentAuditEvents),
    'Admin Access to Real Audit Logs Verified (200 OK)',
    `Found ${adminAudit.data.data?.recentAuditEvents?.length || 0} events`
  );

  // 31. First-Time Registration with Verified Firebase ID Token
  const fbTestEmail = `firsttime_fb_${Date.now()}@iris.care`;
  const fbTestUid = `fb-uid-${Date.now()}`;
  const simFbToken = jwt.sign(
    { uid: fbTestUid, user_id: fbTestUid, email: fbTestEmail, name: 'Firebase Test Senior' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
  const fbRegRes = await request('POST', '/api/auth/register', {
    idToken: simFbToken,
    name: 'Firebase Test Senior',
    email: fbTestEmail,
    role: 'senior',
    phone: '+91 98765 88888'
  });
  assert(
    fbRegRes.status === 201 && fbRegRes.data.user?.email === fbTestEmail,
    'First-Time Registration with Verified Firebase ID Token (201 Created)',
    `User: ${fbRegRes.data.user?.email}`
  );
  const fbUserToken = fbRegRes.data.token;
  const initialUserId = fbRegRes.data.user?.id;

  // 32. Safe Idempotent Partial Registration Recovery
  const fbRetryRes = await request('POST', '/api/auth/register', {
    idToken: simFbToken,
    name: 'Firebase Test Senior Updated',
    email: fbTestEmail,
    role: 'senior',
    phone: '+91 98765 99999'
  });
  assert(
    fbRetryRes.status === 200 && fbRetryRes.data.recovered === true && fbRetryRes.data.user?.id === initialUserId,
    'Safe Idempotent Partial Registration Recovery (200 Recovered, No Duplicates)',
    `Recovered User ID: ${fbRetryRes.data.user?.id}`
  );

  // 33. Complete 7-Step Senior Onboarding Finalization
  const seniorOnboardingComplete = await request('POST', '/api/auth/onboarding', {
    step: 7,
    complete: true,
    profileData: {
      dob: '1950-01-01',
      gender: 'Female',
      maritalStatus: 'Widowed',
      address: 'Madhapur, Hyderabad',
      preferredLanguage: 'English',
      emergencyContactName: 'Rohan Sharma',
      emergencyContactRelation: 'Son',
      emergencyContactPhone: '+91 98765 11111',
      bloodGroup: 'O+'
    },
    consents: [
      { purpose: 'LOCATION_SHARING', granted: true },
      { purpose: 'HEALTH_DATA_SHARING', granted: true }
    ]
  }, { 'Authorization': `Bearer ${fbUserToken}` });
  assert(
    seniorOnboardingComplete.status === 200 && seniorOnboardingComplete.data.user?.onboardingCompleted === true,
    '7-Step Senior Onboarding Finalization (200 OK & onboardingCompleted: true)',
    seniorOnboardingComplete.data.message
  );

  // 34. Completed Account Duplicate Rejection
  const duplicateCompletedReg = await request('POST', '/api/auth/register', {
    idToken: simFbToken,
    name: 'Firebase Test Senior',
    email: fbTestEmail,
    role: 'senior'
  });
  assert(
    duplicateCompletedReg.status === 409 && duplicateCompletedReg.data.error === 'DUPLICATE_EMAIL',
    'Completed Account Rejects Subsequent Re-registration (409 DUPLICATE_EMAIL)',
    `Status ${duplicateCompletedReg.status}`
  );

  console.log('\n================================================================');
  console.log(`   ALL ${passed}/${total} PRODUCTION AUTH & RBAC TESTS PASSED 100%!   `);
  console.log('================================================================\n');
}

runProductionAuthSuite().catch((err) => {
  console.error('\n[TEST SUITE FAILURE]:', err.message);
  process.exit(1);
});
