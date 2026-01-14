import { useMemo } from 'react';
import { useInventory } from '@/features/inventory';
import { useHousehold } from '@/features/household';
import { useRecommendedItems } from '@/features/templates';
import { STANDARD_CATEGORIES } from '@/features/categories';
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
  const { items, disabledRecommendedItems } = useInventory();
  const { household } = useHousehold();
  const { recommendedItems } = useRecommendedItems();
  const calculationOptions = useCalculationOptions();

  // Calculate per-category preparedness
  const categoryPreparedness = useMemo(() => {
    const map = new Map<string, number>();
    STANDARD_CATEGORIES.forEach((category) => {
      const score = calculateCategoryPreparedness(
        category.id,
        items,
        household,
        disabledRecommendedItems,
        recommendedItems,
        calculationOptions,
      );
      map.set(category.id, score);
    });
    return map;
  }, [
    items,
    household,
    disabledRecommendedItems,
    recommendedItems,
    calculationOptions,
  ]);

  // Calculate category statuses
  const categoryStatuses = useMemo(
    () =>
      calculateAllCategoryStatuses(
        STANDARD_CATEGORIES,
        items,
        categoryPreparedness,
        household,
        disabledRecommendedItems,
        recommendedItems,
        calculationOptions,
      ),
    [
      items,
      categoryPreparedness,
      household,
      disabledRecommendedItems,
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
