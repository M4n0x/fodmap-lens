import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';

import en from './locales/en.json';
import fr from './locales/fr.json';
import de from './locales/de.json';

const deviceLanguage = getLocales()[0]?.languageCode ?? 'en';
const supportedLanguages = ['en', 'fr', 'de'];
const defaultLanguage = supportedLanguages.includes(deviceLanguage) ? deviceLanguage : 'en';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    fr: { translation: fr },
    de: { translation: de },
  },
  lng: defaultLanguage,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
