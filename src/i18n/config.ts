import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';
import { getInitialLanguage } from '@/shared/utils/urlLanguage';
import { getAppData } from '@/shared/utils/storage/localStorage';

// Get base path from Vite's import.meta.env.BASE_URL
const basePath = import.meta.env.BASE_URL || '/';

// Determine initial language: URL param > localStorage > default ('en')
const storedData = getAppData();
const storedLanguage = storedData?.settings?.language;
const initialLanguage = getInitialLanguage(storedLanguage);

i18n
  .use(HttpBackend)
  .use(initReactI18next)
  .init({
    lng: initialLanguage, // language from URL param, localStorage, or default
    fallbackLng: 'en',
    ns: ['common', 'categories', 'products', 'units'],
    defaultNS: 'common',
    backend: {
      loadPath: `${basePath}locales/{{lng}}/{{ns}}.json`,
    },
    interpolation: {
      escapeValue: false, // React already escapes
    },
    react: {
      useSuspense: true,
    },
  })
  .catch((error) => {
    console.error('i18n initialization failed:', error);
  });

export default i18n;
