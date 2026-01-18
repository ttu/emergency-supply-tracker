/**
 * Unified category percentage calculator.
 * Provides consistent percentage calculations for categories across the application.
 *
 * This module resolves the inconsistency where alerts and category cards showed
 * different percentages for the food category:
 * - Alert used quantity-based: item.quantity / item.recommendedQuantity
 * - Category card used calorie-based: totalActualCalories / totalNeededCalories
 *
 * Now both use this shared calculator which:
 * - Uses calorie-based calculation for food category
 * - Uses quantity-based calculation against recommended items for other categories
 */

import type {
  InventoryItem,
  HouseholdConfig,
  RecommendedItemDefinition,
} from '@/shared/types';
import { isFoodCategory, isFoodRecommendedItem } from '@/shared/types';
import { RECOMMENDED_ITEMS } from '@/features/templates';
import {
  ADULT_REQUIREMENT_MULTIPLIER,
  CHILDREN_REQUIREMENT_MULTIPLIER,
  DAILY_CALORIES_PER_PERSON,
  DAILY_WATER_PER_PERSON,
} from '@/shared/utils/constants';
import { calculateTotalWaterRequired } from './water';
import {
  findMatchingItemsByType,
  itemMatchesRecommendedId,
} from './itemMatching';

/**
 * Options for category percentage calculations.
 */
export interface CategoryPercentageOptions {
  /** Multiplier for children's requirements (default: 0.75) */
  childrenMultiplier?: number;
  /** Daily calories per person (default: 2000) */
  dailyCaloriesPerPerson?: number;
  /** Daily water per person in liters (default: 3) */
  dailyWaterPerPerson?: number;
}

/**
 * Result of category percentage calculation.
 */
export interface CategoryPercentageResult {
  /** Completion percentage (0-100+, uncapped) */
  percentage: number;
  /** Total actual quantity/items */
  totalActual: number;
  /** Total needed quantity/items */
  totalNeeded: number;
  /** Whether requirements are fully met */
  hasEnough: boolean;
  /** For food category: total actual calories */
  totalActualCalories?: number;
  /** For food category: total needed calories */
  totalNeededCalories?: number;
}

/**
 * Calculate completion percentage for a category.
 *
 * - Food category: Uses calorie-based calculation
 * - Other categories: Uses quantity-based calculation against recommended items
 *
 * @param categoryId - The category ID
 * @param items - All inventory items
 * @param household - Household configuration
 * @param disabledRecommendedItems - IDs of disabled recommended items
 * @param recommendedItems - Recommended item definitions (defaults to RECOMMENDED_ITEMS)
 * @param options - Calculation options
 * @returns CategoryPercentageResult with percentage and totals
 */
export function calculateCategoryPercentage(
  categoryId: string,
  items: InventoryItem[],
  household: HouseholdConfig,
  disabledRecommendedItems: string[] = [],
  recommendedItems: RecommendedItemDefinition[] = RECOMMENDED_ITEMS,
  options: CategoryPercentageOptions = {},
): CategoryPercentageResult {
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

  // No recommended items for this category
  if (recommendedForCategory.length === 0) {
    return {
      percentage: categoryItems.length > 0 ? 100 : 0,
      totalActual: 0,
      totalNeeded: 0,
      hasEnough: categoryItems.length > 0,
    };
  }

  // Calculate people multiplier
  const peopleMultiplier =
    household.adults * ADULT_REQUIREMENT_MULTIPLIER +
    household.children * childrenMultiplier;

  // Food category uses calorie-based calculation
  if (isFoodCategory(categoryId)) {
    return calculateFoodCategoryPercentage(
      categoryItems,
      recommendedForCategory,
      household,
      peopleMultiplier,
      dailyCalories,
      recommendedItems,
      disabledRecommendedItems,
    );
  }

  // Water-beverages category includes preparation water
  const isWaterCategory = categoryId === 'water-beverages';
  const preparationWaterNeeded = isWaterCategory
    ? calculateTotalWaterRequired(items)
    : 0;

  // Other categories use quantity-based calculation
  return calculateQuantityCategoryPercentage(
    categoryId,
    categoryItems,
    recommendedForCategory,
    household,
    peopleMultiplier,
    dailyWater,
    preparationWaterNeeded,
  );
}

/**
 * Calculate percentage for food category using calories.
 */
