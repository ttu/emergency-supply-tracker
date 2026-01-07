import type { HouseholdConfig } from '@/shared/types';
import { HOUSEHOLD_LIMITS } from '../constants';

/**
 * Input for creating a household configuration.
 */
export type CreateHouseholdConfigInput = HouseholdConfig;

/**
 * Options for creating household config from preset.
 */
export type HouseholdPreset = 'single' | 'couple' | 'family';

/**
 * Validation error thrown when household config creation fails validation.
 */
export class HouseholdConfigValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'HouseholdConfigValidationError';
  }
}

/**
 * Validates household config input.
 */
function validateHouseholdConfig(input: CreateHouseholdConfigInput): void {
  // Validate adults
  if (input.adults < HOUSEHOLD_LIMITS.adults.min) {
    throw new HouseholdConfigValidationError(
      `adults must be at least ${HOUSEHOLD_LIMITS.adults.min}, got ${input.adults}`,
    );
  }
  if (input.adults > HOUSEHOLD_LIMITS.adults.max) {
    throw new HouseholdConfigValidationError(
      `adults must be at most ${HOUSEHOLD_LIMITS.adults.max}, got ${input.adults}`,
    );
  }

  // Validate children
  if (input.children < HOUSEHOLD_LIMITS.children.min) {
    throw new HouseholdConfigValidationError(
      `children must be at least ${HOUSEHOLD_LIMITS.children.min}, got ${input.children}`,
    );
  }
  if (input.children > HOUSEHOLD_LIMITS.children.max) {
    throw new HouseholdConfigValidationError(
      `children must be at most ${HOUSEHOLD_LIMITS.children.max}, got ${input.children}`,
    );
  }

  // Validate supplyDurationDays
  if (input.supplyDurationDays < HOUSEHOLD_LIMITS.supplyDays.min) {
    throw new HouseholdConfigValidationError(
      `supplyDurationDays must be at least ${HOUSEHOLD_LIMITS.supplyDays.min}, got ${input.supplyDurationDays}`,
    );
  }
  if (input.supplyDurationDays > HOUSEHOLD_LIMITS.supplyDays.max) {
    throw new HouseholdConfigValidationError(
      `supplyDurationDays must be at most ${HOUSEHOLD_LIMITS.supplyDays.max}, got ${input.supplyDurationDays}`,
    );
  }

  // Validate freezerHoldTimeHours if provided
  if (
    input.freezerHoldTimeHours !== undefined &&
    input.freezerHoldTimeHours < 0
  ) {
    throw new HouseholdConfigValidationError(
      `freezerHoldTimeHours must be non-negative, got ${input.freezerHoldTimeHours}`,
    );
  }
}

/**
 * Factory for creating HouseholdConfig instances with validation.
 */
export class HouseholdConfigFactory {
  /**
   * Creates a household configuration from input data.
   * Validates all inputs according to HOUSEHOLD_LIMITS.
   *
   * @param input - Household configuration data
   * @returns Validated HouseholdConfig
   * @throws HouseholdConfigValidationError if validation fails
   */
  static create(input: CreateHouseholdConfigInput): HouseholdConfig {
    validateHouseholdConfig(input);

    return {
      adults: input.adults,
      children: input.children,
      supplyDurationDays: input.supplyDurationDays,
      useFreezer: input.useFreezer,
      freezerHoldTimeHours: input.freezerHoldTimeHours,
    };
  }

  /**
   * Creates a household configuration from a preset.
   *
   * @param preset - Preset type ('single', 'couple', or 'family')
   * @returns HouseholdConfig for the preset
   */
  static createFromPreset(preset: HouseholdPreset): HouseholdConfig {
    const presets: Record<HouseholdPreset, HouseholdConfig> = {
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

    return this.create(presets[preset]);
  }

  /**
   * Creates a household configuration with default values.
   *
   * @param overrides - Optional overrides for default values
   * @returns HouseholdConfig with defaults
   */
  static createDefault(
    overrides?: Partial<CreateHouseholdConfigInput>,
  ): HouseholdConfig {
    const defaults: HouseholdConfig = {
      adults: 2,
      children: 0,
      supplyDurationDays: 7,
      useFreezer: false,
    };

    return this.create({ ...defaults, ...overrides });
  }
}
