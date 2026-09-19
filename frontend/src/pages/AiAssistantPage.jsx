import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { createSpeechRecognizer, isSpeechRecognitionSupported, speakText } from '../services/speech';
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  AlertTriangle,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Info,
  UserCheck,
  FlaskConical
} from 'lucide-react';

export default function AiAssistantPage() {
  const { lang, t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isDemoMode, setIsDemoMode] = useState(() => searchParams.get('demo') === 'true');

  const getInitialGreeting = (demoActive = isDemoMode) => {
    if (user?.name) {
      if (lang === 'te') return `నమస్కారం ${user.name} గారూ. నేను IRIS కేర్ అసిస్టెంట్‌ని. మీరు ఎలా అనుభవిస్తున్నారో నాకు చెప్పండి, నేను సహాయం చేయడానికి ఇక్కడ ఉన్నాను.`;
      if (lang === 'hi') return `नमस्ते ${user.name} जी। मैं IRIS केयर असिस्टेंट हूँ। कृपया बताएं कि आप कैसा महसूस कर रहे हैं।`;
      return `Hello ${user.name}. I am your IRIS Care Assistant. Tell me how you are feeling, and I will help guide you safely.`;
    }
    if (demoActive) {
      if (lang === 'te') return `నమస్కారం సావిత్రి దేవి గారూ. మీరు డెమో మోడ్ (S102) లో ఉన్నారు. మీ డెమో అపాయింట్‌మెంట్‌లు, మందులు లేదా లక్షణాల గురించి అడగవచ్చు.`;
      if (lang === 'hi') return `नमस्ते सावित्री देवी जी। आप डेमो मोड (S102) में हैं। आप अपने डेमो अपॉइंटमेंट, दवाओं या लक्षणों के बारे में पूछ सकते हैं।`;
      return `Hello Savitri Devi. You are exploring the IRIS Care Assistant in Demo Mode (S102). You can ask about your demo appointments, medicines, vitals, or symptoms.`;
    }
    if (lang === 'te') {
      return `నమస్కారం. నేను IRIS కేర్ అసిస్టెంట్‌ని. మీరు ఎలా అనుభవిస్తున్నారో నాకు చెప్పండి, నేను సహాయం చేయడానికి ఇక్కడ ఉన్నాను.`;
    }
    if (lang === 'hi') {
      return `नमस्ते। मैं IRIS केयर असिस्टेंट हूँ। कृपया बताएं कि आप कैसा महसूस कर रहे हैं।`;
    }
    return `Hello. I am your IRIS Care Assistant. Tell me how you are feeling, and I will help guide you safely.`;
  };

  const [messages, setMessages] = useState([
    {
      id: '1',
      sender: 'iris',
      text: getInitialGreeting(searchParams.get('demo') === 'true'),
      urgency: 'LOW',
      suggestedActions: ['Describe any symptom', 'Ask about medicine timing'],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const toggleDemoMode = () => {
    const nextVal = !isDemoMode;
    setIsDemoMode(nextVal);
    const newParams = new URLSearchParams(searchParams);
    if (nextVal) {
      newParams.set('demo', 'true');
    } else {
      newParams.delete('demo');
    }
    setSearchParams(newParams);
    setMessages([
      {
        id: Date.now().toString(),
        sender: 'iris',
        text: getInitialGreeting(nextVal),
        urgency: 'LOW',
        suggestedActions: nextVal ? ['What is my next appointment?', 'What is my current heart rate?'] : ['Describe any symptom', 'Ask about medicine timing'],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceFeedback, setVoiceFeedback] = useState('idle'); // 'idle' | 'listening' | 'processing' | 'responding'
  const [micError, setMicError] = useState(null);
  const [speechSupported, setSpeechSupported] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    setSpeechSupported(isSpeechRecognitionSupported());
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleActionClick = (action) => {
    if (!action) return;
    const lower = action.toLowerCase();

    // Emergency numbers (108 / 112 / ambulance)
    if (
      lower.includes('emergency') || 
      lower.includes('108') || 
      lower.includes('112') || 
      lower.includes('urgent') || 
      lower.includes('అత్యవసర') || 
      lower.includes('ఆపాతకాలీన')
    ) {
      try {
        window.location.href = 'tel:112';
      } catch (_) {}
      return;
    }

    // Crisis helplines (14416 / 988 / tele-manas)
    if (
      lower.includes('helpline') || 
      lower.includes('14416') || 
      lower.includes('988') || 
      lower.includes('tele-manas') || 
      lower.includes('టెలి-మానస్') || 
      lower.includes('मानस')
    ) {
      try {
        window.location.href = 'tel:14416';
      } catch (_) {}
      return;
    }

    // Medication management
    if (
      lower.includes('medication') || 
      lower.includes('medicine') || 
      lower.includes('మందు') || 
      lower.includes('మాత్ర') || 
      lower.includes('दवा')
    ) {
      navigate('/medicines');
      return;
    }

    // Appointments
    if (
      lower.includes('appointment') || 
      lower.includes('అపాయింట్‌మెంట్') || 
      lower.includes('अपॉइंटमेंट')
    ) {
      navigate('/appointments');
      return;
    }

    // Care network / Community
    if (
      lower.includes('caregiver') || 
      lower.includes('caretaker') || 
      lower.includes('కేర్‌టేకర్‌') || 
      lower.includes('కేర్‌గివర్') || 
      lower.includes('केयरटेकर')
    ) {
      navigate('/community');
      return;
    }

    // Otherwise send as interactive prompt inquiry (e.g. "Prepare questions for doctor")
    handleSend(action);
  };

  const handleSend = async (messageText = inputMessage) => {
    const textToSend = messageText.trim();
    if (!textToSend || loading) return;

    const userMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);
    setVoiceFeedback('processing');

    try {
      const res = await axios.post('/api/ai/chat', {
        message: textToSend,
        language: lang,
        seniorId: isDemoMode ? 'S102' : (user?.seniorId || null),
        isDemo: Boolean(!user && isDemoMode)
      });

      const data = res.data?.data || {};
      const irisMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'iris',
        text: data.reply || 'I am here with you. Please let me know what you need guidance with.',
        urgency: data.urgency || 'LOW',
        suggestedActions: Array.isArray(data.suggestedActions) ? data.suggestedActions : [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, irisMsg]);

      // Speak out reply gently with visual state
      setVoiceFeedback('responding');
      speakText(irisMsg.text, lang);
      setTimeout(() => setVoiceFeedback('idle'), 4000);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'iris',
          text: 'Unable to reach IRIS Care Assistant right now. If this is an emergency, please contact local emergency services (108 / 112) or seek immediate medical care.',
          urgency: 'MODERATE',
          suggestedActions: ['Call Emergency Services (108 / 112)'],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setVoiceFeedback('idle');
    } finally {
      setLoading(false);
    }
  };

  const toggleListening = () => {
    setMicError(null);
    if (isListening) {
      setIsListening(false);
      setVoiceFeedback('idle');
      return;
    }

    if (!isSpeechRecognitionSupported()) {
      setMicError(t('micUnavailable'));
      return;
    }

    const recognizer = createSpeechRecognizer(
      lang,
      (transcript) => {
        setIsListening(false);
        setVoiceFeedback('processing');
        setInputMessage(transcript);
        handleSend(transcript);
      },
      (err) => {
        console.warn('Speech error:', err);
        setIsListening(false);
        setVoiceFeedback('idle');
        if (err === 'not-allowed' || err?.includes?.('denied')) {
          setMicError(t('micDenied'));
        } else if (err !== 'no-speech') {
          setMicError(t('micUnavailable'));
        }
      },
      () => {
        setIsListening(false);
      }
    );

    if (recognizer) {
      try {
        setIsListening(true);
        setVoiceFeedback('listening');
        recognizer.start();
      } catch (e) {
        setIsListening(false);
        setVoiceFeedback('idle');
        setMicError(t('micUnavailable'));
      }
    }
  };

  const samplePrompts = {
    en: [
      'My chest feels uncomfortable and tight.',
      'I feel dizzy when I stand up from bed.',
      'I forgot to take my morning medicine.',
      'What is my next appointment?'
    ],
    te: [
      'నాకు తల తిరుగుతున్నట్టు ఉంది.',
      'నా ఛాతీలో అసౌకర్యంగా ఉంది.',
      'నేను ఉదయం రక్తపోటు మాత్ర వేసుకోవడం మర్చిపోయాను.'
    ],
    hi: [
      'मुझे चक्कर आ रहे हैं और कमजोरी लग रही है।',
      'मेरी छाती में भारीपन लग रहा है।',
      'मैं सुबह की दवा लेना भूल गई।'
    ]
  };

  const activePrompts = samplePrompts[lang] || samplePrompts.en;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 h-[calc(100vh-5rem)] flex flex-col">
      {/* Header */}
      <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-xs mb-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-charcoal-900 flex items-center gap-2">
              IRIS Care Assistant
              <span className="text-[10px] font-semibold uppercase bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded-full">
                AI Health Guide
              </span>
            </h1>
            <p className="text-xs text-stone-500">
              Empathetic symptom assessment with clinical safety rules • English, తెలుగు, हिन्दी
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>Verified: {user.name}</span>
            </div>
          ) : isDemoMode ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
                <FlaskConical className="w-4 h-4 text-amber-600" />
                <span>Demo Mode (S102 - Savitri Devi)</span>
              </div>
              <button
                onClick={toggleDemoMode}
                className="text-xs text-stone-500 hover:text-stone-800 underline font-medium cursor-pointer"
              >
                Exit Demo
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 bg-stone-50 px-3 py-1.5 rounded-xl border border-stone-200">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                <span>Guest Mode</span>
              </div>
              <button
                onClick={toggleDemoMode}
                className="text-xs bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-lg font-medium cursor-pointer transition"
              >
                Try Demo Mode (S102)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 bg-white rounded-3xl p-6 border border-stone-200 shadow-xs overflow-y-auto space-y-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'} animate-in fade-in`}
          >
            <div className="flex items-center gap-2 mb-1 text-[11px] text-stone-400">
              <span className="font-semibold">{m.sender === 'user' ? (user?.name || 'You') : 'IRIS Assistant'}</span>
              <span>•</span>
              <span className="font-mono">{m.timestamp}</span>
            </div>

            <div
              className={`max-w-2xl p-4 rounded-3xl text-sm leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-charcoal-900 text-white rounded-br-none shadow-xs'
                  : 'bg-stone-50 border border-stone-200/80 text-charcoal-900 rounded-bl-none shadow-xs'
              }`}
            >
              {/* Urgency Badge if Assistant */}
              {m.sender === 'iris' && m.urgency && m.urgency !== 'LOW' && (
                <div className="mb-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                      m.urgency === 'CRITICAL'
                        ? 'bg-rose-600 text-white animate-pulse'
                        : 'bg-amber-100 text-amber-900 border border-amber-300'
                    }`}
                  >
                    <AlertTriangle className="w-3 h-3" />
                    {m.urgency} URGENCY NOTICED
                  </span>
                </div>
              )}

              <p className="whitespace-pre-line text-sm">{m.text}</p>

              {/* Contextual Action Suggestions */}
              {m.suggestedActions && m.suggestedActions.length > 0 && (
                <div className="mt-3 pt-3 border-t border-stone-200/60 flex flex-wrap gap-1.5">
                  {m.suggestedActions.map((action, i) => (
                    <button
                      key={i}
                      onClick={() => handleActionClick(action)}
                      className="inline-flex items-center gap-1 text-[11px] font-medium bg-white hover:bg-teal-50 hover:border-teal-300 px-2.5 py-1 rounded-full border border-stone-200 text-stone-700 hover:text-teal-900 transition shadow-2xs cursor-pointer"
                    >
                      <CheckCircle2 className="w-3 h-3 text-teal-600" />
                      {action}
                    </button>
                  ))}
                </div>
              )}

              {/* Read Aloud Button */}
              {m.sender === 'iris' && (
                <button
                  onClick={() => speakText(m.text, lang)}
                  className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 hover:text-teal-900 transition"
                  title="Read Aloud"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  Listen
                </button>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-stone-500 max-w-xs animate-pulse">
            <RefreshCw className="w-4 h-4 animate-spin text-teal-600" />
            <span>IRIS Care Assistant is evaluating safely...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Sample Quick Questions */}
      <div className="py-2 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
        <span className="text-[11px] uppercase font-bold text-stone-400 shrink-0">Try asking:</span>
        {activePrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(prompt)}
            className="px-3 py-1.5 rounded-full bg-white border border-stone-200 hover:border-teal-300 hover:bg-teal-50 text-stone-700 hover:text-teal-900 text-xs font-medium shrink-0 transition shadow-2xs"
          >
            "{prompt}"
          </button>
        ))}
      </div>

      {/* Voice Status & Error Feedback Banners */}
      {micError && (
        <div className="mb-2 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{micError}</span>
          </div>
          <button onClick={() => setMicError(null)} className="text-xs font-bold text-rose-600 hover:text-rose-800 px-2 py-0.5">×</button>
        </div>
      )}

      {voiceFeedback === 'listening' && (
        <div className="mb-2 p-2.5 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900 text-xs font-semibold flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-600 animate-ping"></span>
            <span>{t('listening')}</span>
          </div>
          <button onClick={() => toggleListening()} className="text-[11px] underline text-teal-800 font-bold">Stop</button>
        </div>
      )}

      {voiceFeedback === 'processing' && (
        <div className="mb-2 p-2.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <RefreshCw className="w-4 h-4 animate-spin text-amber-600" />
          <span>{t('processing')}</span>
        </div>
      )}

      {voiceFeedback === 'responding' && (
        <div className="mb-2 p-2.5 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <Volume2 className="w-4 h-4 text-teal-600 animate-pulse" />
          <span>{t('irisResponding')}</span>
        </div>
      )}

      {/* Input Bar */}
      <div className="bg-white rounded-3xl p-3 border border-stone-200 shadow-sm shrink-0">
        <div className="flex items-center gap-2">
          {/* Voice Input Microphone */}
          <button
            onClick={toggleListening}
            className={`p-3 rounded-2xl transition shadow-xs ${
              isListening
                ? 'bg-rose-600 text-white animate-pulse'
                : 'bg-teal-50 text-teal-700 hover:bg-teal-100'
            }`}
            title={isListening ? 'Stop listening' : 'Speak using microphone'}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={
              lang === 'te'
                ? 'మీరు ఎలా అనుభవిస్తున్నారో ఇక్కడ టైప్ చేయండి లేదా మాట్లాడండి...'
                : lang === 'hi'
                ? 'आप कैसा महसूस कर रही हैं यहाँ लिखें या बोलें...'
                : 'Describe symptoms or ask health guidance...'
            }
            className="flex-1 text-sm px-3 py-2 border-none focus:outline-none placeholder:text-stone-400 text-charcoal-900"
          />

          <button
            onClick={() => handleSend()}
            disabled={!inputMessage.trim() || loading}
            className="px-4 py-2.5 rounded-2xl bg-teal-700 hover:bg-teal-800 disabled:opacity-40 text-white font-semibold text-xs shadow-xs flex items-center gap-1.5 transition"
          >
            <span>Send</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Mandatory Medical Safety Disclaimer */}
      <div className="pt-2 text-center text-[11px] text-stone-400 flex items-center justify-center gap-1.5 shrink-0">
        <Info className="w-3.5 h-3.5 text-stone-400" />
        <span>
          IRIS provides general health information and is not a substitute for professional medical advice or clinical diagnosis.
        </span>
      </div>
    </div>
  );
}
