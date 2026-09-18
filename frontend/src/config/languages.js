// 32 Supported Languages in IRIS Care Platform
// Includes 22 Official Scheduled Languages of India + 10 Major Global Healthcare Languages

export const LANGUAGES = [
  // 1. English (Default)
  { code: 'en', name: 'English', nativeName: 'English', dir: 'ltr', region: 'Global' },
  
  // 2. Telugu
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', dir: 'ltr', region: 'India' },
  
  // 3. Hindi
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', dir: 'ltr', region: 'India' },
  
  // 4. Tamil
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', dir: 'ltr', region: 'India' },
  
  // 5. Kannada
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', dir: 'ltr', region: 'India' },
  
  // 6. Malayalam
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', dir: 'ltr', region: 'India' },
  
  // 7. Marathi
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', dir: 'ltr', region: 'India' },
  
  // 8. Bengali
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', dir: 'ltr', region: 'India' },
  
  // 9. Gujarati
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', dir: 'ltr', region: 'India' },
  
  // 10. Punjabi
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', dir: 'ltr', region: 'India' },
  
  // 11. Odia
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', dir: 'ltr', region: 'India' },
  
  // 12. Assamese
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া', dir: 'ltr', region: 'India' },
  
  // 13. Urdu (RTL)
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', dir: 'rtl', region: 'India/Global' },
  
  // 14. Sanskrit
  { code: 'sa', name: 'Sanskrit', nativeName: 'संस्कृतम्', dir: 'ltr', region: 'India' },
  
  // 15. Nepali
  { code: 'ne', name: 'Nepali', nativeName: 'नेपाली', dir: 'ltr', region: 'India/South Asia' },
  
  // 16. Konkani
  { code: 'kok', name: 'Konkani', nativeName: 'कोंकणी', dir: 'ltr', region: 'India' },
  
  // 17. Kashmiri (RTL)
  { code: 'ks', name: 'Kashmiri', nativeName: 'کٲشُر', dir: 'rtl', region: 'India' },
  
  // 18. Sindhi (RTL)
  { code: 'sd', name: 'Sindhi', nativeName: 'سنڌي', dir: 'rtl', region: 'India/South Asia' },
  
  // 19. Maithili
  { code: 'mai', name: 'Maithili', nativeName: 'मैथिली', dir: 'ltr', region: 'India' },
  
  // 20. Dogri
  { code: 'doi', name: 'Dogri', nativeName: 'डोगरी', dir: 'ltr', region: 'India' },
  
  // 21. Manipuri (Meitei)
  { code: 'mni', name: 'Manipuri', nativeName: 'ꯃꯤꯇꯩꯂꯣꯟ', dir: 'ltr', region: 'India' },
  
  // 22. Bodo
  { code: 'brx', name: 'Bodo', nativeName: 'बड़ो', dir: 'ltr', region: 'India' },
  
  // 23. Santali
  { code: 'sat', name: 'Santali', nativeName: 'ᱥᱟᱱᱛᱟᱲᱤ', dir: 'ltr', region: 'India' },
  
  // 24. French
  { code: 'fr', name: 'French', nativeName: 'Français', dir: 'ltr', region: 'Global' },
  
  // 25. German
  { code: 'de', name: 'German', nativeName: 'Deutsch', dir: 'ltr', region: 'Global' },
  
  // 26. Spanish
  { code: 'es', name: 'Spanish', nativeName: 'Español', dir: 'ltr', region: 'Global' },
  
  // 27. Portuguese
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', dir: 'ltr', region: 'Global' },
  
  // 28. Italian
  { code: 'it', name: 'Italian', nativeName: 'Italiano', dir: 'ltr', region: 'Global' },
  
  // 29. Japanese
  { code: 'ja', name: 'Japanese', nativeName: '日本語', dir: 'ltr', region: 'Global' },
  
  // 30. Korean
  { code: 'ko', name: 'Korean', nativeName: '한국어', dir: 'ltr', region: 'Global' },
  
  // 31. Arabic (RTL)
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', dir: 'rtl', region: 'Global' },
  
  // 32. Chinese (Simplified)
  { code: 'zh', name: 'Chinese', nativeName: '简体中文', dir: 'ltr', region: 'Global' }
];

export const LANGUAGE_MAP = LANGUAGES.reduce((acc, lang) => {
  acc[lang.code] = lang;
  return acc;
}, {});

export const RTL_LANGUAGES = ['ur', 'ks', 'sd', 'ar'];

export function isRtlLanguage(code) {
  return RTL_LANGUAGES.includes(code);
}