function calculateFoodCategoryPercentage(
  categoryItems: InventoryItem[],
  recommendedForCategory: RecommendedItemDefinition[],
  household: HouseholdConfig,
  peopleMultiplier: number,
  dailyCalories: number,
  allRecommendedItems: RecommendedItemDefinition[],
  disabledRecommendedItems: string[],
): CategoryPercentageResult {
  // Calculate total needed calories
  const totalNeededCalories =
    dailyCalories * peopleMultiplier * household.supplyDurationDays;

  // Calculate total actual calories from inventory
  let totalActualCalories = 0;

  // Count calories from items matching enabled recommendations
  recommendedForCategory.forEach((recItem) => {
    if (!isFoodRecommendedItem(recItem) || !recItem.caloriesPerUnit) {
      return;
    }

    // Find matching items by itemType only (no name matching)
    const matchingItems = findMatchingItemsByType(categoryItems, recItem.id);

    // Sum calories from matching items
    const itemCalories = matchingItems.reduce((sum, item) => {
      const calsPerUnit = item.caloriesPerUnit ?? recItem.caloriesPerUnit ?? 0;
      return sum + item.quantity * calsPerUnit;
    }, 0);

    totalActualCalories += itemCalories;
  });

  // Also count calories from items that don't match any enabled recommended item
  // This includes:
  // 1. Items with caloriesPerUnit that don't match any enabled recommendation
  // 2. Items matching disabled recommendations (use recommendation's caloriesPerUnit if item doesn't have it)
  categoryItems.forEach((item) => {
    // Check if this item was already counted (by itemType only) in enabled recommendations
    const alreadyCounted = recommendedForCategory.some((recItem) =>
      itemMatchesRecommendedId(item, recItem.id),
    );

    if (alreadyCounted) {
      return;
    }

    // If item has caloriesPerUnit, count it
    if (item.caloriesPerUnit) {
      totalActualCalories += item.quantity * item.caloriesPerUnit;
      return;
    }

    // If item doesn't have caloriesPerUnit, check if it matches a disabled recommendation
    // and use the recommendation's caloriesPerUnit
    if (item.itemType) {
      const disabledRecItem = allRecommendedItems.find(
        (recItem) =>
          recItem.id === item.itemType &&
          disabledRecommendedItems.includes(recItem.id) &&
          isFoodRecommendedItem(recItem) &&
          recItem.caloriesPerUnit,
      );

      if (disabledRecItem) {
        totalActualCalories +=
          item.quantity * (disabledRecItem.caloriesPerUnit ?? 0);
      }
    }
  });

  const percentage =
    totalNeededCalories > 0
      ? Math.round((totalActualCalories / totalNeededCalories) * 100)
      : 100;

  return {
    percentage,
    totalActual: totalActualCalories,
    totalNeeded: totalNeededCalories,
    hasEnough: totalActualCalories >= totalNeededCalories,
    totalActualCalories,
    totalNeededCalories,
  };
}

/**
 * Calculate percentage for non-food categories using quantities.
 */
function calculateQuantityCategoryPercentage(
  categoryId: string,
  categoryItems: InventoryItem[],
  recommendedForCategory: RecommendedItemDefinition[],
  household: HouseholdConfig,
  peopleMultiplier: number,
  dailyWater: number,
  preparationWaterNeeded: number,
): CategoryPercentageResult {
  let totalActual = 0;
  let totalNeeded = 0;

  // Track item types for categories with mixed units
  let itemTypesFulfilled = 0;
  let totalItemTypes = 0;

  // Track unique units
  const uniqueUnits = new Set<string>();

  recommendedForCategory.forEach((recItem) => {
    // For bottled-water, use the user's daily water setting
    let recommendedQty =
      recItem.id === 'bottled-water' ? dailyWater : recItem.baseQuantity;

    if (recItem.scaleWithPeople) {
      recommendedQty *= peopleMultiplier;
    }

    if (recItem.scaleWithDays) {
      recommendedQty *= household.supplyDurationDays;
    }

    // Add water needed for food preparation to bottled-water recommendation
    if (categoryId === 'water-beverages' && recItem.id === 'bottled-water') {
      recommendedQty += preparationWaterNeeded;
    }

    recommendedQty = Math.ceil(recommendedQty);

    // Find matching items by itemType only (no name matching)
    const matchingItems = findMatchingItemsByType(categoryItems, recItem.id);

    const hasMarkedAsEnough = matchingItems.some((item) => item.markedAsEnough);
    const actualQty = matchingItems.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );

    // Track unique units and item types
    uniqueUnits.add(recItem.unit);
    totalItemTypes++;
    if (actualQty >= recommendedQty || hasMarkedAsEnough) {
      itemTypesFulfilled++;
    }

    totalActual += actualQty;
    totalNeeded += recommendedQty;
  });

  // For mixed-unit categories or communication-info, use item type counts
  const hasMixedUnits = uniqueUnits.size > 1;
  const trackByItemTypes = hasMixedUnits || categoryId === 'communication-info';
  if (trackByItemTypes) {
    totalActual = itemTypesFulfilled;
    totalNeeded = totalItemTypes;
  }

  const percentage =
    totalNeeded > 0 ? Math.round((totalActual / totalNeeded) * 100) : 100;

  return {
    percentage,
    totalActual,
    totalNeeded,
    hasEnough: totalActual >= totalNeeded,
  };
}
