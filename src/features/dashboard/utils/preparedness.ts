import type {
  InventoryItem,
  HouseholdConfig,
  RecommendedItemDefinition,
} from '@/shared/types';
import {
  MAX_ITEM_SCORE,
  DEFAULT_FULL_PREPAREDNESS,
  DEFAULT_EMPTY_PREPAREDNESS,
} from '@/shared/utils/constants';
import { calculateCategoryPercentage } from '@/shared/utils/calculations/categoryPercentage';
import { sumMatchingItemsQuantityByType } from '@/shared/utils/calculations/itemMatching';
import type {
  CategoryCalculationOptions,
  CategoryStatusSummary,
} from './categoryStatus';

/**
 * Calculate overall preparedness score (0-100) based on category statuses.
 * Score is calculated as: (number of OK categories / total categories) * 100
 */
export function calculatePreparednessScoreFromCategoryStatuses(
  categoryStatuses: CategoryStatusSummary[],
): number {
  if (categoryStatuses.length === 0) {
    return 0;
  }

  const okCategories = categoryStatuses.filter(
    (status) => status.status === 'ok',
  ).length;

  return Math.round((okCategories / categoryStatuses.length) * 100);
}

/**
 * Calculate overall preparedness score (0-100)
 * based on how many recommended items the user has
 * @deprecated Use calculatePreparednessScoreFromCategoryStatuses instead
 */
export function calculatePreparednessScore(
  items: InventoryItem[],
  household: HouseholdConfig,
  recommendedItems: RecommendedItemDefinition[],
): number {
  // Get recommended items for this household
  const recommendedForHousehold = recommendedItems.filter((item) => {
    // Skip frozen items if not using freezer
    if (item.requiresFreezer && !household.useFreezer) {
      return false;
    }
    return true;
  });

  if (recommendedForHousehold.length === 0) {
    return 0;
  }

  // Calculate recommended quantities
  const totalPeople = household.adults + household.children;
  const recommendedQuantities = new Map<string, number>();

  recommendedForHousehold.forEach((recItem) => {
    // Use regular number for calculations (Quantity is for storage/input boundaries)
    let quantity: number = recItem.baseQuantity;

    if (recItem.scaleWithPeople) {
      quantity *= totalPeople;
    }

    if (recItem.scaleWithDays) {
      quantity *= household.supplyDurationDays;
    }

    recommendedQuantities.set(recItem.id, Math.ceil(quantity));
  });

  // Calculate how well stocked each category is
  let totalScore = 0;
  let maxPossibleScore = 0;

  recommendedForHousehold.forEach((recItem) => {
    const recommendedQty = recommendedQuantities.get(recItem.id) || 0;

    // Skip items with zero recommended quantity to avoid division by zero
    if (recommendedQty === 0) {
      return;
    }

    // Find matching inventory items by itemType only using shared utility
    // (not by category, to avoid double-counting items across multiple recommended items)
    const totalQty = sumMatchingItemsQuantityByType(items, recItem.id);

    // Score is percentage of recommended quantity, capped at MAX_ITEM_SCORE
    const itemScore = Math.min(
      (totalQty / recommendedQty) * MAX_ITEM_SCORE,
      MAX_ITEM_SCORE,
    );
    totalScore += itemScore;
    maxPossibleScore += MAX_ITEM_SCORE;
  });

  // Avoid division by zero if no items contributed to the score
  if (maxPossibleScore === 0) {
    return 0;
  }

  return Math.round((totalScore / maxPossibleScore) * MAX_ITEM_SCORE);
}

/**
 * Calculate preparedness for a specific category.
 * Uses the unified category percentage calculator for consistency.
 * - Food category: Uses calorie-based calculation
 * - Other categories: Uses quantity-based calculation
 */
export function calculateCategoryPreparedness(
  categoryId: string,
  items: InventoryItem[],
  household: HouseholdConfig,
  recommendedItems: RecommendedItemDefinition[],
  disabledRecommendedItems: string[] = [],
  options: CategoryCalculationOptions = {},
): number {
  const categoryItems = items.filter((item) => item.categoryId === categoryId);
  // Ensure both sides are strings for comparison (handles branded types)
  const categoryIdStr =
    typeof categoryId === 'string' ? categoryId : String(categoryId);
  const recommendedForCategory = recommendedItems.filter((item) => {
    const itemCategoryStr =
      typeof item.category === 'string' ? item.category : String(item.category);
    return (
      itemCategoryStr === categoryIdStr &&
      !disabledRecommendedItems.includes(item.id)
    );
  });

  if (recommendedForCategory.length === 0) {
    return categoryItems.length > 0
      ? DEFAULT_FULL_PREPAREDNESS
      : DEFAULT_EMPTY_PREPAREDNESS;
  }

  // Use unified category percentage calculator
  // This ensures food categories use calorie-based calculation
  // and other categories use quantity-based calculation
  const percentageResult = calculateCategoryPercentage(
    categoryId,
    items,
    household,
    disabledRecommendedItems,
    recommendedItems,
    {
      childrenMultiplier: options.childrenMultiplier,
      dailyCaloriesPerPerson: options.dailyCaloriesPerPerson,
      dailyWaterPerPerson: options.dailyWaterPerPerson,
    },
  );

  // Return the percentage (0-100+)
  // Cap at 100 for preparedness score
  return Math.min(percentageResult.percentage, 100);
}
