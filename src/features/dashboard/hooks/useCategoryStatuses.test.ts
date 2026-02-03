import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCategoryStatuses } from './useCategoryStatuses';
import { STANDARD_CATEGORIES } from '@/features/categories';

vi.mock('@/features/inventory', () => ({
  useInventory: vi.fn(),
}));

vi.mock('@/features/household', () => ({
  useHousehold: vi.fn(),
}));

vi.mock('@/features/templates', () => ({
  useRecommendedItems: vi.fn(),
}));

vi.mock('./useCalculationOptions', () => ({
  useCalculationOptions: vi.fn(),
}));

import { useInventory } from '@/features/inventory';
import { useHousehold } from '@/features/household';
import { useRecommendedItems } from '@/features/templates';
import { useCalculationOptions } from './useCalculationOptions';

describe('useCategoryStatuses', () => {
  const defaultMocks = () => {
    vi.mocked(useInventory).mockReturnValue({
      items: [],
      categories: STANDARD_CATEGORIES,
      addItem: vi.fn(),
      addItems: vi.fn(),
      updateItem: vi.fn(),
      deleteItem: vi.fn(),
      dismissedAlertIds: [],
      dismissAlert: vi.fn(),
      dismissAlerts: vi.fn(),
      reactivateAlert: vi.fn(),
      reactivateAllAlerts: vi.fn(),
      disabledRecommendedItems: [],
      disableRecommendedItem: vi.fn(),
      enableRecommendedItem: vi.fn(),
      enableAllRecommendedItems: vi.fn(),
      disabledCategories: [],
      disableCategory: vi.fn(),
      enableCategory: vi.fn(),
      enableAllCategories: vi.fn(),
      customCategories: [],
      addCustomCategory: vi.fn(),
      updateCustomCategory: vi.fn(),
      deleteCustomCategory: vi.fn(() => ({ success: true })),
    });

    vi.mocked(useHousehold).mockReturnValue({
      household: {
        adults: 2,
        children: 0,
        pets: 0,
        supplyDurationDays: 3,
        useFreezer: false,
      },
      updateHousehold: vi.fn(),
      setPreset: vi.fn(),
    });

    vi.mocked(useRecommendedItems).mockReturnValue({
      recommendedItems: [],
      availableKits: [],
      selectedKitId: undefined,
      selectKit: vi.fn(),
      uploadKit: vi.fn(),
      deleteKit: vi.fn(),
      forkBuiltInKit: vi.fn(),
      updateCurrentKitMeta: vi.fn(),
      addItemToKit: vi.fn(),
      updateItemInKit: vi.fn(),
      removeItemFromKit: vi.fn(),
      customRecommendationsInfo: undefined,
      isUsingCustomRecommendations: false,
      importRecommendedItems: vi.fn(),
      exportRecommendedItems: vi.fn(),
      resetToDefaultRecommendations: vi.fn(),
      getItemName: vi.fn(),
    });

    vi.mocked(useCalculationOptions).mockReturnValue({
      childrenMultiplier: 0.75,
      dailyCaloriesPerPerson: 2000,
      dailyWaterPerPerson: 3,
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    defaultMocks();
  });

  it('should return category statuses for all standard categories', () => {
    const { result } = renderHook(() => useCategoryStatuses());

    expect(result.current.categoryStatuses).toHaveLength(
      STANDARD_CATEGORIES.length,
    );
    expect(result.current.categoryStatuses[0]).toHaveProperty('categoryId');
    expect(result.current.categoryStatuses[0]).toHaveProperty('status');
    expect(result.current.categoryStatuses[0]).toHaveProperty(
      'completionPercentage',
    );
  });

  it('should return preparedness score based on category statuses', () => {
    const { result } = renderHook(() => useCategoryStatuses());

    expect(typeof result.current.preparednessScore).toBe('number');
    expect(result.current.preparednessScore).toBeGreaterThanOrEqual(0);
    expect(result.current.preparednessScore).toBeLessThanOrEqual(100);
  });

  it('should return category preparedness map', () => {
    const { result } = renderHook(() => useCategoryStatuses());

    expect(result.current.categoryPreparedness).toBeInstanceOf(Map);
    expect(result.current.categoryPreparedness.size).toBe(
      STANDARD_CATEGORIES.length,
    );
  });

  it('should memoize results when dependencies do not change', () => {
    const { result, rerender } = renderHook(() => useCategoryStatuses());
    const firstStatuses = result.current.categoryStatuses;

    rerender();
    const secondStatuses = result.current.categoryStatuses;

    expect(firstStatuses).toBe(secondStatuses);
  });
});
