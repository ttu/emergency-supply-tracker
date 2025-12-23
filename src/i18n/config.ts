import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files (will be created in next steps)
const resources = {
  en: {
    common: {},
    categories: {},
    products: {},
    units: {},
  },
  fi: {
    common: {},
    categories: {},
    products: {},
    units: {},
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // default language
    fallbackLng: 'en',
    ns: ['common', 'categories', 'products', 'units'],
    defaultNS: 'common',
    interpolation: {
      escapeValue: false, // React already escapes
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  })
  .catch((error) => {
    console.error('i18n initialization failed:', error);
  });

export default i18n;
