import { describe, it, expect } from 'vitest';
import { WaterCategoryStrategy } from './water';
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

describe('WaterCategoryStrategy', () => {
  const strategy = new WaterCategoryStrategy();

  describe('canHandle', () => {
    it('should handle water-beverages category', () => {
      expect(strategy.canHandle('water-beverages')).toBe(true);
    });

    it('should not handle other categories', () => {
      expect(strategy.canHandle('food')).toBe(false);
      expect(strategy.canHandle('tools-supplies')).toBe(false);
      expect(strategy.canHandle('water')).toBe(false); // Different ID
    });
  });

  describe('strategyId', () => {
    it('should have strategyId of "water-beverages"', () => {
      expect(strategy.strategyId).toBe('water-beverages');
    });
  });

  describe('calculateRecommendedQuantity', () => {
    const baseContext: CategoryCalculationContext = {
      categoryId: 'water-beverages',
      items: [], // No food items requiring water
      categoryItems: [],
      recommendedForCategory: [],
      household: createMockHousehold({
        adults: 2,
        children: 1,
        pets: 0,
        supplyDurationDays: 3,
      }),
      disabledRecommendedItems: [],
      options: { dailyWaterPerPerson: 3 },
      peopleMultiplier: 2.75,
    };

    it('should use dailyWater setting for bottled-water instead of baseQuantity', () => {
      const recItem: RecommendedItemDefinition = {
        id: createProductTemplateId('bottled-water'),
        i18nKey: 'products.bottled-water',
        category: 'water-beverages',
        baseQuantity: createQuantity(1), // This should be ignored
        unit: 'liters',
        scaleWithPeople: true,
        scaleWithDays: true,
      };

      const result = strategy.calculateRecommendedQuantity(
        recItem,
        baseContext,
      );
      // 3 (daily) * 2.75 (people) * 3 (days) = 24.75, ceiled to 25
      expect(result).toBe(25);
    });

    it('should use baseQuantity for non-bottled-water items', () => {
      const recItem: RecommendedItemDefinition = {
        id: createProductTemplateId('sports-drink'),
        i18nKey: 'products.sports-drink',
        category: 'water-beverages',
        baseQuantity: createQuantity(2),
        unit: 'bottles',
        scaleWithPeople: true,
        scaleWithDays: false,
      };

      const result = strategy.calculateRecommendedQuantity(
        recItem,
        baseContext,
      );
      // 2 * 2.75 = 5.5, ceiled to 6
      expect(result).toBe(6);
    });

    it('should add preparation water to bottled-water recommendation', () => {
      // Create context with food items that require water
      const contextWithFoodItems: CategoryCalculationContext = {
        ...baseContext,
        items: [
          createMockInventoryItem({
            categoryId: createCategoryId('food'),
            itemType: createProductTemplateId('instant-noodles'),
            quantity: createQuantity(5),
            requiresWaterLiters: 0.5, // 0.5L per unit
          }),
        ],
      };

      const recItem: RecommendedItemDefinition = {
        id: createProductTemplateId('bottled-water'),
        i18nKey: 'products.bottled-water',
        category: 'water-beverages',
        baseQuantity: createQuantity(1),
        unit: 'liters',
        scaleWithPeople: true,
        scaleWithDays: true,
      };

      const result = strategy.calculateRecommendedQuantity(
        recItem,
        contextWithFoodItems,
      );
      // Drinking: 3 * 2.75 * 3 = 24.75
      // Preparation: 5 * 0.5 = 2.5
      // Total: 27.25, ceiled to 28
      expect(result).toBe(28);
    });

    it('should use custom daily water from options', () => {
      const customContext: CategoryCalculationContext = {
        ...baseContext,
        options: { dailyWaterPerPerson: 4 },
      };

      const recItem: RecommendedItemDefinition = {
        id: createProductTemplateId('bottled-water'),
        i18nKey: 'products.bottled-water',
        category: 'water-beverages',
        baseQuantity: createQuantity(1),
        unit: 'liters',
        scaleWithPeople: true,
        scaleWithDays: true,
      };

      const result = strategy.calculateRecommendedQuantity(
        recItem,
        customContext,
      );
      // 4 * 2.75 * 3 = 33
      expect(result).toBe(33);
    });
  });

  describe('calculateActualQuantity', () => {
    const context: CategoryCalculationContext = {
      categoryId: 'water-beverages',
      items: [],
      categoryItems: [],
      recommendedForCategory: [],
      household: createMockHousehold(),
      disabledRecommendedItems: [],
      options: {},
      peopleMultiplier: 2,
    };

    it('should sum quantities of matching items', () => {
      const matchingItems = [
        createMockInventoryItem({ quantity: createQuantity(10) }),
        createMockInventoryItem({ quantity: createQuantity(5) }),
      ];

      const recItem: RecommendedItemDefinition = {
        id: createProductTemplateId('bottled-water'),
        i18nKey: 'products.bottled-water',
        category: 'water-beverages',
        baseQuantity: createQuantity(3),
        unit: 'liters',
        scaleWithPeople: true,
        scaleWithDays: true,
      };

      const result = strategy.calculateActualQuantity(
        matchingItems,
        recItem,
        context,
      );
      expect(result.quantity).toBe(15);
      expect(result.calories).toBeUndefined();
    });
  });

  describe('aggregateTotals', () => {
    const context: CategoryCalculationContext = {
      categoryId: 'water-beverages',
      items: [
        createMockInventoryItem({
          categoryId: createCategoryId('food'),
          itemType: createProductTemplateId('instant-rice'),
          quantity: createQuantity(4),
          requiresWaterLiters: 0.25,
        }),
      ],
      categoryItems: [],
      recommendedForCategory: [],
      household: createMockHousehold({
        adults: 2,
        children: 0,
        pets: 0,
        supplyDurationDays: 3,
      }),
      disabledRecommendedItems: [],
      options: { dailyWaterPerPerson: 3 },
      peopleMultiplier: 2,
    };

    it('should calculate drinking and preparation water separately', () => {
      const itemResults: ItemCalculationResult[] = [
        {
          recItem: {
            id: createProductTemplateId('bottled-water'),
            i18nKey: 'products.bottled-water',
            category: 'water-beverages',
            baseQuantity: createQuantity(3),
            unit: 'liters',
            scaleWithPeople: true,
            scaleWithDays: true,
          },
          recommendedQty: 19, // 3*2*3 + 1 (preparation) = 19
          actualQty: 20,
          matchingItems: [],
          hasMarkedAsEnough: false,
          unit: 'liters',
        },
      ];

      const result = strategy.aggregateTotals(itemResults, context);

      // Drinking: 3 * 2 * 3 = 18
      expect(result.drinkingWaterNeeded).toBe(18);
      // Preparation: 4 * 0.25 = 1
      expect(result.preparationWaterNeeded).toBe(1);
      expect(result.totalActual).toBe(20);
      expect(result.totalNeeded).toBe(19);
    });

    it('should include standard aggregation data', () => {
      const itemResults: ItemCalculationResult[] = [
        {
          recItem: {
            id: createProductTemplateId('bottled-water'),
            i18nKey: 'products.bottled-water',
            category: 'water-beverages',
            baseQuantity: createQuantity(3),
            unit: 'liters',
            scaleWithPeople: true,
            scaleWithDays: true,
          },
          recommendedQty: 18,
          actualQty: 10,
          matchingItems: [],
          hasMarkedAsEnough: false,
          unit: 'liters',
        },
      ];

      const result = strategy.aggregateTotals(itemResults, context);

      expect(result.shortages).toHaveLength(1);
      expect(result.shortages[0].missing).toBe(8);
      expect(result.primaryUnit).toBe('liters');
    });
  });

  describe('hasEnoughInventory', () => {
    it('should return true when totalActual >= totalNeeded', () => {
      const result: ShortageCalculationResult = {
        shortages: [],
        totalActual: 20,
        totalNeeded: 18,
        drinkingWaterNeeded: 15,
        preparationWaterNeeded: 3,
      };

      expect(strategy.hasEnoughInventory(result)).toBe(true);
    });

    it('should return false when totalActual < totalNeeded', () => {
      const result: ShortageCalculationResult = {
        shortages: [],
        totalActual: 10,
        totalNeeded: 18,
        drinkingWaterNeeded: 15,
        preparationWaterNeeded: 3,
      };

      expect(strategy.hasEnoughInventory(result)).toBe(false);
    });

    it('should return false when totalNeeded is 0', () => {
      const result: ShortageCalculationResult = {
        shortages: [],
        totalActual: 0,
        totalNeeded: 0,
      };

      expect(strategy.hasEnoughInventory(result)).toBe(false);
    });
  });
});
