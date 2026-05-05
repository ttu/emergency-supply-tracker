/**
 * Mutation-killing tests for useCalculationOptions.ts
 *
 * Target: ArrayDeclaration L28 [] — the useMemo dependency array.
 * If mutated to ["Stryker was here"], the useMemo dependency array changes,
 * which could cause the memoized value to recompute differently on rerenders.
 * We verify that when settings change, the hook returns updated values.
 */
import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCalculationOptions } from './useCalculationOptions';
import { createPercentage } from '@/shared/types';

vi.mock('@/features/settings', () => ({
  useSettings: vi.fn(),
}));

import { useSettings } from '@/features/settings';

describe('useCalculationOptions mutation tests — useMemo deps', () => {
  it('recomputes when settings change between renders', () => {
    const baseSettings = {
      language: 'en' as const,
      theme: 'light' as const,
      highContrast: false,
      advancedFeatures: {
        calorieTracking: false,
        powerManagement: false,
        waterTracking: false,
      },
    };

    // First render with default settings
    vi.mocked(useSettings).mockReturnValue({
      settings: { ...baseSettings },
      updateSettings: vi.fn(),
    });

    const { result, rerender } = renderHook(() => useCalculationOptions());
    const firstResult = result.current;

    // Change settings
    vi.mocked(useSettings).mockReturnValue({
      settings: {
        ...baseSettings,
        childrenRequirementPercentage: createPercentage(50),
        dailyCaloriesPerPerson: 3000,
        dailyWaterPerPerson: 5,
      },
      updateSettings: vi.fn(),
    });

    rerender();
    const secondResult = result.current;

    // If deps array is mutated to contain a constant string, the memo won't update
    expect(secondResult.childrenMultiplier).toBe(0.5);
    expect(secondResult.dailyCaloriesPerPerson).toBe(3000);
    expect(secondResult.dailyWaterPerPerson).toBe(5);
    expect(secondResult).not.toBe(firstResult);
  });
});
