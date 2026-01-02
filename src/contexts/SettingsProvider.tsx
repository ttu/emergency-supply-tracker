import { useState, useEffect, ReactNode } from 'react';
import type { UserSettings } from '../types';
import {
  getAppData,
  saveAppData,
  createDefaultAppData,
} from '../utils/storage/localStorage';
import { SettingsContext } from './SettingsContext';
import { getLanguageFromUrl, clearLanguageFromUrl } from '../utils/urlLanguage';
import {
  DAILY_CALORIES_PER_PERSON,
  DAILY_WATER_PER_PERSON,
  CHILDREN_REQUIREMENT_MULTIPLIER,
} from '../utils/constants';

const DEFAULT_SETTINGS: UserSettings = {
  language: 'en',
  theme: 'ocean',
  highContrast: false,
  advancedFeatures: {
    calorieTracking: false,
    powerManagement: false,
    waterTracking: false,
  },
  dailyCaloriesPerPerson: DAILY_CALORIES_PER_PERSON,
  dailyWaterPerPerson: DAILY_WATER_PER_PERSON,
  childrenRequirementPercentage: CHILDREN_REQUIREMENT_MULTIPLIER * 100,
};

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>(() => {
    const data = getAppData();
    // Merge stored settings with defaults to handle new fields (migration)
    const storedSettings = { ...DEFAULT_SETTINGS, ...data?.settings };

    // If URL has a lang parameter, use it to override stored language
    const urlLanguage = getLanguageFromUrl();
    if (urlLanguage) {
      return { ...storedSettings, language: urlLanguage };
    }

    return storedSettings;
  });

  // Clear lang param from URL after reading it on initial load
  useEffect(() => {
    clearLanguageFromUrl();
    // Only run once on mount
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
