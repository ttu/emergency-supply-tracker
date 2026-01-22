import { describe, it, expect } from 'vitest';
import { CommunicationCategoryStrategy } from './communication';
import type {
  CategoryCalculationContext,
  ItemCalculationResult,
  ShortageCalculationResult,
} from './types';
import {
  createMockHousehold,
  createMockInventoryItem,
} from '@/shared/utils/test/factories';
import { createProductTemplateId } from '@/shared/types';
import type { RecommendedItemDefinition } from '@/shared/types';

describe('CommunicationCategoryStrategy', () => {
  const strategy = new CommunicationCategoryStrategy();

  describe('canHandle', () => {
    it('should handle communication-info category', () => {
      expect(strategy.canHandle('communication-info')).toBe(true);
    });

    it('should not handle other categories', () => {
      expect(strategy.canHandle('food')).toBe(false);
      expect(strategy.canHandle('water-beverages')).toBe(false);
      expect(strategy.canHandle('communication')).toBe(false); // Different ID
    });
  });

  describe('strategyId', () => {
    it('should have strategyId of "communication-info"', () => {
      expect(strategy.strategyId).toBe('communication-info');
    });
  });

  describe('calculateRecommendedQuantity', () => {
    const baseContext: CategoryCalculationContext = {
      categoryId: 'communication-info',
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
        id: createProductTemplateId('battery-radio'),
        i18nKey: 'products.battery-radio',
        category: 'communication-info',
        baseQuantity: 1,
        unit: 'pieces',
        scaleWithPeople: false,
        scaleWithDays: false,
      };

      const result = strategy.calculateRecommendedQuantity(
        recItem,
        baseContext,
      );
      expect(result).toBe(1);
    });

    it('should scale with people when enabled', () => {
      const recItem: RecommendedItemDefinition = {
        id: createProductTemplateId('whistle'),
        i18nKey: 'products.whistle',
        category: 'communication-info',
        baseQuantity: 1,
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
      categoryId: 'communication-info',
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
        createMockInventoryItem({ quantity: 1 }),
        createMockInventoryItem({ quantity: 2 }),
      ];

      const recItem: RecommendedItemDefinition = {
        id: createProductTemplateId('battery-radio'),
        i18nKey: 'products.battery-radio',
        category: 'communication-info',
        baseQuantity: 1,
        unit: 'pieces',
        scaleWithPeople: false,
        scaleWithDays: false,
      };

      const result = strategy.calculateActualQuantity(
        matchingItems,
        recItem,
        context,
      );
      expect(result.quantity).toBe(3);
      expect(result.calories).toBeUndefined();
    });
  });

  describe('aggregateTotals', () => {
    const context: CategoryCalculationContext = {
      categoryId: 'communication-info',
      items: [],
      categoryItems: [],
      recommendedForCategory: [],
      household: createMockHousehold(),
      disabledRecommendedItems: [],
      options: {},
      peopleMultiplier: 2,
    };

    it('should always use item-type counts instead of quantities', () => {
      const itemResults: ItemCalculationResult[] = [
        {
          recItem: {
            id: createProductTemplateId('battery-radio'),
            i18nKey: 'products.battery-radio',
            category: 'communication-info',
            baseQuantity: 1,
            unit: 'pieces',
            scaleWithPeople: false,
            scaleWithDays: false,
          },
          recommendedQty: 1,
          actualQty: 2, // Have 2, need 1 - fulfilled
          matchingItems: [],
          hasMarkedAsEnough: false,
          unit: 'pieces',
        },
        {
          recItem: {
            id: createProductTemplateId('hand-crank-radio'),
            i18nKey: 'products.hand-crank-radio',
            category: 'communication-info',
            baseQuantity: 1,
            unit: 'pieces',
            scaleWithPeople: false,
            scaleWithDays: false,
          },
          recommendedQty: 1,
          actualQty: 0, // Have 0, need 1 - not fulfilled
          matchingItems: [],
          hasMarkedAsEnough: false,
          unit: 'pieces',
        },
        {
          recItem: {
            id: createProductTemplateId('whistle'),
            i18nKey: 'products.whistle',
            category: 'communication-info',
            baseQuantity: 2,
            unit: 'pieces',
            scaleWithPeople: false,
            scaleWithDays: false,
          },
          recommendedQty: 2,
          actualQty: 2, // Have 2, need 2 - fulfilled
          matchingItems: [],
          hasMarkedAsEnough: false,
          unit: 'pieces',
        },
      ];

      const result = strategy.aggregateTotals(itemResults, context);

      // 2 item types fulfilled (battery-radio, whistle), 1 not (hand-crank-radio)
      expect(result.totalActual).toBe(2);
      expect(result.totalNeeded).toBe(3);
      // primaryUnit should be undefined to signal "items" display
      expect(result.primaryUnit).toBeUndefined();
    });

    it('should treat markedAsEnough as fulfilled', () => {
      const itemResults: ItemCalculationResult[] = [
        {
          recItem: {
            id: createProductTemplateId('battery-radio'),
            i18nKey: 'products.battery-radio',
            category: 'communication-info',
            baseQuantity: 1,
            unit: 'pieces',
            scaleWithPeople: false,
            scaleWithDays: false,
          },
          recommendedQty: 1,
          actualQty: 0, // Have 0, but marked as enough
          matchingItems: [],
          hasMarkedAsEnough: true,
          unit: 'pieces',
        },
      ];

      const result = strategy.aggregateTotals(itemResults, context);

      expect(result.totalActual).toBe(1); // Counted as fulfilled
      expect(result.totalNeeded).toBe(1);
      expect(result.shortages).toHaveLength(0); // No shortage
    });

    it('should create shortages only for unfulfilled items not marked as enough', () => {
      const itemResults: ItemCalculationResult[] = [
        {
          recItem: {
            id: createProductTemplateId('battery-radio'),
            i18nKey: 'products.battery-radio',
            category: 'communication-info',
            baseQuantity: 1,
            unit: 'pieces',
            scaleWithPeople: false,
            scaleWithDays: false,
          },
          recommendedQty: 1,
          actualQty: 0,
          matchingItems: [],
          hasMarkedAsEnough: false,
          unit: 'pieces',
        },
        {
          recItem: {
            id: createProductTemplateId('hand-crank-radio'),
            i18nKey: 'products.hand-crank-radio',
            category: 'communication-info',
            baseQuantity: 1,
            unit: 'pieces',
            scaleWithPeople: false,
            scaleWithDays: false,
          },
          recommendedQty: 1,
          actualQty: 0,
          matchingItems: [],
          hasMarkedAsEnough: true, // Marked as enough
          unit: 'pieces',
        },
      ];

      const result = strategy.aggregateTotals(itemResults, context);

      // Only battery-radio should be in shortages
      expect(result.shortages).toHaveLength(1);
      expect(result.shortages[0].itemId).toBe('battery-radio');
    });

    it('should sort shortages by missing amount descending', () => {
      const itemResults: ItemCalculationResult[] = [
        {
          recItem: {
            id: createProductTemplateId('item-a'),
            i18nKey: 'products.item-a',
            category: 'communication-info',
            baseQuantity: 2,
            unit: 'pieces',
            scaleWithPeople: false,
            scaleWithDays: false,
          },
          recommendedQty: 2,
          actualQty: 1, // Missing 1
          matchingItems: [],
          hasMarkedAsEnough: false,
          unit: 'pieces',
        },
        {
          recItem: {
            id: createProductTemplateId('item-b'),
            i18nKey: 'products.item-b',
            category: 'communication-info',
            baseQuantity: 5,
            unit: 'pieces',
            scaleWithPeople: false,
            scaleWithDays: false,
          },
          recommendedQty: 5,
          actualQty: 1, // Missing 4
          matchingItems: [],
          hasMarkedAsEnough: false,
          unit: 'pieces',
        },
      ];

      const result = strategy.aggregateTotals(itemResults, context);

      expect(result.shortages[0].itemId).toBe('item-b'); // Missing 4
      expect(result.shortages[1].itemId).toBe('item-a'); // Missing 1
    });
  });

  describe('hasEnoughInventory', () => {
    it('should return true when all item types are fulfilled', () => {
      const result: ShortageCalculationResult = {
        shortages: [],
        totalActual: 3,
        totalNeeded: 3,
      };

      expect(strategy.hasEnoughInventory(result)).toBe(true);
    });

    it('should return false when not all item types are fulfilled', () => {
      const result: ShortageCalculationResult = {
        shortages: [
          {
            itemId: 'radio',
            itemName: 'Radio',
            actual: 0,
            needed: 1,
            unit: 'pieces',
            missing: 1,
          },
        ],
        totalActual: 2,
        totalNeeded: 3,
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
