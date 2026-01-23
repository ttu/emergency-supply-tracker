import { useMemo } from 'react';
import { useInventory } from '@/features/inventory';
import { useHousehold } from '@/features/household';
import { useRecommendedItems } from '@/features/templates';
import { STANDARD_CATEGORIES } from '@/features/categories';
import type { StandardCategoryId } from '@/shared/types';
import {
  calculateCategoryPreparedness,
  calculateAllCategoryStatuses,
  calculatePreparednessScoreFromCategoryStatuses,
} from '../utils';
import type { CategoryStatusSummary } from '../utils';
import { useCalculationOptions } from './useCalculationOptions';

export interface UseCategoryStatusesResult {
  categoryStatuses: CategoryStatusSummary[];
  preparednessScore: number;
  categoryPreparedness: Map<string, number>;
}

/**
 * Hook to calculate category statuses and overall preparedness.
 * Consolidates category preparedness calculations, status determination,
 * and overall preparedness score into a single reusable hook.
 */
export function useCategoryStatuses(): UseCategoryStatusesResult {
  const { items, disabledRecommendedItems, disabledCategories } =
    useInventory();
  const { household } = useHousehold();
  const { recommendedItems } = useRecommendedItems();
  const calculationOptions = useCalculationOptions();

  // Filter out disabled categories
  // Cast category.id to StandardCategoryId since STANDARD_CATEGORIES only contains standard categories
  const enabledCategories = useMemo(
    () =>
      STANDARD_CATEGORIES.filter(
        (category) =>
          !disabledCategories.includes(category.id as StandardCategoryId),
      ),
    [disabledCategories],
  );

  // Calculate per-category preparedness
  // Convert ProductTemplateId[] to string[] for compatibility with calculation functions
  const disabledRecommendedItemsAsStrings = useMemo(
    () => disabledRecommendedItems.map(String),
    [disabledRecommendedItems],
  );

  const categoryPreparedness = useMemo(() => {
    const map = new Map<string, number>();
    enabledCategories.forEach((category) => {
      const score = calculateCategoryPreparedness(
        category.id,
        items,
        household,
        recommendedItems,
        disabledRecommendedItemsAsStrings,
        calculationOptions,
      );
      map.set(category.id, score);
    });
    return map;
  }, [
    items,
    household,
    recommendedItems,
    disabledRecommendedItemsAsStrings,
    calculationOptions,
    enabledCategories,
  ]);

  // Calculate category statuses
  const categoryStatuses = useMemo(
    () =>
      calculateAllCategoryStatuses(
        enabledCategories,
        items,
        categoryPreparedness,
        household,
        recommendedItems,
        disabledRecommendedItemsAsStrings,
        calculationOptions,
      ),
    [
      enabledCategories,
      items,
      categoryPreparedness,
      household,
      disabledRecommendedItemsAsStrings,
      recommendedItems,
      calculationOptions,
    ],
  );

  // Calculate overall preparedness score based on category statuses
  const preparednessScore = useMemo(
    () => calculatePreparednessScoreFromCategoryStatuses(categoryStatuses),
    [categoryStatuses],
  );

  return {
    categoryStatuses,
    preparednessScore,
    categoryPreparedness,
  };
}
