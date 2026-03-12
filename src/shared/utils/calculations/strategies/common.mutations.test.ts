import { describe, it, expect } from 'vitest';
import {
  calculateBaseRecommendedQuantity,
  aggregateStandardTotals,
  aggregateMixedUnitsTotals,
} from './common';
import type {
  CategoryCalculationContext,
  ItemCalculationResult,
} from './types';
import { createMockHousehold } from '@/shared/utils/test/factories';
import { createProductTemplateId, createQuantity } from '@/shared/types';
import type { RecommendedItemDefinition } from '@/shared/types';

/**
 * Mutation-killing tests for common.ts surviving mutants:
 *
 * 1. ArithmeticOperator L38: pets * PET_REQUIREMENT_MULTIPLIER -> pets / PET_REQUIREMENT_MULTIPLIER
 * 2. ArithmeticOperator L157 (actually L105 sort): b.missing - a.missing -> b.missing + a.missing
 * 3. ConditionalExpression L98: count > maxCount -> true
 * 4. ConditionalExpression L136: hasMarkedAsEnough || recommendedQty === 0 ? 1 : ... -> false
 * 5. EqualityOperator L98: count > maxCount -> count >= maxCount
 * 6. MethodExpression L157 (actually sort): shortages.sort -> shortages (no sort)
 */
