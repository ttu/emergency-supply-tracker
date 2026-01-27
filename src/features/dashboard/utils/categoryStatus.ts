/**
 * Category status calculations for the dashboard.
 *
 * This module provides functions to calculate category status summaries,
 * including shortages, completion percentages, and overall status.
 *
 * Uses the Strategy pattern for category-specific calculations (food, water, etc.).
 */

import type {
  InventoryItem,
  ItemStatus,
  Category,
  HouseholdConfig,
  Unit,
  RecommendedItemDefinition,
} from '@/shared/types';
import { isFoodCategory } from '@/shared/types';
import { getStatusFromPercentage } from '@/shared/utils/calculations/itemStatus';
import { getRecommendedQuantityForItem } from '@/shared/utils/calculations/itemRecommendedQuantity';
import { calculateItemStatus } from '@/features/inventory/utils/status';
import { calculateCategoryPercentage } from '@/shared/utils/calculations/categoryPercentage';
import { findMatchingItems } from '@/shared/utils/calculations/itemMatching';
import { RECOMMENDED_ITEMS } from '@/features/templates';
import {
  getCategoryStrategy,
  type CategoryCalculationOptions,
  type CategoryShortage,
  type ShortageCalculationResult,
  type ItemCalculationResult,
  type CategoryCalculationContext,
} from '@/shared/utils/calculations/strategies';
import {
  ADULT_REQUIREMENT_MULTIPLIER,
  CHILDREN_REQUIREMENT_MULTIPLIER,
  CRITICAL_PERCENTAGE_THRESHOLD,
  WARNING_PERCENTAGE_THRESHOLD,
} from '@/shared/utils/constants';

// Re-export types for backward compatibility
export type { CategoryCalculationOptions, CategoryShortage };

export interface CategoryStatusSummary {
  categoryId: string;
  itemCount: number;
  status: ItemStatus;
  completionPercentage: number;
  criticalCount: number;
  warningCount: number;
  okCount: number;
  shortages: CategoryShortage[];
  totalActual: number;
  totalNeeded: number;
  primaryUnit?: Unit;
  // Calorie-based tracking for food category
  totalActualCalories?: number;
  totalNeededCalories?: number;
  missingCalories?: number;
  // Water breakdown for water-beverages category
  drinkingWaterNeeded?: number;
  preparationWaterNeeded?: number;
  // False when category has no recommendations (except food/water which always calculate)
  hasRecommendations: boolean;
}

/**
 * Build calculation context for strategies.
 */
function buildCalculationContext(
  categoryId: string,
  items: InventoryItem[],
  household: HouseholdConfig,
  recommendedItems: RecommendedItemDefinition[],
  disabledRecommendedItems: string[],
  options: CategoryCalculationOptions,
): CategoryCalculationContext {
  const childrenMultiplier =
    options.childrenMultiplier ?? CHILDREN_REQUIREMENT_MULTIPLIER;

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

  // Adults count as 1.0, children use the configurable multiplier
  const peopleMultiplier =
    household.adults * ADULT_REQUIREMENT_MULTIPLIER +
    household.children * childrenMultiplier;

  return {
    categoryId,
    items,
    categoryItems,
    recommendedForCategory,
    household,
    disabledRecommendedItems,
    options,
    peopleMultiplier,
  };
}

/**
 * Calculate shortages for a category using strategy pattern.
 */
export function calculateCategoryShortages(
  categoryId: string,
  items: InventoryItem[],
  household: HouseholdConfig,
  recommendedItems: RecommendedItemDefinition[],
  disabledRecommendedItems: string[] = [],
  options: CategoryCalculationOptions = {},
): ShortageCalculationResult {
  const context = buildCalculationContext(
    categoryId,
    items,
    household,
    recommendedItems,
    disabledRecommendedItems,
    options,
  );

  // No recommended items for this category
  if (context.recommendedForCategory.length === 0) {
    return {
      shortages: [],
      totalActual: 0,
      totalNeeded: 0,
      primaryUnit: undefined,
    };
  }

  // Get the appropriate strategy for this category
  const strategy = getCategoryStrategy(categoryId);

  // Calculate results for each recommended item
  const itemResults: ItemCalculationResult[] = [];

  context.recommendedForCategory.forEach((recItem) => {
    const recommendedQty = strategy.calculateRecommendedQuantity(
      recItem,
      context,
    );

    // Skip items with 0 recommended quantity (e.g., pet items when pets is 0)
    if (recommendedQty === 0) {
      return;
    }

    // Find matching items
    const matchingItems = findMatchingItems(context.categoryItems, recItem);
    const hasMarkedAsEnough = matchingItems.some((item) => item.markedAsEnough);

    // Calculate actual quantity (and calories for food)
    const { quantity: actualQty, calories: actualCalories } =
      strategy.calculateActualQuantity(matchingItems, recItem, context);

    itemResults.push({
      recItem,
      recommendedQty,
      actualQty,
      matchingItems,
      hasMarkedAsEnough,
      unit: recItem.unit,
      actualCalories,
    });
  });

  // Aggregate results using the strategy
  return strategy.aggregateTotals(itemResults, context);
}

