/**
 * IRIS AI Clinical Intent & Safety Classifier
 * 
 * Accurately classifies user messages into clinical, emergency, emotional,
 * medication, appointment, vital, and serious diagnosis intents across
 * English, Telugu, Hindi, and regional scripts.
 */

const INTENTS = {
  SELF_HARM: 'SELF_HARM',
  EMERGENCY_SYMPTOM: 'EMERGENCY_SYMPTOM',
  CANCER_SERIOUS_DIAGNOSIS: 'CANCER_SERIOUS_DIAGNOSIS',
  AMBIGUOUS_DYING_DISTRESS: 'AMBIGUOUS_DYING_DISTRESS',
  ABNORMAL_WEARABLE_SIGNAL: 'ABNORMAL_WEARABLE_SIGNAL',
  WEARABLE_VITALS_QUESTION: 'WEARABLE_VITALS_QUESTION',
  MEDICATION_QUESTION: 'MEDICATION_QUESTION',
  APPOINTMENT_QUESTION: 'APPOINTMENT_QUESTION',
  CAREGIVER_REQUEST: 'CAREGIVER_REQUEST',
  FAMILY_COMMUNICATION: 'FAMILY_COMMUNICATION',
  FALL_INCIDENT: 'FALL_INCIDENT',
  MENTAL_EMOTIONAL_DISTRESS: 'MENTAL_EMOTIONAL_DISTRESS',
  PREPARE_DOCTOR_QUESTIONS: 'PREPARE_DOCTOR_QUESTIONS',
  GENERAL_HEALTH_SYMPTOM: 'GENERAL_HEALTH_SYMPTOM',
  GENERAL_HEALTH_QUESTION: 'GENERAL_HEALTH_QUESTION',
  GENERAL_WELLNESS: 'GENERAL_WELLNESS',
  UNCLEAR_AMBIGUOUS: 'UNCLEAR_AMBIGUOUS'
};

/**
 * Classifies the intent, urgency, and clinical sub-conditions of a user message.
 * @param {string} rawMessage 
 * @param {string} language 
 * @returns {object} Classification result
 */
