const https = require('https');
const { classifyIntent, INTENTS } = require('./aiClassifier');
const { buildAuthorizedAiContext } = require('./aiContextBuilder');

const SYSTEM_INSTRUCTION = `
You are IRIS Care Assistant, an empathetic, clinically grounded, non-diagnostic AI health companion for senior citizens and families.

CRITICAL SAFETY & GROUNDING RULES (NEVER VIOLATE):
1. STRICT ZERO-HALLUCINATION POLICY FOR PERSONAL HEALTH DATA:
   - You have access ONLY to facts explicitly provided in VERIFIED_CONTEXT.
   - You must NEVER invent, assume, or hallucinate:
     * Vital signs (heart rate, SpO2, blood pressure, glucose, temperature, respiratory rate)
     * Care team members (physician names, doctor names, caregiver names, nurse names)
     * Appointments, clinics, or consultation details
     * Medications, dosages, or schedules
     * Medical diagnoses or conditions
   - If a requested piece of information is NOT in VERIFIED_CONTEXT:
     * For vitals: State clearly: "I don't have a current verified vital reading available right now."
     * For caregivers/doctors: State clearly: "I don't currently have an authorized caregiver or healthcare provider listed in your IRIS care records."
     * For appointments: State clearly: "I don't have any upcoming appointments scheduled in your authorized IRIS care records."
     * For medications: State clearly: "I don't have any active medications recorded in your authorized IRIS profile."
   - NEVER say "Your vital readings currently show..." unless verified recent vitals are explicitly provided in VERIFIED_CONTEXT.

2. CANCER & SERIOUS PROGNOSIS PROTOCOL:
   - NEVER determine cancer stage, predict life expectancy, provide survival duration, confirm dying, or claim an illness is terminal.
   - Respond empathetically and acknowledge uncertainty.
   - If the user says "feel like I'm dying" or fears dying in months:
     Gently clarify: "When you say you feel like you're dying, do you mean you're experiencing severe physical symptoms right now, or that you're feeling emotionally overwhelmed and thinking about hurting yourself?"
     If severe physical symptoms, guide to immediate emergency services.
     If emotional distress, direct user to their treating oncology team who have the complete clinical pathology and scans needed to interpret their prognosis.
     Offer to help write down questions for their oncologist or explain medical terminology.

3. SELF-HARM & SUICIDAL CRISIS PROTOCOL:
   - Respond with immediate compassionate safety guidance.
   - Direct to local emergency helplines:
     * India: Tele-MANAS (14416 / 1800-891-4416) or emergency 112.
     * US/Canada: 988 (Suicide & Crisis Lifeline).
     * UK: 111 / 999.
   - Encourage staying in a safe space, moving away from means of harm, and connecting with a trusted person who can stay with them.
   - Keep concise and supportive. NEVER provide instructions for self-harm. No lectures or guilt.

4. ACUTE EMERGENCY SYMPTOMS PROTOCOL:
   - For chest pain, severe breathing difficulty, stroke symptoms, loss of consciousness, severe bleeding, or sudden severe confusion:
     State clearly: "This could require urgent medical attention. Please contact your local emergency service (such as 108 or 112 in India, 911 in the US, or 999 in the UK) or seek immediate emergency medical care right away."
     NEVER say "Rest and observe". Do NOT diagnose the cause.

5. WEARABLE TIME-AWARENESS:
   - If wearable data is present, specify source and exact timestamp/age. Distinguish recent (< 15 min) from older readings.
   - If no recent reading exists, state: "I don't have a recent verified vital reading available right now."

6. CONTEXTUAL ACTION BUTTONS:
   - Provide suggestedActions ONLY when directly relevant to the user's intent:
     * Medication inquiry -> ["View medication schedule", "Consult pharmacist or doctor"]
     * Appointment inquiry -> ["View appointments", "Schedule an appointment"]
     * Caregiver request -> ["Contact caregiver", "Update care network"]
     * Emergency symptoms -> ["Call Emergency Services (108 / 112)", "Seek urgent medical care"]
     * Emotional crisis -> ["Call Crisis Helpline (14416 / 988)", "Reach out to someone you trust"]
     * Cancer discussion -> ["Prepare questions for doctor", "Consult treating oncology team"]
   - If no safe action is appropriate, return an empty array [].
   - NEVER show "Rest and observe" or generic caretaker buttons for emergencies.

7. LANGUAGE:
   - Respond in the user's preferred language (Telugu if 'te', Hindi if 'hi', English if 'en').

8. OUTPUT FORMAT:
   - You MUST output ONLY valid JSON:
   {
     "reply": "Your response text here",
     "urgency": "LOW" | "MODERATE" | "HIGH" | "CRITICAL",
     "suggestedActions": ["Relevant Action 1", "Relevant Action 2"]
   }
`;

/**
 * Generates a clinically grounded, intent-driven response when Gemini API is offline,
 * unconfigured, or when Gemini output violates grounding rules.
 */
