import type {
  InventoryItem,
  ItemStatus,
  Category,
  HouseholdConfig,
  Unit,
  RecommendedItemDefinition,
} from '@/shared/types';
import { isFoodCategory, isFoodRecommendedItem } from '@/shared/types';
import {
  calculateItemStatus,
  getStatusFromPercentage,
} from '@/shared/utils/calculations/itemStatus';
import { calculateTotalWaterRequired } from '@/shared/utils/calculations/water';
import { RECOMMENDED_ITEMS } from '@/features/templates';
import { calculateCategoryPreparedness } from './preparedness';
import {
  ADULT_REQUIREMENT_MULTIPLIER,
  CHILDREN_REQUIREMENT_MULTIPLIER,
  DAILY_CALORIES_PER_PERSON,
  DAILY_WATER_PER_PERSON,
  CRITICAL_PERCENTAGE_THRESHOLD,
  WARNING_PERCENTAGE_THRESHOLD,
} from '@/shared/utils/constants';

/**
 * Options for category calculations that can be customized by user settings.
 */
export interface CategoryCalculationOptions {
  /** Multiplier for children's requirements (default: 0.75) */
  childrenMultiplier?: number;
  /** Daily calories per person (default: 2000) */
  dailyCaloriesPerPerson?: number;
  /** Daily water per person in liters (default: 3) */
  dailyWaterPerPerson?: number;
}

export interface CategoryShortage {
  itemId: string;
  itemName: string;
  actual: number;
  needed: number;
  unit: Unit;
  missing: number;
}

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
}

/**
 * Check if a category has enough inventory based on actual vs needed quantities.
 * For food category, uses calorie-based comparison; for others, uses quantity-based.
 */
function hasEnoughInventory(
  categoryId: string,
  shortageInfo: {
    totalActual: number;
    totalNeeded: number;
    totalActualCalories?: number;
    totalNeededCalories?: number;
  },
): boolean {
  if (isFoodCategory(categoryId)) {
    return (
      (shortageInfo.totalActualCalories ?? 0) >=
      (shortageInfo.totalNeededCalories ?? 0)
    );
  }
  return shortageInfo.totalActual >= shortageInfo.totalNeeded;
}

/**
 * Calculate shortages for a category based on recommended items.
 * For the 'food' category, uses calorie-based calculations instead of quantity-based.
 * For the 'water-beverages' category, includes water needed for food preparation.
 */
