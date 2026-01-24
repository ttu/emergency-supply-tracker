import type { HouseholdConfig } from '@/shared/types';

/** Preset identifier for single, couple, or family. */
export type HouseholdPreset = 'single' | 'couple' | 'family';

/**
 * Full household configuration for each preset.
 * Single source of truth for onboarding, settings, and HouseholdConfigFactory.
 */
export const HOUSEHOLD_PRESETS: Record<HouseholdPreset, HouseholdConfig> = {
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
    pets: 0,
    supplyDurationDays: 3,
    useFreezer: true,
  },
};
