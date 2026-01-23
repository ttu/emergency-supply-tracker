/**
 * Common helper functions used by category calculation strategies.
 */

import type { RecommendedItemDefinition, Unit } from '@/shared/types';
import type {
  CategoryCalculationContext,
  CategoryShortage,
  ItemCalculationResult,
  ShortageCalculationResult,
} from './types';
import { PET_REQUIREMENT_MULTIPLIER } from '@/shared/utils/constants';

/**
 * Calculate base recommended quantity with standard scaling.
 *
 * Applies scaling based on:
 * - scaleWithPeople: multiplies by peopleMultiplier
 * - scaleWithPets: multiplies by pets * PET_REQUIREMENT_MULTIPLIER
 * - scaleWithDays: multiplies by supplyDurationDays
 *
 * @param recItem - The recommended item definition
 * @param context - The calculation context
 * @returns The calculated quantity (ceiled)
 */
export function calculateBaseRecommendedQuantity(
  recItem: RecommendedItemDefinition,
  context: CategoryCalculationContext,
): number {
  let qty = recItem.baseQuantity;

  if (recItem.scaleWithPeople) {
    qty *= context.peopleMultiplier;
  }

  if (recItem.scaleWithPets) {
    qty *= context.household.pets * PET_REQUIREMENT_MULTIPLIER;
  }

  if (recItem.scaleWithDays) {
    qty *= context.household.supplyDurationDays;
  }

  return Math.ceil(qty);
}

/**
 * Aggregate item results into standard totals (quantity-based).
 *
 * This is the default aggregation used for categories without special logic.
 * It sums quantities and finds the most common unit.
 *
 * @param itemResults - Results from each recommended item calculation
 * @returns The aggregated shortage result
 */
export function aggregateStandardTotals(
  itemResults: ItemCalculationResult[],
): ShortageCalculationResult {
  const shortages: CategoryShortage[] = [];
  let totalActual = 0;
  let totalNeeded = 0;

  // Track unit frequency to find primary unit
  const unitCounts = new Map<Unit, number>();

  itemResults.forEach(
    ({ recItem, recommendedQty, actualQty, hasMarkedAsEnough }) => {
      // Track unit frequency
      unitCounts.set(
        recItem.unit,
        (unitCounts.get(recItem.unit) || 0) + recommendedQty,
      );

      // Add to totals (markedAsEnough affects shortage list, not totals)
      totalActual += actualQty;
      totalNeeded += recommendedQty;

      // Add shortage if not marked as enough
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

  // Find the most common unit by quantity
  let primaryUnit: Unit | undefined = undefined;
  let maxCount = 0;
  unitCounts.forEach((count, unit) => {
    if (count > maxCount) {
      maxCount = count;
      primaryUnit = unit;
    }
  });

  // Sort shortages by missing amount (descending)
  shortages.sort((a, b) => b.missing - a.missing);

  return {
    shortages,
    totalActual,
    totalNeeded,
    primaryUnit,
  };
}

/**
 * Aggregate item results using weighted fulfillment for mixed-unit categories.
 *
 * Instead of summing quantities (which doesn't make sense for mixed units),
 * this calculates the weighted fulfillment ratio where each item type
 * contributes equally to the total.
 *
 * @param itemResults - Results from each recommended item calculation
 * @returns The aggregated shortage result with item-type based totals
 */
export function aggregateMixedUnitsTotals(
  itemResults: ItemCalculationResult[],
): ShortageCalculationResult {
  const shortages: CategoryShortage[] = [];
  let weightedFulfillment = 0;
  const totalItemTypes = itemResults.length;

  itemResults.forEach(
    ({ recItem, recommendedQty, actualQty, hasMarkedAsEnough }) => {
      // Calculate weighted fulfillment (0-1) for this item type
      const fulfillmentRatio =
        hasMarkedAsEnough || recommendedQty === 0
          ? 1
          : Math.min(actualQty / recommendedQty, 1);
      weightedFulfillment += fulfillmentRatio;

      // Add shortage if not marked as enough
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
    totalActual: weightedFulfillment,
    totalNeeded: totalItemTypes,
    primaryUnit: undefined, // Signal to show "items" instead of a specific unit
  };
}

/**
 * Check if item results have mixed units.
 *
 * @param itemResults - Results from each recommended item calculation
 * @returns True if there are multiple different units
 */
export function hasMixedUnits(itemResults: ItemCalculationResult[]): boolean {
  const uniqueUnits = new Set(itemResults.map((r) => r.unit));
  return uniqueUnits.size > 1;
}

/**
 * Default check for whether inventory meets requirements.
 *
 * @param result - The shortage calculation result
 * @returns True if totalActual >= totalNeeded
 */
export function defaultHasEnoughInventory(
  result: ShortageCalculationResult,
): boolean {
  if (result.totalNeeded === 0) {
    return false;
  }
  return result.totalActual >= result.totalNeeded;
}
