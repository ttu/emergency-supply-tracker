import { createContext } from 'react';
import type { UserSettings } from '../types';

export interface SettingsContextValue {
  settings: UserSettings;
  updateSettings: (updates: Partial<UserSettings>) => void;
  toggleAdvancedFeature: (
    feature: keyof UserSettings['advancedFeatures'],
  ) => void;
}

export const SettingsContext = createContext<SettingsContextValue | undefined>(
  undefined,
);
