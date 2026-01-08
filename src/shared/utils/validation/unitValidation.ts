import type { Unit } from '@/shared/types';
import { VALID_UNITS } from '@/shared/types';

/**
 * Validates that a unit is a valid Unit type.
 * Type guard that narrows the type to Unit when returning true.
 *
 * @param unit - The unit string to validate
 * @returns true if unit is a valid Unit, false otherwise
 *
 * @example
 * ```ts
 * const input: string = 'pieces';
 * if (isValidUnit(input)) {
 *   // input is now typed as Unit
 *   const unit: Unit = input;
 * }
 * ```
 */
export function isValidUnit(unit: string): unit is Unit {
  // Handle edge cases: null, undefined, non-string types
  if (unit === null || unit === undefined || typeof unit !== 'string') {
    return false;
  }

  return VALID_UNITS.includes(unit as Unit);
}