/**
 * Check if a category has enough inventory based on strategy logic.
 */
function hasEnoughInventory(
  categoryId: string,
  result: ShortageCalculationResult,
): boolean {
  const strategy = getCategoryStrategy(categoryId);
  return strategy.hasEnoughInventory(result);
}

/**
 * Calculate status summary for a category.
 */
export function calculateCategoryStatus(
  category: Category,
  items: InventoryItem[],
  completionPercentage: number,
  household: HouseholdConfig,
  recommendedItems: RecommendedItemDefinition[],
  disabledRecommendedItems: string[] = [],
  options: CategoryCalculationOptions = {},
): CategoryStatusSummary {
  const categoryItems = items.filter((item) => item.categoryId === category.id);

  // Count items by status
  let criticalCount = 0;
  let warningCount = 0;
  let okCount = 0;

  categoryItems.forEach((item) => {
    // Calculate recommended quantity for status determination
    const recommendedQuantity = getRecommendedQuantityForItem(
      item,
      household,
      recommendedItems,
      options.childrenMultiplier,
    );
    const status =
      recommendedQuantity > 0
        ? calculateItemStatus(item, recommendedQuantity)
        : item.quantity === 0
          ? 'critical'
          : 'ok';
    if (status === 'critical') criticalCount++;
    else if (status === 'warning') warningCount++;
    else okCount++;
  });

  // Calculate shortages using strategy
  const shortageInfo = calculateCategoryShortages(
    category.id,
    items,
    household,
    recommendedItems,
    disabledRecommendedItems,
    options,
  );

  // Determine if this category has recommendations
  const categoryIdStr = String(category.id);
  const recommendedForCategory = recommendedItems.filter(
    (item) =>
      String(item.category) === categoryIdStr &&
      !disabledRecommendedItems.includes(item.id),
  );
  const hasRecommendations = recommendedForCategory.length > 0;

  // Check if inventory meets the minimum requirements
  // When using "none" kit (no recommendations at all), non-food/non-water categories have nothing to meet
  const isFood = isFoodCategory(category.id);
  const isWater = category.id === 'water-beverages';
  const kitHasNoRecommendations = recommendedItems.length === 0;
  const hasEnough =
    kitHasNoRecommendations && !isFood && !isWater
      ? true
      : hasEnoughInventory(category.id, shortageInfo);

  // Calculate effective percentage
  // For mixed units categories, use weighted fulfillment for consistency
  let effectivePercentage = completionPercentage;
  if (!shortageInfo.primaryUnit && shortageInfo.totalNeeded > 0) {
    // Use weighted fulfillment ratio to calculate percentage
    const weightedPercentage = Math.round(
      (shortageInfo.totalActual / shortageInfo.totalNeeded) * 100,
    );
    effectivePercentage = weightedPercentage;
  }

  // Determine overall category status
  let categoryStatus: ItemStatus;
  if (hasEnough) {
    categoryStatus = 'ok';
  } else if (
    criticalCount > 0 ||
    effectivePercentage < CRITICAL_PERCENTAGE_THRESHOLD
  ) {
    categoryStatus = 'critical';
  } else if (
    warningCount > 0 ||
    effectivePercentage < WARNING_PERCENTAGE_THRESHOLD
  ) {
    categoryStatus = 'warning';
  } else {
    categoryStatus = 'ok';
  }

  // Cap percentage at 100: exact 100 when enough, otherwise capped
  const finalCompletionPercentage = hasEnough
    ? 100
    : Math.min(effectivePercentage, 100);

  // For food/water without recommendations, get calorie/water values from percentage calculation
  // (shortageInfo won't have these when there are no recommendations)
  let { totalActualCalories, totalNeededCalories, missingCalories } =
    shortageInfo;
  const { drinkingWaterNeeded, preparationWaterNeeded } = shortageInfo;
  let totalActual = shortageInfo.totalActual;
  let totalNeeded = shortageInfo.totalNeeded;
  let primaryUnit = shortageInfo.primaryUnit;

  if (kitHasNoRecommendations) {
    const percentageResult = calculateCategoryPercentage(
      category.id,
      items,
      household,
      disabledRecommendedItems,
      recommendedItems,
      options,
    );

    if (isFood) {
      totalActualCalories = percentageResult.totalActualCalories;
      totalNeededCalories = percentageResult.totalNeededCalories;
      missingCalories =
        totalNeededCalories && totalActualCalories
          ? Math.max(0, totalNeededCalories - totalActualCalories)
          : undefined;
    } else if (isWater) {
      totalActual = percentageResult.totalActual;
      totalNeeded = percentageResult.totalNeeded;
      primaryUnit = 'liters';
    }
  }

  return {
    categoryId: category.id,
    itemCount: categoryItems.length,
    status: categoryStatus,
    completionPercentage: finalCompletionPercentage,
    criticalCount,
    warningCount,
    okCount,
    shortages: shortageInfo.shortages,
    totalActual,
    totalNeeded,
    primaryUnit,
    totalActualCalories,
    totalNeededCalories,
    missingCalories,
    drinkingWaterNeeded,
    preparationWaterNeeded,
    hasRecommendations,
  };
}