export function calculateCategoryShortages(
  categoryId: string,
  items: InventoryItem[],
  household: HouseholdConfig,
  disabledRecommendedItems: string[] = [],
  recommendedItems: RecommendedItemDefinition[] = RECOMMENDED_ITEMS,
  options: CategoryCalculationOptions = {},
): {
  shortages: CategoryShortage[];
  totalActual: number;
  totalNeeded: number;
  primaryUnit?: Unit;
  totalActualCalories?: number;
  totalNeededCalories?: number;
  missingCalories?: number;
  drinkingWaterNeeded?: number;
  preparationWaterNeeded?: number;
} {
  const childrenMultiplier =
    options.childrenMultiplier ?? CHILDREN_REQUIREMENT_MULTIPLIER;
  const dailyCalories =
    options.dailyCaloriesPerPerson ?? DAILY_CALORIES_PER_PERSON;
  const dailyWater = options.dailyWaterPerPerson ?? DAILY_WATER_PER_PERSON;

  const categoryItems = items.filter((item) => item.categoryId === categoryId);
  const recommendedForCategory = recommendedItems.filter(
    (item) =>
      item.category === categoryId &&
      !disabledRecommendedItems.includes(item.id),
  );

  // Calculate water needed for food preparation (for water-beverages category)
  const isWaterCategory = categoryId === 'water-beverages';
  const preparationWaterNeeded = isWaterCategory
    ? calculateTotalWaterRequired(items)
    : 0;

  if (recommendedForCategory.length === 0) {
    return {
      shortages: [],
      totalActual: 0,
      totalNeeded: 0,
      primaryUnit: undefined,
    };
  }

  // Adults count as 1.0, children use the configurable multiplier
  const peopleMultiplier =
    household.adults * ADULT_REQUIREMENT_MULTIPLIER +
    household.children * childrenMultiplier;
  const shortages: CategoryShortage[] = [];
  let totalActual = 0;
  let totalNeeded = 0;

  // Track item types for mixed-unit categories
  let totalItemTypes = 0;
  // Track weighted fulfillment for mixed units (to match percentage calculation)
  let weightedFulfillment = 0;

  // Calorie tracking for food category
  const isFood = isFoodCategory(categoryId);
  let totalActualCalories = 0;
  let totalNeededCalories = 0;

  // For food category, calculate needed calories based on people and days
  // Children use the configurable multiplier for calorie requirements
  if (isFood) {
    totalNeededCalories =
      dailyCalories * peopleMultiplier * household.supplyDurationDays;
  }

  // Track drinking water separately for water-beverages category
  let drinkingWaterNeeded = 0;

  // Track units to find the most common one and detect mixed units
  const unitCounts = new Map<Unit, number>();
  const uniqueUnits = new Set<Unit>();

  recommendedForCategory.forEach((recItem) => {
    // For bottled-water, use the user's daily water setting instead of the
    // hardcoded baseQuantity from recommendedItems
    let recommendedQty =
      recItem.id === 'bottled-water' ? dailyWater : recItem.baseQuantity;

    if (recItem.scaleWithPeople) {
      recommendedQty *= peopleMultiplier;
    }

    if (recItem.scaleWithDays) {
      recommendedQty *= household.supplyDurationDays;
    }

    // Track drinking water separately for water-beverages category
    if (isWaterCategory && recItem.id === 'bottled-water') {
      drinkingWaterNeeded = recommendedQty;
    }

    // Add water needed for food preparation to bottled-water recommendation
    if (isWaterCategory && recItem.id === 'bottled-water') {
      recommendedQty += preparationWaterNeeded;
    }

    recommendedQty = Math.ceil(recommendedQty);

    // Match items by: productTemplateId, itemType (direct ID match), or name (normalized)
    const recItemId = recItem.id;
    const recItemIdNormalized = recItemId.toLowerCase();
    const matchingItems = categoryItems.filter((item) => {
      // Direct template ID match
      if (item.productTemplateId === recItemId) return true;
      // itemType is now stored as template ID directly
      if (item.itemType === recItemId) return true;
      // Match name by normalizing to kebab-case (for manually created items)
      const nameNormalized = item.name.toLowerCase().replace(/\s+/g, '-');
      if (nameNormalized === recItemIdNormalized) return true;
      return false;
    });

    // If any matching item is marked as enough, treat as having met the requirement
    const hasMarkedAsEnough = matchingItems.some((item) => item.markedAsEnough);

    const actualQty = matchingItems.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );

    // Calculate calories for food items
    if (isFoodRecommendedItem(recItem) && recItem.caloriesPerUnit) {
      // Get calories from inventory items (use template value as fallback)
      // Always use actual quantities, not inflated to recommended
      const itemCalories = matchingItems.reduce((sum, item) => {
        const calsPerUnit =
          item.caloriesPerUnit ?? recItem.caloriesPerUnit ?? 0;
        return sum + item.quantity * calsPerUnit;
      }, 0);

      totalActualCalories += itemCalories;
    }

    const missing = Math.max(0, recommendedQty - actualQty);

    // Track unique units and item types
    uniqueUnits.add(recItem.unit);
    totalItemTypes++;
    // Calculate weighted fulfillment (0-1) for this item type
    // If marked as enough or recommended quantity is zero, treat as fully fulfilled (1.0)
    // Otherwise, calculate ratio of actual to recommended, capped at 1.0
    const fulfillmentRatio =
      hasMarkedAsEnough || recommendedQty === 0
        ? 1
        : Math.min(actualQty / recommendedQty, 1);
    weightedFulfillment += fulfillmentRatio;

    // Track unit frequency
    unitCounts.set(
      recItem.unit,
      (unitCounts.get(recItem.unit) || 0) + recommendedQty,
    );

    // Add to totals
    // Always use actual quantities - markedAsEnough only affects requirement satisfaction, not totals
    totalActual += actualQty;
    totalNeeded += recommendedQty;

    // Only add to shortages if not marked as enough
    if (missing > 0 && !hasMarkedAsEnough) {
      shortages.push({
        itemId: recItem.id,
        itemName: recItem.i18nKey,
        actual: actualQty,
        needed: recommendedQty,
        unit: recItem.unit,
        missing,
      });
    }
  });

  // Find the most common unit by quantity
  let primaryUnit: Unit | undefined = undefined;
  let maxCount = 0;
  unitCounts.forEach((count, unit) => {
    if (count > maxCount) {
      maxCount = count;
      primaryUnit = unit;
    }
  });

  // If multiple different units, use item type counts instead
  // Also use item type counts for communication-info category since each item type
  // (battery radio, hand-crank radio) represents a distinct preparedness item
  const hasMixedUnits = uniqueUnits.size > 1;
  const trackByItemTypes = hasMixedUnits || categoryId === 'communication-info';
  if (trackByItemTypes) {
    // Use weighted fulfillment to match the percentage calculation
    // This ensures the progress bar and item count are consistent
    totalActual = weightedFulfillment;
    totalNeeded = totalItemTypes;
    primaryUnit = undefined; // Signal to show "items" instead of a specific unit
  }

  // Sort shortages by missing amount (descending)
  shortages.sort((a, b) => b.missing - a.missing);

  // Return with calorie data for food category
  if (isFood) {
    const missingCalories = Math.max(
      0,
      totalNeededCalories - totalActualCalories,
    );
    return {
      shortages,
      totalActual,
      totalNeeded,
      primaryUnit,
      totalActualCalories,
      totalNeededCalories,
      missingCalories,
    };
  }

  // Return with water breakdown data for water-beverages category
  if (isWaterCategory) {
    return {
      shortages,
      totalActual,
      totalNeeded,
      primaryUnit,
      drinkingWaterNeeded,
      preparationWaterNeeded,
    };
  }

  return { shortages, totalActual, totalNeeded, primaryUnit };
}

