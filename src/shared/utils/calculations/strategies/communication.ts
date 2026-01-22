/**
 * Communication category calculation strategy.
 *
 * The communication-info category always uses item-type tracking instead of
 * quantity-based tracking. This is because each type of communication device
 * (battery radio, hand-crank radio, etc.) represents a distinct preparedness
 * item that should be tracked separately.
 */

import type { InventoryItem, RecommendedItemDefinition } from '@/shared/types';
import type {
  CategoryCalculationContext,
  CategoryCalculationStrategy,
  CategoryShortage,
  ItemCalculationResult,
  ShortageCalculationResult,
} from './types';
import { calculateBaseRecommendedQuantity } from './common';

const COMMUNICATION_CATEGORY_ID = 'communication-info';

/**
 * Strategy for the communication-info category.
 *
 * Features:
 * - Always uses item-type tracking (counts items instead of summing quantities)
 * - Each recommended item type contributes equally to completion percentage
 * - Useful for categories where having different types of items matters
 */
export class CommunicationCategoryStrategy implements CategoryCalculationStrategy {
  readonly strategyId = 'communication-info';

  canHandle(categoryId: string): boolean {
    return categoryId === COMMUNICATION_CATEGORY_ID;
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

  /**
   * Always aggregate by item types for communication category.
   *
   * Each recommended item type counts as 1 item type that can be fulfilled.
   * An item type is considered fulfilled if:
   * - actualQty >= recommendedQty, OR
   * - Any matching item is markedAsEnough
   */
  aggregateTotals(
    itemResults: ItemCalculationResult[],
    _context: CategoryCalculationContext,
  ): ShortageCalculationResult {
    const shortages: CategoryShortage[] = [];
    let itemTypesFulfilled = 0;
    const totalItemTypes = itemResults.length;

    itemResults.forEach(
      ({ recItem, recommendedQty, actualQty, hasMarkedAsEnough }) => {
        // An item type is fulfilled if requirements are met or marked as enough
        if (actualQty >= recommendedQty || hasMarkedAsEnough) {
          itemTypesFulfilled++;
        }

        // Add shortage if not fulfilled and not marked as enough
        const missing = Math.max(0, recommendedQty - actualQty);
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
      },
    );

    // Sort shortages by missing amount (descending)
    shortages.sort((a, b) => b.missing - a.missing);

    return {
      shortages,
      totalActual: itemTypesFulfilled,
      totalNeeded: totalItemTypes,
      primaryUnit: undefined, // Signal to show "items" instead of units
    };
  }

  hasEnoughInventory(result: ShortageCalculationResult): boolean {
    if (result.totalNeeded === 0) {
      return false;
    }
    return result.totalActual >= result.totalNeeded;
  }
}
