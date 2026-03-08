import { describe, it, expect } from 'vitest';
import { FoodCategoryStrategy } from './food';
import type {
  CategoryCalculationContext,
  ItemCalculationResult,
  ShortageCalculationResult,
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

describe('FoodCategoryStrategy', () => {
  const strategy = new FoodCategoryStrategy();

  describe('canHandle', () => {
    it('should handle food category', () => {
      expect(strategy.canHandle('food')).toBe(true);
    });

    it('should not handle non-food categories', () => {
      expect(strategy.canHandle('water-beverages')).toBe(false);
      expect(strategy.canHandle('tools-supplies')).toBe(false);
      expect(strategy.canHandle('communication-info')).toBe(false);
    });
  });

  describe('strategyId', () => {
    it('should have strategyId of "food"', () => {
      expect(strategy.strategyId).toBe('food');
    });
  });

  describe('calculateRecommendedQuantity', () => {
    const baseContext: CategoryCalculationContext = {
      categoryId: 'food',
      items: [],
      categoryItems: [],
      recommendedForCategory: [],
      household: createMockHousehold({
        adults: 2,
        children: 1,
        pets: 0,
        supplyDurationDays: 3,
      }),
      disabledRecommendedItems: [],
      options: {},
      peopleMultiplier: 2.75,
    };

    it('should calculate quantity with standard scaling', () => {
      const recItem: RecommendedItemDefinition = {
        id: createProductTemplateId('canned-beans'),
        i18nKey: 'products.canned-beans',
        category: 'food',
        baseQuantity: createQuantity(2),
        unit: 'cans',
        scaleWithPeople: true,
        scaleWithDays: true,
        caloriesPerUnit: 200,
      };

      const result = strategy.calculateRecommendedQuantity(
        recItem,
        baseContext,
      );
      // 2 * 2.75 (people) * 3 (days) = 16.5, ceiled to 17
      expect(result).toBe(17);
    });
  });

  describe('calculateActualQuantity', () => {
    const context: CategoryCalculationContext = {
      categoryId: 'food',
      items: [],
      categoryItems: [],
      recommendedForCategory: [],
      household: createMockHousehold(),
      disabledRecommendedItems: [],
      options: {},
      peopleMultiplier: 2,
    };

    it('should calculate quantity and calories', () => {
      const matchingItems = [
        createMockInventoryItem({
          categoryId: createCategoryId('food'),
          quantity: createQuantity(5),
          caloriesPerUnit: 200,
        }),
        createMockInventoryItem({
          categoryId: createCategoryId('food'),
          quantity: createQuantity(3),
          caloriesPerUnit: 150,
        }),
      ];

      const recItem: RecommendedItemDefinition = {
        id: createProductTemplateId('canned-food'),
        i18nKey: 'products.canned-food',
        category: 'food',
        baseQuantity: createQuantity(10),
        unit: 'cans',
        scaleWithPeople: false,
        scaleWithDays: false,
        caloriesPerUnit: 200,
      };

      const result = strategy.calculateActualQuantity(
        matchingItems,
        recItem,
        context,
      );

      expect(result.quantity).toBe(8);
      // 5 * 200 + 3 * 150 = 1000 + 450 = 1450
      expect(result.calories).toBe(1450);
    });

    it('should use fallback calories when item has no caloriesPerUnit', () => {
      const matchingItems = [
        createMockInventoryItem({
          categoryId: createCategoryId('food'),
          quantity: createQuantity(5),
          caloriesPerUnit: undefined,
        }),
      ];

      const recItem: RecommendedItemDefinition = {
        id: createProductTemplateId('canned-food'),
        i18nKey: 'products.canned-food',
        category: 'food',
        baseQuantity: createQuantity(10),
        unit: 'cans',
        scaleWithPeople: false,
        scaleWithDays: false,
        caloriesPerUnit: 200,
      };

      const result = strategy.calculateActualQuantity(
        matchingItems,
        recItem,
        context,
      );

      expect(result.quantity).toBe(5);
      // Fallback: 5 * 200 (from recItem) = 1000
      expect(result.calories).toBe(1000);
    });

    it('should return 0 calories when recommended item has no caloriesPerUnit', () => {
      const matchingItems = [
        createMockInventoryItem({
          categoryId: createCategoryId('food'),
          quantity: createQuantity(5),
          caloriesPerUnit: 200,
        }),
      ];

      const recItem: RecommendedItemDefinition = {
        id: createProductTemplateId('mystery-food'),
        i18nKey: 'products.mystery-food',
        category: 'food',
        baseQuantity: createQuantity(10),
        unit: 'cans',
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
      expect(result.calories).toBe(0);
    });
  });

  describe('aggregateTotals', () => {
    const context: CategoryCalculationContext = {
      categoryId: 'food',
      items: [],
      categoryItems: [],
      recommendedForCategory: [],
      household: createMockHousehold({
        adults: 2,
        children: 0,
        pets: 0,
        supplyDurationDays: 3,
      }),
      disabledRecommendedItems: [],
      options: { dailyCaloriesPerPerson: 2000 },
      peopleMultiplier: 2,
    };

    it('should calculate total needed calories based on household', () => {
      const itemResults: ItemCalculationResult[] = [
        {
          recItem: {
            id: createProductTemplateId('canned-beans'),
            i18nKey: 'products.canned-beans',
            category: 'food',
            baseQuantity: createQuantity(5),
            unit: 'cans',
            scaleWithPeople: false,
            scaleWithDays: false,
            caloriesPerUnit: 200,
          },
          recommendedQty: 5,
          actualQty: 5,
          matchingItems: [],
          hasMarkedAsEnough: false,
          unit: 'cans',
          actualCalories: 1000,
        },
      ];

      const result = strategy.aggregateTotals(itemResults, context);

      // 2000 calories * 2 people * 3 days = 12000
      expect(result.totalNeededCalories).toBe(12000);
      expect(result.totalActualCalories).toBe(1000);
      expect(result.missingCalories).toBe(11000);
    });

    it('should track quantity totals alongside calories', () => {
      const itemResults: ItemCalculationResult[] = [
        {
          recItem: {
            id: createProductTemplateId('item-a'),
            i18nKey: 'products.item-a',
            category: 'food',
            baseQuantity: createQuantity(10),
            unit: 'cans',
            scaleWithPeople: false,
            scaleWithDays: false,
          },
          recommendedQty: 10,
          actualQty: 8,
          matchingItems: [],
          hasMarkedAsEnough: false,
          unit: 'cans',
          actualCalories: 1600,
        },
        {
          recItem: {
            id: createProductTemplateId('item-b'),
            i18nKey: 'products.item-b',
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
          actualCalories: 1000,
        },
      ];

      const result = strategy.aggregateTotals(itemResults, context);

      expect(result.totalActual).toBe(13);
      expect(result.totalNeeded).toBe(15);
      expect(result.primaryUnit).toBe('cans');
      expect(result.totalActualCalories).toBe(2600);
    });

    it('should create shortages for items below recommended quantity', () => {
      const itemResults: ItemCalculationResult[] = [
        {
          recItem: {
            id: createProductTemplateId('canned-soup'),
            i18nKey: 'products.canned-soup',
            category: 'food',
            baseQuantity: createQuantity(10),
            unit: 'cans',
            scaleWithPeople: false,
            scaleWithDays: false,
          },
          recommendedQty: 10,
          actualQty: 3,
          matchingItems: [],
          hasMarkedAsEnough: false,
          unit: 'cans',
          actualCalories: 600,
        },
      ];

      const result = strategy.aggregateTotals(itemResults, context);

      expect(result.shortages).toHaveLength(1);
      expect(result.shortages[0].itemId).toBe('canned-soup');
      expect(result.shortages[0].missing).toBe(7);
    });

    it('should use custom daily calories from options', () => {
      const customContext: CategoryCalculationContext = {
        ...context,
        options: { dailyCaloriesPerPerson: 2500 },
      };

      const itemResults: ItemCalculationResult[] = [];

      const result = strategy.aggregateTotals(itemResults, customContext);

      // 2500 * 2 people * 3 days = 15000
      expect(result.totalNeededCalories).toBe(15000);
    });
  });

  describe('strategyId - string literal mutation', () => {
    it('strategyId must be exactly "food" not empty string', () => {
      expect(strategy.strategyId).toBe('food');
      expect(strategy.strategyId).not.toBe('');
      expect(strategy.strategyId.length).toBeGreaterThan(0);
    });
  });

  describe('calculateActualQuantity - compound condition mutations', () => {
    const context: CategoryCalculationContext = {
      categoryId: 'food',
      items: [],
      categoryItems: [],
      recommendedForCategory: [],
      household: createMockHousehold(),
      disabledRecommendedItems: [],
      options: {},
      peopleMultiplier: 2,
    };

    it('returns 0 calories when recItem.caloriesPerUnit is null', () => {
      const matchingItems = [
        createMockInventoryItem({
          categoryId: createCategoryId('food'),
          quantity: createQuantity(5),
          caloriesPerUnit: 200,
        }),
      ];

      const recItem: RecommendedItemDefinition = {
        id: createProductTemplateId('food-item'),
        i18nKey: 'products.food-item',
        category: 'food',
        baseQuantity: createQuantity(10),
        unit: 'cans',
        scaleWithPeople: false,
        scaleWithDays: false,
        caloriesPerUnit: null as unknown as undefined,
      };

      const result = strategy.calculateActualQuantity(
        matchingItems,
        recItem,
        context,
      );

      expect(result.quantity).toBe(5);
      expect(result.calories).toBe(0);
    });

    it('returns 0 calories when recItem.caloriesPerUnit is NaN', () => {
      const matchingItems = [
        createMockInventoryItem({
          categoryId: createCategoryId('food'),
          quantity: createQuantity(5),
          caloriesPerUnit: 200,
        }),
      ];

      const recItem: RecommendedItemDefinition = {
        id: createProductTemplateId('nan-food'),
        i18nKey: 'products.nan-food',
        category: 'food',
        baseQuantity: createQuantity(10),
        unit: 'cans',
        scaleWithPeople: false,
        scaleWithDays: false,
        caloriesPerUnit: Number.NaN,
      };

      const result = strategy.calculateActualQuantity(
        matchingItems,
        recItem,
        context,
      );

      expect(result.quantity).toBe(5);
      expect(result.calories).toBe(0);
    });

    it('returns 0 calories when recItem.caloriesPerUnit is Infinity', () => {
      const matchingItems = [
        createMockInventoryItem({
          categoryId: createCategoryId('food'),
          quantity: createQuantity(3),
          caloriesPerUnit: 100,
        }),
      ];

      const recItem: RecommendedItemDefinition = {
        id: createProductTemplateId('inf-food'),
        i18nKey: 'products.inf-food',
        category: 'food',
        baseQuantity: createQuantity(10),
        unit: 'cans',
        scaleWithPeople: false,
        scaleWithDays: false,
        caloriesPerUnit: Infinity,
      };

      const result = strategy.calculateActualQuantity(
        matchingItems,
        recItem,
        context,
      );

      expect(result.quantity).toBe(3);
      expect(result.calories).toBe(0);
    });

    it('uses fallback when item.caloriesPerUnit is null', () => {
      const matchingItems = [
        createMockInventoryItem({
          categoryId: createCategoryId('food'),
          quantity: createQuantity(4),
          caloriesPerUnit: null as unknown as undefined,
        }),
      ];

      const recItem: RecommendedItemDefinition = {
        id: createProductTemplateId('fallback-food'),
        i18nKey: 'products.fallback-food',
        category: 'food',
        baseQuantity: createQuantity(10),
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
      // Fallback: 4 * 300 = 1200
      expect(result.calories).toBe(1200);
    });

    it('uses fallback when item.caloriesPerUnit is NaN', () => {
      const matchingItems = [
        createMockInventoryItem({
          categoryId: createCategoryId('food'),
          quantity: createQuantity(2),
          caloriesPerUnit: Number.NaN,
        }),
      ];

      const recItem: RecommendedItemDefinition = {
        id: createProductTemplateId('nan-item-food'),
        i18nKey: 'products.nan-item-food',
        category: 'food',
        baseQuantity: createQuantity(10),
        unit: 'cans',
        scaleWithPeople: false,
        scaleWithDays: false,
        caloriesPerUnit: 500,
      };

      const result = strategy.calculateActualQuantity(
        matchingItems,
        recItem,
        context,
      );

      expect(result.quantity).toBe(2);
      // Fallback: 2 * 500 = 1000
      expect(result.calories).toBe(1000);
    });
  });

  describe('aggregateTotals - boundary and sorting mutations', () => {
    const context: CategoryCalculationContext = {
      categoryId: 'food',
      items: [],
      categoryItems: [],
      recommendedForCategory: [],
      household: createMockHousehold({
        adults: 2,
        children: 1,
        pets: 0,
        supplyDurationDays: 3,
      }),
      disabledRecommendedItems: [],
      options: { dailyCaloriesPerPerson: 2000 },
      peopleMultiplier: 2.75,
    };

    it('does not add shortage when missing is exactly 0', () => {
      const itemResults: ItemCalculationResult[] = [
        {
          recItem: {
            id: createProductTemplateId('exact-match'),
            i18nKey: 'products.exact-match',
            category: 'food',
            baseQuantity: createQuantity(5),
            unit: 'cans',
            scaleWithPeople: false,
            scaleWithDays: false,
          },
          recommendedQty: 5,
          actualQty: 5, // exactly meets recommended
          matchingItems: [],
          hasMarkedAsEnough: false,
          unit: 'cans',
          actualCalories: 1000,
        },
      ];

      const result = strategy.aggregateTotals(itemResults, context);

      expect(result.shortages).toHaveLength(0);
    });

    it('does not add shortage when item is marked as enough', () => {
      const itemResults: ItemCalculationResult[] = [
        {
          recItem: {
            id: createProductTemplateId('enough-item'),
            i18nKey: 'products.enough-item',
            category: 'food',
            baseQuantity: createQuantity(10),
            unit: 'cans',
            scaleWithPeople: false,
            scaleWithDays: false,
          },
          recommendedQty: 10,
          actualQty: 3, // missing 7 but marked as enough
          matchingItems: [],
          hasMarkedAsEnough: true,
          unit: 'cans',
          actualCalories: 600,
        },
      ];

      const result = strategy.aggregateTotals(itemResults, context);

      expect(result.shortages).toHaveLength(0);
    });

    it('adds shortage when missing > 0 AND not marked as enough (both conditions required)', () => {
      const itemResults: ItemCalculationResult[] = [
        {
          recItem: {
            id: createProductTemplateId('short-item'),
            i18nKey: 'products.short-item',
            category: 'food',
            baseQuantity: createQuantity(10),
            unit: 'cans',
            scaleWithPeople: false,
            scaleWithDays: false,
          },
          recommendedQty: 10,
          actualQty: 3,
          matchingItems: [],
          hasMarkedAsEnough: false,
          unit: 'cans',
          actualCalories: 600,
        },
      ];

      const result = strategy.aggregateTotals(itemResults, context);

      expect(result.shortages).toHaveLength(1);
      expect(result.shortages[0].missing).toBe(7);
    });

    it('finds primary unit by highest total quantity', () => {
      // actualQty differs from recommendedQty to ensure primaryUnit uses recommendedQty
      const itemResults: ItemCalculationResult[] = [
        {
          recItem: {
            id: createProductTemplateId('kg-item'),
            i18nKey: 'products.kg-item',
            category: 'food',
            baseQuantity: createQuantity(2),
            unit: 'kilograms',
            scaleWithPeople: false,
            scaleWithDays: false,
          },
          recommendedQty: 2,
          actualQty: 10, // higher actualQty — would make kg win if actualQty were used
          matchingItems: [],
          hasMarkedAsEnough: false,
          unit: 'kilograms',
          actualCalories: 0,
        },
        {
          recItem: {
            id: createProductTemplateId('can-item-1'),
            i18nKey: 'products.can-item-1',
            category: 'food',
            baseQuantity: createQuantity(5),
            unit: 'cans',
            scaleWithPeople: false,
            scaleWithDays: false,
          },
          recommendedQty: 5,
          actualQty: 0, // zero actualQty — only recommendedQty should matter
          matchingItems: [],
          hasMarkedAsEnough: false,
          unit: 'cans',
          actualCalories: 0,
        },
        {
          recItem: {
            id: createProductTemplateId('can-item-2'),
            i18nKey: 'products.can-item-2',
            category: 'food',
            baseQuantity: createQuantity(3),
            unit: 'cans',
            scaleWithPeople: false,
            scaleWithDays: false,
          },
          recommendedQty: 3,
          actualQty: 0,
          matchingItems: [],
          hasMarkedAsEnough: false,
          unit: 'cans',
          actualCalories: 0,
        },
      ];

      const result = strategy.aggregateTotals(itemResults, context);

      // By recommendedQty: cans = 5+3 = 8, kg = 2 -> cans wins
      // By actualQty: cans = 0, kg = 10 -> kg would win (regression)
      expect(result.primaryUnit).toBe('cans');
    });

    it('sorts shortages by missing amount descending', () => {
      const itemResults: ItemCalculationResult[] = [
        {
          recItem: {
            id: createProductTemplateId('small-shortage'),
            i18nKey: 'products.small-shortage',
            category: 'food',
            baseQuantity: createQuantity(5),
            unit: 'cans',
            scaleWithPeople: false,
            scaleWithDays: false,
          },
          recommendedQty: 5,
          actualQty: 3, // missing 2
          matchingItems: [],
          hasMarkedAsEnough: false,
          unit: 'cans',
          actualCalories: 0,
        },
        {
          recItem: {
            id: createProductTemplateId('large-shortage'),
            i18nKey: 'products.large-shortage',
            category: 'food',
            baseQuantity: createQuantity(10),
            unit: 'cans',
            scaleWithPeople: false,
            scaleWithDays: false,
          },
          recommendedQty: 10,
          actualQty: 1, // missing 9
          matchingItems: [],
          hasMarkedAsEnough: false,
          unit: 'cans',
          actualCalories: 0,
        },
        {
          recItem: {
            id: createProductTemplateId('medium-shortage'),
            i18nKey: 'products.medium-shortage',
            category: 'food',
            baseQuantity: createQuantity(8),
            unit: 'cans',
            scaleWithPeople: false,
            scaleWithDays: false,
          },
          recommendedQty: 8,
          actualQty: 3, // missing 5
          matchingItems: [],
          hasMarkedAsEnough: false,
          unit: 'cans',
          actualCalories: 0,
        },
      ];

      const result = strategy.aggregateTotals(itemResults, context);

      expect(result.shortages).toHaveLength(3);
      // Should be sorted: 9, 5, 2 (descending)
      expect(result.shortages[0].missing).toBe(9);
      expect(result.shortages[0].itemId).toBe('large-shortage');
      expect(result.shortages[1].missing).toBe(5);
      expect(result.shortages[1].itemId).toBe('medium-shortage');
      expect(result.shortages[2].missing).toBe(2);
      expect(result.shortages[2].itemId).toBe('small-shortage');
    });

    it('uses default DAILY_CALORIES_PER_PERSON when not specified in options', () => {
      const defaultContext: CategoryCalculationContext = {
        ...context,
        options: {}, // no dailyCaloriesPerPerson
      };

      const itemResults: ItemCalculationResult[] = [];
      const result = strategy.aggregateTotals(itemResults, defaultContext);

      // DAILY_CALORIES_PER_PERSON = 2000, peopleMultiplier=2.75, 3 days = 16500
      expect(result.totalNeededCalories).toBe(16500);
    });
  });

  describe('hasEnoughInventory', () => {
    it('should return true when actual calories >= needed calories', () => {
      const result: ShortageCalculationResult = {
        shortages: [],
        totalActual: 10,
        totalNeeded: 15,
        totalActualCalories: 12000,
        totalNeededCalories: 12000,
      };

      expect(strategy.hasEnoughInventory(result)).toBe(true);
    });

    it('should return true when actual calories > needed calories', () => {
      const result: ShortageCalculationResult = {
        shortages: [],
        totalActual: 10,
        totalNeeded: 15,
        totalActualCalories: 15000,
        totalNeededCalories: 12000,
      };

      expect(strategy.hasEnoughInventory(result)).toBe(true);
    });

    it('should return false when actual calories < needed calories', () => {
      const result: ShortageCalculationResult = {
        shortages: [],
        totalActual: 10,
        totalNeeded: 15,
        totalActualCalories: 8000,
        totalNeededCalories: 12000,
      };

      expect(strategy.hasEnoughInventory(result)).toBe(false);
    });

    it('should return false when needed calories is 0', () => {
      const result: ShortageCalculationResult = {
        shortages: [],
        totalActual: 0,
        totalNeeded: 0,
        totalActualCalories: 0,
        totalNeededCalories: 0,
      };

      expect(strategy.hasEnoughInventory(result)).toBe(false);
    });

    it('should return false when needed calories is undefined', () => {
      const result: ShortageCalculationResult = {
        shortages: [],
        totalActual: 10,
        totalNeeded: 15,
        // No calorie fields
      };

      expect(strategy.hasEnoughInventory(result)).toBe(false);
    });
  });
});
