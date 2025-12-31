import type {
  InventoryItem,
  HouseholdConfig,
  RecommendedItemDefinition,
} from '../../types';
import { RECOMMENDED_ITEMS } from '../../data/recommendedItems';
import {
  MAX_ITEM_SCORE,
  DEFAULT_FULL_PREPAREDNESS,
  DEFAULT_EMPTY_PREPAREDNESS,
} from '../constants';

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

    // Find matching inventory items by productTemplateId or name
    const matchingItems = items.filter(
      (item) =>
        item.productTemplateId === recItem.id ||
        item.name === recItem.id ||
        item.categoryId === recItem.category,
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

  const totalPeople = household.adults + household.children;
  let totalScore = 0;
  let maxScore = 0;

  recommendedForCategory.forEach((recItem) => {
    let recommendedQty = recItem.baseQuantity;

    if (recItem.scaleWithPeople) {
      recommendedQty *= totalPeople;
    }

    if (recItem.scaleWithDays) {
      recommendedQty *= household.supplyDurationDays;
    }

    const matchingItems = categoryItems.filter(
      (item) =>
        item.productTemplateId === recItem.id || item.name === recItem.id,
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
