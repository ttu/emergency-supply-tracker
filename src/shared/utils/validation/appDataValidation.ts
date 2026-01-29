import type { AppData } from '@/shared/types';
import { VALID_THEMES } from '@/shared/types';

/**
 * Validation error details for data validation.
 * When message is an i18n key, use interpolation for placeholder values in the UI.
 */
export interface DataValidationError {
  field: string;
  /** i18n key or fallback message; translated in UI when key exists */
  message: string;
  value?: unknown;
  /** Optional interpolation for i18n when message is a key (e.g. value, allowed, field) */
  interpolation?: Record<string, string | number>;
}

/**
 * Result of comprehensive data validation.
 */
export interface DataValidationResult {
  isValid: boolean;
  errors: DataValidationError[];
}

/**
 * Valid language values for settings.
 */
const VALID_LANGUAGES = ['en', 'fi'] as const;

/** Valid range for childrenRequirementPercentage (0–100). */
const CHILDREN_REQUIREMENT_MIN = 0;
const CHILDREN_REQUIREMENT_MAX = 100;

/**
 * Safely converts a value to a string representation for error messages.
 * Handles objects by using JSON.stringify to avoid "[object Object]".
 */
function safeStringify(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  const type = typeof value;
  // Handle primitives directly
  if (type === 'string' || type === 'number' || type === 'boolean') {
    return String(value);
  }
  // Use JSON.stringify for objects, arrays, and any other types
  return JSON.stringify(value);
}

/**
 * Validates that the given data has the structure of AppData.
 * This is a type guard that checks for required fields and their types.
 *
 * @param data - Unknown data to validate
 * @returns True if data matches AppData structure
 */
export function isValidAppData(data: unknown): data is AppData {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;

  return (
    typeof d.version === 'string' &&
    d.household !== null &&
    !Array.isArray(d.household) &&
    typeof d.household === 'object' &&
    d.settings !== null &&
    !Array.isArray(d.settings) &&
    typeof d.settings === 'object' &&
    Array.isArray(d.items) &&
    typeof d.lastModified === 'string'
    // categories is optional - will be populated from STANDARD_CATEGORIES if missing
  );
}

/**
 * Validates settings values (language, theme, numeric fields).
 */
function validateSettings(
  settings: Record<string, unknown>,
): DataValidationError[] {
  const errors: DataValidationError[] = [];

  // Validate language
  if (
    settings.language !== undefined &&
    !VALID_LANGUAGES.includes(settings.language as 'en' | 'fi')
  ) {
    errors.push({
      field: 'settings.language',
      message: 'validation.settings.languageInvalid',
      value: settings.language,
      interpolation: {
        value: safeStringify(settings.language),
        allowed: VALID_LANGUAGES.join(', '),
      },
    });
  }

  // Validate theme
  if (
    settings.theme !== undefined &&
    !VALID_THEMES.includes(settings.theme as (typeof VALID_THEMES)[number])
  ) {
    errors.push({
      field: 'settings.theme',
      message: 'validation.settings.themeInvalid',
      value: settings.theme,
      interpolation: {
        value: safeStringify(settings.theme),
        allowed: VALID_THEMES.join(', '),
      },
    });
  }

  // Validate numeric fields
  if (
    settings.dailyCaloriesPerPerson !== undefined &&
    (!Number.isFinite(settings.dailyCaloriesPerPerson) ||
      (settings.dailyCaloriesPerPerson as number) < 0)
  ) {
    errors.push({
      field: 'settings.dailyCaloriesPerPerson',
      message: 'validation.settings.dailyCaloriesPerPerson',
      value: settings.dailyCaloriesPerPerson,
    });
  }

  if (
    settings.dailyWaterPerPerson !== undefined &&
    (!Number.isFinite(settings.dailyWaterPerPerson) ||
      (settings.dailyWaterPerPerson as number) < 0)
  ) {
    errors.push({
      field: 'settings.dailyWaterPerPerson',
      message: 'validation.settings.dailyWaterPerPerson',
      value: settings.dailyWaterPerPerson,
    });
  }

  if (
    settings.childrenRequirementPercentage !== undefined &&
    (!Number.isFinite(settings.childrenRequirementPercentage) ||
      (settings.childrenRequirementPercentage as number) <
        CHILDREN_REQUIREMENT_MIN ||
      (settings.childrenRequirementPercentage as number) >
        CHILDREN_REQUIREMENT_MAX)
  ) {
    errors.push({
      field: 'settings.childrenRequirementPercentage',
      message: 'validation.settings.childrenRequirementPercentage',
      value: settings.childrenRequirementPercentage,
    });
  }

  return errors;
}

/**
 * Validates household configuration values.
 */
function validateHousehold(
  household: Record<string, unknown>,
): DataValidationError[] {
  const errors: DataValidationError[] = [];

  // Validate numeric fields
  const numericFields = ['adults', 'children', 'pets', 'supplyDurationDays'];
  for (const field of numericFields) {
    const value = household[field];
    if (value !== undefined) {
      if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
        errors.push({
          field: `household.${field}`,
          message: 'validation.household.nonNegativeNumber',
          value,
          interpolation: { field },
        });
      }
    }
  }

  // Validate useFreezer is boolean if present
  if (
    household.useFreezer !== undefined &&
    typeof household.useFreezer !== 'boolean'
  ) {
    errors.push({
      field: 'household.useFreezer',
      message: 'validation.household.useFreezerBoolean',
      value: household.useFreezer,
    });
  }

  return errors;
}

/**
 * Comprehensively validates AppData including value validation.
 * This goes beyond structure checking to validate actual field values.
 *
 * @param data - Data to validate (should pass isValidAppData first)
 * @returns Validation result with error details
 */
export function validateAppDataValues(data: AppData): DataValidationResult {
  const errors: DataValidationError[] = [];

  // Validate settings if present
  if (data.settings && typeof data.settings === 'object') {
    errors.push(
      ...validateSettings(data.settings as unknown as Record<string, unknown>),
    );
  }

  // Validate household if present
  if (data.household && typeof data.household === 'object') {
    errors.push(
      ...validateHousehold(
        data.household as unknown as Record<string, unknown>,
      ),
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
