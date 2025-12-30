import { useState, useEffect, ReactNode } from 'react';
import type { UserSettings } from '../types';
import {
  getAppData,
  saveAppData,
  createDefaultAppData,
} from '../utils/storage/localStorage';
import { SettingsContext } from './SettingsContext';
import { getLanguageFromUrl, setLanguageInUrl } from '../utils/urlLanguage';

const DEFAULT_SETTINGS: UserSettings = {
  language: 'en',
  theme: 'light',
  highContrast: false,
  advancedFeatures: {
    calorieTracking: false,
    powerManagement: false,
    waterTracking: false,
  },
};

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>(() => {
    const data = getAppData();
    const storedSettings = data?.settings || DEFAULT_SETTINGS;

    // If URL has a lang parameter, use it to override stored language
    const urlLanguage = getLanguageFromUrl();
    if (urlLanguage) {
      return { ...storedSettings, language: urlLanguage };
    }

    return storedSettings;
  });

  // Sync URL with language on initial load
  useEffect(() => {
    setLanguageInUrl(settings.language);
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    const data = getAppData() || createDefaultAppData();
    data.settings = settings;
    data.lastModified = new Date().toISOString();
    saveAppData(data);
  }, [settings]);

  const updateSettings = (updates: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}
