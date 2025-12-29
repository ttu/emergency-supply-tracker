import type { InventoryItem, HouseholdConfig } from '../../types';
import { RECOMMENDED_ITEMS } from '../../data/recommendedItems';

/**
 * Calculate overall preparedness score (0-100)
 * based on how many recommended items the user has
 */
export function calculatePreparednessScore(
  items: InventoryItem[],
  household: HouseholdConfig,
): number {
  // Get recommended items for this household
  const recommendedForHousehold = RECOMMENDED_ITEMS.filter((item) => {
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

    // Score is percentage of recommended quantity, capped at 100%
    const itemScore = Math.min((totalQty / recommendedQty) * 100, 100);
    totalScore += itemScore;
    maxPossibleScore += 100;
  });

  return Math.round((totalScore / maxPossibleScore) * 100);
}

/**
 * Calculate preparedness for a specific category
 */
export function calculateCategoryPreparedness(
  categoryId: string,
  items: InventoryItem[],
  household: HouseholdConfig,
): number {
  const categoryItems = items.filter((item) => item.categoryId === categoryId);
  const recommendedForCategory = RECOMMENDED_ITEMS.filter(
    (item) => item.category === categoryId,
  );

  if (recommendedForCategory.length === 0) {
    return categoryItems.length > 0 ? 100 : 0;
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
    const score = Math.min((actualQty / recommendedQty) * 100, 100);

    totalScore += score;
    maxScore += 100;
  });

  return Math.round((totalScore / maxScore) * 100);
}
