/**
 * Water category calculation strategy.
 *
 * The water-beverages category has special handling:
 * - Bottled water uses the user's daily water setting instead of base quantity
 * - Water needed for food preparation is added to the bottled-water requirement
 * - Tracks drinking water and preparation water separately for display
 */

import type { InventoryItem, RecommendedItemDefinition } from '@/shared/types';
import type {
  CategoryCalculationContext,
  CategoryCalculationStrategy,
  ItemCalculationResult,
  ShortageCalculationResult,
} from './types';
import { aggregateStandardTotals } from './common';
import { calculateTotalWaterRequired } from '../water';
import {
  DAILY_WATER_PER_PERSON,
  PET_REQUIREMENT_MULTIPLIER,
} from '@/shared/utils/constants';

const WATER_CATEGORY_ID = 'water-beverages';
const BOTTLED_WATER_ID = 'bottled-water';

/**
 * Strategy for the water-beverages category.
 *
 * Features:
 * - Bottled water uses user's daily water setting
 * - Preparation water from food items is added to bottled-water requirement
 * - Tracks drinking water and preparation water separately
 */
export class WaterCategoryStrategy implements CategoryCalculationStrategy {
  readonly strategyId = 'water-beverages';

  canHandle(categoryId: string): boolean {
    return categoryId === WATER_CATEGORY_ID;
  }

  calculateRecommendedQuantity(
    recItem: RecommendedItemDefinition,
    context: CategoryCalculationContext,
  ): number {
    const dailyWater =
      context.options.dailyWaterPerPerson ?? DAILY_WATER_PER_PERSON;

    // Bottled water uses user's daily water setting instead of base quantity
    let qty =
      recItem.id === BOTTLED_WATER_ID ? dailyWater : recItem.baseQuantity;

    // Apply standard scaling
    if (recItem.scaleWithPeople) {
      qty *= context.peopleMultiplier;
    }

    if (recItem.scaleWithPets) {
      qty *= context.household.pets * PET_REQUIREMENT_MULTIPLIER;
    }

    if (recItem.scaleWithDays) {
      qty *= context.household.supplyDurationDays;
    }

    // Add water needed for food preparation to bottled-water
    if (recItem.id === BOTTLED_WATER_ID) {
      const preparationWater = calculateTotalWaterRequired(context.items);
      qty += preparationWater;
    }

    return Math.ceil(qty);
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
    context: CategoryCalculationContext,
  ): ShortageCalculationResult {
    // Use standard aggregation for the base result
    const baseResult = aggregateStandardTotals(itemResults);

    // Calculate water breakdown
    const dailyWater =
      context.options.dailyWaterPerPerson ?? DAILY_WATER_PER_PERSON;
    const drinkingWaterNeeded =
      dailyWater *
      context.peopleMultiplier *
      context.household.supplyDurationDays;
    const preparationWaterNeeded = calculateTotalWaterRequired(context.items);

    return {
      ...baseResult,
      drinkingWaterNeeded,
      preparationWaterNeeded,
    };
  }

  hasEnoughInventory(result: ShortageCalculationResult): boolean {
    if (result.totalNeeded === 0) {
      return false;
    }
    return result.totalActual >= result.totalNeeded;
  }
}
