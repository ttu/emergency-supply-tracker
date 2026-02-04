import type { HouseholdConfig } from '@/shared/types';

/** Preset identifier for single, couple, family, or inventoryOnly. */
export type HouseholdPreset = 'single' | 'couple' | 'family' | 'inventoryOnly';

/**
 * Full household configuration for each preset.
 * Single source of truth for onboarding, settings, and HouseholdConfigFactory.
 */
export const HOUSEHOLD_PRESETS: Record<HouseholdPreset, HouseholdConfig> = {
  single: {
    enabled: true,
    adults: 1,
    children: 0,
    pets: 0,
    supplyDurationDays: 3,
    useFreezer: false,
  },
  couple: {
    enabled: true,
    adults: 2,
    children: 0,
    pets: 0,
    supplyDurationDays: 3,
    useFreezer: true,
  },
  family: {
    enabled: true,
    adults: 2,
    children: 2,
    pets: 0,
    supplyDurationDays: 3,
    useFreezer: true,
  },
  inventoryOnly: {
    enabled: false,
    adults: 1,
    children: 0,
    pets: 0,
    supplyDurationDays: 3,
    useFreezer: false,
  },
};
