import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCategoryStatuses } from './useCategoryStatuses';
import { STANDARD_CATEGORIES } from '@/features/categories';
import type { StandardCategoryId } from '@/shared/types';

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

describe('useCategoryStatuses - mutation killing tests', () => {
  const defaultMocks = () => {
    vi.mocked(useInventory).mockReturnValue({
      items: [],
      categories: STANDARD_CATEGORIES,
      addItem: vi.fn(),
      addItems: vi.fn(),
      updateItem: vi.fn(),
      deleteItem: vi.fn(),
      deleteItems: vi.fn(),
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
      customTemplates: [],
      addCustomTemplate: vi.fn(),
      updateCustomTemplate: vi.fn(),
      deleteCustomTemplate: vi.fn(),
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

  describe('enabledCategories filtering (L37: STANDARD_CATEGORIES mutant)', () => {
    it('filters out disabled categories correctly', () => {
      const firstCategoryId = STANDARD_CATEGORIES[0].id as StandardCategoryId;
      vi.mocked(useInventory).mockReturnValue({
        items: [],
        categories: STANDARD_CATEGORIES,
        addItem: vi.fn(),
        addItems: vi.fn(),
        updateItem: vi.fn(),
        deleteItem: vi.fn(),
        deleteItems: vi.fn(),
        dismissedAlertIds: [],
        dismissAlert: vi.fn(),
        dismissAlerts: vi.fn(),
        reactivateAlert: vi.fn(),
        reactivateAllAlerts: vi.fn(),
        disabledRecommendedItems: [],
        disableRecommendedItem: vi.fn(),
        enableRecommendedItem: vi.fn(),
        enableAllRecommendedItems: vi.fn(),
        disabledCategories: [firstCategoryId],
        disableCategory: vi.fn(),
        enableCategory: vi.fn(),
        enableAllCategories: vi.fn(),
        customCategories: [],
        addCustomCategory: vi.fn(),
        updateCustomCategory: vi.fn(),
        deleteCustomCategory: vi.fn(() => ({ success: true })),
        customTemplates: [],
        addCustomTemplate: vi.fn(),
        updateCustomTemplate: vi.fn(),
        deleteCustomTemplate: vi.fn(),
      });

      const { result } = renderHook(() => useCategoryStatuses());

      // Should have one fewer category
      expect(result.current.categoryStatuses).toHaveLength(
        STANDARD_CATEGORIES.length - 1,
      );
      // The disabled category should not appear
      const categoryIds = result.current.categoryStatuses.map(
        (s) => s.categoryId,
      );
      expect(categoryIds).not.toContain(firstCategoryId);
    });
  });

  describe('array return values (L41, L65, L100: [] mutants)', () => {
    it('categoryStatuses is a non-empty array with all standard categories', () => {
      const { result } = renderHook(() => useCategoryStatuses());

      // If L41/L65/L100 returns [], these would fail
      expect(result.current.categoryStatuses).toHaveLength(
        STANDARD_CATEGORIES.length,
      );
      expect(result.current.categoryStatuses.length).toBeGreaterThan(0);
    });

    it('categoryPreparedness map has entries for all enabled categories', () => {
      const { result } = renderHook(() => useCategoryStatuses());

      expect(result.current.categoryPreparedness.size).toBe(
        STANDARD_CATEGORIES.length,
      );
      // Verify each category has a numeric score
      for (const category of STANDARD_CATEGORIES) {
        expect(result.current.categoryPreparedness.has(category.id)).toBe(true);
        expect(
          typeof result.current.categoryPreparedness.get(category.id),
        ).toBe('number');
      }
    });

    it('preparednessScore is a number (not undefined from empty array mutant)', () => {
      const { result } = renderHook(() => useCategoryStatuses());

      // With empty inventory, score is 0 but must be a number (not undefined)
      // If ArrayDeclaration mutant replaces [] with ["Stryker was here"],
      // the category statuses would be corrupted
      expect(typeof result.current.preparednessScore).toBe('number');
      expect(Number.isNaN(result.current.preparednessScore)).toBe(false);
    });

    it('each category status has required properties', () => {
      const { result } = renderHook(() => useCategoryStatuses());

      for (const status of result.current.categoryStatuses) {
        expect(status).toHaveProperty('categoryId');
        expect(status).toHaveProperty('status');
        expect(status).toHaveProperty('completionPercentage');
        expect(typeof status.categoryId).toBe('string');
        expect(typeof status.completionPercentage).toBe('number');
      }
    });
  });
});
