import { useState, useCallback } from 'react';
import {
  getAppData,
  getLastDataValidationResult,
  clearDataValidationResult,
} from '@/shared/utils/storage/localStorage';
import type { DataValidationResult } from '@/shared/utils/validation/appDataValidation';

interface UseDataValidationResult {
  /** Whether there was a validation error on load */
  hasValidationError: boolean;
  /** The validation result with error details, if any */
  validationResult: DataValidationResult | null;
  /** Clear the error and retry loading data */
  retry: () => void;
}

/**
 * Performs initial data validation check.
 * This is called once during module initialization to trigger validation.
 */
function checkInitialValidation(): {
  hasError: boolean;
  result: DataValidationResult | null;
} {
  // Trigger data load which will validate the data
  getAppData();
  const result = getLastDataValidationResult();
  return {
    hasError: result !== null && !result.isValid,
    result,
  };
}

/**
 * Hook to check for data validation errors on app load.
 * This should be used at the top level of the app to detect corrupted data.
 *
 * @returns Validation state and retry function
 */
export function useDataValidation(): UseDataValidationResult {
  // Initialize state with validation check - only runs once on component mount
  const [{ hasValidationError, validationResult }] = useState(() => {
    const { hasError, result } = checkInitialValidation();
    return { hasValidationError: hasError, validationResult: result };
  });

  const retry = useCallback(() => {
    clearDataValidationResult();
    // Force a page reload to reinitialize everything
    globalThis.location.reload();
  }, []);

  return {
    hasValidationError,
    validationResult,
    retry,
  };
}
