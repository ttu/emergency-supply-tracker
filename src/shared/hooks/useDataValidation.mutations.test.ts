/**
 * Mutation-killing tests for useDataValidation.ts
 *
 * Target: ArrayDeclaration L52 ["Stryker was here"] — the useCallback dependency array [].
 * With empty deps [], the retry callback should be referentially stable across renders.
 * With ["Stryker was here"] in deps, it would create a new function each render.
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

  it('retry callback is referentially stable across rerenders (empty deps)', () => {
    const { result, rerender } = renderHook(() => useDataValidation());
    const retryFirst = result.current.retry;

    rerender();

    // With [] deps, retry should be the same reference
    // With ["Stryker was here"] deps, a new function would be created
    expect(result.current.retry).toBe(retryFirst);
  });
});
