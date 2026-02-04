import type { HouseholdConfig } from '@/shared/types';

// Default values for household configuration (used in onboarding forms)
export const HOUSEHOLD_DEFAULTS = {
  adults: 1,
  children: 0,
  pets: 0,
  supplyDays: 3,
  useFreezer: false,
} as const;

// Default household for new workspaces
export const DEFAULT_HOUSEHOLD: HouseholdConfig = {
  adults: 2,
  children: 3,
  pets: 0,
  supplyDurationDays: 3,
  useFreezer: false,
};

// Validation limits for household configuration
export const HOUSEHOLD_LIMITS = {
  adults: { min: 1, max: 20 },
  children: { min: 0, max: 20 },
  pets: { min: 0, max: 20 },
  supplyDays: { min: 1, max: 365 },
} as const;
