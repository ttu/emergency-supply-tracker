import { createContext } from 'react';
import type { HouseholdConfig } from '../types';

export interface HouseholdContextValue {
  household: HouseholdConfig;
  updateHousehold: (updates: Partial<HouseholdConfig>) => void;
  setPreset: (preset: 'single' | 'couple' | 'family') => void;
}

export const HouseholdContext = createContext<
  HouseholdContextValue | undefined
>(undefined);
