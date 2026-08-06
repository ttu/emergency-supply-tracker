import type { HouseholdConfig } from '@/shared/types';

// Default values for household configuration (used in onboarding forms)
export const HOUSEHOLD_DEFAULTS = {
  adults: 1,
  children: 0,
  pets: 0,
  supplyDays: 3,
  useFreezer: false,
} as const;

// Default household for new inventory sets. Derived from the form defaults
// rather than restated, so a new set and a fresh onboarding always start the
// same household — they drifted to "2 adults, 3 children" here otherwise.
export const DEFAULT_HOUSEHOLD: HouseholdConfig = {
  adults: HOUSEHOLD_DEFAULTS.adults,
  children: HOUSEHOLD_DEFAULTS.children,
  pets: HOUSEHOLD_DEFAULTS.pets,
  supplyDurationDays: HOUSEHOLD_DEFAULTS.supplyDays,
  useFreezer: HOUSEHOLD_DEFAULTS.useFreezer,
};

// Validation limits for household configuration
export const HOUSEHOLD_LIMITS = {
  adults: { min: 1, max: 20 },
  children: { min: 0, max: 20 },
  pets: { min: 0, max: 20 },
  supplyDays: { min: 1, max: 365 },
} as const;
