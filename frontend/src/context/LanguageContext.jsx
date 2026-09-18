import React, { createContext, useContext, useState } from 'react';
import en from '../locales/en.json';
import te from '../locales/te.json';
import hi from '../locales/hi.json';

const LanguageContext = createContext();

export const TRANSLATIONS = {
  en,
  te,
  hi
};

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('iris_lang') || 'en';
  });

  const changeLanguage = (newLang) => {
    if (TRANSLATIONS[newLang]) {
      setLang(newLang);
      localStorage.setItem('iris_lang', newLang);
    }
  };

  const t = (key) => {
    return TRANSLATIONS[lang]?.[key] || TRANSLATIONS.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
