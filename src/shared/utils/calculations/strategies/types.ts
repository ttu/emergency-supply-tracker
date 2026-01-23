/**
 * Strategy pattern types for category-specific calculations.
 *
 * This module defines the interfaces for implementing category-specific
 * calculation strategies, enabling extensible and testable category logic.
 */

import type {
  InventoryItem,
  HouseholdConfig,
  RecommendedItemDefinition,
  Unit,
} from '@/shared/types';

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

/**
 * Context provided to strategy methods for calculations.
 */
export interface CategoryCalculationContext {
  /** The category ID being calculated */
  categoryId: string;
  /** All inventory items (for cross-category calculations like water needs) */
  items: InventoryItem[];
  /** Items filtered to the current category */
  categoryItems: InventoryItem[];
  /** Recommended items for this category (excluding disabled items) */
  recommendedForCategory: RecommendedItemDefinition[];
  /** Household configuration */
  household: HouseholdConfig;
  /** IDs of disabled recommended items */
  disabledRecommendedItems: string[];
  /** Calculation options */
  options: CategoryCalculationOptions;
  /** Pre-calculated people multiplier (adults * 1.0 + children * childrenMultiplier) */
  peopleMultiplier: number;
}

/**
 * Represents a shortage for a single recommended item.
 */
export interface CategoryShortage {
  itemId: string;
  itemName: string;
  actual: number;
  needed: number;
  unit: Unit;
  missing: number;
}

/**
 * Result of calculating shortages for a category.
 */
export interface ShortageCalculationResult {
  shortages: CategoryShortage[];
  totalActual: number;
  totalNeeded: number;
  primaryUnit?: Unit;
  // Category-specific fields (food)
  totalActualCalories?: number;
  totalNeededCalories?: number;
  missingCalories?: number;
  // Category-specific fields (water-beverages)
  drinkingWaterNeeded?: number;
  preparationWaterNeeded?: number;
}

/**
 * Result from calculating a single recommended item.
 */
export interface ItemCalculationResult {
  recItem: RecommendedItemDefinition;
  recommendedQty: number;
  actualQty: number;
  matchingItems: InventoryItem[];
  hasMarkedAsEnough: boolean;
  unit: Unit;
  // Category-specific
  actualCalories?: number;
}

/**
 * Strategy interface for category-specific calculations.
 *
 * Each category that needs special calculation logic implements this interface.
 * The strategy pattern allows for clean separation of category-specific code
 * and easy addition of new category behaviors.
 */
export interface CategoryCalculationStrategy {
  /**
   * Unique identifier for the strategy.
   */
  readonly strategyId: string;

  /**
   * Determine if this strategy handles the given category.
   *
   * @param categoryId - The category ID to check
   * @returns True if this strategy should handle the category
   */
  canHandle(categoryId: string): boolean;

  /**
   * Calculate the recommended quantity for a single recommended item.
   *
   * @param recItem - The recommended item definition
   * @param context - The calculation context
   * @returns The calculated recommended quantity (ceiled)
   */
  calculateRecommendedQuantity(
    recItem: RecommendedItemDefinition,
    context: CategoryCalculationContext,
  ): number;

  /**
   * Calculate the actual quantity from matching inventory items.
   *
   * @param matchingItems - Inventory items matching the recommended item
   * @param recItem - The recommended item definition
   * @param context - The calculation context
   * @returns The actual quantity (and optionally calories for food)
   */
  calculateActualQuantity(
    matchingItems: InventoryItem[],
    recItem: RecommendedItemDefinition,
    context: CategoryCalculationContext,
  ): { quantity: number; calories?: number };

  /**
   * Aggregate individual item results into category totals.
   *
   * @param itemResults - Results from each recommended item calculation
   * @param context - The calculation context
   * @returns The aggregated shortage result for the category
   */
  aggregateTotals(
    itemResults: ItemCalculationResult[],
    context: CategoryCalculationContext,
  ): ShortageCalculationResult;

  /**
   * Check if the category has enough inventory to meet requirements.
   *
   * @param result - The shortage calculation result
   * @returns True if requirements are met
   */
  hasEnoughInventory(result: ShortageCalculationResult): boolean;
}
