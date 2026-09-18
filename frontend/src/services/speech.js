/**
 * Speech Recognition and Text-to-Speech wrapper for IRIS
 * Supports English ('en-US'), Telugu ('te-IN'), and Hindi ('hi-IN')
 * Gracefully degrades if browser APIs are unavailable.
 */

export function isSpeechRecognitionSupported() {
  return typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
}

export function isSpeechSynthesisSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function createSpeechRecognizer(language = 'en', onResult, onError, onEnd) {
  if (!isSpeechRecognitionSupported()) return null;

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();

  const langMap = {
    en: 'en-US',
    te: 'te-IN',
    hi: 'hi-IN'
  };

  recognition.lang = langMap[language] || 'en-US';
  recognition.interimResults = false;
  recognition.continuous = false;

  recognition.onresult = (event) => {
    if (event.results && event.results[0]) {
      const transcript = event.results[0][0].transcript;
      if (onResult) onResult(transcript);
    }
  };

  recognition.onerror = (event) => {
    console.warn('[IRIS Speech Rec Error]:', event.error);
    if (onError) onError(event.error);
  };

  recognition.onend = () => {
    if (onEnd) onEnd();
  };

  return recognition;
}

export function speakText(text, language = 'en') {
  if (!isSpeechSynthesisSupported() || !text) return;

  try {
    window.speechSynthesis.cancel(); // cancel prior utterances
    const utterance = new SpeechSynthesisUtterance(text);

    const langMap = {
      en: 'en-US',
      te: 'te-IN',
      hi: 'hi-IN'
    };

    utterance.lang = langMap[language] || 'en-US';
    utterance.rate = 0.95; // Gentle pace for seniors
    utterance.pitch = 1.0;

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('[IRIS Speech Synth Error]:', err.message);
  }
}
