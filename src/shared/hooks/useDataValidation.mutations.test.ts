/**
 * Mutation-killing tests for useDataValidation.ts
 *
 * Target: ArrayDeclaration L52 ["Stryker was here"] — the useCallback dependency array [].
 * If mutated to ["Stryker was here"], the retry callback would be recreated on every render
 * instead of being stable. We verify referential stability of the retry function.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDataValidation } from './useDataValidation';

vi.mock('@/shared/utils/storage/localStorage', () => ({
  getAppData: vi.fn(),
  getLastDataValidationResult: vi.fn(),
  clearDataValidationResult: vi.fn(),
}));

import * as localStorage from '@/shared/utils/storage/localStorage';

describe('useDataValidation mutation tests — useCallback deps', () => {
  let originalLocation: Location;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(localStorage.getLastDataValidationResult).mockReturnValue(null);

    originalLocation = globalThis.location;
    Object.defineProperty(globalThis, 'location', {
      value: { reload: vi.fn() },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(globalThis, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true,
    });
  });

  it('retry function maintains referential identity across rerenders', () => {
    const { result, rerender } = renderHook(() => useDataValidation());
    const firstRetry = result.current.retry;

    rerender();
    const secondRetry = result.current.retry;

    // If deps array is mutated to contain a string, useCallback would recreate
    // the function on every render since the deps always change
    expect(firstRetry).toBe(secondRetry);
  });
});
