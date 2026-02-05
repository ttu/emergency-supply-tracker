import { ReactNode } from 'react';
import type { HouseholdConfig } from '@/shared/types';
import { useLocalStorageSync } from '@/shared/hooks';
import { HouseholdContext } from './context';
import { HOUSEHOLD_PRESETS } from './presets';
import { DEFAULT_HOUSEHOLD } from './constants';

export function HouseholdProvider({ children }: { children: ReactNode }) {
  const [household, setHousehold] = useLocalStorageSync(
    'household',
    DEFAULT_HOUSEHOLD,
  );

  const updateHousehold = (updates: Partial<HouseholdConfig>) => {
    setHousehold((prev) => ({ ...prev, ...updates }));
  };

  const setPreset = (preset: 'single' | 'couple' | 'family') => {
    setHousehold(HOUSEHOLD_PRESETS[preset]);
  };

  return (
    <HouseholdContext.Provider
      value={{ household, updateHousehold, setPreset }}
    >
      {children}
    </HouseholdContext.Provider>
  );
}
