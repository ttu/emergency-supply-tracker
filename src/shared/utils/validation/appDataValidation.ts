import type { AppData } from '@/shared/types';
import { VALID_THEMES } from '@/shared/types';

/**
 * Validation error details for data validation.
 */
export interface DataValidationError {
  field: string;
  message: string;
  value?: unknown;
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
      message: `Invalid language: "${settings.language}". Must be one of: ${VALID_LANGUAGES.join(', ')}`,
      value: settings.language,
    });
  }

  // Validate theme
  if (
    settings.theme !== undefined &&
    !VALID_THEMES.includes(settings.theme as (typeof VALID_THEMES)[number])
  ) {
    errors.push({
      field: 'settings.theme',
      message: `Invalid theme: "${settings.theme}". Must be one of: ${VALID_THEMES.join(', ')}`,
      value: settings.theme,
    });
  }

  // Validate numeric fields
  if (
    settings.dailyCaloriesPerPerson !== undefined &&
    (typeof settings.dailyCaloriesPerPerson !== 'number' ||
      settings.dailyCaloriesPerPerson < 0)
  ) {
    errors.push({
      field: 'settings.dailyCaloriesPerPerson',
      message: 'dailyCaloriesPerPerson must be a non-negative number',
      value: settings.dailyCaloriesPerPerson,
    });
  }

  if (
    settings.dailyWaterPerPerson !== undefined &&
    (typeof settings.dailyWaterPerPerson !== 'number' ||
      settings.dailyWaterPerPerson < 0)
  ) {
    errors.push({
      field: 'settings.dailyWaterPerPerson',
      message: 'dailyWaterPerPerson must be a non-negative number',
      value: settings.dailyWaterPerPerson,
    });
  }

  if (
    settings.childrenRequirementPercentage !== undefined &&
    (typeof settings.childrenRequirementPercentage !== 'number' ||
      settings.childrenRequirementPercentage < 0 ||
      settings.childrenRequirementPercentage > 100)
  ) {
    errors.push({
      field: 'settings.childrenRequirementPercentage',
      message:
        'childrenRequirementPercentage must be a number between 0 and 100',
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
          message: `${field} must be a non-negative number`,
          value,
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
      message: 'useFreezer must be a boolean',
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
