import { useState, useEffect, ReactNode } from 'react';
import type { HouseholdConfig } from '@/shared/types';
import {
  getAppData,
  saveAppData,
  createDefaultAppData,
} from '@/shared/utils/storage/localStorage';
import { HouseholdContext } from './context';

const DEFAULT_HOUSEHOLD: HouseholdConfig = {
  adults: 2,
  children: 3,
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
    supplyDurationDays: 3,
    useFreezer: false,
  },
  couple: {
    adults: 2,
    children: 0,
    supplyDurationDays: 3,
    useFreezer: true,
  },
  family: {
    adults: 2,
    children: 2,
    supplyDurationDays: 3,
    useFreezer: true,
  },
};

export function HouseholdProvider({ children }: { children: ReactNode }) {
  const [household, setHousehold] = useState<HouseholdConfig>(() => {
    const data = getAppData();
    return data?.household || DEFAULT_HOUSEHOLD;
  });

  // Save to localStorage on change
  useEffect(() => {
    const data = getAppData() || createDefaultAppData();
    data.household = household;
    data.lastModified = new Date().toISOString();
    saveAppData(data);
  }, [household]);

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
