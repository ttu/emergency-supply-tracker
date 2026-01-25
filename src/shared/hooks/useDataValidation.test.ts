import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDataValidation } from './useDataValidation';
import type { DataValidationResult } from '@/shared/utils/validation/appDataValidation';

// Mock localStorage utilities
vi.mock('@/shared/utils/storage/localStorage', () => ({
  getAppData: vi.fn(),
  getLastDataValidationResult: vi.fn(),
  clearDataValidationResult: vi.fn(),
}));

// Import after mocking
import * as localStorage from '@/shared/utils/storage/localStorage';

describe('useDataValidation', () => {
  const mockGetAppData = vi.mocked(localStorage.getAppData);
  const mockGetLastDataValidationResult = vi.mocked(
    localStorage.getLastDataValidationResult,
  );
  const mockClearDataValidationResult = vi.mocked(
    localStorage.clearDataValidationResult,
  );

  let reloadSpy: ReturnType<typeof vi.fn>;
  let originalLocation: Location;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock location.reload
    reloadSpy = vi.fn();
    originalLocation = globalThis.location;
    Object.defineProperty(globalThis, 'location', {
      value: { reload: reloadSpy },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    // Restore original location
    Object.defineProperty(globalThis, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true,
    });
  });

  describe('when validation result has isValid === false', () => {
    it('should expose hasValidationError true and validationResult with errors', () => {
      const mockValidationResult: DataValidationResult = {
        isValid: false,
        errors: [
          {
            field: 'settings.theme',
            message: 'Invalid theme',
            value: 'invalid',
          },
        ],
      };

      mockGetLastDataValidationResult.mockReturnValue(mockValidationResult);

      const { result } = renderHook(() => useDataValidation());

      expect(result.current.hasValidationError).toBe(true);
      expect(result.current.validationResult).toEqual(mockValidationResult);
      expect(mockGetAppData).toHaveBeenCalled();
    });
  });

  describe('when validation result is null', () => {
    it('should expose hasValidationError false and validationResult null', () => {
      mockGetLastDataValidationResult.mockReturnValue(null);

      const { result } = renderHook(() => useDataValidation());

      expect(result.current.hasValidationError).toBe(false);
      expect(result.current.validationResult).toBeNull();
    });
  });

  describe('when validation result has isValid === true', () => {
    it('should expose hasValidationError false', () => {
      const mockValidationResult: DataValidationResult = {
        isValid: true,
        errors: [],
      };

      mockGetLastDataValidationResult.mockReturnValue(mockValidationResult);

      const { result } = renderHook(() => useDataValidation());

      expect(result.current.hasValidationError).toBe(false);
      expect(result.current.validationResult).toEqual(mockValidationResult);
    });
  });

  describe('retry()', () => {
    it('should call clearDataValidationResult and location.reload', () => {
      const mockValidationResult: DataValidationResult = {
        isValid: false,
        errors: [{ field: 'test', message: 'error' }],
      };

      mockGetLastDataValidationResult.mockReturnValue(mockValidationResult);

      const { result } = renderHook(() => useDataValidation());

      act(() => {
        result.current.retry();
      });

      expect(mockClearDataValidationResult).toHaveBeenCalled();
      expect(reloadSpy).toHaveBeenCalled();
    });
  });
});
