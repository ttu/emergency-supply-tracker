// Context and Provider
export { HouseholdContext } from './context';
export type { HouseholdContextValue } from './context';
export { HouseholdProvider } from './provider';

// Hooks
export { useHousehold } from './hooks';

// Utils
export {
  calculateHouseholdMultiplier,
  calculateRecommendedQuantity,
} from './utils';

// Constants
export { HOUSEHOLD_DEFAULTS, HOUSEHOLD_LIMITS } from './constants';

// Factories
export {
  HouseholdConfigFactory,
  HouseholdConfigValidationError,
} from './factories/HouseholdConfigFactory';
export type {
  CreateHouseholdConfigInput,
  HouseholdPreset,
} from './factories/HouseholdConfigFactory';
