const https = require('https');

const SYSTEM_INSTRUCTION = `
You are IRIS Care Assistant, an empathetic, safety-first AI health companion designed specifically for senior citizens and their families.

STRICT MEDICAL & SAFETY RULES:
1. NEVER provide a medical diagnosis. Never say "You have X" or "Diagnosis confirmed".
2. ALWAYS use responsible triage language: "Possible causes may include...", "This could be related to...", "Unusual health pattern".
3. For acute or alarming symptoms (chest pain/tightness, severe shortness of breath, sudden numbness or weakness on one side, sudden vision loss, severe confusion, sudden severe headache), IMMEDIATELY advise seeking emergency medical care (ambulance / hospital) or pressing the IRIS SOS button.
4. Keep sentences calm, clear, and reassuring, suitable for an older adult.
5. Provide actionable next steps (e.g. sit down safely, drink a glass of water, check resting blood pressure, call caretaker Ravi Kumar).
6. ALWAYS end with the mandatory notice: "IRIS provides general health information and is not a substitute for professional medical advice."
7. If the user speaks or writes in Telugu, respond in Telugu. If in Hindi, respond in Hindi. If in English, respond in English.
`;

// Contextual fallback response generator when GEMINI_API_KEY is not set or network fails
function generateFallbackResponse(userMessage, language = 'en') {
  const msg = (userMessage || '').toLowerCase();

  // Telugu detection
  if (language === 'te' || /[\u0C00-\u0C7F]/.test(userMessage)) {
    if (msg.includes('తల') || msg.includes('తిరుగు') || msg.includes('కళ్ళు')) {
      return {
        reply: `మీకు తల తిరుగుతున్నట్టు ఉంటే, దయచేసి వెంటనే నిశ్శబ్దంగా కూర్చోండి లేదా పడుకోండి. ఆకస్మిక కదలికలు నివారించండి మరియు ఒక గ్లాసు మంచినీరు త్రాగండి. మీరు ఒంటరిగా ఉంటే, IRIS ద్వారా మీ సంరక్షకుడు రవి కుమార్ లేదా కుమారుడు రోహన్‌కు వెంటనే కాల్ చేయవచ్చు.

లక్షణాలు కొనసాగితే లేదా తీవ్రమైతే, వెంటనే అత్యవసర వైద్య సహాయం తీసుకోండి.

గమనిక: ఐరిస్ సాధారణ సమాచారాన్ని అందిస్తుంది మరియు ఇది వృత్తిపరమైన వైద్య నిర్ధారణ లేదా సలహాకు ప్రత్యామ్నాయం కాదు.`,
        urgency: 'MODERATE',
        suggestedActions: ['కూర్చోండి లేదా విశ్రాంతి తీసుకోండి', 'నీరు త్రాగండి', 'కేర్ టేకర్ రవి కుమార్‌ను సంప్రదించండి']
      };
    }

    return {
      reply: `నమస్కారం సావిత్రి గారూ. మీ ఆరోగ్యం మరియు భద్రత మా మొదటి ప్రాధాన్యత. మీ ప్రస్తుత పరిస్థితిని పర్యవేక్షిస్తున్నాము. దయచేసి విశ్రాంతి తీసుకోండి మరియు ఏదైనా అసౌకర్యం ఉంటే వెంటనే తెలియజేయండి.

గమనిక: ఐరిస్ సాధారణ సమాచారాన్ని అందిస్తుంది మరియు ఇది వైద్య నిర్ధారణ కాదు.`,
      urgency: 'LOW',
      suggestedActions: ['విశ్రాంతి తీసుకోండి', 'కుటుంబ సభ్యుడిని సంప్రదించండి']
    };
  }

  // Hindi detection
  if (language === 'hi' || /[\u0900-\u097F]/.test(userMessage)) {
    if (msg.includes('चक्कर') || msg.includes('सिर') || msg.includes('कमजोरी')) {
      return {
        reply: `यदि आपको चक्कर आ रहे हैं या कमजोरी महसूस हो रही है, तो कृपया तुरंत सुरक्षित रूप से बैठ जाएं या लेट जाएं। एक गिलास पानी पिएं और गहरी सांसें लें। यदि आप अकेले हैं, तो IRIS के माध्यम से अपने केयरटेकर रवि कुमार या अपने बेटे रोहन को तुरंत सूचित किया जा सकता है।

यदि चक्कर के साथ सीने में दर्द या सांस लेने में तकलीफ हो, तो तुरंत आपातकालीन सहायता लें।

सूचना: आइरिस सामान्य स्वास्थ्य जानकारी प्रदान करता है, यह चिकित्सीय सलाह या निदान का विकल्प नहीं है।`,
        urgency: 'MODERATE',
        suggestedActions: ['तुरंत बैठ जाएं', 'पानी पिएं', 'केयरटेकर को कॉल करें']
      };
    }

    return {
      reply: `नमस्ते सावित्री जी। IRIS आपकी देखभाल और सुरक्षा के लिए हमेशा उपस्थित है। कृपया अपने स्वास्थ्य का ध्यान रखें और किसी भी असुविधा पर हमें बताएं।

सूचना: आइरिस सामान्य जानकारी प्रदान करता है, यह चिकित्सीय सलाह का विकल्प नहीं है।`,
      urgency: 'LOW',
      suggestedActions: ['विश्राम करें']
    };
  }

  // English Handling
  if (msg.includes('chest') || msg.includes('heart') || msg.includes('tightness') || msg.includes('pain in arm')) {
    return {
      reply: `Chest discomfort can have several causes. Because some causes can be serious, especially if it is sudden, severe, or accompanied by difficulty breathing, cold sweating, nausea, dizziness, or pain spreading to the arm, neck, or jaw, seek urgent medical care immediately.

Please tap the red [ HELP / SOS ] button on your IRIS dashboard so caretaker Ravi Kumar and local emergency services are immediately alerted.

IRIS provides general information and is not a substitute for professional medical advice.`,
      urgency: 'CRITICAL',
      suggestedActions: ['Tap Red HELP / SOS Button', 'Call 108 Emergency Ambulance', 'Sit upright and remain still']
    };
  }

  if (msg.includes('dizzy') || msg.includes('lightheaded') || msg.includes('spinning') || msg.includes('unsteady')) {
    return {
      reply: `Dizziness upon standing or resting can arise from temporary blood pressure shifts (orthostatic hypotension), dehydration, inner-ear balance, or medication timing.

Please sit or lie down immediately to prevent falls. Drink a glass of water, breathe slowly, and do not attempt to walk unaided until the sensation subsides. If you feel unsteady, your caretaker Ravi Kumar is nearby in Madhapur and can be summoned with 1 tap.

IRIS provides general information and is not a substitute for professional medical advice.`,
      urgency: 'MODERATE',
      suggestedActions: ['Sit or lie down safely', 'Drink a glass of water', 'Notify Caretaker Ravi Kumar']
    };
  }

  if (msg.includes('medicine') || msg.includes('pill') || msg.includes('forgot') || msg.includes('missed')) {
    return {
      reply: `Missing a routine dose happens occasionally. For blood pressure medications like your Amlodipine (5 mg):
1. If it is close to your scheduled time (08:00 AM), take it with a sip of water.
2. If it is already close to your next evening dose, never double up doses to compensate.
3. Consult Dr. Ananya Rao or check with your daughter Dr. Ananya Sharma if in doubt.

IRIS provides general information and is not a substitute for professional medical advice.`,
      urgency: 'LOW',
      suggestedActions: ['Check Medicine Tab', 'Mark Taken on IRIS', 'Call Family']
    };
  }

  // Default General Health Response
  return {
    reply: `Thank you for sharing how you are feeling. Your vital readings currently show a stable resting heart rate of 72 BPM and 98% SpO2. 

If this symptom is new, persistent, or causing distress, it is always recommended to consult your physician Dr. Ananya Rao or have caretaker Ravi Kumar check your vitals in person.

IRIS provides general information and is not a substitute for professional medical advice.`,
    urgency: 'LOW',
    suggestedActions: ['Rest and observe', 'Review upcoming appointment', 'Call Caretaker']
  };
}

/**
 * Call Gemini API or fallback safely
 */
async function getChatResponse(userMessage, language = 'en', seniorId = 'S102') {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === '' || apiKey.includes('YOUR_')) {
    // Graceful, clinically guided mock fallback
    return generateFallbackResponse(userMessage, language);
  }

  try {
    // Native HTTPS request to Google Gemini API
    const postData = JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: `${SYSTEM_INSTRUCTION}\n\nSenior ID: ${seniorId}\nPreferred Language: ${language}\nSenior Query: "${userMessage}"` }]
        }
      ],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 600
      }
    });

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const responseText = await new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
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
      return {
        reply: candidateText,
        urgency: candidateText.toLowerCase().includes('emergency') || candidateText.toLowerCase().includes('urgent') ? 'CRITICAL' : 'LOW',
        suggestedActions: ['Follow medical guidance', 'Check vitals on IRIS']
      };
    }

    return generateFallbackResponse(userMessage, language);
  } catch (err) {
    console.warn('[IRIS Gemini] API call failed, falling back to clinical rule engine:', err.message);
    return generateFallbackResponse(userMessage, language);
  }
}

module.exports = { getChatResponse, generateFallbackResponse };
