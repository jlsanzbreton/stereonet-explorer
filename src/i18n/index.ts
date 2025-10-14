import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enCommon from './locales/en/common.json';
import esCommon from './locales/es/common.json';

export const LANGUAGE_STORAGE_KEY = 'stereonet-lang';
const SUPPORTED_LANGUAGES = ['en', 'es'] as const;

const resources = {
  en: {
    common: enCommon,
  },
  es: {
    common: esCommon,
  },
} as const;

type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const detectInitialLanguage = (): SupportedLanguage => {
  if (typeof window === 'undefined') {
    return 'en';
  }

  try {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored && SUPPORTED_LANGUAGES.includes(stored as SupportedLanguage)) {
      return stored as SupportedLanguage;
    }
  } catch {
    // Ignore storage errors and fall back to browser detection.
  }

  if (typeof navigator !== 'undefined') {
    const browserLanguage = navigator.languages?.[0] ?? navigator.language ?? '';
    if (browserLanguage.toLowerCase().startsWith('es')) {
      return 'es';
    }
  }

  return 'en';
};

if (!i18n.isInitialized) {
  i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: detectInitialLanguage(),
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false,
      },
      defaultNS: 'common',
      returnNull: false,
    })
    .catch((error) => {
      console.error('i18n initialization failed', error);
    });

  i18n.on('languageChanged', (lng) => {
    if (typeof window === 'undefined' || !SUPPORTED_LANGUAGES.includes(lng as SupportedLanguage)) {
      return;
    }
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, lng);
    } catch {
      // Storage may be unavailable (private mode, etc.). Ignore persist errors.
    }
  });
}

export const supportedLocales = SUPPORTED_LANGUAGES;
export default i18n;
