import { useState, useEffect, ReactNode } from 'react';
import type { UserSettings } from '../types';
import { getAppData, saveAppData } from '../utils/storage/localStorage';
import { SettingsContext } from './SettingsContext';

const DEFAULT_SETTINGS: UserSettings = {
  language: 'en',
  theme: 'light',
  advancedFeatures: {
    calorieTracking: false,
    powerManagement: false,
    waterTracking: false,
  },
};

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>(() => {
    const data = getAppData();
    return data?.settings || DEFAULT_SETTINGS;
  });

  // Save to localStorage on change
  useEffect(() => {
    const data = getAppData() || {
      version: '1.0.0',
      household: {
        adults: 2,
        children: 0,
        supplyDurationDays: 7,
        useFreezer: false,
      },
      settings: DEFAULT_SETTINGS,
      customCategories: [], // Only custom categories, STANDARD_CATEGORIES are always available
      items: [],
      customTemplates: [],
      lastModified: new Date().toISOString(),
    };
    data.settings = settings;
    data.lastModified = new Date().toISOString();
    saveAppData(data);
  }, [settings]);

  const updateSettings = (updates: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  };

  const toggleAdvancedFeature = (
    feature: keyof UserSettings['advancedFeatures'],
  ) => {
    setSettings((prev) => ({
      ...prev,
      advancedFeatures: {
        ...prev.advancedFeatures,
        [feature]: !prev.advancedFeatures[feature],
      },
    }));
  };

  return (
    <SettingsContext.Provider
      value={{ settings, updateSettings, toggleAdvancedFeature }}
    >
      {children}
    </SettingsContext.Provider>
  );
}
