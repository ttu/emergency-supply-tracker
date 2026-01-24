// Context and Provider
export { HouseholdContext } from './context';
export type { HouseholdContextValue } from './context';
export { HouseholdProvider } from './provider';

// Hooks
export { useHousehold } from './hooks';

// Constants
export { HOUSEHOLD_DEFAULTS, HOUSEHOLD_LIMITS } from './constants';
export { HOUSEHOLD_PRESETS } from './presets';
export type { HouseholdPreset } from './presets';

// Factories
export {
  HouseholdConfigFactory,
  HouseholdConfigValidationError,
} from './factories/HouseholdConfigFactory';
export type { CreateHouseholdConfigInput } from './factories/HouseholdConfigFactory';
