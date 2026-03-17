/**
 * Additional mutation-killing tests for strategies/food.ts
 * Targets surviving mutants from issue #271 mutation testing report.
 */
import { describe, it, expect } from 'vitest';
import { FoodCategoryStrategy } from './food';
import type { RecommendedItemDefinition } from '@/shared/types';
import {
  createItemId,
  createCategoryId,
  createProductTemplateId,
  createQuantity,
} from '@/shared/types';
import {
  createMockInventoryItem,
  createMockHousehold,
} from '@/shared/utils/test/factories';
import type { CategoryCalculationContext } from './types';

const strategy = new FoodCategoryStrategy();

function createFoodContext(
  overrides: Partial<CategoryCalculationContext> = {},
): CategoryCalculationContext {
  const household = createMockHousehold({
    adults: 1,
    children: 0,
    supplyDurationDays: 3,
  });

  return {
    categoryId: 'food',
    items: [],
    categoryItems: [],
    recommendedForCategory: [],
    household,
    disabledRecommendedItems: [],
    options: {},
    peopleMultiplier: 1,
    ...overrides,
  };
}

// ============================================================================
// L31: StringLiteral - strategyId '' instead of 'food'
// ============================================================================
describe('L31: strategyId string literal', () => {
  it('has correct strategyId', () => {
    expect(strategy.strategyId).toBe('food');
    expect(strategy.strategyId).not.toBe('');
  });
});

// ============================================================================
// L57-58: ConditionalExpression - isFoodRecommendedItem && caloriesPerUnit checks
// Mutant: conditions → true (always calculate calories)
// ============================================================================
describe('L57-58: food calorie calculation guards', () => {
  it('returns 0 calories for non-food recommended items', () => {
    const nonFoodRec: RecommendedItemDefinition = {
      id: createProductTemplateId('flashlight'),
      i18nKey: 'flashlight',
      category: 'food', // In food category but not a food item (no caloriesPerUnit)
      baseQuantity: createQuantity(1),
      unit: 'pieces',
      scaleWithPeople: false,
      scaleWithDays: false,
    };

    const items = [
      createMockInventoryItem({
        id: createItemId('1'),
        categoryId: createCategoryId('food'),
        itemType: createProductTemplateId('flashlight'),
        quantity: createQuantity(5),
        unit: 'pieces',
      }),
    ];

    const context = createFoodContext();
    const result = strategy.calculateActualQuantity(items, nonFoodRec, context);

    // Non-food rec item: calories should be 0
    expect(result.quantity).toBe(5);
    expect(result.calories).toBe(0);
  });

  it('calculates calories for food items with valid caloriesPerUnit', () => {
    const foodRec: RecommendedItemDefinition = {
      id: createProductTemplateId('rice'),
      i18nKey: 'rice',
      category: 'food',
      baseQuantity: createQuantity(1),
      unit: 'kilograms',
      scaleWithPeople: true,
      scaleWithDays: true,
      caloriesPerUnit: 3600,
      caloriesPer100g: 360,
      weightGramsPerUnit: 1000,
    };

    const items = [
      createMockInventoryItem({
        id: createItemId('1'),
        categoryId: createCategoryId('food'),
        itemType: createProductTemplateId('rice'),
        quantity: createQuantity(2),
        unit: 'kilograms',
        caloriesPerUnit: 3600,
        weightGrams: 1000,
      }),
    ];

    const context = createFoodContext();
    const result = strategy.calculateActualQuantity(items, foodRec, context);

    expect(result.quantity).toBe(2);
    expect(result.calories).toBeGreaterThan(0);
  });
});

// ============================================================================
// L63: ConditionalExpression - item calorie guard
// ============================================================================
describe('L63: individual item calorie validation', () => {
  it('falls back to rec caloriesPerUnit when item has no calories', () => {
    const foodRec: RecommendedItemDefinition = {
      id: createProductTemplateId('rice'),
      i18nKey: 'rice',
      category: 'food',
      baseQuantity: createQuantity(1),
      unit: 'kilograms',
      scaleWithPeople: true,
      scaleWithDays: true,
      caloriesPerUnit: 3600,
      caloriesPer100g: 360,
      weightGramsPerUnit: 1000,
    };

    const items = [
      createMockInventoryItem({
        id: createItemId('1'),
        categoryId: createCategoryId('food'),
        itemType: createProductTemplateId('rice'),
        quantity: createQuantity(2),
        unit: 'kilograms',
        caloriesPerUnit: undefined, // No calories on item
      }),
    ];

    const context = createFoodContext();
    const result = strategy.calculateActualQuantity(items, foodRec, context);

    // Should use rec's caloriesPerUnit as fallback: 2 * 3600 = 7200
    expect(result.calories).toBe(7200);
  });
});
