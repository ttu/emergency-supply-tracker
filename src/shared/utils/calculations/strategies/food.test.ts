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
