import { ReactNode } from 'react';
import type { HouseholdConfig } from '@/shared/types';
import { useLocalStorageSync } from '@/shared/hooks';
import { HouseholdContext } from './context';
import { HOUSEHOLD_PRESETS } from './presets';

const DEFAULT_HOUSEHOLD: HouseholdConfig = {
  enabled: true,
  adults: 2,
  children: 3,
  pets: 0,
  supplyDurationDays: 3,
  useFreezer: false,
};

export function HouseholdProvider({ children }: { children: ReactNode }) {
  const [household, setHousehold] = useLocalStorageSync(
    'household',
    DEFAULT_HOUSEHOLD,
  );

  const updateHousehold = (updates: Partial<HouseholdConfig>) => {
    setHousehold((prev) => ({ ...prev, ...updates }));
  };

  const setPreset = (
    preset: 'single' | 'couple' | 'family' | 'inventoryOnly',
  ) => {
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