/**
 * Calculate status summaries for all categories.
 */
export function calculateAllCategoryStatuses(
  categories: Category[],
  items: InventoryItem[],
  categoryPreparedness: Map<string, number>,
  household: HouseholdConfig,
  recommendedItems: RecommendedItemDefinition[],
  disabledRecommendedItems: string[] = [],
  options: CategoryCalculationOptions = {},
): CategoryStatusSummary[] {
  return categories.map((category) => {
    const completionPercentage = categoryPreparedness.get(category.id) || 0;
    return calculateCategoryStatus(
      category,
      items,
      completionPercentage,
      household,
      recommendedItems,
      disabledRecommendedItems,
      options,
    );
  });
}

/**
 * Simplified interface for category status display in UI components.
 */
export interface CategoryDisplayStatus {
  status: ItemStatus;
  completionPercentage: number;
  totalActual: number;
  totalNeeded: number;
  primaryUnit?: Unit;
  shortages: CategoryShortage[];
  // Calorie data for food category
  totalActualCalories?: number;
  totalNeededCalories?: number;
  missingCalories?: number;
  // Water breakdown for water-beverages category
  drinkingWaterNeeded?: number;
  preparationWaterNeeded?: number;
  // False when category has no recommendations (except food/water which always calculate)
  hasRecommendations: boolean;
}

/**
 * Calculate everything needed to display category status in UI.
 * This is the main function UI components should use.
 */
export function getCategoryDisplayStatus(
  categoryId: string,
  items: InventoryItem[],
  household: HouseholdConfig,
  recommendedItems: RecommendedItemDefinition[] = RECOMMENDED_ITEMS,
  disabledRecommendedItems: string[] = [],
  options: CategoryCalculationOptions = {},
): CategoryDisplayStatus {
  // Use unified category percentage calculator
  const percentageResult = calculateCategoryPercentage(
    categoryId,
    items,
    household,
    disabledRecommendedItems,
    recommendedItems,
    options,
  );

  // Calculate shortages using strategy
  const shortageInfo = calculateCategoryShortages(
    categoryId,
    items,
    household,
    recommendedItems,
    disabledRecommendedItems,
    options,
  );

  // Check if inventory meets the minimum requirements
  // When using "none" kit (no recommendations at all), non-food/non-water categories have nothing to meet
  const isFood = isFoodCategory(categoryId);
  const isWater = categoryId === 'water-beverages';
  const kitHasNoRecommendations = recommendedItems.length === 0;
  const hasEnough =
    kitHasNoRecommendations && !isFood && !isWater
      ? true
      : hasEnoughInventory(categoryId, shortageInfo);

  // Use percentage from unified calculator
  // For mixed units categories, use weighted fulfillment for consistency
  let effectivePercentage = percentageResult.percentage;
  if (!shortageInfo.primaryUnit && shortageInfo.totalNeeded > 0) {
    const weightedPercentage = Math.round(
      (shortageInfo.totalActual / shortageInfo.totalNeeded) * 100,
    );
    effectivePercentage = weightedPercentage;
  }

  // Determine status
  const status: ItemStatus = hasEnough
    ? 'ok'
    : getStatusFromPercentage(effectivePercentage);

  // Cap percentage at 100
  const completionPercentage = hasEnough
    ? 100
    : Math.min(effectivePercentage, 100);

  // For categories without recommendations, use values from percentage calculation
  // (shortageInfo will be empty because there are no recommendations to match)
  // Food uses totalActualCalories/totalNeededCalories which are already from percentageResult
  let totalActual = shortageInfo.totalActual;
  let totalNeeded = shortageInfo.totalNeeded;
  let primaryUnit = shortageInfo.primaryUnit;

  if (kitHasNoRecommendations) {
    if (isWater) {
      // Water: use liters from percentage calculation
      totalActual = percentageResult.totalActual;
      totalNeeded = percentageResult.totalNeeded;
      primaryUnit = 'liters';
    } else if (!isFood) {
      // Other categories: use item counts from percentage calculation
      totalActual = percentageResult.totalActual;
      totalNeeded = percentageResult.totalNeeded;
      primaryUnit = undefined;
    }
    // Food uses totalActualCalories/totalNeededCalories, not totalActual/totalNeeded
  }

  return {
    status,
    completionPercentage,
    totalActual,
    totalNeeded,
    primaryUnit,
    shortages: shortageInfo.shortages,
    totalActualCalories: percentageResult.totalActualCalories,
    totalNeededCalories: percentageResult.totalNeededCalories,
    missingCalories:
      percentageResult.totalNeededCalories &&
      percentageResult.totalActualCalories
        ? Math.max(
            0,
            percentageResult.totalNeededCalories -
              percentageResult.totalActualCalories,
          )
        : undefined,
    drinkingWaterNeeded: shortageInfo.drinkingWaterNeeded,
    preparationWaterNeeded: shortageInfo.preparationWaterNeeded,
    hasRecommendations: percentageResult.hasRecommendations,
  };
}
