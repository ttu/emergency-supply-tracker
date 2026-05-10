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

// ============================================================================
// Merged from water.behaviors2.test.ts
// ============================================================================

const strategy = new WaterCategoryStrategy();

function createWaterContext(
  overrides: Partial<CategoryCalculationContext> = {},
): CategoryCalculationContext {
  const household = createMockHousehold({
    adults: 2,
    children: 0,
    pets: 1,
    supplyDurationDays: 3,
  });

  return {
    categoryId: 'water-beverages',
    items: [],
    categoryItems: [],
    recommendedForCategory: [],
    household,
    disabledRecommendedItems: [],
    options: {},
    peopleMultiplier: 2,
    ...overrides,
  };
}

// ============================================================================
// L24-25: StringLiteral - WATER_CATEGORY_ID and BOTTLED_WATER_ID
// Mutant: '' instead of 'water-beverages' or 'bottled-water'
// ============================================================================
describe('L24-25: string constant values', () => {
  it('strategyId is "water-beverages"', () => {
    expect(strategy.strategyId).toBe('water-beverages');
    expect(strategy.strategyId).not.toBe('');
  });

  it('canHandle returns true for water-beverages', () => {
    expect(strategy.canHandle('water-beverages')).toBe(true);
  });

  it('canHandle returns false for other categories', () => {
    expect(strategy.canHandle('food')).toBe(false);
    expect(strategy.canHandle('')).toBe(false);
  });
});

// ============================================================================
// L36: StringLiteral - '' instead of 'water-beverages'
// ============================================================================
describe('canHandle category check', () => {
  it('correctly identifies water-beverages category', () => {
    expect(strategy.canHandle('water-beverages')).toBe(true);
    expect(strategy.canHandle('tools-supplies')).toBe(false);
  });
});

// ============================================================================
// L59: ArithmeticOperator - pets * PET_REQUIREMENT_MULTIPLIER
// Mutant: * → / (PET_REQUIREMENT_MULTIPLIER=1, equivalent)
// ============================================================================
describe('pet scaling in water calculation', () => {
  it('scales water requirement by pet count', () => {
    const context = createWaterContext();

    const petWaterRec: RecommendedItemDefinition = {
      id: createProductTemplateId('pet-water'),
      i18nKey: 'pet-water',
      category: 'water-beverages',
      baseQuantity: createQuantity(1),
      unit: 'liters',
      scaleWithPets: true,
      scaleWithPeople: false,
      scaleWithDays: true,
    };

    const qty = strategy.calculateRecommendedQuantity(petWaterRec, context);
    // baseQuantity(1) * pets(1) * PET_MULTIPLIER(1) * days(3) = 3
    expect(qty).toBe(3);
  });
});