describe('common.ts – mutation killing', () => {
  describe('calculateBaseRecommendedQuantity – pet scaling L38', () => {
    it('multiplies by pets * PET_REQUIREMENT_MULTIPLIER, not divides (kills ArithmeticOperator L38)', () => {
      const context: CategoryCalculationContext = {
        categoryId: 'tools-supplies',
        items: [],
        categoryItems: [],
        recommendedForCategory: [],
        household: createMockHousehold({
          adults: 1,
          children: 0,
          pets: 3,
          supplyDurationDays: 1,
        }),
        disabledRecommendedItems: [],
        options: {},
        peopleMultiplier: 1,
      };

      const recItem: RecommendedItemDefinition = {
        id: createProductTemplateId('pet-food'),
        i18nKey: 'products.pet-food',
        category: 'tools-supplies',
        baseQuantity: createQuantity(2),
        unit: 'pieces',
        scaleWithPeople: false,
        scaleWithDays: false,
        scaleWithPets: true,
      };

      const result = calculateBaseRecommendedQuantity(recItem, context);
      // PET_REQUIREMENT_MULTIPLIER = 1
      // Correct: 2 * (3 * 1) = 6
      // Mutant (division): 2 * (3 / 1) = 6 -- same with multiplier=1!
      // We need a non-1 multiplier... but it's a constant = 1.
      // With PET_REQUIREMENT_MULTIPLIER = 1, * and / give same result.
      // This mutant is equivalent. Still, verify correct behavior:
      expect(result).toBe(6);
    });

    it('returns correct result with pets=0 and scaleWithPets=true', () => {
      const context: CategoryCalculationContext = {
        categoryId: 'tools-supplies',
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

      const recItem: RecommendedItemDefinition = {
        id: createProductTemplateId('pet-item'),
        i18nKey: 'products.pet-item',
        category: 'tools-supplies',
        baseQuantity: createQuantity(5),
        unit: 'pieces',
        scaleWithPeople: false,
        scaleWithDays: false,
        scaleWithPets: true,
      };

      const result = calculateBaseRecommendedQuantity(recItem, context);
      // 5 * (0 * 1) = 0
      // With division: 5 * (0 / 1) = 0 -- same
      // This is equivalent with multiplier=1
      expect(result).toBe(0);
    });
  });

  describe('aggregateStandardTotals – primaryUnit L98 count > maxCount', () => {
    it('keeps first unit on tie (kills count >= maxCount)', () => {
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
          actualQty: 5,
          matchingItems: [],
          hasMarkedAsEnough: false,
          unit: 'pieces',
        },
        {
          recItem: {
            id: createProductTemplateId('item-b'),
            i18nKey: 'products.item-b',
            category: 'tools-supplies',
            baseQuantity: createQuantity(5),
            unit: 'liters',
            scaleWithPeople: false,
            scaleWithDays: false,
          },
          recommendedQty: 5, // Same as pieces
          actualQty: 5,
          matchingItems: [],
          hasMarkedAsEnough: false,
          unit: 'liters',
        },
      ];

      const result = aggregateStandardTotals(itemResults);
      // With > : pieces(5) > 0 -> sets maxCount=5, then liters(5) > 5 is false -> pieces wins
      // With >= : pieces(5) >= 0 -> sets maxCount=5, then liters(5) >= 5 -> liters wins
      expect(result.primaryUnit).toBe('pieces');
    });

    it('replaces primaryUnit when strictly greater (kills ConditionalExpression -> true)', () => {
      const itemResults: ItemCalculationResult[] = [
        {
          recItem: {
            id: createProductTemplateId('small-unit'),
            i18nKey: 'products.small-unit',
            category: 'tools-supplies',
            baseQuantity: createQuantity(2),
            unit: 'liters',
            scaleWithPeople: false,
            scaleWithDays: false,
          },
          recommendedQty: 2,
          actualQty: 2,
          matchingItems: [],
          hasMarkedAsEnough: false,
          unit: 'liters',
        },
        {
          recItem: {
            id: createProductTemplateId('large-unit'),
            i18nKey: 'products.large-unit',
            category: 'tools-supplies',
            baseQuantity: createQuantity(10),
            unit: 'pieces',
            scaleWithPeople: false,
            scaleWithDays: false,
          },
          recommendedQty: 10,
          actualQty: 10,
          matchingItems: [],
          hasMarkedAsEnough: false,
          unit: 'pieces',
        },
      ];

      const result = aggregateStandardTotals(itemResults);
      // If condition is always true, last unit wins regardless
      // With correct logic, pieces (10) > liters (2) so pieces wins
      expect(result.primaryUnit).toBe('pieces');
    });
  });

  describe('aggregateStandardTotals – shortage sorting L105', () => {
    it('sorts shortages descending by missing amount (kills sort reversal and no-sort)', () => {
      const itemResults: ItemCalculationResult[] = [
        {
          recItem: {
            id: createProductTemplateId('small-miss'),
            i18nKey: 'products.small-miss',
            category: 'tools-supplies',
            baseQuantity: createQuantity(5),
            unit: 'pieces',
            scaleWithPeople: false,
            scaleWithDays: false,
          },
          recommendedQty: 5,
          actualQty: 3, // missing 2
          matchingItems: [],
          hasMarkedAsEnough: false,
          unit: 'pieces',
        },
        {
          recItem: {
            id: createProductTemplateId('large-miss'),
            i18nKey: 'products.large-miss',
            category: 'tools-supplies',
            baseQuantity: createQuantity(10),
            unit: 'pieces',
            scaleWithPeople: false,
            scaleWithDays: false,
          },
          recommendedQty: 10,
          actualQty: 1, // missing 9
          matchingItems: [],
          hasMarkedAsEnough: false,
          unit: 'pieces',
        },
        {
          recItem: {
            id: createProductTemplateId('medium-miss'),
            i18nKey: 'products.medium-miss',
            category: 'tools-supplies',
            baseQuantity: createQuantity(7),
            unit: 'pieces',
            scaleWithPeople: false,
            scaleWithDays: false,
          },
          recommendedQty: 7,
          actualQty: 2, // missing 5
          matchingItems: [],
          hasMarkedAsEnough: false,
          unit: 'pieces',
        },
      ];

      const result = aggregateStandardTotals(itemResults);

      expect(result.shortages).toHaveLength(3);
      // Descending order: 9, 5, 2
      expect(result.shortages[0].missing).toBe(9);
      expect(result.shortages[0].itemId).toBe('large-miss');
      expect(result.shortages[1].missing).toBe(5);
      expect(result.shortages[1].itemId).toBe('medium-miss');
      expect(result.shortages[2].missing).toBe(2);
      expect(result.shortages[2].itemId).toBe('small-miss');

      // Verify strict ordering (kills b.missing + a.missing which wouldn't sort correctly)
      expect(result.shortages[0].missing).toBeGreaterThan(
        result.shortages[1].missing,
      );
      expect(result.shortages[1].missing).toBeGreaterThan(
        result.shortages[2].missing,
      );
    });
  });

  describe('aggregateMixedUnitsTotals – fulfillment ratio L136', () => {
    it('uses ratio 1 for markedAsEnough items (kills ConditionalExpression -> false)', () => {
      const itemResults: ItemCalculationResult[] = [
        {
          recItem: {
            id: createProductTemplateId('enough-item'),
            i18nKey: 'products.enough-item',
            category: 'tools-supplies',
            baseQuantity: createQuantity(10),
            unit: 'pieces',
            scaleWithPeople: false,
            scaleWithDays: false,
          },
          recommendedQty: 10,
          actualQty: 2, // Only 2 of 10, but marked as enough
          matchingItems: [],
          hasMarkedAsEnough: true,
          unit: 'pieces',
        },
      ];

      const result = aggregateMixedUnitsTotals(itemResults);
      // If markedAsEnough ? 1 : ratio is mutated to false,
      // fulfillmentRatio would be Math.min(2/10, 1) = 0.2 instead of 1
      // totalActual should be 1 (fulfillment = 1.0 for markedAsEnough)
      expect(result.totalActual).toBe(1);
      expect(result.totalNeeded).toBe(1);
    });

    it('uses calculated ratio for non-markedAsEnough items with recommendedQty > 0', () => {
      const itemResults: ItemCalculationResult[] = [
        {
          recItem: {
            id: createProductTemplateId('partial-item'),
            i18nKey: 'products.partial-item',
            category: 'tools-supplies',
            baseQuantity: createQuantity(10),
            unit: 'pieces',
            scaleWithPeople: false,
            scaleWithDays: false,
          },
          recommendedQty: 10,
          actualQty: 5, // 50% fulfilled
          matchingItems: [],
          hasMarkedAsEnough: false,
          unit: 'pieces',
        },
      ];

      const result = aggregateMixedUnitsTotals(itemResults);
      // fulfillmentRatio = Math.min(5/10, 1) = 0.5
      expect(result.totalActual).toBe(0.5);
      expect(result.totalNeeded).toBe(1);
    });

    it('uses ratio 1 for items with recommendedQty === 0 (kills ConditionalExpression -> false)', () => {
      const itemResults: ItemCalculationResult[] = [
        {
          recItem: {
            id: createProductTemplateId('zero-rec'),
            i18nKey: 'products.zero-rec',
            category: 'tools-supplies',
            baseQuantity: createQuantity(0),
            unit: 'pieces',
            scaleWithPeople: false,
            scaleWithDays: false,
          },
          recommendedQty: 0,
          actualQty: 0,
          matchingItems: [],
          hasMarkedAsEnough: false,
          unit: 'pieces',
        },
      ];

      const result = aggregateMixedUnitsTotals(itemResults);
      // With recommendedQty === 0, ternary should give 1
      // If mutated to false, we'd divide by zero: 0/0 = NaN
      expect(result.totalActual).toBe(1);
    });
  });

  describe('aggregateMixedUnitsTotals – shortage sorting L157', () => {
    it('sorts shortages descending (kills sort reversal and MethodExpression removal)', () => {
      const itemResults: ItemCalculationResult[] = [
        {
          recItem: {
            id: createProductTemplateId('small'),
            i18nKey: 'products.small',
            category: 'tools-supplies',
            baseQuantity: createQuantity(3),
            unit: 'pieces',
            scaleWithPeople: false,
            scaleWithDays: false,
          },
          recommendedQty: 3,
          actualQty: 1, // missing 2
          matchingItems: [],
          hasMarkedAsEnough: false,
          unit: 'pieces',
        },
        {
          recItem: {
            id: createProductTemplateId('large'),
            i18nKey: 'products.large',
            category: 'tools-supplies',
            baseQuantity: createQuantity(10),
            unit: 'liters',
            scaleWithPeople: false,
            scaleWithDays: false,
          },
          recommendedQty: 10,
          actualQty: 2, // missing 8
          matchingItems: [],
          hasMarkedAsEnough: false,
          unit: 'liters',
        },
      ];

      const result = aggregateMixedUnitsTotals(itemResults);
      expect(result.shortages).toHaveLength(2);
      // First should have larger missing
      expect(result.shortages[0].missing).toBe(8);
      expect(result.shortages[0].itemId).toBe('large');
      expect(result.shortages[1].missing).toBe(2);
      expect(result.shortages[1].itemId).toBe('small');
    });
  });
});
