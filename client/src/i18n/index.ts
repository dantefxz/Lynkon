import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import es from './locales/es';
import en from './locales/en';
import ja from './locales/ja';

export const SUPPORTED_LANGUAGES = ['es', 'en', 'ja'] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

export const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  es: 'Español',
  en: 'English',
  ja: '日本語',
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      es: { translation: es },
      en: { translation: en },
      ja: { translation: ja },
    },
    lng:           'es',
    fallbackLng:   'es',
    interpolation: { escapeValue: false },
    compatibilityJSON: 'v3',
  });

export default i18n;
