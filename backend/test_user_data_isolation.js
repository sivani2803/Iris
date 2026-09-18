const http = require('http');

const BASE_URL = 'http://localhost:5000';

function makeRequest(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(url, {
      method,
      headers
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, text: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runIsolationTests() {
  console.log('====================================================');
  console.log('   IRIS USER DATA ISOLATION VERIFICATION SUITE       ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(` [PASS] ${message}`);
      passed++;
    } else {
      console.error(` [FAIL] ${message}`);
      failed++;
    }
  }

  try {
    const uniqueEmailSuffix = Date.now();

    // 1. REGISTER NEW SENIOR: Ravi Kumar
    console.log('\n--- Scenario 1: New Senior Registration (Ravi Kumar) ---');
    const seniorEmail = `ravi_${uniqueEmailSuffix}@care.test`;
    const regSeniorRes = await makeRequest('POST', '/api/auth/register', {
      name: 'Ravi Kumar',
      email: seniorEmail,
      password: 'Password123!',
      role: 'senior'
    });

    assert(regSeniorRes.status === 201, `Senior registration HTTP 201 (Got: ${regSeniorRes.status})`);
    const raviToken = regSeniorRes.body?.token;
    const raviSeniorId = regSeniorRes.body?.user?.seniorId;
    assert(raviSeniorId && raviSeniorId !== 'S102', `Senior assigned unique seniorId (Got: ${raviSeniorId}, NOT S102)`);

    // Complete Onboarding for Ravi
    const onboardSeniorRes = await makeRequest('POST', '/api/auth/onboarding', {
      step: 3,
      complete: true,
      profileData: {
        gender: 'Male',
        bloodGroup: 'A+',
        emergencyContactName: 'Ananya Rao',
        emergencyContactRelation: 'Daughter',
        emergencyContactPhone: '+91 98765 11111'
      }
    }, raviToken);
    assert(onboardSeniorRes.status === 200, `Ravi onboarding completed (HTTP 200)`);

    // Verify GET /api/seniors/me returns Ravi Kumar
    const meSeniorRes = await makeRequest('GET', '/api/seniors/me', null, raviToken);
    assert(meSeniorRes.status === 200 && meSeniorRes.body?.data?.name === 'Ravi Kumar', `GET /api/seniors/me returns Ravi Kumar (Got: ${meSeniorRes.body?.data?.name})`);
    assert(meSeniorRes.body?.data?.seniorId === raviSeniorId, `Ravi profile seniorId matches ${raviSeniorId}`);

    // Verify IDOR: Ravi CANNOT access Savitri Devi (S102)
    const idorRes = await makeRequest('GET', '/api/seniors/S102', null, raviToken);
    assert(idorRes.status === 403, `IDOR Blocked: Ravi cannot access /api/seniors/S102 (HTTP 403, Got: ${idorRes.status})`);

    // Verify Medication Isolation: Ravi has 0 medicines initially
    const raviMedsRes = await makeRequest('GET', '/api/medicines/me', null, raviToken);
    assert(raviMedsRes.status === 200 && raviMedsRes.body?.data?.total === 0, `Medication isolation: Ravi has 0 medicines (Got: ${raviMedsRes.body?.data?.total})`);

    // Add a medicine for Ravi
    const addMedRes = await makeRequest('POST', '/api/medicines', {
      name: 'Amlodipine 5mg',
      dosage: '1 tablet',
      time: '09:00 AM'
    }, raviToken);
    assert(addMedRes.status === 201, `Ravi added medicine (HTTP 201)`);

    // Check Ravi medicines again
    const raviMedsRes2 = await makeRequest('GET', '/api/medicines/me', null, raviToken);
    assert(raviMedsRes2.body?.data?.total === 1 && raviMedsRes2.body?.data?.medicines[0]?.name === 'Amlodipine 5mg', `Ravi sees only his own medication`);

    // 2. REGISTER NEW FAMILY MEMBER: Ananya Rao
    console.log('\n--- Scenario 2: New Family Member Registration (Ananya Rao) ---');
    const familyEmail = `ananya_${uniqueEmailSuffix}@care.test`;
    const regFamilyRes = await makeRequest('POST', '/api/auth/register', {
      name: 'Ananya Rao',
      email: familyEmail,
      password: 'Password123!',
      role: 'family'
    });

    assert(regFamilyRes.status === 201, `Family registration HTTP 201 (Got: ${regFamilyRes.status})`);
    const ananyaToken = regFamilyRes.body?.token;
    assert(regFamilyRes.body?.user?.seniorId === null, `New family user has seniorId: null (NOT S102)`);

    // Unconnected family GET /api/seniors/me returns connected: false
    const ananyaMeRes = await makeRequest('GET', '/api/seniors/me', null, ananyaToken);
    assert(ananyaMeRes.body?.connected === false, `Unconnected family gets connected: false`);

    // Unconnected family cannot access S102
    const ananyaS102Res = await makeRequest('GET', '/api/seniors/S102', null, ananyaToken);
    assert(ananyaS102Res.status === 403, `Unconnected family blocked from S102 (HTTP 403)`);

    // Unconnected family active emergency does NOT leak S102 emergency
    const ananyaEmergRes = await makeRequest('GET', '/api/emergency/active', null, ananyaToken);
    assert(ananyaEmergRes.body?.data === null, `Unconnected family sees NO emergency data (Got: ${ananyaEmergRes.body?.data})`);

    // Profile language persistence
    const langUpdateRes = await makeRequest('PATCH', '/api/auth/profile/language', { preferredLanguage: 'te' }, ananyaToken);
    assert(langUpdateRes.status === 200 && langUpdateRes.body?.preferredLanguage === 'te', `Language preference persisted to profile (Telugu)`);

    // Connect Ananya to Ravi with wrong code (should fail)
    const badConnectRes = await makeRequest('POST', '/api/auth/connect-senior', {
      seniorId: raviSeniorId,
      inviteCode: 'WRONG-CODE'
    }, ananyaToken);
    assert(badConnectRes.status === 403, `Invalid invite code blocked (HTTP 403)`);

    // Connect Ananya to Ravi with valid code
    const goodConnectRes = await makeRequest('POST', '/api/auth/connect-senior', {
      seniorId: raviSeniorId,
      inviteCode: 'IRIS-' + raviSeniorId,
      relationship: 'Daughter'
    }, ananyaToken);
    assert(goodConnectRes.status === 200, `Valid invite code connects Ananya to Ravi (HTTP 200)`);

    // Connected family GET /api/seniors/me now returns Ravi Kumar
    const ananyaConnectedMe = await makeRequest('GET', '/api/seniors/me', null, ananyaToken);
    assert(ananyaConnectedMe.body?.connected === true && ananyaConnectedMe.body?.data?.name === 'Ravi Kumar', `Connected family sees Ravi Kumar`);

    // Connected family GET /api/medicines/me returns Ravi's medicine (Amlodipine)
    const ananyaMedsRes = await makeRequest('GET', '/api/medicines/me', null, ananyaToken);
    assert(ananyaMedsRes.body?.data?.total === 1 && ananyaMedsRes.body?.data?.medicines[0]?.name === 'Amlodipine 5mg', `Connected family sees Ravi's medicines`);

    // Ananya STILL cannot access S102
    const ananyaStillBlocked = await makeRequest('GET', '/api/seniors/S102', null, ananyaToken);
    assert(ananyaStillBlocked.status === 403, `Ananya still blocked from S102 (HTTP 403)`);

    // 3. DEMO ACCOUNTS MAINTAIN S102 ACCESS
    console.log('\n--- Scenario 3: Demo Evaluator Accounts (Savitri Devi / S102) ---');
    const demoSeniorLogin = await makeRequest('POST', '/api/auth/login', {
      email: 'senior@iris.care',
      password: 'Password123!'
    });
    assert(demoSeniorLogin.status === 200, `Demo senior login HTTP 200`);
    const demoSeniorToken = demoSeniorLogin.body?.token;
    assert(demoSeniorLogin.body?.user?.seniorId === 'S102', `Demo senior retains S102 seniorId`);

    const demoMeRes = await makeRequest('GET', '/api/seniors/me', null, demoSeniorToken);
    assert(demoMeRes.status === 200 && demoMeRes.body?.data?.name === 'Savitri Devi', `Demo senior sees Savitri Devi`);

    const demoMedsRes = await makeRequest('GET', '/api/medicines/me', null, demoSeniorToken);
    assert(demoMedsRes.body?.data?.total > 1, `Demo senior sees demo seeded medicines`);

    console.log('\n====================================================');
    console.log(`   TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
    console.log('====================================================');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runIsolationTests();
