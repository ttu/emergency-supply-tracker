import { useState, useEffect, ReactNode } from 'react';
import type { HouseholdConfig } from '../types';
import { getAppData, saveAppData } from '../utils/storage/localStorage';
import { HouseholdContext } from './HouseholdContext';
import { STANDARD_CATEGORIES } from '../data/standardCategories';

const DEFAULT_HOUSEHOLD: HouseholdConfig = {
  adults: 2,
  children: 3,
  supplyDurationDays: 3,
  hasFreezer: false,
};

const HOUSEHOLD_PRESETS: Record<
  'single' | 'couple' | 'family',
  HouseholdConfig
> = {
  single: {
    adults: 1,
    children: 0,
    supplyDurationDays: 3,
    hasFreezer: false,
  },
  couple: {
    adults: 2,
    children: 0,
    supplyDurationDays: 3,
    hasFreezer: true,
  },
  family: {
    adults: 2,
    children: 2,
    supplyDurationDays: 3,
    hasFreezer: true,
  },
};

export function HouseholdProvider({ children }: { children: ReactNode }) {
  const [household, setHousehold] = useState<HouseholdConfig>(() => {
    const data = getAppData();
    return data?.household || DEFAULT_HOUSEHOLD;
  });

  // Save to localStorage on change
  useEffect(() => {
    const data = getAppData() || {
      version: '1.0.0',
      household: DEFAULT_HOUSEHOLD,
      settings: {
        language: 'en',
        theme: 'light',
        advancedFeatures: {
          calorieTracking: false,
          powerManagement: false,
          waterTracking: false,
        },
      },
      categories: STANDARD_CATEGORIES,
      items: [],
      customTemplates: [],
      lastModified: new Date().toISOString(),
    };
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