function classifyIntent(rawMessage, language = 'en') {
  const text = String(rawMessage || '').trim();
  const lower = text.toLowerCase();

  // 1. SELF-HARM & SUICIDAL LANGUAGE (Highest Safety Priority)
  const selfHarmPatterns = [
    /\b(want to die|wanna die|wish I were dead|better off dead)\b/i,
    /\b(kill myself|commit suicide|end my life|take my own life)\b/i,
    /\b(don't want to live|dont want to live|no point (in )?(living|anymore))\b/i,
    /\b(want (it|everything) to end|end it all)\b/i,
    /\b(hurt myself|harm myself|cut myself|hang myself|overdose)\b/i,
    /\b(feel like dying and (want|thinking about) (to hurt|hurting) myself)\b/i,
    // Telugu
    /చనిపోవాలని|ఆత్మహత్య|బ్రతకాలని లేదు|జీవితం ముగిసిపోవాలని|నా ప్రాణం తీసుకోవాలని/,
    // Hindi
    /मरना चाहता|मरना चाहती|आत्महत्या|जीने का कोई (मतलब|फायदा) नहीं|सब खत्म करना|खुद को चोट/
  ];

  for (const pattern of selfHarmPatterns) {
    if (pattern.test(lower)) {
      return {
        intent: INTENTS.SELF_HARM,
        urgency: 'CRITICAL',
        needsSafetyIntervention: true,
        isAmbiguousDying: false
      };
    }
  }

  // Ambiguous "feel like I'm dying" without explicit self-harm or emergency
  // (e.g., "cancer and I feel like I'm dying in a few months", "I feel like I'm dying")
  const feelLikeDying = /\b(feel like (i'm|i am|im) dying|feels like (i'm|i am|im) dying|feel like dying)\b/i.test(lower) ||
    /చనిపోతున్నట్టు|చనిపోతానేమో/.test(lower) ||
    /मर रहा हूँ|मर रही हूँ|मरने जैसा/.test(lower);

  // 2. CANCER & SERIOUS PROGNOSIS / DIAGNOSIS
  const cancerPatterns = [
    /\b(cancer|carcinoma|sarcoma|leukemia|lymphoma|melanoma|oncolog(y|ist)|chemo(therapy)?|radiation therapy|malignan(t|cy)|tumor|tumour|metastasis|metastatic)\b/i,
    /\b(terminal (cancer|diagnosis|illness)|advanced cancer|stage (1|2|3|4|iv|iii|ii|i))\b/i,
    /క్యాన్సర్|ట్యూమర్|కీమోథెరపీ/,
    /कैंसर|ट्यूमर|कीमोथेरेपी/
  ];

  const hasCancerKeywords = cancerPatterns.some(p => p.test(lower));

  if (hasCancerKeywords) {
    const isAdvancedExplanation = /\b(what (does|is) advanced cancer|explain advanced cancer|what does it mean|meaning of advanced cancer)\b/i.test(lower);
    const isDoctorQuestions = /\b(prepare questions?|questions? (to|for|should I) ask|what questions (to|for|should)|write down questions)\b/i.test(lower) ||
      /ప్రశ్నలను సిద్ధం|వైద్యుని అడగవలసిన ప్రశ్నలు/.test(lower) ||
      /प्रश्न तैयार|डॉक्टर से पूछने वाले सवाल/.test(lower);
    const isScared = /\b(scared|terrified|afraid|frightened|worried|anxious|crying|fear)\b/i.test(lower) ||
      /భయంగా|ఆందోళన/.test(lower) ||
      /डर लग|घबराहट/.test(lower);

    if (isDoctorQuestions && !feelLikeDying) {
      return {
        intent: INTENTS.PREPARE_DOCTOR_QUESTIONS,
        urgency: 'LOW',
        isCancerRelated: true
      };
    }

    return {
      intent: INTENTS.CANCER_SERIOUS_DIAGNOSIS,
      urgency: 'HIGH',
      hasCancerKeywords: true,
      isFeelLikeDying: feelLikeDying,
      isAdvancedExplanation,
      isScared,
      needsSafetyClarification: feelLikeDying
    };
  }

  // Cancer timeframe or prognosis fear without explicit cancer keyword (e.g., "dying in a few months")
  if (feelLikeDying && (lower.includes('month') || lower.includes('year') || lower.includes('week') || lower.includes('prognosis'))) {
    return {
      intent: INTENTS.CANCER_SERIOUS_DIAGNOSIS,
      urgency: 'HIGH',
      hasCancerKeywords: false,
      isFeelLikeDying: true,
      needsSafetyClarification: true
    };
  }

  // Ambiguous "I feel like I'm dying" without cancer or timeframe keywords (acute distress / symptom inquiry)
  if (feelLikeDying) {
    return {
      intent: INTENTS.AMBIGUOUS_DYING_DISTRESS,
      urgency: 'HIGH',
      hasCancerKeywords: false,
      isFeelLikeDying: true,
      needsSafetyClarification: true
    };
  }

  // 3. ACUTE EMERGENCY SYMPTOMS
  const chestPatterns = /\b(chest (pain|pressure|tightness|tight|feels tight|heaviness|discomfort|squeezing)|tight chest|crushing chest|pain (in|radiating to) (my )?(arm|jaw|neck|shoulder))\b/i;
  const breathingPatterns = /\b(trouble breathing|hard to breathe|can't breathe|cannot breathe|shortness of breath|breathless(ness)?|gasping|choking|suffocating)\b/i;
  const strokePatterns = /\b(face drooping|arm weakness|facial weakness|slurred speech|speech slurring|sudden numbness|can't speak|stroke|paralysis)\b/i;
  const syncopePatterns = /\b(passed out|blacked out|unconscious|lost consciousness|fainted suddenly|fainting)\b/i;
  const bleedingPatterns = /\b(severe bleeding|coughing blood|vomiting blood|heavy blood)\b/i;
  const allergicPatterns = /\b(anaphylaxis|throat (closing|swelling)|tongue swelling|severe allergic)\b/i;
  const seizurePatterns = /\b(seizure|convulsion|fits|epileptic fit)\b/i;

  const teluguEmergency = /ఛాతీ నొప్పి|గుండె నొప్పి|ఛాతీలో బిగుతుగా|ఊపిరి ఆడటం లేదు|శ్వాస తీసుకోవడంలో ఇబ్బంది|స్పృహ తప్పి|రక్తం కారుతుంది|పక్షవాతం|తీవ్రమైన నొప్పి/;
  const hindiEmergency = /सीने में दर्द|सीने में भारीपन|सांस लेने में (तकलीफ|दिक्कत)|बेहोश हो गया|बेहोश हो गई|खून की उल्टी|दौरा|लकवा/;

  const isEmergencySymptom = chestPatterns.test(lower) ||
    breathingPatterns.test(lower) ||
    strokePatterns.test(lower) ||
    syncopePatterns.test(lower) ||
    bleedingPatterns.test(lower) ||
    allergicPatterns.test(lower) ||
    seizurePatterns.test(lower) ||
    teluguEmergency.test(lower) ||
    hindiEmergency.test(lower);

  if (isEmergencySymptom) {
    return {
      intent: INTENTS.EMERGENCY_SYMPTOM,
      urgency: 'CRITICAL',
      isChestDiscomfort: chestPatterns.test(lower) || /ఛాతీ|सीने/.test(lower),
      isBreathingIssue: breathingPatterns.test(lower) || /ఊపిరి|सांस/.test(lower)
    };
  }

  // 4. FALL INCIDENT
  const fallPatterns = /\b(fell down|had a fall|slipped and fell|tripped and fell|fallen|tumbled|hit my head)\b/i;
  const teluguFall = /పడిపోయాను|జారిపడ్డాను|తల తగిలింది/;
  const hindiFall = /गिर गया|गिर गई|फिसल कर गिर|सिर पर चोट/;

  if (fallPatterns.test(lower) || teluguFall.test(lower) || hindiFall.test(lower)) {
    const hitHead = /\b(hit (my )?head|head injury|lost consciousness)\b/i.test(lower) || /తల|सिर/.test(lower);
    return {
      intent: INTENTS.FALL_INCIDENT,
      urgency: hitHead ? 'CRITICAL' : 'HIGH',
      hitHead
    };
  }

  // 5. ABNORMAL WEARABLE SIGNAL
  const abnormalWearablePatterns = /\b(watch alert|smartwatch alert|watch warning|high heart rate alert|low oxygen alert|pulse (is )?(spiking|too high|over \d{2,3})|spo2 (dropped|below \d{2})|irregular rhythm|arrhythmia)\b/i;
  if (abnormalWearablePatterns.test(lower)) {
    return {
      intent: INTENTS.ABNORMAL_WEARABLE_SIGNAL,
      urgency: 'HIGH'
    };
  }

  // 6. WEARABLE & VITAL SIGNS INQUIRY (Standard inquiry)
  const vitalPatterns = /\b(heart rate|pulse|spo2|oxygen( level)?|blood pressure|bp|vitals|wearable|smartwatch reading|temperature|blood sugar|glucose)\b/i;
  const teluguVitals = /హృదయ స్పందన|పల్స్|ఆక్సిజన్|రక్తపోటు|వైటల్స్/;
  const hindiVitals = /हार्ट रेट|पल्स|ऑक्सीजन|ब्लड प्रेशर|बीपी|वाइटल्स/;

  if (vitalPatterns.test(lower) || teluguVitals.test(lower) || hindiVitals.test(lower)) {
    return {
      intent: INTENTS.WEARABLE_VITALS_QUESTION,
      urgency: 'LOW',
      metric: lower.includes('pulse') || lower.includes('heart') ? 'heartRate' :
              lower.includes('spo2') || lower.includes('oxygen') ? 'spo2' :
              lower.includes('blood pressure') || lower.includes('bp') ? 'bloodPressure' : 'general'
    };
  }

  // 7. MEDICATION INQUIRIES
  const medPatterns = /\b(medicin(e|es)|pill|pills|tablet|tablets|dose|dosage|prescription|forgot (my )?medicine|missed (my )?medicine|forgot (to take|morning)|missed (a )?dose)\b/i;
  const teluguMeds = /మందులు|మాత్ర|మందు|వేసుకోవడం మర్చిపోయాను|ఔషధం/;
  const hindiMeds = /दवा|गोली|दवाइयां|दवा लेना भूल|खुराक/;

  if (medPatterns.test(lower) || teluguMeds.test(lower) || hindiMeds.test(lower)) {
    return {
      intent: INTENTS.MEDICATION_QUESTION,
      urgency: 'LOW',
      isMissedDose: /\b(forgot|missed|skipped)\b/i.test(lower) || /మర్చిపో|भूल/.test(lower)
    };
  }

  // 8. APPOINTMENT INQUIRIES
  const apptPatterns = /\b(appointment|appointments|doctor visit|doctor appointment|checkup|when is my doctor|next appointment|scheduled visit)\b/i;
  const teluguAppt = /అపాయింట్‌మెంట్|డాక్టర్ దర్శనం|వైద్యుని అపాయింట్‌మెంట్/;
  const hindiAppt = /अपॉइंटमेंट|डॉक्टर से मिलना|चेकअप कब है/;

  if (apptPatterns.test(lower) || teluguAppt.test(lower) || hindiAppt.test(lower)) {
    return {
      intent: INTENTS.APPOINTMENT_QUESTION,
      urgency: 'LOW'
    };
  }

  // 9. CAREGIVER / CARETAKER REQUEST
  const caregiverPatterns = /\b(caregiver|caretaker|nurse|attendant|call (my )?caregiver|call (my )?caretaker|contact caregiver|reach caregiver)\b/i;
  const teluguCaregiver = /కేర్‌టేకర్‌|సంరక్షకుడు|కేర్‌గివర్|కేర్‌టేకర్‌కు కాల్/;
  const hindiCaregiver = /केयरटेकर|देखभालकर्ता|केयरटेकर को कॉल|केयरगिवर/;

  if (caregiverPatterns.test(lower) || teluguCaregiver.test(lower) || hindiCaregiver.test(lower)) {
    return {
      intent: INTENTS.CAREGIVER_REQUEST,
      urgency: 'LOW'
    };
  }

  // 10. FAMILY COMMUNICATION
  const familyPatterns = /\b(call (my )?(son|daughter|family|child|children)|contact (my )?family|message family|family check-in)\b/i;
  const teluguFamily = /కుటుంబం|కుమారుడు|కొడుకు|కూతురు|కుటుంబ సభ్యులు/;
  const hindiFamily = /परिवार|बेटा|बेटी|परिवार को कॉल/;

  if (familyPatterns.test(lower) || teluguFamily.test(lower) || hindiFamily.test(lower)) {
    return {
      intent: INTENTS.FAMILY_COMMUNICATION,
      urgency: 'LOW'
    };
  }

  // 11. MENTAL & EMOTIONAL DISTRESS (Non-Self-Harm)
  const distressPatterns = /\b(feeling lonely|loneliness|feeling sad|depressed|feeling down|anxious|anxiety|scared|frightened|terrified|crying|overwhelmed|nobody (cares|visits)|isolated)\b/i;
  const teluguDistress = /ఒంటరిగా|భయంగా ఉంది|దిగులుగా ఉంది|ఆందోళనగా ఉంది/;
  const hindiDistress = /अकेलापन|उदासी|डर लग रहा|घबराहट|परेशान हूँ/;

  if (distressPatterns.test(lower) || teluguDistress.test(lower) || hindiDistress.test(lower)) {
    return {
      intent: INTENTS.MENTAL_EMOTIONAL_DISTRESS,
      urgency: 'MODERATE'
    };
  }

  // 12. PREPARE DOCTOR QUESTIONS (General or oncology visit question preparation)
  const doctorQuestionPatterns = /\b(prepare questions?|questions? (to|for|should I) ask (my )?(doctor|oncologist|physician|specialist)|write down questions?|questions? for (my )?(doctor|oncologist|visit|appointment)|what (should|can) I ask (my )?(doctor|oncologist)|ask my doctor)\b/i;
  const teluguDocQuestions = /ప్రశ్నలను సిద్ధం|వైద్యుని అడగవలసిన ప్రశ్నలు|డాక్టర్‌ను అడగవలసిన ప్రశ్నలు|ప్రశ్నలు రాయండి/;
  const hindiDocQuestions = /प्रश्न तैयार|डॉक्टर से पूछने वाले सवाल|ऑन्कोलॉजिस्ट के लिए प्रश्न|सवाल तैयार/;

  if (doctorQuestionPatterns.test(lower) || teluguDocQuestions.test(lower) || hindiDocQuestions.test(lower)) {
    return {
      intent: INTENTS.PREPARE_DOCTOR_QUESTIONS,
      urgency: 'LOW',
      isCancerRelated: hasCancerKeywords || /cancer|oncolog|chemo|carcinoma|tumor/i.test(lower)
    };
  }

  // 13. GENERAL HEALTH QUESTION (Educational / Non-symptomatic inquiry)
  const healthEducationPatterns = /\b(what is (diabetes|hypertension|blood pressure|cholesterol|arthritis|dementia|alzheimer)|how does (diabetes|blood pressure) work|causes of (hypertension|diabetes|arthritis))\b/i;
  if (healthEducationPatterns.test(lower)) {
    return {
      intent: INTENTS.GENERAL_HEALTH_QUESTION,
      urgency: 'LOW'
    };
  }

  // 13. GENERAL HEALTH SYMPTOM (Non-emergency symptom description)
  const generalSymptomPatterns = /\b(dizzy|dizziness|lightheaded|spinning|knee (hurts|pain)|headache|back pain|stiff(ness)?|swollen|cough|cold|stomach ache|nausea|tired|fatigue|sore)\b/i;
  const teluguGeneral = /తల తిరుగు|మోకాలి నొప్పి|నడుము నొప్పి|దగ్గు|జలుబు|అలసట/;
  const hindiGeneral = /चक्कर|घुटने में दर्द|सिरदर्द|पीठ दर्द|खांसी|जुकाम|थकान/;

  if (generalSymptomPatterns.test(lower) || teluguGeneral.test(lower) || hindiGeneral.test(lower)) {
    const isDizzy = /\b(dizzy|lightheaded|spinning)\b/i.test(lower) || /తల తిరుగు|चक्कर/.test(lower);
    return {
      intent: INTENTS.GENERAL_HEALTH_SYMPTOM,
      urgency: isDizzy ? 'MODERATE' : 'LOW',
      isDizzy
    };
  }

  // 14. GENERAL WELLNESS
  const wellnessPatterns = /\b(water|hydration|diet|nutrition|exercise|walk(ing)?|sleep|rest|yoga|wellness)\b/i;
  if (wellnessPatterns.test(lower)) {
    return {
      intent: INTENTS.GENERAL_WELLNESS,
      urgency: 'LOW'
    };
  }

  // 15. UNCLEAR / AMBIGUOUS / GREETING
  return {
    intent: INTENTS.UNCLEAR_AMBIGUOUS,
    urgency: 'LOW'
  };
}

module.exports = {
  INTENTS,
  classifyIntent
};
