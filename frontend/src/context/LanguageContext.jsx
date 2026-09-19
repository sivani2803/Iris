import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { LANGUAGES, LANGUAGE_MAP, isRtlLanguage } from '../config/languages';

const LanguageContext = createContext();

// Load all 32 locale dictionaries via Vite's eager glob
const localeModules = import.meta.glob('../locales/*.json', { eager: true });
export const TRANSLATIONS = {};
for (const modulePath in localeModules) {
  const match = modulePath.match(/[/\\]([^/\\]+)\.json$/);
  if (match && match[1]) {
    TRANSLATIONS[match[1]] = localeModules[modulePath].default || localeModules[modulePath];
  }
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('iris_lang') || 'en';
  });
  const [isLangModalOpen, setIsLangModalOpen] = useState(false);

  const openLanguageModal = () => setIsLangModalOpen(true);
  const closeLanguageModal = () => setIsLangModalOpen(false);

  const isRtl = isRtlLanguage(lang);

  // Sync document language and RTL direction
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    if (isRtl) {
      document.body.classList.add('is-rtl');
    } else {
      document.body.classList.remove('is-rtl');
    }
  }, [lang, isRtl]);

  const changeLanguage = async (newLang) => {
    if (LANGUAGES.some(l => l.code === newLang) || TRANSLATIONS[newLang]) {
      setLang(newLang);
      localStorage.setItem('iris_lang', newLang);

      // Persist to user profile if authenticated
      const token = localStorage.getItem('iris_jwt_token');
      if (token) {
        try {
          await axios.patch('/api/auth/profile/language', { preferredLanguage: newLang }, {
            headers: { Authorization: `Bearer ${token}` }
          });
        } catch (_) {}
      }
    }
  };

  const t = (key) => {
    return TRANSLATIONS[lang]?.[key] || TRANSLATIONS.en?.[key] || key;
  };

  const currentLanguageInfo = LANGUAGE_MAP[lang] || { code: lang, name: lang, nativeName: lang, dir: isRtl ? 'rtl' : 'ltr' };

  return (
    <LanguageContext.Provider value={{
      lang,
      isRtl,
      currentLanguageInfo,
      languages: LANGUAGES,
      changeLanguage,
      t,
      isLangModalOpen,
      openLanguageModal,
      closeLanguageModal
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
