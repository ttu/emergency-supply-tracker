/**
 * Default category calculation strategy.
 *
 * Handles all categories without special calculation logic.
 * Uses quantity-based calculations with automatic detection of mixed units.
 */

import type { InventoryItem, RecommendedItemDefinition } from '@/shared/types';
import type {
  CategoryCalculationContext,
  CategoryCalculationStrategy,
  ItemCalculationResult,
  ShortageCalculationResult,
} from './types';
import {
  calculateBaseRecommendedQuantity,
  aggregateStandardTotals,
  aggregateMixedUnitsTotals,
  hasMixedUnits,
  defaultHasEnoughInventory,
} from './common';

/**
 * Default strategy for categories without special calculation requirements.
 *
 * Features:
 * - Standard quantity-based calculations
 * - Automatic mixed-units detection with weighted fulfillment
 * - Standard shortage tracking
 */
export class DefaultCategoryStrategy implements CategoryCalculationStrategy {
  readonly strategyId = 'default';

  /**
   * The default strategy handles any category not claimed by other strategies.
   */
  canHandle(_categoryId: string): boolean {
    return true;
  }

  calculateRecommendedQuantity(
    recItem: RecommendedItemDefinition,
    context: CategoryCalculationContext,
  ): number {
    return calculateBaseRecommendedQuantity(recItem, context);
  }

  calculateActualQuantity(
    matchingItems: InventoryItem[],
    _recItem: RecommendedItemDefinition,
    _context: CategoryCalculationContext,
  ): { quantity: number; calories?: number } {
    const quantity = matchingItems.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );
    return { quantity };
  }

  aggregateTotals(
    itemResults: ItemCalculationResult[],
    _context: CategoryCalculationContext,
  ): ShortageCalculationResult {
    // Automatically detect mixed units and use appropriate aggregation
    if (hasMixedUnits(itemResults)) {
      return aggregateMixedUnitsTotals(itemResults);
    }
    return aggregateStandardTotals(itemResults);
  }

  hasEnoughInventory(result: ShortageCalculationResult): boolean {
    return defaultHasEnoughInventory(result);
  }
}
