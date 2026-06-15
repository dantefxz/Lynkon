import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import i18n, { SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/i18n';

const STORAGE_KEY = 'app_language';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => Promise<void>;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

function detectDeviceLanguage(): SupportedLanguage {
  const locale = Localization.getLocales()[0]?.languageCode ?? 'es';
  const code = locale.split('-')[0].toLowerCase();
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(code)
    ? (code as SupportedLanguage)
    : 'es';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLang] = useState<SupportedLanguage>('es');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      const lang = (SUPPORTED_LANGUAGES as readonly string[]).includes(stored ?? '')
        ? (stored as SupportedLanguage)
        : detectDeviceLanguage();
      setLang(lang);
      i18n.changeLanguage(lang);
    }).catch(() => {
      const lang = detectDeviceLanguage();
      setLang(lang);
      i18n.changeLanguage(lang);
    });
  }, []);

  const setLanguage = async (lang: SupportedLanguage) => {
    await AsyncStorage.setItem(STORAGE_KEY, lang);
    await i18n.changeLanguage(lang);
    setLang(lang);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