function generateGroundedClinicalResponse(userMessage, language = 'en', context = {}, intentResult = null) {
  const intentData = intentResult || classifyIntent(userMessage, language);
  const intent = intentData.intent;
  const lang = language || 'en';
  const isTe = lang === 'te' || /[\u0C00-\u0C7F]/.test(userMessage);
  const isHi = lang === 'hi' || /[\u0900-\u097F]/.test(userMessage);

  const relevant = context.relevantData || {};

  // =========================================================================
  // 1. SELF-HARM & CRISIS INTENT
  // =========================================================================
  if (intent === INTENTS.SELF_HARM) {
    if (isTe) {
      return {
        reply: `మీరు చాలా బాధపడుతున్నారని నేను అర్థం చేసుకున్నాను. మీరు ఒంటరిగా లేరు, సహాయం వెంటనే అందుబాటులో ఉంది.\n\nమీరు మీ ప్రాణాలను కాపాడుకోవడానికి దయచేసి వెంటనే టెలి-మానస్ (Tele-MANAS) హెల్ప్‌లైన్ 14416 లేదా 1800-891-4416 కి కాల్ చేయండి. అత్యవసర సహాయం కోసం 112 లేదా 108 కి సంప్రదించండి.\n\nదయచేసి మీకు నమ్మకమైన కుటుంబ సభ్యుడితో లేదా స్నేహితుడితో వెంటనే మాట్లాడండి మరియు ఒంటరిగా ఉండకండి.`,
        urgency: 'CRITICAL',
        suggestedActions: ['టెలి-మానస్ 14416 కి కాల్ చేయండి', 'అత్యవసర 112 కి కాల్ చేయండి', 'నమ్మకమైన వ్యక్తిని సంప్రదించండి']
      };
    }
    if (isHi) {
      return {
        reply: `मुझे बहुत दुख है कि आप इस समय इतना कष्ट महसूस कर रहे हैं। आप अकेले नहीं हैं, और सहायता उपलब्ध है।\n\nकृपया तुरंत टेली-मानस (Tele-MANAS) हेल्पलाइन 14416 या 1800-891-4416 पर कॉल करें। आपातकालीन सहायता के लिए 112 पर संपर्क करें।\n\nकृपया किसी ऐसे व्यक्ति से तुरंत बात करें जिस पर आप भरोसा करते हैं, और किसी भी हानिकारक वस्तु से दूर रहें। आपकी जिंदगी अनमोल है।`,
        urgency: 'CRITICAL',
        suggestedActions: ['हेल्पलाइन 14416 पर कॉल करें', 'आपातकालीन 112 पर कॉल करें', 'भरोसेमंद व्यक्ति से बात करें']
      };
    }
    return {
      reply: `I hear how much pain you are carrying right now, and I want you to know that you are not alone. Please know that support is available right this second.\n\nIf you are in immediate danger or feel you cannot keep yourself safe, please reach out immediately:\n• In India: Call the National Tele-MANAS mental health helpline at 14416 (or 1800-891-4416), or call 112.\n• In the US/Canada: Call or text 988 (Suicide & Crisis Lifeline).\n• In the UK: Call 111 or 999.\n\nPlease move to a safe place, stay away from anything that could hurt you, and connect with a trusted person who can stay with you right now.`,
      urgency: 'CRITICAL',
      suggestedActions: ['Call Crisis Helpline (14416 / 988)', 'Reach out to someone you trust', 'Seek immediate emergency care']
    };
  }

  // =========================================================================
  // 2. CANCER & SERIOUS PROGNOSIS / DIAGNOSIS
  // =========================================================================
  if (intent === INTENTS.CANCER_SERIOUS_DIAGNOSIS) {
    if (intentData.isAdvancedExplanation) {
      if (isTe) {
        return {
          reply: `క్యాన్సర్ విషయంలో 'అడ్వాన్స్‌డ్' (Advanced) అనే పదం సాధారణంగా క్యాన్సర్ ప్రారంభమైన ప్రదేశం నుండి ఇతర భాగాలు లేదా కణజాలాలకు విస్తరించిన స్థితిని సూచిస్తుంది.\n\nఅయితే, క్యాన్సర్ రకం మరియు వ్యక్తిగత పరిస్థితిని బట్టి దీని అర్థం మరియు చికిత్సా పద్ధతులు చాలా భిన్నంగా ఉంటాయి. మీ ఖచ్చితమైన రోగ నిర్ధారణ మరియు చికిత్స ఎంపికల గురించి మీ ఆంకాలజిస్ట్ (క్యాన్సర్ నిపుణులు) తో చర్చించడం అత్యంత ముఖ్యం.\n\nమీ వైద్యుడిని అడగడానికి అవసరమైన ప్రశ్నలను సిద్ధం చేయడంలో నేను మీకు సహాయపడగలను.`,
          urgency: 'MODERATE',
          suggestedActions: ['ఆంకాలజిస్ట్ కోసం ప్రశ్నలు సిద్ధం చేయండి', 'వైద్య నివేదికలు సమీక్షించండి']
        };
      }
      if (isHi) {
        return {
          reply: `कैंसर के संदर्भ में 'एडवांस्ड' (Advanced) शब्द का सामान्य अर्थ है कि कैंसर अपने मूल स्थान से आसपास के ऊतकों या शरीर के अन्य भागों में फैल गया है।\n\nहालांकि, कैंसर के प्रकार और व्यक्ति के आधार पर इसका सटीक अर्थ और उपचार के विकल्प काफी भिन्न होते हैं। अपनी सटीक स्थिति और रोगनिदान (prognosis) को समझने के लिए अपने ऑन्कोलॉजिस्ट (कैंसर विशेषज्ञ) से विस्तार से बात करना सबसे महत्वपूर्ण है।\n\nयदि आप चाहें, तो मैं आपके डॉक्टर से पूछने के लिए प्रश्नों की एक सूची तैयार करने में आपकी मदद कर सकता हूँ।`,
          urgency: 'MODERATE',
          suggestedActions: ['ऑन्कोलॉजिस्ट के लिए प्रश्न तैयार करें', 'चिकित्सा सहायता लें']
        };
      }
      return {
        reply: `In oncology, the term "advanced cancer" generally refers to cancer that has grown outside the original site, which may include locally advanced cancer or cancer that has spread to other parts of the body (metastatic).\n\nHowever, what "advanced" means varies greatly depending on the specific type of cancer, available targeted therapies, and your overall health. It does not automatically mean that treatment cannot help.\n\nBecause every person's situation is unique, your treating oncology team is the right source to explain your specific stage and treatment goals. If you'd like, I can help you write down clear questions to ask your oncologist at your next appointment.`,
        urgency: 'MODERATE',
        suggestedActions: ['Prepare questions for doctor', 'Consult treating oncology team']
      };
    }

    // Cancer with "feel like I'm dying" or fear of dying in months
    if (intentData.isFeelLikeDying || userMessage.toLowerCase().includes('dying')) {
      if (isTe) {
        return {
          reply: `మీరు ఇంత భయంకరమైన పరిస్థితిని ఎదుర్కొంటున్నందుకు నాకు చాలా బాధగా ఉంది. క్యాన్సర్ వంటి తీవ్రమైన విషయాల గురించి ఆలోచిస్తున్నప్పుడు తీవ్రమైన భయం కలగడం సహజం.\n\nమొదటగా స్పష్టం చేసుకోవడానికి: మీరు 'చనిపోతున్నట్టు అనిపిస్తోంది' అన్నప్పుడు, ప్రస్తుతం మీకు తీవ్రమైన శారీరక నొప్పులు లేదా శ్వాస ఆడకపోవడం వంటి అత్యవసర లక్షణాలు ఉన్నాయా, లేదా మీరు మానసికంగా తీవ్రమైన భయంతో, నిస్సహాయతతో ఉన్నారా?\n\n• మీరు తీవ్రమైన శారీరక నొప్పితో బాధపడుతుంటే, వెంటనే అత్యవసర వైద్య సహాయం (108/112) తీసుకోండి.\n• మీ సమయం పరిమితంగా ఉందని ఎవరైనా మీకు చెప్పినట్లయితే, మీ చికిత్స అందిస్తున్న ఆంకాలజీ బృందంతో మాట్లాడటం అత్యంత ఉపయోగకరమైన మార్గం, ఎందుకంటే మీ పూర్తి వైద్య నివేదికలు వారి వద్ద మాత్రమే ఉంటాయి.\n\nమీ వైద్యునితో మాట్లాడటానికి ప్రశ్నలను సిద్ధం చేయడంలో నేను మీకు సహాయం చేయగలను.`,
          urgency: 'HIGH',
          suggestedActions: ['వైద్యుడిని అడగవలసిన ప్రశ్నలు రాయండి', 'ఆంకాలజిస్ట్‌ను సంప్రదించండి', 'తీవ్ర లక్షణాలుంటే 108 కి కాల్ చేయండి']
        };
      }
      if (isHi) {
        return {
          reply: `मुझे वास्तव में बहुत दुख है कि आप इतनी डरावनी और कठिन स्थिति से गुजर रहे हैं। कैंसर के बारे में अनिश्चितता भारी मानसिक तनाव पैदा कर सकती है।\n\nस्पष्ट रूप से समझने के लिए: जब आप कहते हैं कि आपको लगता है कि आप मर रहे हैं, तो क्या आपको इस समय कोई गंभीर शारीरिक लक्षण (जैसे सीने में दर्द या सांस लेने में बहुत कठिनाई) हो रहे हैं, या आप भावनात्मक रूप से बहुत अधिक भयभीत और असहज महसूस कर रहे हैं?\n\n• यदि आपको कोई गंभीर शारीरिक आपात स्थिति महसूस हो रही है, तो कृपया तुरंत आपातकालीन चिकित्सा सहायता (108 / 112) लें।\n• यदि आपको किसी ने बताया है कि आपका समय सीमित है, तो सबसे महत्वपूर्ण कदम अपनी ऑन्कोलॉजी टीम से बात करना है, क्योंकि केवल उनके पास ही आपकी सटीक स्थिति और विकल्पों की पूरी जानकारी होती है।\n\nमैं आपके अगले अपॉइंटमेंट के लिए प्रश्न तैयार करने में आपकी सहायता कर सकता हूँ।`,
          urgency: 'HIGH',
          suggestedActions: ['डॉक्टर के लिए प्रश्न तैयार करें', 'ऑन्कोलॉजिस्ट से बात करें', 'आपात स्थिति में 108 पर कॉल करें']
        };
      }
      return {
        reply: `I am truly sorry you are dealing with something this frightening. Facing cancer and the fear of what comes next can feel completely overwhelming.\n\nFirst, I want to clarify: when you say you feel like you're dying, do you mean you are experiencing acute, severe physical symptoms right now (such as severe chest pain, extreme breathlessness, or collapse), or that you are feeling emotionally terrified and burdened by a prognosis you were given?\n\n• If you are having severe physical symptoms right now, please contact local emergency services (108 / 112) or go to an emergency department immediately.\n• If you have been told your cancer is serious or that your time may be limited, the most helpful step is to speak directly with your treating oncology team. They have your scans and pathology, and can give you an honest explanation of your diagnosis, palliative care support, and treatment options.\n\nIf you'd like, you can tell me what your doctor has mentioned so far, and I can help you prepare a clear list of questions for your next visit.`,
        urgency: 'HIGH',
        suggestedActions: ['Prepare questions for doctor', 'Consult treating oncology team', 'Seek urgent care if severe symptoms']
      };
    }

    // Cancer diagnosis fear (e.g., "I was diagnosed with cancer and I'm scared")
    if (intentData.isScared) {
      if (isTe) {
        return {
          reply: `క్యాన్సర్ నిర్ధారణ గురించి విన్నప్పుడు తీవ్రమైన భయం మరియు ఆందోళన కలగడం చాలా సహజం. మీరు ఒంటరిగా లేరని దయచేసి గుర్తుంచుకోండి.\n\nకొన్ని ముఖ్యమైన విషయాలు:\n• ఆధునిక వైద్యంలో క్యాన్సర్‌కు వ్యక్తిగతీకరించిన చికిత్సలు మరియు ఉపశమన సంరక్షణ అందుబాటులో ఉన్నాయి.\n• మీ ఖచ్చితమైన రోగ నిర్ధారణ మరియు చికిత్సా ప్రణాళికను వివరించడానికి మీ ఆంకాలజీ బృందం అత్యుత్తమ మార్గదర్శకులు.\n• కుటుంబ సభ్యులు లేదా నమ్మకమైన స్నేహితులతో మాట్లాడటం మీకు మానసిక ధైర్యాన్ని ఇస్తుంది.\n\nమీ ఆంకాలజిస్ట్‌ను అడగడానికి ప్రశ్నలను సిద్ధం చేయడంలో నేను మీకు సహాయపడగలను.`,
          urgency: 'HIGH',
          suggestedActions: ['ఆంకాలజిస్ట్ కోసం ప్రశ్నలు సిద్ధం చేయండి', 'చికిత్స అందిస్తున్న ఆంకాలజీ బృందాన్ని సంప్రదించండి', 'కుటుంబ సభ్యుడిని సంప్రదించండి']
        };
      }
      if (isHi) {
        return {
          reply: `कैंसर के निदान के बारे में सुनकर अत्यधिक भय और चिंता होना पूरी तरह से स्वाभाविक है। कृपया ध्यान रखें कि आप अकेले नहीं हैं और सहायता उपलब्ध है।\n\nकुछ महत्वपूर्ण बातें:\n• आधुनिक चिकित्सा में लक्षित उपचार और लक्षण प्रबंधन के कई प्रभावी विकल्प उपलब्ध हैं।\n• आपकी ऑन्कोलॉजी टीम आपकी विशिष्ट स्थिति के आधार पर सही मार्गदर्शन और व्यक्तिगत उपचार योजना तैयार करेगी।\n• अपने करीबी परिवार या दोस्तों से अपनी चिंताएं साझा करने से मानसिक संबल मिलता है।\n\nयदि आप चाहें, तो मैं आपके ऑन्कोलॉजिस्ट से पूछने के लिए प्रश्नों की एक स्पष्ट सूची तैयार करने में आपकी मदद कर सकता हूँ।`,
          urgency: 'HIGH',
          suggestedActions: ['ऑन्कोलॉजिस्ट के लिए प्रश्न तैयार करें', 'उपचार कर रही ऑन्कोलॉजी टीम से परामर्श लें', 'भरोसेमंद व्यक्ति से बात करें']
        };
      }
      return {
        reply: `Hearing a cancer diagnosis is scary and it is completely normal to feel frightened, overwhelmed, or anxious right now. Please take a gentle breath—you do not have to figure out everything in this single moment.\n\nHere are important realities to keep in mind:\n• Cancer care is highly individualized today, with many targeted therapies, immunotherapies, and symptom-relief options tailored to specific pathology.\n• Your treating oncology team has your complete scans and tissue pathology, and they are the best partners to explain your exact stage and outline a personalized care plan.\n• You do not have to carry this alone. Connecting with a trusted family member or close friend can provide immediate comfort and emotional strength.\n\nWhenever you are ready, I can help you write down a clear list of questions to ask your oncologist at your next appointment.`,
        urgency: 'HIGH',
        suggestedActions: ['Prepare questions for doctor', 'Consult treating oncology team', 'Reach out to someone you trust']
      };
    }

    // General cancer query
    return {
      reply: `I'm really sorry you're facing this. When dealing with a cancer diagnosis, having clear information from your medical team makes a tremendous difference.\n\nBecause cancer treatment and outcomes depend entirely on the exact cellular type, staging, biomarkers, and individual health, your treating oncologist is the best person to explain what your diagnosis means and what steps come next.\n\nI can help you understand medical terminology or help you write down questions to take to your next doctor's appointment.`,
      urgency: 'MODERATE',
      suggestedActions: ['Prepare questions for doctor', 'Consult treating oncology team']
    };
  }

  // =========================================================================
  // 2B. PREPARE DOCTOR / SPECIALIST QUESTIONS
  // =========================================================================
  if (intent === INTENTS.PREPARE_DOCTOR_QUESTIONS) {
    if (intentData.isCancerRelated) {
      if (isTe) {
        return {
          reply: `మీ ఆంకాలజిస్ట్ (క్యాన్సర్ నిపుణులు) ను అడగడానికి ఇక్కడ కొన్ని ముఖ్యమైన ప్రశ్నలు ఉన్నాయి:\n\n1. రోగ నిర్ధారణ & దశ: నా క్యాన్సర్ యొక్క ఖచ్చితమైన రకం మరియు స్టేజ్ ఏమిటి?\n2. చికిత్స ఎంపికలు: నాకు అందుబాటులో ఉన్న చికిత్సా మార్గాలు ఏమిటి (శస్త్రచికిత్స, కీమోథెరపీ, రేడియేషన్ లేదా టార్గెటెడ్ థెరపీ)?\n3. చికిత్స లక్ష్యం: ఈ చికిత్స యొక్క ప్రాథమిక లక్ష్యం ఏమిటి (నయం చేయడం, నియంత్రణ లేదా లక్షణాల ఉపశమనం)?\n4. దుష్ప్రభావాలు: నేను ఏ దుష్ప్రభావాలను (side effects) ఆశించాలి మరియు వాటిని ఎలా నిర్వహించాలి?\n5. అత్యవసర సంప్రదింపు: సందర్శనల మధ్య అత్యవసర లక్షణాలు కనిపిస్తే నేను ఎవరిని సంప్రదించాలి?\n\nఈ ప్రశ్నలను మీతో పాటు మీ తదుపరి అపాయింట్‌మెంట్‌కు తీసుకెళ్లండి. మీకు కుటుంబ సభ్యుడిని కూడా వెంట తీసుకెళ్లడం మంచిది.`,
          urgency: 'LOW',
          suggestedActions: ['అపాయింట్‌మెంట్‌లు చూడండి', 'కేర్‌టేకర్‌ని సంప్రదించండి']
        };
      }
      if (isHi) {
        return {
          reply: `अपने ऑन्कोलॉजिस्ट (कैंसर विशेषज्ञ) से पूछने के लिए यहाँ आवश्यक प्रश्नों की एक सूची है:\n\n1. निदान और स्टेज: मेरे कैंसर का सटीक प्रकार, सबटाइप और स्टेज क्या है?\n2. उपचार के विकल्प: मेरे लिए कौन-कौन से उपचार विकल्प उपलब्ध हैं (सर्जरी, कीमोथेरेपी, रेडिएशन या टारगेटेड थेरेपी)?\n3. उपचार का उद्देश्य: इस उपचार का प्राथमिक लक्ष्य क्या है (रोग को ठीक करना, नियंत्रित रखना या लक्षणों से राहत)?\n4. संभावित दुष्प्रभाव: मुझे किन दुष्प्रभावों की अपेक्षा करनी चाहिए और उन्हें कैसे प्रबंधित किया जाएगा?\n5. आपातकालीन संपर्क: यदि अपॉइंटमेंट के बीच कोई गंभीर लक्षण दिखाई दें, तो मुझे किससे संपर्क करना चाहिए?\n\nइन प्रश्नों को नोट कर लें और अपनी अगली मुलाकात में किसी विश्वसनीय परिजन को साथ रखें।`,
          urgency: 'LOW',
          suggestedActions: ['अपॉइंटमेंट देखें', 'केयरटेकर से संपर्क करें']
        };
      }
      return {
        reply: `Here are key questions to ask your oncologist to ensure you have complete clarity:\n\n1. Diagnosis & Staging: What is the exact type, subtype, and stage of my cancer, and where is it located?\n2. Treatment Goals: What are my treatment options, and what is the primary goal of each (curative, disease control, or symptom relief/palliative)?\n3. Benefits & Risks: What are the expected benefits, potential side effects, and risks of the recommended therapy?\n4. Symptom Management: How will pain or fatigue be managed, and who do I call if symptoms worsen between appointments?\n5. Support & Clinical Trials: Are there molecular biomarker tests, clinical trials, or supportive care counselors available for me and my family?\n\nConsider taking a notebook and having a trusted family member accompany you to take notes during the consultation.`,
        urgency: 'LOW',
        suggestedActions: ['View upcoming appointments', 'Reach out to someone you trust']
      };
    }

    if (isTe) {
      return {
        reply: `మీ వైద్యుని సందర్శనకు ముందు సిద్ధం చేసుకోవలసిన కొన్ని ఉపయోగకరమైన ప్రశ్నలు:\n\n1. నా లక్షణాలకు కారణం ఏమిటి మరియు ఖచ్చితమైన నిర్ధారణ ఏమిటి?\n2. ఈ పరిస్థితిని నిర్వహించడానికి ఉత్తమమైన చికిత్స లేదా మందులు ఏమిటి?\n3. మందుల వల్ల ఏవైనా దుష్ప్రభావాలు లేదా ఇతర మందులతో పరస్పర చర్యలు ఉన్నాయా?\n4. జీవనశైలి లేదా ఆహారంలో ఏవైనా మార్పులు చేయాలా?\n5. నేను తదుపరి ఫాలో-అప్ అపాయింట్‌మెంట్‌ను ఎప్పుడు షెడ్యూల్ చేయాలి?`,
        urgency: 'LOW',
        suggestedActions: ['అపాయింట్‌మెంట్‌లు చూడండి', 'మందుల షెడ్యూల్ చూడండి']
      };
    }
    if (isHi) {
      return {
        reply: `अपने डॉक्टर से परामर्श के लिए यहाँ कुछ महत्वपूर्ण प्रश्न हैं:\n\n1. मेरे लक्षणों का मुख्य कारण और सटीक निदान क्या है?\n2. इस स्थिति के लिए सबसे प्रभावी उपचार योजना क्या है?\n3. निर्धारित दवाओं के संभावित दुष्प्रभाव क्या हो सकते हैं?\n4. क्या मुझे अपनी जीवनशैली या आहार में कोई बदलाव करना चाहिए?\n5. मुझे अगली फॉलो-अप विजिट कब रखनी चाहिए?`,
        urgency: 'LOW',
        suggestedActions: ['अपॉइंटमेंट देखें', 'दवाओं का समय देखें']
      };
    }
    return {
      reply: `Here are key questions to prepare for your doctor's appointment:\n\n1. Understanding Diagnosis: What is the cause of my symptoms, and what is my diagnosis?\n2. Treatment Plan: What are my treatment options, and what lifestyle modifications or therapies do you recommend?\n3. Medication Review: How should I take my medicines, and what possible interactions or side effects should I watch for?\n4. Warning Signs: What symptoms require immediate medical attention or an urgent clinic call?\n5. Next Steps: When should I schedule my next follow-up appointment?`,
      urgency: 'LOW',
      suggestedActions: ['View upcoming appointments', 'View medication schedule']
    };
  }

  // =========================================================================
  // 2B. AMBIGUOUS "FEEL LIKE I'M DYING" (WITHOUT CANCER CONTEXT)
  // =========================================================================
  if (intent === INTENTS.AMBIGUOUS_DYING_DISTRESS) {
    if (isTe) {
      return {
        reply: `మీరు ఇంత భయానకమైన అనుభూతిని ఎదుర్కొంటున్నారని విని నేను చాలా ఆందోళన చెందుతున్నాను. మీ పరిస్థితిని సరిగ్గా అర్థం చేసుకుని సరైన మార్గదర్శకత్వం ఇవ్వడానికి, దయచేసి స్పష్టం చేయండి:\n\n1. అత్యవసర శారీరక లక్షణాలు: ప్రస్తుతం మీకు తీవ్రమైన ఛాతీ నొప్పి, తీవ్రమైన శ్వాస ఆడకపోవడం లేదా కళ్లు తిరగడం వంటి శారీరక లక్షణాలు ఉన్నాయా? అలా అయితే, వెంటనే 108 లేదా 112 అత్యవసర సేవలను సంప్రదించండి.\n2. తీవ్రమైన మానసిక ఆందోళన లేదా భయం: మీరు మానసికంగా తీవ్రమైన భయంతో లేదా పానిక్ అటాక్ కారణంగా నిస్సహాయంగా భావిస్తున్నారా? అలా అయితే, సురక్షితమైన చోట కూర్చుని కుటుంబ సభ్యుని లేదా వైద్యుని సహాయం తీసుకోండి.\n3. ఆత్మహత్య ఆలోచనలు: మీరు జీవితాన్ని ముగించాలనే ఆలోచనలతో ఉన్నారా? అలా అయితే, దయచేసి వెంటనే టెలి-మానస్ (Tele-MANAS) హెల్ప్‌లైన్ 14416 కి కాల్ చేయండి.\n\nదయచేసి ఒంటరిగా ఉండకండి, మీకు సహాయం చేయడానికి మేము ఇక్కడ ఉన్నాము.`,
        urgency: 'HIGH',
        suggestedActions: ['తీవ్ర లక్షణాలుంటే 108 కి కాల్ చేయండి', 'టెలి-మానస్ 14416 కి కాల్ చేయండి', 'కుటుంబ సభ్యుడిని సంప్రదించండి']
      };
    }
    if (isHi) {
      return {
        reply: `मुझे बहुत चिंता है कि आप इस समय इतना भयानक महसूस कर रहे हैं। आपकी सुरक्षा और सही सहायता के लिए, कृपया स्पष्ट करें कि आप क्या अनुभव कर रहे हैं:\n\n1. गंभीर शारीरिक आपात स्थिति: क्या आपको इस समय सीने में तेज दर्द, सांस लेने में अत्यधिक कठिनाई या बेहोशी जैसे शारीरिक लक्षण हैं? यदि हाँ, तो तुरंत आपातकालीन चिकित्सा सहायता (108 / 112) लें।\n2. अत्यधिक मानसिक घबराहट या भय: क्या आप अत्यधिक भय, पैनिक या भावनात्मक रूप से टूटन महसूस कर रहे हैं? यदि हाँ, तो किसी शांत स्थान पर बैठें और अपने किसी करीबी या डॉक्टर से बात करें।\n3. संकट या जीवन समाप्त करने के विचार: क्या आपके मन में आत्महत्या या खुद को चोट पहुँचाने के विचार आ रहे हैं? यदि हाँ, तो कृपया तुरंत टेली-मानस हेल्पलाइन 14416 पर कॉल करें।\n\nकृपया अकेले न रहें, मदद तुरंत उपलब्ध है।`,
        urgency: 'HIGH',
        suggestedActions: ['आपातकालीन 108 पर कॉल करें', 'हेल्पलाइन 14416 पर कॉल करें', 'भरोसेमंद व्यक्ति से बात करें']
      };
    }
    return {
      reply: `I hear how frightening and overwhelming this feels right now, and your safety is the highest priority. When you say you feel like you're dying, could you help me understand what is happening:\n\n1. Acute Physical Emergency: Are you experiencing severe physical symptoms right now (such as crushing chest pain, extreme breathlessness, severe bleeding, or collapse)? If so, please call emergency medical services (108 / 112 in India, 911 in the US, or 999 in the UK) immediately.\n2. Severe Emotional Distress or Panic: Are you experiencing intense emotional panic, dread, or feeling overwhelmed? If so, please sit in a safe, comfortable place, take slow breaths, and reach out to someone you trust or your healthcare provider.\n3. Crisis or Thoughts of Self-Harm: Are you feeling despair and having thoughts of ending your life or hurting yourself? If so, please call the Tele-MANAS mental health helpline at 14416 (or 1800-891-4416 in India, or 988 in the US/Canada) right now.\n\nPlease do not remain alone. Help is available immediately.`,
      urgency: 'HIGH',
      suggestedActions: ['Seek urgent emergency care if physical (108 / 112)', 'Call Crisis Helpline if in despair (14416 / 988)', 'Reach out to someone you trust']
    };
  }

  // =========================================================================
  // 3. ACUTE EMERGENCY SYMPTOMS
  // =========================================================================
  if (intent === INTENTS.EMERGENCY_SYMPTOM) {
    if (isTe) {
      return {
        reply: `ఇది అత్యవసర వైద్య పరిస్థితికి సంకేతం కావచ్చు. ఛాతీలో బిగుతుగా ఉండటం, నొప్పి లేదా శ్వాస తీసుకోవడంలో తీవ్రమైన ఇబ్బందిని నిర్లక్ష్యం చేయకూడదు.\n\nదయచేసి వెంటనే స్థానిక అత్యవసర సేవలను (108 లేదా 112 అంబులెన్స్) సంప్రదించండి లేదా సమీపంలోని అత్యవసర ఆసుపత్రికి వెళ్లండి. ఒంటరిగా నడవడానికి ప్రయత్నించకండి మరియు వెంటనే ఒకరి సహాయం తీసుకోండి.`,
        urgency: 'CRITICAL',
        suggestedActions: ['108 అంబులెన్స్‌కు కాల్ చేయండి', 'అత్యవసర 112 కి కాల్ చేయండి', 'సహాయం కోసం ఎవరినైనా పిలవండి']
      };
    }
    if (isHi) {
      return {
        reply: `यह एक गंभीर और आपातकालीन चिकित्सा स्थिति का संकेत हो सकता है। सीने में भारीपन, दर्द या सांस लेने में गंभीर कठिनाई को कभी भी अनदेखा नहीं करना चाहिए।\n\nकृपया तुरंत स्थानीय आपातकालीन सेवाओं (108 या 112 एम्बुलेंस) को कॉल करें या तुरंत नजदीकी अस्पताल के इमरजेंसी विभाग में जाएं। अकेले चलने की कोशिश न करें और तुरंत किसी की मदद लें।`,
        urgency: 'CRITICAL',
        suggestedActions: ['108 एम्बुलेंस को कॉल करें', 'आपातकालीन 112 पर कॉल करें', 'तुरंत सहायता मांगें']
      };
    }
    return {
      reply: `This could require urgent medical attention. Symptoms such as severe chest discomfort, tightness, or difficulty breathing can be signs of an acute medical condition that needs prompt professional evaluation.\n\nPlease contact your local emergency service (such as 108 or 112 in India, 911 in the US, or 999 in the UK) or seek immediate emergency medical care. Do not wait or attempt to drive yourself.`,
      urgency: 'CRITICAL',
      suggestedActions: ['Call Emergency Services (108 / 112)', 'Seek immediate emergency medical care', 'Notify a trusted person nearby']
    };
  }

  // =========================================================================
  // 4. FALL INCIDENT
  // =========================================================================
  if (intent === INTENTS.FALL_INCIDENT) {
    const hitHead = intentData.hitHead;
    if (hitHead) {
      return {
        reply: `Falling and hitting your head requires immediate medical evaluation. Head impacts can lead to complications that may not be immediately visible.\n\nPlease remain still and do not attempt to stand if you feel dizzy or in pain. Contact local emergency services (108 / 112) or have someone nearby help you get emergency care right away.`,
        urgency: 'CRITICAL',
        suggestedActions: ['Call Emergency Services (108 / 112)', 'Remain still and call for help']
      };
    }
    return {
      reply: `I'm sorry you had a fall. Please do not rush to get up. Take a moment to check yourself for pain, swelling, or difficulty moving your limbs.\n\nIf you feel pain in your hip, back, or joints, or if you hit your head, please call for help immediately rather than trying to stand unassisted. If you are hurt, contact local emergency medical services.`,
      urgency: 'HIGH',
      suggestedActions: ['Rest and check for injuries', 'Call for assistance', 'Seek medical evaluation if hurt']
    };
  }

  // =========================================================================
  // 5. ABNORMAL WEARABLE SIGNAL
  // =========================================================================
  if (intent === INTENTS.ABNORMAL_WEARABLE_SIGNAL) {
    return {
      reply: `An abnormal wearable signal or alert indicates that your monitoring sensor detected an irregular physiological reading. If you are experiencing symptoms such as lightheadedness, chest fluttering, tightness, or shortness of breath, please sit down safely and seek medical evaluation right away. If you feel fine, re-check the sensor placement and take a quiet resting reading.`,
      urgency: 'HIGH',
      suggestedActions: ['Take resting vital reading', 'Check sensor fit', 'Seek medical care if symptomatic']
    };
  }

  // =========================================================================
  // 6. WEARABLE & VITALS INQUIRY
  // =========================================================================
  if (intent === INTENTS.WEARABLE_VITALS_QUESTION) {
    // Specific check if inquiry was about Blood Pressure
    if (intentData.metric === 'bloodPressure') {
      if (isTe) {
        return {
          reply: `మీ IRIS కేర్ రికార్డులలో ధృవీకరించబడిన రక్తపోటు (BP) రీడింగ్ ఏదీ నమోదు కాలేదు. స్మార్ట్‌వాచ్‌లు సాధారణంగా వైద్యపరమైన రక్తపోటును కొలవలేవు. ఖచ్చితమైన రీడింగ్ కోసం, దయచేసి ప్రామాణికమైన బ్లడ్ ప్రెజర్ మానిటర్‌ను ఉపయోగించండి లేదా మీ వైద్యుని వద్ద తనిఖీ చేయించుకోండి.`,
          urgency: 'LOW',
          suggestedActions: ['బీపీ కఫ్‌తో తనిఖీ చేయండి', 'వైద్యుని సంప్రదించండి']
        };
      }
      if (isHi) {
        return {
          reply: `आपके IRIS केयर रिकॉर्ड में कोई सत्यापित ब्लड प्रेशर (BP) रीडिंग उपलब्ध नहीं है। स्मार्टवॉच आमतौर पर नैदानिक ब्लड प्रेशर नहीं मापते हैं। सटीक माप के लिए कृपया ऊपरी बांह वाले बीपी मॉनिटर का उपयोग करें या अपने डॉक्टर से जांच करवाएं।`,
          urgency: 'LOW',
          suggestedActions: ['बीपी कफ से जांचें', 'डॉक्टर से परामर्श लें']
        };
      }
      return {
        reply: `I don't have a verified blood pressure reading recorded in your IRIS care records. Smartwatches and continuous wearable sensors do not measure diagnostic blood pressure. For an accurate reading, please use a calibrated upper-arm blood pressure cuff or consult your healthcare provider.`,
        urgency: 'LOW',
        suggestedActions: ['Check blood pressure with cuff', 'Consult primary care doctor']
      };
    }

    const vitals = relevant.vitals;

    if (vitals && relevant.hasRecentVitals) {
      return {
        reply: `Your smartwatch recorded a heart rate of ${vitals.heartRate} BPM and ${vitals.spo2}% SpO2 at ${vitals.formattedTime} (${vitals.ageMinutes} minutes ago). These readings are current and verified.`,
        urgency: 'LOW',
        suggestedActions: ['View vitals history', 'Continue routine monitoring']
      };
    }

    if (vitals && !relevant.hasRecentVitals) {
      return {
        reply: `I don't have a current verified vital reading available right now. The last recorded reading from your smartwatch was at ${vitals.formattedTime} (${vitals.heartRate} BPM), which is from earlier and not considered current.`,
        urgency: 'LOW',
        suggestedActions: ['Check smartwatch connection', 'Take a resting vital reading']
      };
    }

    return {
      reply: `I don't have a current verified vital reading available right now. Please verify that your smartwatch or monitoring sensor is powered on and connected to IRIS.`,
      urgency: 'LOW',
      suggestedActions: ['Check smartwatch connection', 'Take a resting vital reading']
    };
  }

  // =========================================================================
  // 7. MEDICATION INQUIRIES
  // =========================================================================
  if (intent === INTENTS.MEDICATION_QUESTION) {
    const meds = relevant.medicines || [];

    if (meds.length > 0) {
      const medList = meds.map(m => `• ${m.name} (${m.dosage}) - ${m.time} (${m.instructions || m.frequency})`).join('\n');
      return {
        reply: `Here are your authorized medication schedules recorded in IRIS:\n\n${medList}\n\nIf you missed a morning dose, general guidance is never to take a double dose to compensate. If it is close to the scheduled time, take it with water; otherwise, consult your doctor or pharmacist.`,
        urgency: 'LOW',
        suggestedActions: ['View medication schedule', 'Consult pharmacist or doctor']
      };
    }

    return {
      reply: `I don't have any active medications recorded in your authorized IRIS profile. If you missed a dose of your regular medicine, general clinical guidance advises never to double up doses to make up for a missed one. Please check your prescription label or consult your pharmacist or doctor for guidance.`,
      urgency: 'LOW',
      suggestedActions: ['Check prescription label', 'Consult doctor or pharmacist']
    };
  }

  // =========================================================================
  // 8. APPOINTMENT INQUIRIES
  // =========================================================================
  if (intent === INTENTS.APPOINTMENT_QUESTION) {
    const appts = relevant.appointments || [];

    if (appts.length > 0) {
      const first = appts[0];
      return {
        reply: `Your next upcoming appointment is with ${first.doctor} (${first.specialty}) scheduled for ${first.date} at ${first.time}${first.location ? ` at ${first.location}` : ''}. Notes: ${first.notes || 'Routine consultation'}.`,
        urgency: 'LOW',
        suggestedActions: ['View upcoming appointments']
      };
    }

    return {
      reply: `I don't have any upcoming appointments scheduled in your authorized IRIS care records. If you believe you have a visit scheduled, please check directly with your healthcare provider's clinic.`,
      urgency: 'LOW',
      suggestedActions: ['Schedule an appointment']
    };
  }

  // =========================================================================
  // 9. CAREGIVER INQUIRY
  // =========================================================================
  if (intent === INTENTS.CAREGIVER_REQUEST) {
    const caregiver = relevant.caregiver;

    if (caregiver && caregiver.name) {
      return {
        reply: `Your authorized caregiver on record is ${caregiver.name} (${caregiver.relation}). You can contact them at ${caregiver.phone}.`,
        urgency: 'LOW',
        suggestedActions: [`Call ${caregiver.name}`]
      };
    }

    return {
      reply: `I don't currently have an authorized caregiver or emergency contact listed in your IRIS care network. You can add a trusted caregiver or family member in your profile settings, or reach out to local eldercare support.`,
      urgency: 'LOW',
      suggestedActions: ['Add emergency contact', 'Explore care options']
    };
  }

  // =========================================================================
  // 10. MENTAL & EMOTIONAL DISTRESS
  // =========================================================================
  if (intent === INTENTS.MENTAL_EMOTIONAL_DISTRESS) {
    if (isTe) {
      return {
        reply: `మీరు ఒంటరిగా లేదా ఆందోళనగా భావిస్తున్నారని నేను అర్థం చేసుకోగలను. ఇది చాలా సహజమైన భావన, కానీ మీరు ఒంటరిగా ఉండవలసిన అవసరం లేదు.\n\nమీ కుటుంబ సభ్యులతో లేదా స్నేహితులతో కాసేపు మాట్లాడటం మీకు సాంత్వన చేకూరుస్తుంది. మీరు కావాలనుకుంటే మీ ఆలోచనలను నాతో కూడా పంచుకోవచ్చు.`,
        urgency: 'MODERATE',
        suggestedActions: ['కుటుంబ సభ్యుడిని సంప్రదించండి', 'స్నేహితుడితో మాట్లాడండి']
      };
    }
    if (isHi) {
      return {
        reply: `मैं समझ सकता हूँ कि अकेलापन या घबराहट महसूस होना कितना कठिन हो सकता है। कृपया ध्यान रखें कि आपकी भावनाएं महत्वपूर्ण हैं और आप अकेले नहीं हैं।\n\nअपने किसी करीबी दोस्त, परिवार के सदस्य या भरोसेमंद व्यक्ति से बात करने से बहुत राहत मिल सकती है। मैं भी यहाँ आपकी सहायता के लिए हमेशा उपस्थित हूँ।`,
        urgency: 'MODERATE',
        suggestedActions: ['परिवार से बात करें', 'किसी मित्र से संपर्क करें']
      };
    }
    return {
      reply: `I'm sorry you are feeling this way right now. Feelings of loneliness, anxiety, or emotional exhaustion can be very heavy, but please know that you are valued and not alone.\n\nReaching out to a loved one, trusted neighbor, or friend can bring comfort. If your distress feels persistent, speaking with a supportive counselor or your healthcare provider can provide meaningful guidance.`,
      urgency: 'MODERATE',
      suggestedActions: ['Talk to someone you trust', 'Reach out to a family member']
    };
  }

  // =========================================================================
  // 11. GENERAL HEALTH QUESTION (Educational)
  // =========================================================================
  if (intent === INTENTS.GENERAL_HEALTH_QUESTION) {
    return {
      reply: `In general, conditions such as hypertension, diabetes, or joint inflammation develop from a combination of cardiovascular regulation, metabolic factors, and lifestyle elements. Managing them typically involves consistent medical follow-ups, appropriate nutrition, gentle physical activity, and prescribed therapies. Because individual health profiles differ, it is best to discuss specific diagnosis and management goals with your healthcare provider.`,
      urgency: 'LOW',
      suggestedActions: ['Consult primary care physician', 'Review health lifestyle guidance']
    };
  }

  // =========================================================================
  // 12. GENERAL HEALTH SYMPTOM (e.g. Dizziness, Knee pain)
  // =========================================================================
  if (intent === INTENTS.GENERAL_HEALTH_SYMPTOM) {
    if (intentData.isDizzy) {
      if (isTe) {
        return {
          reply: `తల తిరుగుతున్నట్లు అనిపిస్తే, పడిపోకుండా నివారించడానికి దయచేసి వెంటనే సురక్షితంగా కూర్చోండి లేదా పడుకోండి. ఒక గ్లాసు నీరు త్రాగండి మరియు నెమ్మదిగా శ్వాస తీసుకోండి.\n\nతలతిరుగుడుతో పాటు ఛాతీ నొప్పి, శ్వాస తీసుకోవడంలో ఇబ్బంది లేదా శరీరంలో ఒక వైపు బలహీనత ఉంటే వెంటనే అత్యవసర వైద్య సహాయం (108/112) పొందండి.`,
          urgency: 'MODERATE',
          suggestedActions: ['వెంటనే కూర్చోండి లేదా పడుకోండి', 'నీరు త్రాగండి', 'వైద్యుని సంప్రదించండి']
        };
      }
      if (isHi) {
        return {
          reply: `यदि आपको चक्कर आ रहे हैं या सिर घूम रहा है, तो गिरने से बचने के लिए कृपया तुरंत सुरक्षित रूप से बैठ जाएं या लेट जाएं। एक गिलास पानी पिएं और गहरी सांसें लें।\n\nयदि चक्कर आने के साथ सीने में दर्द, सांस लेने में तकलीफ या बोलने में कठिनाई हो, तो तुरंत आपातकालीन चिकित्सा सहायता लें।`,
          urgency: 'MODERATE',
          suggestedActions: ['तुरंत बैठ जाएं या लेटें', 'पानी पिएं', 'डॉक्टर से परामर्श लें']
        };
      }
      return {
        reply: `If you feel dizzy or lightheaded, please sit or lie down immediately to prevent falls. Drink a glass of water and breathe slowly and evenly.\n\nDizziness upon standing can be related to temporary blood pressure changes (orthostatic hypotension), dehydration, or inner ear balance. However, if your dizziness is sudden and accompanied by chest tightness, shortness of breath, speech difficulty, or weakness on one side, seek emergency medical care immediately.`,
        urgency: 'MODERATE',
        suggestedActions: ['Sit or lie down safely', 'Drink water and rest', 'Consult your doctor if symptoms persist']
      };
    }

    return {
      reply: `Thank you for sharing your symptom. Mild or routine discomfort can occur from strain, joint changes, or mild fatigue. It is best to rest the affected area, stay hydrated, and monitor how you feel.\n\nIf the symptom worsens, causes severe pain, is accompanied by fever or swelling, or interferes with your daily routine, please schedule an evaluation with your primary care physician.`,
      urgency: 'LOW',
      suggestedActions: ['Rest and monitor symptoms', 'Consult primary care doctor']
    };
  }

  // =========================================================================
  // 13. GENERAL WELLNESS
  // =========================================================================
  if (intent === INTENTS.GENERAL_WELLNESS) {
    return {
      reply: `Maintaining daily wellness habits such as drinking adequate water, eating balanced meals, engaging in gentle walking, and getting restful sleep plays a significant role in everyday vitality. If you have specific medical conditions, always align your wellness routine with your doctor's recommendations.`,
      urgency: 'LOW',
      suggestedActions: ['Stay hydrated', 'Maintain gentle routine']
    };
  }

  // =========================================================================
  // 14. DEFAULT / UNCLEAR / GREETING
  // =========================================================================
  const nameGreeting = context.userName ? `Hello ${context.userName}. ` : 'Hello. ';
  return {
    reply: `${nameGreeting}I am your IRIS Care Assistant. I am here to help you navigate your health questions, explain medical terminology, check verified care records, or provide safe wellness guidance. Please let me know what you would like assistance with.`,
    urgency: 'LOW',
    suggestedActions: ['Ask a health question', 'Check appointments or medicines']
  };
}

