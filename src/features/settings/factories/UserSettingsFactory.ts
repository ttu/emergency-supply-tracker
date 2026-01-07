import type { UserSettings } from '@/shared/types';
import {
  DAILY_CALORIES_PER_PERSON,
  DAILY_WATER_PER_PERSON,
  CHILDREN_REQUIREMENT_MULTIPLIER,
} from '@/shared/utils/constants';

/**
 * Input for creating user settings.
 * All fields are optional as settings have defaults.
 */
export type CreateUserSettingsInput = Partial<UserSettings>;

/**
 * Validation error thrown when settings creation fails validation.
 */
export class UserSettingsValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UserSettingsValidationError';
  }
}

/**
 * Valid language values.
 */
const VALID_LANGUAGES = ['en', 'fi'] as const;

/**
 * Valid theme values.
 */
const VALID_THEMES = [
  'light',
  'dark',
  'auto',
  'midnight',
  'ocean',
  'sunset',
  'forest',
  'lavender',
  'minimal',
] as const;

/**
 * Validates user settings input.
 */
function validateUserSettings(input: CreateUserSettingsInput): void {
  // Validate language
  if (input.language && !VALID_LANGUAGES.includes(input.language)) {
    throw new UserSettingsValidationError(
      `Invalid language: ${input.language}. Must be one of: ${VALID_LANGUAGES.join(', ')}`,
    );
  }

  // Validate theme
  if (input.theme && !VALID_THEMES.includes(input.theme)) {
    throw new UserSettingsValidationError(
      `Invalid theme: ${input.theme}. Must be one of: ${VALID_THEMES.join(', ')}`,
    );
  }

  // Validate dailyCaloriesPerPerson
  if (
    input.dailyCaloriesPerPerson !== undefined &&
    input.dailyCaloriesPerPerson < 0
  ) {
    throw new UserSettingsValidationError(
      `dailyCaloriesPerPerson must be non-negative, got ${input.dailyCaloriesPerPerson}`,
    );
  }

  // Validate dailyWaterPerPerson
  if (
    input.dailyWaterPerPerson !== undefined &&
    input.dailyWaterPerPerson < 0
  ) {
    throw new UserSettingsValidationError(
      `dailyWaterPerPerson must be non-negative, got ${input.dailyWaterPerPerson}`,
    );
  }

  // Validate childrenRequirementPercentage
  if (
    input.childrenRequirementPercentage !== undefined &&
    (input.childrenRequirementPercentage < 0 ||
      input.childrenRequirementPercentage > 100)
  ) {
    throw new UserSettingsValidationError(
      `childrenRequirementPercentage must be between 0 and 100, got ${input.childrenRequirementPercentage}`,
    );
  }
}

/**
 * Factory for creating UserSettings instances with validation and defaults.
 */
export class UserSettingsFactory {
  /**
   * Creates user settings from input data.
   * Merges with defaults and validates all inputs.
   *
   * @param input - Settings data (all fields optional)
   * @returns Validated UserSettings with defaults applied
   * @throws UserSettingsValidationError if validation fails
   */
  static create(input: CreateUserSettingsInput = {}): UserSettings {
    validateUserSettings(input);

    const defaults: UserSettings = {
      language: 'en',
      theme: 'ocean',
      highContrast: false,
      advancedFeatures: {
        calorieTracking: false,
        powerManagement: false,
        waterTracking: false,
      },
      dailyCaloriesPerPerson: DAILY_CALORIES_PER_PERSON,
      dailyWaterPerPerson: DAILY_WATER_PER_PERSON,
      childrenRequirementPercentage: CHILDREN_REQUIREMENT_MULTIPLIER * 100,
    };

    // Deep merge advancedFeatures
    const advancedFeatures = {
      ...defaults.advancedFeatures,
      ...input.advancedFeatures,
    };

    return {
      ...defaults,
      ...input,
      advancedFeatures,
    };
  }

  /**
   * Creates default user settings.
   *
   * @returns UserSettings with all defaults
   */
  static createDefault(): UserSettings {
    return this.create({});
  }
}
