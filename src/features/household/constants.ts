// Default values for household configuration
export const HOUSEHOLD_DEFAULTS = {
  enabled: true,
  adults: 1,
  children: 0,
  pets: 0,
  supplyDays: 3,
  useFreezer: false,
} as const;

// Validation limits for household configuration
export const HOUSEHOLD_LIMITS = {
  adults: { min: 1, max: 20 },
  children: { min: 0, max: 20 },
  pets: { min: 0, max: 20 },
  supplyDays: { min: 1, max: 365 },
} as const;
