import { describe, it, expect } from 'vitest';
import { WaterCategoryStrategy } from './water';
import type { CategoryCalculationContext } from './types';
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
 * Mutation-killing tests for water.ts surviving mutants:
 *
 * 1. StringLiteral L24: WATER_CATEGORY_ID = '' (empty string)
 * 2. StringLiteral L25: BOTTLED_WATER_ID = '' (empty string)
 * 3. StringLiteral L36: strategyId = '' (empty string)
 * 4. ArithmeticOperator L59: pets * PET_REQUIREMENT_MULTIPLIER -> pets / PET_REQUIREMENT_MULTIPLIER
 * 5. ConditionalExpression L54: recItem.scaleWithPeople -> true
 * 6. ConditionalExpression L67: recItem.id === BOTTLED_WATER_ID -> true
 */
describe('WaterCategoryStrategy – mutation killing', () => {
  const strategy = new WaterCategoryStrategy();

  describe('strategyId string literal (L36)', () => {
    it('must be "water-beverages", not empty string', () => {
      expect(strategy.strategyId).toBe('water-beverages');
      expect(strategy.strategyId).not.toBe('');
      expect(strategy.strategyId.length).toBeGreaterThan(0);
    });
  });

  describe('canHandle – WATER_CATEGORY_ID string literal (L24)', () => {
    it('handles "water-beverages" specifically, not empty string (kills L24 StringLiteral)', () => {
      expect(strategy.canHandle('water-beverages')).toBe(true);
      // If WATER_CATEGORY_ID is mutated to '', canHandle('') would be true but canHandle('water-beverages') false
      expect(strategy.canHandle('')).toBe(false);
    });
  });

  describe('calculateRecommendedQuantity – BOTTLED_WATER_ID string literal (L25)', () => {
    const context: CategoryCalculationContext = {
      categoryId: 'water-beverages',
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
      options: { dailyWaterPerPerson: 5 },
      peopleMultiplier: 1,
    };

    it('uses dailyWater for bottled-water, baseQuantity for others (kills L25 StringLiteral)', () => {
      const bottledWater: RecommendedItemDefinition = {
        id: createProductTemplateId('bottled-water'),
        i18nKey: 'products.bottled-water',
        category: 'water-beverages',
        baseQuantity: createQuantity(1), // Should be ignored for bottled-water
        unit: 'liters',
        scaleWithPeople: false,
        scaleWithDays: false,
      };

      const otherItem: RecommendedItemDefinition = {
        id: createProductTemplateId('sports-drink'),
        i18nKey: 'products.sports-drink',
        category: 'water-beverages',
        baseQuantity: createQuantity(2),
        unit: 'bottles',
        scaleWithPeople: false,
        scaleWithDays: false,
      };

      const bottledResult = strategy.calculateRecommendedQuantity(
        bottledWater,
        context,
      );
      const otherResult = strategy.calculateRecommendedQuantity(
        otherItem,
        context,
      );

      // Bottled water: uses dailyWater (5), not baseQuantity (1)
      expect(bottledResult).toBe(5);
      // Other item: uses baseQuantity (2)
      expect(otherResult).toBe(2);
      // They must differ (kills empty string mutation where both would use baseQuantity)
      expect(bottledResult).not.toBe(otherResult);
    });
  });

  describe('calculateRecommendedQuantity – scaleWithPeople L54', () => {
    it('does NOT scale when scaleWithPeople is false (kills L54 ConditionalExpression -> true)', () => {
      const context: CategoryCalculationContext = {
        categoryId: 'water-beverages',
        items: [],
        categoryItems: [],
        recommendedForCategory: [],
        household: createMockHousehold({
          adults: 3,
          children: 0,
          pets: 0,
          supplyDurationDays: 1,
        }),
        disabledRecommendedItems: [],
        options: { dailyWaterPerPerson: 2 },
        peopleMultiplier: 3,
      };

      const recItem: RecommendedItemDefinition = {
        id: createProductTemplateId('juice'),
        i18nKey: 'products.juice',
        category: 'water-beverages',
        baseQuantity: createQuantity(4),
        unit: 'liters',
        scaleWithPeople: false, // Must NOT scale
        scaleWithDays: false,
      };

      const result = strategy.calculateRecommendedQuantity(recItem, context);
      // Should be 4 (baseQuantity, no scaling)
      // If L54 is mutated to true, result would be 4 * 3 = 12
      expect(result).toBe(4);
    });
  });

  describe('calculateRecommendedQuantity – preparation water L67', () => {
    it('only adds preparation water for bottled-water, not other items (kills L67 -> true)', () => {
      const contextWithFood: CategoryCalculationContext = {
        categoryId: 'water-beverages',
        items: [
          createMockInventoryItem({
            categoryId: createCategoryId('food'),
            itemType: createProductTemplateId('instant-noodles'),
            quantity: createQuantity(10),
            requiresWaterLiters: 0.5, // 10 * 0.5 = 5L prep water
          }),
        ],
        categoryItems: [],
        recommendedForCategory: [],
        household: createMockHousehold({
          adults: 1,
          children: 0,
          pets: 0,
          supplyDurationDays: 1,
        }),
        disabledRecommendedItems: [],
        options: { dailyWaterPerPerson: 3 },
        peopleMultiplier: 1,
      };

      const nonWaterItem: RecommendedItemDefinition = {
        id: createProductTemplateId('sports-drink'),
        i18nKey: 'products.sports-drink',
        category: 'water-beverages',
        baseQuantity: createQuantity(2),
        unit: 'bottles',
        scaleWithPeople: false,
        scaleWithDays: false,
      };

      const result = strategy.calculateRecommendedQuantity(
        nonWaterItem,
        contextWithFood,
      );
      // Should be 2 (baseQuantity only, no preparation water)
      // If L67 is mutated to true, it would add 5L prep water: 2 + 5 = 7
      expect(result).toBe(2);
    });

    it('adds preparation water for bottled-water item', () => {
      const contextWithFood: CategoryCalculationContext = {
        categoryId: 'water-beverages',
        items: [
          createMockInventoryItem({
            categoryId: createCategoryId('food'),
            itemType: createProductTemplateId('instant-noodles'),
            quantity: createQuantity(10),
            requiresWaterLiters: 0.5,
          }),
        ],
        categoryItems: [],
        recommendedForCategory: [],
        household: createMockHousehold({
          adults: 1,
          children: 0,
          pets: 0,
          supplyDurationDays: 1,
        }),
        disabledRecommendedItems: [],
        options: { dailyWaterPerPerson: 3 },
        peopleMultiplier: 1,
      };

      const bottledWater: RecommendedItemDefinition = {
        id: createProductTemplateId('bottled-water'),
        i18nKey: 'products.bottled-water',
        category: 'water-beverages',
        baseQuantity: createQuantity(1),
        unit: 'liters',
        scaleWithPeople: false,
        scaleWithDays: false,
      };

      const result = strategy.calculateRecommendedQuantity(
        bottledWater,
        contextWithFood,
      );
      // 3 (dailyWater) + 5 (prep water) = 8
      expect(result).toBe(8);
    });
  });

  describe('calculateRecommendedQuantity – pet scaling L59', () => {
    it('scales with pets when scaleWithPets is true', () => {
      const context: CategoryCalculationContext = {
        categoryId: 'water-beverages',
        items: [],
        categoryItems: [],
        recommendedForCategory: [],
        household: createMockHousehold({
          adults: 1,
          children: 0,
          pets: 2,
          supplyDurationDays: 1,
        }),
        disabledRecommendedItems: [],
        options: {},
        peopleMultiplier: 1,
      };

      const recItem: RecommendedItemDefinition = {
        id: createProductTemplateId('pet-water'),
        i18nKey: 'products.pet-water',
        category: 'water-beverages',
        baseQuantity: createQuantity(1),
        unit: 'liters',
        scaleWithPeople: false,
        scaleWithDays: false,
        scaleWithPets: true,
      };

      const result = strategy.calculateRecommendedQuantity(recItem, context);
      // PET_REQUIREMENT_MULTIPLIER = 1
      // 1 * (2 * 1) = 2
      // With division: 1 * (2 / 1) = 2 -- same with multiplier=1
      expect(result).toBe(2);
    });
  });
});
