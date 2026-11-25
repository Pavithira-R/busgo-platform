import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { storage } from '../lib/storage';
import { en } from './en';
import { si } from './si';
import { ta } from './ta';

export const LANGUAGES = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'si', label: 'සිංහල', short: 'සිං' },
  { code: 'ta', label: 'தமிழ்', short: 'தமி' },
] as const;
export type LanguageCode = (typeof LANGUAGES)[number]['code'];

const LANGUAGE_KEY = 'busgo.language';

function savedLanguage(): LanguageCode {
  const saved = storage.get(LANGUAGE_KEY);
  return LANGUAGES.some((l) => l.code === saved)
    ? (saved as LanguageCode)
    : 'en';
}

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    si: { translation: si },
    ta: { translation: ta },
  },
  lng: savedLanguage(),
  fallbackLng: 'en',
  // React already escapes text, so i18next doesn't need to.
  interpolation: { escapeValue: false },
});

/** Keep <html lang> correct (screen readers, fonts) and remember the choice. */
function applyLanguage(lng: string) {
  document.documentElement.lang = lng;
  storage.set(LANGUAGE_KEY, lng);
}
applyLanguage(i18n.language);
i18n.on('languageChanged', applyLanguage);

export default i18n;