/**
 * Calculate status summary for a category
 */
export function calculateCategoryStatus(
  category: Category,
  items: InventoryItem[],
  completionPercentage: number,
  household?: HouseholdConfig,
  disabledRecommendedItems: string[] = [],
  recommendedItems: RecommendedItemDefinition[] = RECOMMENDED_ITEMS,
  options: CategoryCalculationOptions = {},
): CategoryStatusSummary {
  const categoryItems = items.filter((item) => item.categoryId === category.id);

  // Count items by status
  let criticalCount = 0;
  let warningCount = 0;
  let okCount = 0;

  categoryItems.forEach((item) => {
    const status = calculateItemStatus(item);
    if (status === 'critical') criticalCount++;
    else if (status === 'warning') warningCount++;
    else okCount++;
  });

  // Calculate shortages if household config is provided
  const shortageInfo = household
    ? calculateCategoryShortages(
        category.id,
        items,
        household,
        disabledRecommendedItems,
        recommendedItems,
        options,
      )
    : { shortages: [], totalActual: 0, totalNeeded: 0, primaryUnit: undefined };

  // Check if inventory meets the minimum requirements
  const hasEnough = household && hasEnoughInventory(category.id, shortageInfo);

  // For food category, calculate percentage based on calories instead of quantity
  // (if household is provided and we have calorie data)
  // This should be checked first, before mixed units, as food is a special case
  const isFood = isFoodCategory(category.id);
  let effectivePercentage = completionPercentage;
  if (
    household &&
    isFood &&
    shortageInfo.totalNeededCalories &&
    shortageInfo.totalNeededCalories > 0
  ) {
    const caloriePercentage = Math.round(
      ((shortageInfo.totalActualCalories ?? 0) /
        shortageInfo.totalNeededCalories) *
        100,
    );
    effectivePercentage = caloriePercentage;
  }

  // For mixed units categories, calculate percentage from weighted fulfillment
  // to ensure consistency with the item count display (same logic as getCategoryDisplayStatus)
  // Check if this is a mixed units category (primaryUnit is undefined) and we have items to track
  // Skip this check for food category, as food uses calorie-based calculation
  if (
    household &&
    !isFood &&
    !shortageInfo.primaryUnit &&
    shortageInfo.totalNeeded > 0
  ) {
    // Use weighted fulfillment ratio to calculate percentage
    // This ensures the progress bar matches the "X / Y items" display
    // totalActual is the weighted fulfillment sum, totalNeeded is the number of item types
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

  return {
    categoryId: category.id,
    itemCount: categoryItems.length,
    status: categoryStatus,
    completionPercentage: finalCompletionPercentage,
    criticalCount,
    warningCount,
    okCount,
    shortages: shortageInfo.shortages,
    totalActual: shortageInfo.totalActual,
    totalNeeded: shortageInfo.totalNeeded,
    primaryUnit: shortageInfo.primaryUnit,
    // Calorie data for food category
    totalActualCalories: shortageInfo.totalActualCalories,
    totalNeededCalories: shortageInfo.totalNeededCalories,
    missingCalories: shortageInfo.missingCalories,
    // Water breakdown for water-beverages category
    drinkingWaterNeeded: shortageInfo.drinkingWaterNeeded,
    preparationWaterNeeded: shortageInfo.preparationWaterNeeded,
  };
}

/**
 * Calculate status summaries for all categories
 */
export function calculateAllCategoryStatuses(
  categories: Category[],
  items: InventoryItem[],
  categoryPreparedness: Map<string, number>,
  household?: HouseholdConfig,
  disabledRecommendedItems: string[] = [],
  recommendedItems: RecommendedItemDefinition[] = RECOMMENDED_ITEMS,
  options: CategoryCalculationOptions = {},
): CategoryStatusSummary[] {
  return categories.map((category) => {
    const completionPercentage = categoryPreparedness.get(category.id) || 0;
    return calculateCategoryStatus(
      category,
      items,
      completionPercentage,
      household,
      disabledRecommendedItems,
      recommendedItems,
      options,
    );
  });
}

/**
 * Simplified interface for category status display in UI components
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
}

/**
 * Calculate everything needed to display category status in UI.
 * This is the main function UI components should use.
 */
export function getCategoryDisplayStatus(
  categoryId: string,
  items: InventoryItem[],
  household: HouseholdConfig,
  disabledRecommendedItems: string[] = [],
  recommendedItems: RecommendedItemDefinition[] = RECOMMENDED_ITEMS,
  options: CategoryCalculationOptions = {},
): CategoryDisplayStatus {
  const calculatedPercentage = calculateCategoryPreparedness(
    categoryId,
    items,
    household,
    disabledRecommendedItems,
    recommendedItems,
    options,
  );

  const shortageInfo = calculateCategoryShortages(
    categoryId,
    items,
    household,
    disabledRecommendedItems,
    recommendedItems,
    options,
  );

  // Check if inventory meets the minimum requirements
  const hasEnough = hasEnoughInventory(categoryId, shortageInfo);

  // For food category, calculate percentage based on calories instead of quantity
  const isFood = isFoodCategory(categoryId);
  let effectivePercentage = calculatedPercentage;

  if (isFood && shortageInfo.totalNeededCalories) {
    const caloriePercentage = Math.round(
      ((shortageInfo.totalActualCalories ?? 0) /
        shortageInfo.totalNeededCalories) *
        100,
    );
    effectivePercentage = caloriePercentage;
  }

  // For mixed units categories, calculate percentage from weighted fulfillment
  // to ensure consistency with the item count display
  // Check if this is a mixed units category (primaryUnit is undefined) and we have items to track
  // Skip this check for food category, as food uses calorie-based calculation
  if (!isFood && !shortageInfo.primaryUnit && shortageInfo.totalNeeded > 0) {
    // Use weighted fulfillment ratio to calculate percentage
    // This ensures the progress bar matches the "X / Y items" display
    // totalActual is the weighted fulfillment sum, totalNeeded is the number of item types
    const weightedPercentage = Math.round(
      (shortageInfo.totalActual / shortageInfo.totalNeeded) * 100,
    );
    effectivePercentage = weightedPercentage;
  }

  // Determine status: if we have enough inventory, the status should be OK
  // regardless of optional recommended items
  const status: ItemStatus = hasEnough
    ? 'ok'
    : getStatusFromPercentage(effectivePercentage);

  // Cap percentage at 100: exact 100 when enough, otherwise capped
  const completionPercentage = hasEnough
    ? 100
    : Math.min(effectivePercentage, 100);

  return {
    status,
    completionPercentage,
    totalActual: shortageInfo.totalActual,
    totalNeeded: shortageInfo.totalNeeded,
    primaryUnit: shortageInfo.primaryUnit,
    shortages: shortageInfo.shortages,
    totalActualCalories: shortageInfo.totalActualCalories,
    totalNeededCalories: shortageInfo.totalNeededCalories,
    missingCalories: shortageInfo.missingCalories,
    drinkingWaterNeeded: shortageInfo.drinkingWaterNeeded,
    preparationWaterNeeded: shortageInfo.preparationWaterNeeded,
  };
}
