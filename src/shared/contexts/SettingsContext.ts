import { createContext } from 'react';
import type { UserSettings } from '@/shared/types';

export interface SettingsContextValue {
  settings: UserSettings;
  updateSettings: (updates: Partial<UserSettings>) => void;
}

export const SettingsContext = createContext<SettingsContextValue | undefined>(
  undefined,
);
