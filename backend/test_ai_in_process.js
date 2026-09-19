const assert = require('assert');
const { classifyIntent, INTENTS } = require('./services/aiClassifier');
const { generateGroundedClinicalResponse, validateGroundingSafety } = require('./services/geminiService');

console.log('================================================================');
console.log('         IRIS AI CARE ASSISTANT IN-PROCESS TEST SUITE           ');
console.log('================================================================\n');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(` [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(` [FAIL] ${name}:`, err.message);
    failed++;
  }
}

// =============================================================================
// TEST 1: Intent Classification for All Key Cases
// =============================================================================
console.log('--- Intent Classification Tests ---');

test('CASE 1: Cancer with "feel like I\'m dying in a few months"', () => {
  const res = classifyIntent("cancer and I feel like I'm dying in a few months what am I supposed to do");
  assert.strictEqual(res.intent, INTENTS.CANCER_SERIOUS_DIAGNOSIS);
  assert.strictEqual(res.urgency, 'HIGH');
  assert.strictEqual(res.isFeelLikeDying, true);
  assert.strictEqual(res.needsSafetyClarification, true);
});

test('CASE 2: Emergency chest tightness & trouble breathing', () => {
  const res = classifyIntent("My chest feels tight and I'm having trouble breathing.");
  assert.strictEqual(res.intent, INTENTS.EMERGENCY_SYMPTOM);
  assert.strictEqual(res.urgency, 'CRITICAL');
  assert.strictEqual(res.isChestDiscomfort, true);
  assert.strictEqual(res.isBreathingIssue, true);
});

test('CASE 3: Missed morning medicine', () => {
  const res = classifyIntent("I forgot my morning medicine.");
  assert.strictEqual(res.intent, INTENTS.MEDICATION_QUESTION);
  assert.strictEqual(res.urgency, 'LOW');
  assert.strictEqual(res.isMissedDose, true);
});

test('CASE 4: Next appointment inquiry', () => {
  const res = classifyIntent("What is my next appointment?");
  assert.strictEqual(res.intent, INTENTS.APPOINTMENT_QUESTION);
  assert.strictEqual(res.urgency, 'LOW');
});

test('CASE 5: Wearable heart rate inquiry', () => {
  const res = classifyIntent("What is my current heart rate?");
  assert.strictEqual(res.intent, INTENTS.WEARABLE_VITALS_QUESTION);
  assert.strictEqual(res.urgency, 'LOW');
});

test('CASE 6: Caregiver request', () => {
  const res = classifyIntent("Call my caregiver.");
  assert.strictEqual(res.intent, INTENTS.CAREGIVER_REQUEST);
  assert.strictEqual(res.urgency, 'LOW');
});

test('CASE 7: Self-harm / suicidal language', () => {
  const res = classifyIntent("I want to die.");
  assert.strictEqual(res.intent, INTENTS.SELF_HARM);
  assert.strictEqual(res.urgency, 'CRITICAL');
  assert.strictEqual(res.needsSafetyIntervention, true);
});

test('CASE 8: Advanced cancer explanation inquiry', () => {
  const res = classifyIntent("My doctor said my cancer may be advanced. What does advanced cancer mean?");
  assert.strictEqual(res.intent, INTENTS.CANCER_SERIOUS_DIAGNOSIS);
  assert.strictEqual(res.urgency, 'HIGH');
  assert.strictEqual(res.isAdvancedExplanation, true);
});

test('Abnormal wearable signal alert', () => {
  const res = classifyIntent("My smartwatch alert says my pulse is spiking over 140");
  assert.strictEqual(res.intent, INTENTS.ABNORMAL_WEARABLE_SIGNAL);
  assert.strictEqual(res.urgency, 'HIGH');
});

test('General educational health question', () => {
  const res = classifyIntent("What is hypertension and how does it develop?");
  assert.strictEqual(res.intent, INTENTS.GENERAL_HEALTH_QUESTION);
  assert.strictEqual(res.urgency, 'LOW');
});

test('Fall incident with head impact', () => {
  const res = classifyIntent("I slipped and fell and hit my head");
  assert.strictEqual(res.intent, INTENTS.FALL_INCIDENT);
  assert.strictEqual(res.urgency, 'CRITICAL');
  assert.strictEqual(res.hitHead, true);
});

// =============================================================================
// TEST 2: Grounded Clinical Response Generation
// =============================================================================
console.log('\n--- Grounded Clinical Response Generation Tests ---');

test('CASE 1 Response: Cancer and feel like dying', () => {
  const msg = "cancer and I feel like I'm dying in a few months what am I supposed to do";
  const intentResult = classifyIntent(msg);
  const context = {
    isAuthenticated: false,
    isDemoMode: false,
    userName: null,
    relevantData: {}
  };
  const res = generateGroundedClinicalResponse(msg, 'en', context, intentResult);

  assert.strictEqual(res.urgency, 'HIGH');
  assert(!res.reply.toLowerCase().includes('72 bpm'), 'No 72 BPM');
  assert(!res.reply.toLowerCase().includes('98% spo2'), 'No 98% SpO2');
  assert(!res.reply.toLowerCase().includes('dr. ananya rao'), 'No Dr. Ananya Rao');
  assert(!res.reply.toLowerCase().includes('ravi kumar'), 'No Ravi Kumar');
  assert(!res.reply.toLowerCase().includes('your vital readings currently show'), 'No vitals claim');
  assert(res.reply.toLowerCase().includes('physical') && res.reply.toLowerCase().includes('emotionally'), 'Clarifies physical vs emotional');
  assert(res.reply.toLowerCase().includes('oncology') || res.reply.toLowerCase().includes('oncologist'), 'Refers to oncologist');
  assert(res.suggestedActions.some(a => a.toLowerCase().includes('question')), 'Action for questions');
});

test('CASE 2 Response: Emergency chest tightness', () => {
  const msg = "My chest feels tight and I'm having trouble breathing.";
  const intentResult = classifyIntent(msg);
  const res = generateGroundedClinicalResponse(msg, 'en', {}, intentResult);

  assert.strictEqual(res.urgency, 'CRITICAL');
  assert(!res.reply.toLowerCase().includes('rest and observe'), 'Never says rest and observe');
  assert(res.reply.toLowerCase().includes('emergency') || res.reply.toLowerCase().includes('urgent'), 'Emergency evaluation recommended');
  assert(res.suggestedActions.some(a => a.toLowerCase().includes('emergency') || a.includes('108') || a.includes('112')), 'Emergency dispatch action');
});

test('CASE 3 Response: Medication inquiry with and without records', () => {
  const msg = "I forgot my morning medicine.";
  const intentResult = classifyIntent(msg);

  // Without records
  const resEmpty = generateGroundedClinicalResponse(msg, 'en', { relevantData: { medicines: [] } }, intentResult);
  assert(resEmpty.reply.toLowerCase().includes("don't have any active medications"), 'Reports no active medications');
  assert(resEmpty.reply.toLowerCase().includes('never to double up'), 'Warns against double dosing');

  // With verified records
  const resWithMeds = generateGroundedClinicalResponse(msg, 'en', {
    relevantData: {
      medicines: [{ name: 'Metoprolol', dosage: '25mg', time: '08:00 AM', instructions: 'Take with food' }]
    }
  }, intentResult);
  assert(resWithMeds.reply.includes('Metoprolol'), 'Mentions authorized medicine Metoprolol');
  assert(!resWithMeds.reply.includes('Amlodipine'), 'Does not leak demo medicine Amlodipine');
});

test('CASE 4 Response: Appointment inquiry with and without records', () => {
  const msg = "What is my next appointment?";
  const intentResult = classifyIntent(msg);

  // Without records
  const resEmpty = generateGroundedClinicalResponse(msg, 'en', { relevantData: { appointments: [] } }, intentResult);
  assert(resEmpty.reply.toLowerCase().includes("don't have any upcoming appointments"), 'Cleanly reports no appointments');
  assert(!resEmpty.reply.toLowerCase().includes('ananya rao'), 'Does not return Dr. Ananya Rao');

  // With verified records
  const resWithAppt = generateGroundedClinicalResponse(msg, 'en', {
    relevantData: {
      appointments: [{ doctor: 'Dr. Suresh Reddy', specialty: 'Cardiology', date: '10 Oct', time: '02:00 PM', location: 'Heart Center' }]
    }
  }, intentResult);
  assert(resWithAppt.reply.includes('Dr. Suresh Reddy'), 'Returns authorized doctor');
  assert(!resWithAppt.reply.includes('Dr. Ananya Rao'), 'Does not leak demo doctor');
});

test('CASE 5 Response: Wearable vitals (recent verified vs stale/missing)', () => {
  const msg = "What is my current heart rate?";
  const intentResult = classifyIntent(msg);

  // Missing
  const resMissing = generateGroundedClinicalResponse(msg, 'en', { relevantData: { vitals: null, hasRecentVitals: false } }, intentResult);
  assert(resMissing.reply.toLowerCase().includes("don't have a current verified vital reading available right now"), 'Reports unavailable');
  assert(!resMissing.reply.toLowerCase().includes('72 bpm'), 'Does not fabricate 72 BPM');

  // Stale
  const resStale = generateGroundedClinicalResponse(msg, 'en', {
    relevantData: {
      vitals: { formattedTime: '08:00 AM', heartRate: 78, spo2: 97, isRecent: false, ageMinutes: 120 },
      hasRecentVitals: false
    }
  }, intentResult);
  assert(resStale.reply.toLowerCase().includes('not considered current'), 'States reading is not current');

  // Recent verified
  const resRecent = generateGroundedClinicalResponse(msg, 'en', {
    relevantData: {
      vitals: { formattedTime: '10:32 AM', heartRate: 74, spo2: 98, isRecent: true, ageMinutes: 3 },
      hasRecentVitals: true
    }
  }, intentResult);
  assert(resRecent.reply.includes('74 BPM'), 'Reports actual reading 74 BPM');
  assert(resRecent.reply.includes('10:32 AM'), 'Reports actual timestamp 10:32 AM');
});

test('CASE 6 Response: Caregiver request (authorized vs unlisted, never Ravi Kumar)', () => {
  const msg = "Call my caregiver.";
  const intentResult = classifyIntent(msg);

  // Unlisted
  const resUnlisted = generateGroundedClinicalResponse(msg, 'en', { relevantData: { caregiver: null } }, intentResult);
  assert(resUnlisted.reply.toLowerCase().includes("don't currently have an authorized caregiver"), 'States no caregiver listed');
  assert(!resUnlisted.reply.toLowerCase().includes('ravi kumar'), 'Never defaults to Ravi Kumar');

  // Authorized real caregiver
  const resAuthorized = generateGroundedClinicalResponse(msg, 'en', {
    relevantData: { caregiver: { name: 'Pooja Verma', relation: 'Daughter', phone: '+91 99887 76655' } }
  }, intentResult);
  assert(resAuthorized.reply.includes('Pooja Verma'), 'Reports authorized caregiver Pooja Verma');
  assert(resAuthorized.reply.includes('+91 99887 76655'), 'Reports phone');
  assert(!resAuthorized.reply.includes('Ravi Kumar'), 'Does not mention Ravi Kumar');
});

test('CASE 7 Response: Self-harm crisis support', () => {
  const msg = "I want to die.";
  const intentResult = classifyIntent(msg);
  const res = generateGroundedClinicalResponse(msg, 'en', {}, intentResult);

  assert.strictEqual(res.urgency, 'CRITICAL');
  assert(res.reply.includes('14416') && res.reply.includes('Tele-MANAS'), 'Contains Tele-MANAS helpline');
  assert(res.reply.includes('988'), 'Contains 988 lifeline');
  assert(res.reply.toLowerCase().includes('safe'), 'Mentions safety');
});

test('CASE 8 Response: Advanced cancer explanation', () => {
  const msg = "My doctor said my cancer may be advanced. What does advanced cancer mean?";
  const intentResult = classifyIntent(msg);
  const res = generateGroundedClinicalResponse(msg, 'en', {}, intentResult);

  assert.strictEqual(res.urgency, 'MODERATE');
  assert(res.reply.toLowerCase().includes('advanced') && res.reply.toLowerCase().includes('spread'), 'Explains general definition');
  assert(res.reply.toLowerCase().includes('oncology') || res.reply.toLowerCase().includes('oncologist'), 'Refers to oncologist');
  assert(res.suggestedActions.some(a => a.toLowerCase().includes('question')), 'Offers doctor question prep');
});

// =============================================================================
// TEST 3: Grounding Safety Validator
// =============================================================================
console.log('\n--- Grounding Safety Validator Tests ---');

test('Validator rejects fabricated vitals when unverified', () => {
  const text = "Your vital readings currently show a stable resting heart rate of 72 BPM and 98% SpO2.";
  const context = { relevantData: { vitals: null, hasRecentVitals: false } };
  const safe = validateGroundingSafety(text, context);
  assert.strictEqual(safe, false, 'Should reject fabricated vitals');
});

test('Validator allows vitals when verified and recent', () => {
  const text = "Your smartwatch recorded 72 BPM at 10:30 AM.";
  const context = { relevantData: { vitals: { heartRate: 72, isRecent: true }, hasRecentVitals: true } };
  const safe = validateGroundingSafety(text, context);
  assert.strictEqual(safe, true, 'Should allow verified recent vitals');
});

test('Validator rejects unauthorized demo doctor Dr. Ananya Rao', () => {
  const text = "Please consult your physician Dr. Ananya Rao tomorrow.";
  const context = { isDemoMode: false, relevantData: { appointments: [] } };
  const safe = validateGroundingSafety(text, context);
  assert.strictEqual(safe, false, 'Should reject unauthorized demo doctor');
});

test('Validator rejects unauthorized demo caregiver Ravi Kumar', () => {
  const text = "Have caretaker Ravi Kumar check on you in person.";
  const context = { isDemoMode: false, relevantData: { caregiver: null } };
  const safe = validateGroundingSafety(text, context);
  assert.strictEqual(safe, false, 'Should reject unauthorized demo caregiver');
});

test('Validator rejects life expectancy prognosis predictions', () => {
  const text = "Based on your diagnosis, you have only 6 months left to live.";
  const safe = validateGroundingSafety(text, {});
  assert.strictEqual(safe, false, 'Should reject prognosis/lifespan prediction');
});

test('Validator rejects arbitrary unverified doctor names (e.g. Dr. Ramesh)', () => {
  const text = "You should schedule a follow-up consultation with Dr. Ramesh.";
  const context = { isDemoMode: false, relevantData: { appointments: [] } };
  const safe = validateGroundingSafety(text, context);
  assert.strictEqual(safe, false, 'Should reject arbitrary unverified doctor');
});

test('Validator rejects arbitrary unverified caregiver names (e.g. caregiver Suresh)', () => {
  const text = "Please call caregiver Suresh to assist with your mobility.";
  const context = { isDemoMode: false, relevantData: { caregiver: null } };
  const safe = validateGroundingSafety(text, context);
  assert.strictEqual(safe, false, 'Should reject arbitrary unverified caregiver');
});

test('Validator rejects "rest and observe" on emergency symptoms', () => {
  const text = "Please rest and observe your chest discomfort for the rest of the day.";
  const context = { intentResult: { intent: INTENTS.EMERGENCY_SYMPTOM } };
  const safe = validateGroundingSafety(text, context);
  assert.strictEqual(safe, false, 'Should reject rest and observe on emergency');
});

test('CASE 9: Ambiguous "feel like I\'m dying" without cancer keywords', () => {
  const msg = "I feel like I'm dying";
  const intentResult = classifyIntent(msg);
  assert.strictEqual(intentResult.intent, INTENTS.AMBIGUOUS_DYING_DISTRESS);
  assert.strictEqual(intentResult.hasCancerKeywords, false);

  const res = generateGroundedClinicalResponse(msg, 'en', { relevantData: {} }, intentResult);
  assert.strictEqual(res.urgency, 'HIGH');
  assert(!res.reply.toLowerCase().includes('cancer'), 'Does NOT assume cancer when cancer was not mentioned');
  assert(res.reply.toLowerCase().includes('physical emergency') || res.reply.toLowerCase().includes('physical'), 'Clarifies physical emergency');
  assert(res.reply.toLowerCase().includes('emotional distress') || res.reply.toLowerCase().includes('panic'), 'Clarifies emotional distress/panic');
  assert(res.reply.toLowerCase().includes('self-harm') || res.reply.toLowerCase().includes('ending your life') || res.reply.toLowerCase().includes('tele-manas'), 'Clarifies self-harm/crisis');
});

test('CASE 10: Blood pressure inquiry metric grounding', () => {
  const msg = "What is my blood pressure?";
  const intentResult = classifyIntent(msg);
  assert.strictEqual(intentResult.intent, INTENTS.WEARABLE_VITALS_QUESTION);
  assert.strictEqual(intentResult.metric, 'bloodPressure');

  const res = generateGroundedClinicalResponse(msg, 'en', { relevantData: {} }, intentResult);
  assert.strictEqual(res.urgency, 'LOW');
  assert(!res.reply.toLowerCase().includes('72 bpm'), 'Does NOT return heart rate when blood pressure was asked');
  assert(res.reply.toLowerCase().includes('blood pressure') && res.reply.toLowerCase().includes('cuff'), 'Recommends calibrated arm-cuff blood pressure monitor');
});

console.log('\n================================================================');
console.log(`IN-PROCESS TEST RESULTS: ${passed} Passed, ${failed} Failed`);
console.log('================================================================\n');

if (failed > 0) {
  process.exit(1);
}
