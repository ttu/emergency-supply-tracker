import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCalculationOptions } from './useCalculationOptions';
import {
  DAILY_CALORIES_PER_PERSON,
  DAILY_WATER_PER_PERSON,
  CHILDREN_REQUIREMENT_MULTIPLIER,
} from '@/shared/utils/constants';
import { createPercentage } from '@/shared/types';

vi.mock('@/features/settings', () => ({
  useSettings: vi.fn(),
}));

import { useSettings } from '@/features/settings';

describe('useCalculationOptions', () => {
  it('should return default values when settings are not configured', () => {
    vi.mocked(useSettings).mockReturnValue({
      settings: {
        language: 'en',
        theme: 'light',
        highContrast: false,
        advancedFeatures: {
          calorieTracking: false,
          powerManagement: false,
          waterTracking: false,
        },
      },
      updateSettings: vi.fn(),
    });

    const { result } = renderHook(() => useCalculationOptions());

    expect(result.current).toEqual({
      childrenMultiplier: CHILDREN_REQUIREMENT_MULTIPLIER,
      dailyCaloriesPerPerson: DAILY_CALORIES_PER_PERSON,
      dailyWaterPerPerson: DAILY_WATER_PER_PERSON,
    });
  });

  it('should return custom values from settings when configured', () => {
    vi.mocked(useSettings).mockReturnValue({
      settings: {
        language: 'en',
        theme: 'light',
        highContrast: false,
        advancedFeatures: {
          calorieTracking: true,
          powerManagement: false,
          waterTracking: true,
        },
        childrenRequirementPercentage: createPercentage(50),
        dailyCaloriesPerPerson: 2500,
        dailyWaterPerPerson: 4,
      },
      updateSettings: vi.fn(),
    });

    const { result } = renderHook(() => useCalculationOptions());

    expect(result.current).toEqual({
      childrenMultiplier: 0.5,
      dailyCaloriesPerPerson: 2500,
      dailyWaterPerPerson: 4,
    });
  });

  it('should memoize the result to prevent unnecessary recalculations', () => {
    const mockSettings = {
      language: 'en' as const,
      theme: 'light' as const,
      highContrast: false,
      advancedFeatures: {
        calorieTracking: false,
        powerManagement: false,
        waterTracking: false,
      },
    };

    vi.mocked(useSettings).mockReturnValue({
      settings: mockSettings,
      updateSettings: vi.fn(),
    });

    const { result, rerender } = renderHook(() => useCalculationOptions());
    const firstResult = result.current;

    rerender();
    const secondResult = result.current;

    expect(firstResult).toBe(secondResult);
  });
});
