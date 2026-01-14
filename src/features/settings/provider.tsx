import { useEffect, ReactNode } from 'react';
import type { UserSettings } from '@/shared/types';
import { useLocalStorageSync } from '@/shared/hooks';
import { SettingsContext } from './context';
import {
  getLanguageFromUrl,
  clearLanguageFromUrl,
} from '@/shared/utils/urlLanguage';
import { UserSettingsFactory } from './factories/UserSettingsFactory';

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useLocalStorageSync('settings', (data) => {
    // Merge stored settings with defaults using factory to handle new fields
    const storedSettings = UserSettingsFactory.create(data?.settings || {});

    // If URL has a lang parameter, use it to override stored language
    const urlLanguage = getLanguageFromUrl();
    if (urlLanguage) {
      return UserSettingsFactory.create({
        ...storedSettings,
        language: urlLanguage,
      });
    }

    return storedSettings;
  });

  // Clear lang param from URL after reading it on initial load
  useEffect(() => {
    clearLanguageFromUrl();
    // Only run once on mount
  }, []);

  const updateSettings = (updates: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}
