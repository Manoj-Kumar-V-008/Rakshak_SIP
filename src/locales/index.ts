import en from './en.json';
import hi from './hi.json';
import ta from './ta.json';
import te from './te.json';
import kn from './kn.json';
import mr from './mr.json';
import bn from './bn.json';

export type Language = 'en' | 'hi' | 'ta' | 'te' | 'kn' | 'mr' | 'bn';

const translations: Record<Language, Record<string, unknown>> = {
  en,
  hi,
  ta,
  te,
  kn,
  mr,
  bn,
};

let currentLanguage: Language = 'en';

export const setLanguage = (lang: Language) => {
  currentLanguage = lang;
};

export const getLanguage = (): Language => currentLanguage;

// Simple deep-get with dot-notation keys, e.g. "scanner.title"
const getNested = (obj: Record<string, unknown>, path: string): unknown => {
  return path.split('.').reduce((o: Record<string, unknown> | unknown, key: string) => {
    return (o as Record<string, unknown>)?.[key];
  }, obj);
};

export const t = (key: string, params?: Record<string, string | number>): string => {
  const translationsForLang = translations[currentLanguage] || translations.en;
  const value = getNested(translationsForLang, key);
  if (typeof value !== 'string') {
    // Fallback to English
    const fallback = getNested(translations.en, key);
    if (typeof fallback !== 'string') return key;
    return interpolate(fallback, params);
  }
  return interpolate(value, params);
};

const interpolate = (str: string, params?: Record<string, string | number>): string => {
  if (!params) return str;
  return str.replace(/\{(\w+)\}/g, (_match, key) => {
    return params?.[key] !== undefined ? String(params[key]) : `{${key}}`;
  });
};