/**
 * Validates Gemini generated candidate text against hallucinated names, vitals, or clinical safety rules.
 * Returns true if safe, false if hallucination/safety violation detected.
 */
function validateGroundingSafety(candidateText, context) {
  if (!candidateText || typeof candidateText !== 'string') return false;

  const lower = candidateText.toLowerCase();

  // 1. Check for fabricated vitals (BPM, SpO2, blood pressure, etc.)
  const vitalsMentioned = /\b(\d{2,3}\s*(bpm|beats per min|beats\/min)|spo2|oxygen level|\d{2,3}\/\d{2,3}\s*mmhg)\b/i.test(lower) ||
    lower.includes('vital readings currently show') ||
    lower.includes('resting heart rate of') ||
    lower.includes('vitals currently show') ||
    /\b(heart rate|pulse|spo2)\s+(is|shows?|measures?)\s+\d{2,3}\b/i.test(lower);

  if (vitalsMentioned) {
    const verifiedVitals = context?.relevantData?.vitals;
    if (!verifiedVitals || !context.relevantData.hasRecentVitals) {
      console.warn('[IRIS AI Safety] Fabricated or stale vitals detected in candidate response. Rejecting.');
      return false;
    }
  }

  // 2. Check for unauthorized doctor names (both demo doctors and arbitrary invented doctors)
  const demoDoctorNames = ['ananya rao', 'dr. ananya rao', 'k. srinivas', 'dr. k. srinivas'];
  for (const docName of demoDoctorNames) {
    if (lower.includes(docName)) {
      const authorizedDocs = (context?.relevantData?.appointments || []).map(a => (a.doctor || '').toLowerCase());
      const isAuthorized = authorizedDocs.some(d => d.includes(docName));
      if (!isAuthorized) {
        console.warn(`[IRIS AI Safety] Unauthorized demo doctor "${docName}" detected in candidate response. Rejecting.`);
        return false;
      }
    }
  }

  // Reject any specific named physician/doctor (e.g. "Dr. Sharma", "Doctor Patel") if not authorized
  const namedDoctorPattern = /\b(?:Dr\.?|Doctor)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/g;
  let docMatch;
  while ((docMatch = namedDoctorPattern.exec(candidateText)) !== null) {
    const candidateDocName = docMatch[1].toLowerCase();
    // Exclude generic non-names
    if (['who', 'assistant', 'specialist', 'oncall', 'duty', 'appointment', 'visit'].includes(candidateDocName)) continue;
    const authorizedDocs = (context?.relevantData?.appointments || []).map(a => (a.doctor || '').toLowerCase());
    const isAuthorized = authorizedDocs.some(d => d.includes(candidateDocName));
    if (!isAuthorized) {
      console.warn(`[IRIS AI Safety] Unauthorized named doctor "${docMatch[0]}" detected in candidate response. Rejecting.`);
      return false;
    }
  }

  // 3. Check for unauthorized caregiver names (both demo caregivers and arbitrary invented caregivers)
  const demoCaregiverNames = ['ravi kumar', 'priya sharma'];
  for (const demoName of demoCaregiverNames) {
    if (lower.includes(demoName)) {
      const authorizedCaregiver = (context?.relevantData?.caregiver?.name || '').toLowerCase();
      const isAuthorized = authorizedCaregiver.includes(demoName) && context.isDemoMode;
      if (!isAuthorized) {
        console.warn(`[IRIS AI Safety] Unauthorized demo caregiver "${demoName}" detected in candidate response. Rejecting.`);
        return false;
      }
    }
  }

  // Check if response mentions a specific named caretaker or caregiver when none or different is authorized
  const namedCaregiverPattern = /\b(?:caretaker|caregiver)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/gi;
  let careMatch;
  while ((careMatch = namedCaregiverPattern.exec(candidateText)) !== null) {
    const candidateCareName = careMatch[1].toLowerCase();
    if (['who', 'assistant', 'support', 'help'].includes(candidateCareName)) continue;
    const authorizedCaregiver = (context?.relevantData?.caregiver?.name || '').toLowerCase();
    if (!authorizedCaregiver || !authorizedCaregiver.includes(candidateCareName)) {
      console.warn(`[IRIS AI Safety] Unauthorized caregiver "${careMatch[0]}" detected in candidate response. Rejecting.`);
      return false;
    }
  }

  // 4. Check for life expectancy / prognosis predictions or terminal stage claims
  const lifeExpectancyPattern = /\b(you have (only )?\d+ (months|weeks|days|years)|life expectancy (is|of) \d+|you will die (in|within) \d+|terminal stage|only \d+ months left|you are in stage (4|iv|iii|ii|i)|you are dying)\b/i;
  if (lifeExpectancyPattern.test(lower)) {
    console.warn('[IRIS AI Safety] Prognosis/life expectancy prediction detected in candidate response. Rejecting.');
    return false;
  }

  // 5. Check for "rest and observe" on emergency symptoms or acute crisis
  if (
    context?.intentResult?.intent === INTENTS.EMERGENCY_SYMPTOM || 
    context?.intentResult?.intent === INTENTS.SELF_HARM ||
    context?.intentResult?.intent === INTENTS.AMBIGUOUS_DYING_DISTRESS
  ) {
    if (lower.includes('rest and observe') || lower.includes('wait and see') || lower.includes('take some rest')) {
      console.warn('[IRIS AI Safety] Dangerous "rest and observe" detected for emergency intent. Rejecting.');
      return false;
    }
  }

  return true;
}

