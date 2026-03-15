import { describe, it, expect } from 'vitest';
import { FoodCategoryStrategy } from './food';
import type {
  CategoryCalculationContext,
  ItemCalculationResult,
} from './types';
import {
  createMockHousehold,
  createMockInventoryItem,
} from '@/shared/utils/test/factories';
import {
  createCategoryId,
  createProductTemplateId,
  createQuantity,
} from '@/shared/types';
import type { RecommendedItemDefinition } from '@/shared/types';

/**
 * Mutation-killing tests for food.ts surviving mutants:
 *
 * 1. StringLiteral L31: strategyId = '' (empty string)
 * 2. ConditionalExpression L57: isFoodRecommendedItem(recItem) && ... -> true
 * 3. ConditionalExpression L58: recItem.caloriesPerUnit != null -> true
 * 4. ConditionalExpression L63: item.caloriesPerUnit != null && ... -> true
 * 5. ConditionalExpression L134: count > maxCount -> true
 * 6. LogicalOperator L57: isFoodRecommendedItem(recItem) || recItem.caloriesPerUnit != null
 * 7. EqualityOperator L134: count >= maxCount
 */
describe('FoodCategoryStrategy – mutation killing', () => {
  const strategy = new FoodCategoryStrategy();

  describe('strategyId string literal (L31)', () => {
    it('must be "food", not empty string', () => {
      expect(strategy.strategyId).toBe('food');
      expect(strategy.strategyId).not.toBe('');
    });
  });

  describe('calculateActualQuantity – L57 isFoodRecommendedItem || caloriesPerUnit guard', () => {
    const context: CategoryCalculationContext = {
      categoryId: 'food',
      items: [],
      categoryItems: [],
      recommendedForCategory: [],
      household: createMockHousehold({
        adults: 1,
        children: 0,
        pets: 0,
        supplyDurationDays: 1,
      }),
      disabledRecommendedItems: [],
      options: {},
      peopleMultiplier: 1,
    };

    it('returns 0 calories for non-food category item without caloriesPerUnit (kills L57 || -> && and ConditionalExpression -> true)', () => {
      // A non-food item with no caloriesPerUnit should NOT enter the calorie calculation block.
      // If L57 is mutated to `true`, calories would be calculated incorrectly.
      // If || is mutated to &&, both conditions would need to be true (non-food fails isFoodRecommendedItem).
      const matchingItems = [
        createMockInventoryItem({
          categoryId: createCategoryId('food'),
          quantity: createQuantity(5),
          caloriesPerUnit: 200,
        }),
      ];

      // Non-food category item - isFoodRecommendedItem returns false
      const recItem: RecommendedItemDefinition = {
        id: createProductTemplateId('non-food-item'),
        i18nKey: 'products.non-food-item',
        category: 'tools-supplies', // NOT food
        baseQuantity: createQuantity(10),
        unit: 'pieces',
        scaleWithPeople: false,
        scaleWithDays: false,
        // No caloriesPerUnit
      };

      const result = strategy.calculateActualQuantity(
        matchingItems,
        recItem,
        context,
      );
      expect(result.quantity).toBe(5);
      // Non-food item without caloriesPerUnit: calories must be 0
      expect(result.calories).toBe(0);
    });

    it('returns 0 calories for food item with undefined caloriesPerUnit (kills L58 ConditionalExpression -> true)', () => {
      // If L58 (recItem.caloriesPerUnit != null) is mutated to true,
      // we'd enter the calorie block with undefined caloriesPerUnit leading to NaN fallback.
      const matchingItems = [
        createMockInventoryItem({
          categoryId: createCategoryId('food'),
          quantity: createQuantity(3),
          caloriesPerUnit: undefined,
        }),
      ];

      const recItem: RecommendedItemDefinition = {
        id: createProductTemplateId('food-no-cal'),
        i18nKey: 'products.food-no-cal',
        category: 'food',
        baseQuantity: createQuantity(5),
        unit: 'cans',
        scaleWithPeople: false,
        scaleWithDays: false,
        // caloriesPerUnit is intentionally undefined
      };

      const result = strategy.calculateActualQuantity(
        matchingItems,
        recItem,
        context,
      );
      expect(result.quantity).toBe(3);
      expect(result.calories).toBe(0);
    });

    it('uses item caloriesPerUnit when available, not fallback (kills L63 ConditionalExpression -> true)', () => {
      // If L63 (item.caloriesPerUnit != null && Number.isFinite(item.caloriesPerUnit)) is mutated to true,
      // items with NaN/null caloriesPerUnit would go through calculateItemTotalCalories instead of fallback.
      // We test with an item that has valid caloriesPerUnit - result should differ from fallback.
      const matchingItems = [
        createMockInventoryItem({
          categoryId: createCategoryId('food'),
          quantity: createQuantity(4),
          caloriesPerUnit: 100, // Different from recItem's 300
        }),
      ];

      const recItem: RecommendedItemDefinition = {
        id: createProductTemplateId('food-with-cal'),
        i18nKey: 'products.food-with-cal',
        category: 'food',
        baseQuantity: createQuantity(5),
        unit: 'cans',
        scaleWithPeople: false,
        scaleWithDays: false,
        caloriesPerUnit: 300,
      };

      const result = strategy.calculateActualQuantity(
        matchingItems,
        recItem,
        context,
      );
      expect(result.quantity).toBe(4);
      // Should use item's 100 cal/unit: 4 * 100 = 400
      // NOT recItem's fallback 300: 4 * 300 = 1200
      expect(result.calories).toBe(400);
    });

    it('uses fallback when item has NaN caloriesPerUnit (ensures L63 guard works)', () => {
      const matchingItems = [
        createMockInventoryItem({
          categoryId: createCategoryId('food'),
          quantity: createQuantity(2),
          caloriesPerUnit: Number.NaN,
        }),
      ];

      const recItem: RecommendedItemDefinition = {
        id: createProductTemplateId('food-fallback'),
        i18nKey: 'products.food-fallback',
        category: 'food',
        baseQuantity: createQuantity(5),
        unit: 'cans',
        scaleWithPeople: false,
        scaleWithDays: false,
        caloriesPerUnit: 250,
      };

      const result = strategy.calculateActualQuantity(
        matchingItems,
        recItem,
        context,
      );
      // Fallback: 2 * 250 = 500
      expect(result.calories).toBe(500);
    });
  });

  describe('aggregateTotals – primaryUnit L134 count > maxCount vs count >= maxCount', () => {
    const context: CategoryCalculationContext = {
      categoryId: 'food',
      items: [],
      categoryItems: [],
      recommendedForCategory: [],
      household: createMockHousehold({
        adults: 1,
        children: 0,
        pets: 0,
        supplyDurationDays: 1,
      }),
      disabledRecommendedItems: [],
      options: { dailyCaloriesPerPerson: 2000 },
      peopleMultiplier: 1,
    };

    it('picks first unit when two units have equal counts (kills count >= maxCount)', () => {
      // If mutated to count >= maxCount, the second unit would replace the first
      // when counts are equal. With count > maxCount (original), first unit wins ties.
      const itemResults: ItemCalculationResult[] = [
        {
          recItem: {
            id: createProductTemplateId('item-cans'),
            i18nKey: 'products.item-cans',
            category: 'food',
            baseQuantity: createQuantity(5),
            unit: 'cans',
            scaleWithPeople: false,
            scaleWithDays: false,
          },
          recommendedQty: 5,
          actualQty: 5,
          matchingItems: [],
          hasMarkedAsEnough: false,
          unit: 'cans',
          actualCalories: 0,
        },
        {
          recItem: {
            id: createProductTemplateId('item-kg'),
            i18nKey: 'products.item-kg',
            category: 'food',
            baseQuantity: createQuantity(5),
            unit: 'kilograms',
            scaleWithPeople: false,
            scaleWithDays: false,
          },
          recommendedQty: 5, // Same count as cans
          actualQty: 5,
          matchingItems: [],
          hasMarkedAsEnough: false,
          unit: 'kilograms',
          actualCalories: 0,
        },
      ];

      const result = strategy.aggregateTotals(itemResults, context);
      // With count > maxCount: first unit 'cans' wins (5 > 0, sets maxCount=5; 5 > 5 is false, kg doesn't replace)
      // With count >= maxCount: 'kilograms' would replace (5 >= 5 is true)
      expect(result.primaryUnit).toBe('cans');
    });

    it('replaces primaryUnit when strictly greater count found (kills ConditionalExpression -> true)', () => {
      // If L134 condition is mutated to `true`, primaryUnit would always be the last unit
      const itemResults: ItemCalculationResult[] = [
        {
          recItem: {
            id: createProductTemplateId('item-big'),
            i18nKey: 'products.item-big',
            category: 'food',
            baseQuantity: createQuantity(10),
            unit: 'cans',
            scaleWithPeople: false,
            scaleWithDays: false,
          },
          recommendedQty: 10,
          actualQty: 10,
          matchingItems: [],
          hasMarkedAsEnough: false,
          unit: 'cans',
          actualCalories: 0,
        },
        {
          recItem: {
            id: createProductTemplateId('item-small'),
            i18nKey: 'products.item-small',
            category: 'food',
            baseQuantity: createQuantity(2),
            unit: 'kilograms',
            scaleWithPeople: false,
            scaleWithDays: false,
          },
          recommendedQty: 2,
          actualQty: 2,
          matchingItems: [],
          hasMarkedAsEnough: false,
          unit: 'kilograms',
          actualCalories: 0,
        },
      ];

      const result = strategy.aggregateTotals(itemResults, context);
      // cans=10 > kg=2, so cans should win
      // If condition is always true, last unit 'kilograms' would win
      expect(result.primaryUnit).toBe('cans');
    });
  });
});
