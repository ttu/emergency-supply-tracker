import { describe, it, expect } from 'vitest';
import { DefaultCategoryStrategy } from './default';
import type {
  CategoryCalculationContext,
  ItemCalculationResult,
  ShortageCalculationResult,
} from './types';
import {
  createMockHousehold,
  createMockInventoryItem,
} from '@/shared/utils/test/factories';
import { createProductTemplateId, createQuantity } from '@/shared/types';
import type { RecommendedItemDefinition } from '@/shared/types';

describe('DefaultCategoryStrategy', () => {
  const strategy = new DefaultCategoryStrategy();

  describe('canHandle', () => {
    it('should handle any category', () => {
      expect(strategy.canHandle('water-beverages')).toBe(true);
      expect(strategy.canHandle('food')).toBe(true);
      expect(strategy.canHandle('unknown-category')).toBe(true);
      expect(strategy.canHandle('')).toBe(true);
    });
  });

  describe('strategyId', () => {
    it('should have strategyId of "default"', () => {
      expect(strategy.strategyId).toBe('default');
    });
  });

  describe('calculateRecommendedQuantity', () => {
    const baseContext: CategoryCalculationContext = {
      categoryId: 'tools-supplies',
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
      peopleMultiplier: 2.75, // 2 * 1.0 + 1 * 0.75
    };

    it('should calculate base quantity without scaling', () => {
      const recItem: RecommendedItemDefinition = {
        id: createProductTemplateId('flashlight'),
        i18nKey: 'products.flashlight',
        category: 'tools-supplies',
        baseQuantity: createQuantity(2),
        unit: 'pieces',
        scaleWithPeople: false,
        scaleWithDays: false,
      };

      const result = strategy.calculateRecommendedQuantity(
        recItem,
        baseContext,
      );
      expect(result).toBe(2);
    });

    it('should scale with people when scaleWithPeople is true', () => {
      const recItem: RecommendedItemDefinition = {
        id: createProductTemplateId('batteries'),
        i18nKey: 'products.batteries',
        category: 'tools-supplies',
        baseQuantity: createQuantity(4),
        unit: 'pieces',
        scaleWithPeople: true,
        scaleWithDays: false,
      };

      const result = strategy.calculateRecommendedQuantity(
        recItem,
        baseContext,
      );
      // 4 * 2.75 = 11, ceiled
      expect(result).toBe(11);
    });

    it('should scale with days when scaleWithDays is true', () => {
      const recItem: RecommendedItemDefinition = {
        id: createProductTemplateId('candles'),
        i18nKey: 'products.candles',
        category: 'tools-supplies',
        baseQuantity: createQuantity(2),
        unit: 'pieces',
        scaleWithPeople: false,
        scaleWithDays: true,
      };

      const result = strategy.calculateRecommendedQuantity(
        recItem,
        baseContext,
      );
      // 2 * 3 days = 6
      expect(result).toBe(6);
    });

    it('should scale with pets when scaleWithPets is true', () => {
      const contextWithPets: CategoryCalculationContext = {
        ...baseContext,
        household: { ...baseContext.household, pets: 2 },
      };

      const recItem: RecommendedItemDefinition = {
        id: createProductTemplateId('pet-food'),
        i18nKey: 'products.pet-food',
        category: 'pets',
        baseQuantity: createQuantity(1),
        unit: 'packages',
        scaleWithPeople: false,
        scaleWithDays: false,
        scaleWithPets: true,
      };

      const result = strategy.calculateRecommendedQuantity(
        recItem,
        contextWithPets,
      );
      // 1 * 2 pets * 1 (PET_REQUIREMENT_MULTIPLIER) = 2
      expect(result).toBe(2);
    });

    it('should ceil the result', () => {
      const recItem: RecommendedItemDefinition = {
        id: createProductTemplateId('item'),
        i18nKey: 'products.item',
        category: 'tools-supplies',
        baseQuantity: createQuantity(1),
        unit: 'pieces',
        scaleWithPeople: true,
        scaleWithDays: false,
      };

      const result = strategy.calculateRecommendedQuantity(
        recItem,
        baseContext,
      );
      // 1 * 2.75 = 2.75, ceiled to 3
      expect(result).toBe(3);
    });
  });

  describe('calculateActualQuantity', () => {
    const context: CategoryCalculationContext = {
      categoryId: 'tools-supplies',
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
        createMockInventoryItem({ quantity: createQuantity(5) }),
        createMockInventoryItem({ quantity: createQuantity(3) }),
        createMockInventoryItem({ quantity: createQuantity(2) }),
      ];

      const recItem: RecommendedItemDefinition = {
        id: createProductTemplateId('flashlight'),
        i18nKey: 'products.flashlight',
        category: 'tools-supplies',
        baseQuantity: createQuantity(2),
        unit: 'pieces',
        scaleWithPeople: false,
        scaleWithDays: false,
      };

      const result = strategy.calculateActualQuantity(
        matchingItems,
        recItem,
        context,
      );
      expect(result.quantity).toBe(10);
      expect(result.calories).toBeUndefined();
    });

    it('should return 0 for empty matching items', () => {
      const recItem: RecommendedItemDefinition = {
        id: createProductTemplateId('flashlight'),
        i18nKey: 'products.flashlight',
        category: 'tools-supplies',
        baseQuantity: createQuantity(2),
        unit: 'pieces',
        scaleWithPeople: false,
        scaleWithDays: false,
      };

      const result = strategy.calculateActualQuantity([], recItem, context);
      expect(result.quantity).toBe(0);
    });
  });

  describe('aggregateTotals', () => {
    const context: CategoryCalculationContext = {
      categoryId: 'tools-supplies',
      items: [],
      categoryItems: [],
      recommendedForCategory: [],
      household: createMockHousehold(),
      disabledRecommendedItems: [],
      options: {},
      peopleMultiplier: 2,
    };

    it('should aggregate standard totals for single unit', () => {
      const itemResults: ItemCalculationResult[] = [
        {
          recItem: {
            id: createProductTemplateId('flashlight'),
            i18nKey: 'products.flashlight',
            category: 'tools-supplies',
            baseQuantity: createQuantity(2),
            unit: 'pieces',
            scaleWithPeople: false,
            scaleWithDays: false,
          },
          recommendedQty: 2,
          actualQty: 1,
          matchingItems: [],
          hasMarkedAsEnough: false,
          unit: 'pieces',
        },
        {
          recItem: {
            id: createProductTemplateId('batteries'),
            i18nKey: 'products.batteries',
            category: 'tools-supplies',
            baseQuantity: createQuantity(8),
            unit: 'pieces',
            scaleWithPeople: false,
            scaleWithDays: false,
          },
          recommendedQty: 8,
          actualQty: 8,
          matchingItems: [],
          hasMarkedAsEnough: false,
          unit: 'pieces',
        },
      ];

      const result = strategy.aggregateTotals(itemResults, context);

      expect(result.totalActual).toBe(9);
      expect(result.totalNeeded).toBe(10);
      expect(result.primaryUnit).toBe('pieces');
      expect(result.shortages).toHaveLength(1);
      expect(result.shortages[0].itemId).toBe('flashlight');
      expect(result.shortages[0].missing).toBe(1);
    });

    it('should use weighted fulfillment for mixed units', () => {
      const itemResults: ItemCalculationResult[] = [
        {
          recItem: {
            id: createProductTemplateId('water'),
            i18nKey: 'products.water',
            category: 'tools-supplies',
            baseQuantity: createQuantity(10),
            unit: 'liters',
            scaleWithPeople: false,
            scaleWithDays: false,
          },
          recommendedQty: 10,
          actualQty: 10, // 100% fulfilled
          matchingItems: [],
          hasMarkedAsEnough: false,
          unit: 'liters',
        },
        {
          recItem: {
            id: createProductTemplateId('food'),
            i18nKey: 'products.food',
            category: 'tools-supplies',
            baseQuantity: createQuantity(5),
            unit: 'kilograms',
            scaleWithPeople: false,
            scaleWithDays: false,
          },
          recommendedQty: 5,
          actualQty: 2.5, // 50% fulfilled
          matchingItems: [],
          hasMarkedAsEnough: false,
          unit: 'kilograms',
        },
      ];

      const result = strategy.aggregateTotals(itemResults, context);

      // Mixed units: uses weighted fulfillment
      // Item 1: 10/10 = 1.0, Item 2: 2.5/5 = 0.5
      // Total: 1.0 + 0.5 = 1.5 out of 2 item types
      expect(result.totalActual).toBe(1.5);
      expect(result.totalNeeded).toBe(2);
      expect(result.primaryUnit).toBeUndefined(); // Signal for "items"
    });

    it('should handle markedAsEnough items', () => {
      const itemResults: ItemCalculationResult[] = [
        {
          recItem: {
            id: createProductTemplateId('item'),
            i18nKey: 'products.item',
            category: 'tools-supplies',
            baseQuantity: createQuantity(10),
            unit: 'pieces',
            scaleWithPeople: false,
            scaleWithDays: false,
          },
          recommendedQty: 10,
          actualQty: 2,
          matchingItems: [],
          hasMarkedAsEnough: true, // Marked as enough
          unit: 'pieces',
        },
      ];

      const result = strategy.aggregateTotals(itemResults, context);

      // Even though actualQty < recommendedQty, no shortage because markedAsEnough
      expect(result.shortages).toHaveLength(0);
    });

    it('should sort shortages by missing amount descending', () => {
      const itemResults: ItemCalculationResult[] = [
        {
          recItem: {
            id: createProductTemplateId('item-a'),
            i18nKey: 'products.item-a',
            category: 'tools-supplies',
            baseQuantity: createQuantity(5),
            unit: 'pieces',
            scaleWithPeople: false,
            scaleWithDays: false,
          },
          recommendedQty: 5,
          actualQty: 3, // Missing 2
          matchingItems: [],
          hasMarkedAsEnough: false,
          unit: 'pieces',
        },
        {
          recItem: {
            id: createProductTemplateId('item-b'),
            i18nKey: 'products.item-b',
            category: 'tools-supplies',
            baseQuantity: createQuantity(10),
            unit: 'pieces',
            scaleWithPeople: false,
            scaleWithDays: false,
          },
          recommendedQty: 10,
          actualQty: 2, // Missing 8
          matchingItems: [],
          hasMarkedAsEnough: false,
          unit: 'pieces',
        },
      ];

      const result = strategy.aggregateTotals(itemResults, context);

      expect(result.shortages).toHaveLength(2);
      expect(result.shortages[0].itemId).toBe('item-b'); // Missing 8 (highest)
      expect(result.shortages[1].itemId).toBe('item-a'); // Missing 2
    });
  });

  describe('hasEnoughInventory', () => {
    it('should return true when totalActual >= totalNeeded', () => {
      const result: ShortageCalculationResult = {
        shortages: [],
        totalActual: 10,
        totalNeeded: 10,
      };

      expect(strategy.hasEnoughInventory(result)).toBe(true);
    });

    it('should return true when totalActual > totalNeeded', () => {
      const result: ShortageCalculationResult = {
        shortages: [],
        totalActual: 15,
        totalNeeded: 10,
      };

      expect(strategy.hasEnoughInventory(result)).toBe(true);
    });

    it('should return false when totalActual < totalNeeded', () => {
      const result: ShortageCalculationResult = {
        shortages: [],
        totalActual: 5,
        totalNeeded: 10,
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