/**
 * Main AI Chat Pipeline
 * Resolves context -> Classifies intent -> Calls Gemini (with safety checks) or Grounded Clinical Engine.
 * 
 * @param {string} userMessage 
 * @param {string} language 
 * @param {object} options 
 * @param {object} [options.user] Authenticated MongoDB User document
 * @param {boolean} [options.isDemoMode] Demo mode flag
 * @param {string} [options.seniorId] Frontend requested seniorId
 * @returns {Promise<{ reply: string, urgency: string, suggestedActions: string[] }>}
 */
async function getChatResponse(userMessage, language = 'en', options = {}) {
  const sanitizedMessage = String(userMessage || '').slice(0, 500).trim();
  const lang = language || 'en';

  // 1. Classify intent and safety
  const intentResult = classifyIntent(sanitizedMessage, lang);

  // 2. Build minimal, authorized context
  const context = await buildAuthorizedAiContext({
    user: options.user || null,
    isDemoMode: Boolean(options.isDemoMode),
    requestedSeniorId: options.seniorId || null,
    intentResult
  });

  context.intentResult = intentResult;

  const apiKey = process.env.GEMINI_API_KEY;

  // If GEMINI_API_KEY is not configured or in test environment without key,
  // rely on the grounded clinical rule engine immediately.
  if (!apiKey || apiKey.trim() === '' || apiKey.includes('YOUR_')) {
    return generateGroundedClinicalResponse(sanitizedMessage, lang, context, intentResult);
  }

  // 3. Attempt Gemini API with strict context injection
  try {
    const contextPromptSnippet = JSON.stringify({
      user: {
        name: context.userName,
        role: context.userRole,
        isDemoMode: context.isDemoMode,
        hasAuthorizedRecords: context.hasAuthorizedRecords
      },
      classifiedIntent: intentResult.intent,
      urgencyHint: intentResult.urgency,
      relevantVerifiedData: context.relevantData
    }, null, 2);

    const postData = JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `${SYSTEM_INSTRUCTION}

VERIFIED_CONTEXT (USE ONLY THIS DATA, NEVER INVENT ADDITIONAL DATA):
${contextPromptSnippet}

Preferred Language: ${lang}
User Message: "${sanitizedMessage}"`
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 600,
        responseMimeType: 'application/json'
      }
    });

    const optionsReq = {
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const responseText = await new Promise((resolve, reject) => {
      const req = https.request(optionsReq, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data));
      });
      req.on('error', reject);
      req.setTimeout(8000, () => {
        req.destroy();
        reject(new Error('Gemini API timeout'));
      });
      req.write(postData);
      req.end();
    });

    const parsed = JSON.parse(responseText);
    const candidateText = parsed.candidates?.[0]?.content?.parts?.[0]?.text;

    if (candidateText) {
      let parsedOutput = null;
      try {
        parsedOutput = JSON.parse(candidateText);
      } catch (_) {
        const cleanJson = candidateText.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
        parsedOutput = JSON.parse(cleanJson);
      }

      if (parsedOutput && parsedOutput.reply) {
        // Run safety & hallucination validation
        const isSafe = validateGroundingSafety(parsedOutput.reply, context);
        if (isSafe) {
          return {
            reply: parsedOutput.reply,
            urgency: parsedOutput.urgency || intentResult.urgency || 'LOW',
            suggestedActions: Array.isArray(parsedOutput.suggestedActions) ? parsedOutput.suggestedActions : []
          };
        }
      }
    }

    // If Gemini output failed validation, use grounded rule response
    console.warn('[IRIS Gemini] Output failed grounding validation. Falling back to clinical safety engine.');
    return generateGroundedClinicalResponse(sanitizedMessage, lang, context, intentResult);
  } catch (err) {
    console.warn('[IRIS Gemini] API call failed, evaluating fallback:', err.message);

    // If safety-critical intent, provide deterministic clinical safety guidance immediately
    if (intentResult.urgency === 'CRITICAL' || intentResult.intent === INTENTS.SELF_HARM || intentResult.intent === INTENTS.EMERGENCY_SYMPTOM) {
      return generateGroundedClinicalResponse(sanitizedMessage, lang, context, intentResult);
    }

    // For general health queries when Gemini is offline, return transparent connection fallback (Section 19)
    return {
      reply: "I'm having trouble connecting to the IRIS assistant right now. I can still help you access your care information, medications, appointments, or emergency support.",
      urgency: 'LOW',
      suggestedActions: ['Check appointments or medicines', 'Contact support or caregiver']
    };
  }
}

module.exports = {
  getChatResponse,
  generateGroundedClinicalResponse,
  validateGroundingSafety
};
