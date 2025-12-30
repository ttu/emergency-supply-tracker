import { useState, useEffect, ReactNode } from 'react';
import type { UserSettings } from '../types';
import {
  getAppData,
  saveAppData,
  createDefaultAppData,
} from '../utils/storage/localStorage';
import { SettingsContext } from './SettingsContext';

const DEFAULT_SETTINGS: UserSettings = {
  language: 'en',
  theme: 'light',
};

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>(() => {
    const data = getAppData();
    return data?.settings || DEFAULT_SETTINGS;
  });

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
