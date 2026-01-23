/**
 * Food category calculation strategy.
 *
 * The food category uses calorie-based tracking instead of quantity-based.
 * This reflects real emergency preparedness needs where calorie intake
 * is the key metric for food supplies.
 */

import type { InventoryItem, RecommendedItemDefinition } from '@/shared/types';
import { isFoodCategory, isFoodRecommendedItem } from '@/shared/types';
import type {
  CategoryCalculationContext,
  CategoryCalculationStrategy,
  CategoryShortage,
  ItemCalculationResult,
  ShortageCalculationResult,
} from './types';
import { calculateBaseRecommendedQuantity } from './common';
import { calculateItemTotalCalories } from '../calories';
import { DAILY_CALORIES_PER_PERSON } from '@/shared/utils/constants';

/**
 * Strategy for the food category.
 *
 * Features:
 * - Calorie-based completion tracking
 * - Standard quantity tracking for shortage display
 * - Calories calculated from item's caloriesPerUnit and quantity
 */
export class FoodCategoryStrategy implements CategoryCalculationStrategy {
  readonly strategyId = 'food';

  canHandle(categoryId: string): boolean {
    return isFoodCategory(categoryId);
  }

  calculateRecommendedQuantity(
    recItem: RecommendedItemDefinition,
    context: CategoryCalculationContext,
  ): number {
    return calculateBaseRecommendedQuantity(recItem, context);
  }

  calculateActualQuantity(
    matchingItems: InventoryItem[],
    recItem: RecommendedItemDefinition,
    _context: CategoryCalculationContext,
  ): { quantity: number; calories?: number } {
    const quantity = matchingItems.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );

    // Calculate calories if this is a food item with calorie data
    let calories = 0;
    if (
      isFoodRecommendedItem(recItem) &&
      recItem.caloriesPerUnit != null &&
      Number.isFinite(recItem.caloriesPerUnit)
    ) {
      calories = matchingItems.reduce((sum, item) => {
        if (
          item.caloriesPerUnit != null &&
          Number.isFinite(item.caloriesPerUnit)
        ) {
          return sum + calculateItemTotalCalories(item);
        }
        // Fallback: use recommended item's calories per unit
        return sum + item.quantity * (recItem.caloriesPerUnit ?? 0);
      }, 0);
    }

    return { quantity, calories };
  }

  aggregateTotals(
    itemResults: ItemCalculationResult[],
    context: CategoryCalculationContext,
  ): ShortageCalculationResult {
    const shortages: CategoryShortage[] = [];
    let totalActual = 0;
    let totalNeeded = 0;
    let totalActualCalories = 0;

    // Calculate total needed calories based on household
    const dailyCalories =
      context.options.dailyCaloriesPerPerson ?? DAILY_CALORIES_PER_PERSON;
    const totalNeededCalories =
      dailyCalories *
      context.peopleMultiplier *
      context.household.supplyDurationDays;

    // Track unit frequency for primary unit
    const unitCounts = new Map<string, number>();

    itemResults.forEach(
      ({
        recItem,
        recommendedQty,
        actualQty,
        hasMarkedAsEnough,
        actualCalories,
      }) => {
        // Track unit frequency
        unitCounts.set(
          recItem.unit,
          (unitCounts.get(recItem.unit) || 0) + recommendedQty,
        );

        // Add to totals
        totalActual += actualQty;
        totalNeeded += recommendedQty;
        totalActualCalories += actualCalories ?? 0;

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
    let primaryUnit: string | undefined = undefined;
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
      primaryUnit: primaryUnit as ShortageCalculationResult['primaryUnit'],
      totalActualCalories,
      totalNeededCalories,
      missingCalories: Math.max(0, totalNeededCalories - totalActualCalories),
    };
  }

  /**
   * For food category, check if calorie requirements are met.
   */
  hasEnoughInventory(result: ShortageCalculationResult): boolean {
    const neededCalories = result.totalNeededCalories ?? 0;
    if (neededCalories === 0) {
      return false;
    }
    return (result.totalActualCalories ?? 0) >= neededCalories;
  }
}
