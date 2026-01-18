import type { AppData } from '@/shared/types';

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
