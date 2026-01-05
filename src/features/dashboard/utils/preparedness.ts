import type {
  InventoryItem,
  HouseholdConfig,
  RecommendedItemDefinition,
} from '@/shared/types';
import { RECOMMENDED_ITEMS } from '@/features/templates';
import {
  MAX_ITEM_SCORE,
  DEFAULT_FULL_PREPAREDNESS,
  DEFAULT_EMPTY_PREPAREDNESS,
  ADULT_REQUIREMENT_MULTIPLIER,
  CHILDREN_REQUIREMENT_MULTIPLIER,
} from '@/shared/utils/constants';
import type { CategoryCalculationOptions } from './categoryStatus';

/**
 * Calculate overall preparedness score (0-100)
 * based on how many recommended items the user has
 */
export function calculatePreparednessScore(
  items: InventoryItem[],
  household: HouseholdConfig,
  recommendedItems: RecommendedItemDefinition[] = RECOMMENDED_ITEMS,
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
    let quantity = recItem.baseQuantity;

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

    // Find matching inventory items by productTemplateId or name only
    // (not by category, to avoid double-counting items across multiple recommended items)
    const matchingItems = items.filter(
      (item) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        item.productTemplateId === (recItem.id as any) ||
        item.name === recItem.id,
    );

    const totalQty = matchingItems.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );

    // Score is percentage of recommended quantity, capped at MAX_ITEM_SCORE
    const itemScore = Math.min(
      (totalQty / recommendedQty) * MAX_ITEM_SCORE,
      MAX_ITEM_SCORE,
    );
    totalScore += itemScore;
    maxPossibleScore += MAX_ITEM_SCORE;
  });

  return Math.round((totalScore / maxPossibleScore) * MAX_ITEM_SCORE);
}

/**
 * Calculate preparedness for a specific category
 */
export function calculateCategoryPreparedness(
  categoryId: string,
  items: InventoryItem[],
  household: HouseholdConfig,
  disabledRecommendedItems: string[] = [],
  recommendedItems: RecommendedItemDefinition[] = RECOMMENDED_ITEMS,
  options: CategoryCalculationOptions = {},
): number {
  const categoryItems = items.filter((item) => item.categoryId === categoryId);
  const recommendedForCategory = recommendedItems.filter(
    (item) =>
      item.category === categoryId &&
      !disabledRecommendedItems.includes(item.id),
  );

  if (recommendedForCategory.length === 0) {
    return categoryItems.length > 0
      ? DEFAULT_FULL_PREPAREDNESS
      : DEFAULT_EMPTY_PREPAREDNESS;
  }

  // Use childrenMultiplier from options, falling back to default constant
  const childrenMultiplier =
    options.childrenMultiplier ?? CHILDREN_REQUIREMENT_MULTIPLIER;

  // Adults count as 1.0, children use the configurable multiplier
  const peopleMultiplier =
    household.adults * ADULT_REQUIREMENT_MULTIPLIER +
    household.children * childrenMultiplier;

  let totalScore = 0;
  let maxScore = 0;

  recommendedForCategory.forEach((recItem) => {
    let recommendedQty = recItem.baseQuantity;

    if (recItem.scaleWithPeople) {
      recommendedQty *= peopleMultiplier;
    }

    if (recItem.scaleWithDays) {
      recommendedQty *= household.supplyDurationDays;
    }

    const matchingItems = categoryItems.filter(
      (item) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        item.productTemplateId === (recItem.id as any) ||
        item.name === recItem.id,
    );

    const actualQty = matchingItems.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );
    const score = Math.min(
      (actualQty / recommendedQty) * MAX_ITEM_SCORE,
      MAX_ITEM_SCORE,
    );

    totalScore += score;
    maxScore += MAX_ITEM_SCORE;
  });

  return Math.round((totalScore / maxScore) * MAX_ITEM_SCORE);
}
