import { ReactNode } from 'react';
import type { HouseholdConfig } from '@/shared/types';
import { useLocalStorageSync } from '@/shared/hooks';
import { HouseholdContext } from './context';

const DEFAULT_HOUSEHOLD: HouseholdConfig = {
  adults: 2,
  children: 3,
  pets: 0,
  supplyDurationDays: 3,
  useFreezer: false,
};

const HOUSEHOLD_PRESETS: Record<
  'single' | 'couple' | 'family',
  HouseholdConfig
> = {
  single: {
    adults: 1,
    children: 0,
    pets: 0,
    supplyDurationDays: 3,
    useFreezer: false,
  },
  couple: {
    adults: 2,
    children: 0,
    pets: 0,
    supplyDurationDays: 3,
    useFreezer: true,
  },
  family: {
    adults: 2,
    children: 2,
    pets: 1,
    supplyDurationDays: 3,
    useFreezer: true,
  },
};

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
