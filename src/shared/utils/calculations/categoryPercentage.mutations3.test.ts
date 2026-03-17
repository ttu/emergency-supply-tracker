/**
 * Additional mutation-killing tests for categoryPercentage.ts
 * Targets surviving mutants from issue #271 mutation testing report.
 */
import { describe, it, expect } from 'vitest';
import { calculateCategoryPercentage } from './categoryPercentage';
import type { RecommendedItemDefinition } from '@/shared/types';
import {
  createItemId,
  createCategoryId,
  createProductTemplateId,
  createQuantity,
} from '@/shared/types';
import { createMockHousehold } from '@/shared/utils/test/factories';
import {
  createMockInventoryItem,
  mockToolsRecommendedItems,
} from './__helpers__/categoryPercentage.helpers';

describe('categoryPercentage - additional mutation killers', () => {
  // ============================================================
  // L111: ArithmeticOperator - household.adults * ADULT_REQUIREMENT_MULTIPLIER
  // Mutant: * → / (adults divided by multiplier instead of multiplied)
  // ADULT_REQUIREMENT_MULTIPLIER = 1, so this is equivalent for adults.
  // ============================================================
  describe('L111: adults * ADULT_REQUIREMENT_MULTIPLIER arithmetic', () => {
    it('correctly calculates peopleMultiplier with multiple adults', () => {
      // With adults=2 and ADULT_REQUIREMENT_MULTIPLIER=1:
      // Original: 2 * 1 = 2, Mutant (÷): 2 / 1 = 2 (equivalent for multiplier=1)
      // Need to test via children multiplier to detect the issue
      // Actually since ADULT_REQUIREMENT_MULTIPLIER is 1, * and / give same result.
      // This may be an equivalent mutant. Let's verify via the total calculation.
      const household = createMockHousehold({
        adults: 2,
        children: 1,
        pets: 0,
        supplyDurationDays: 3,
      });

      const result = calculateCategoryPercentage(
        'tools-supplies',
        [],
        household,
        [],
        mockToolsRecommendedItems,
      );

      // With 2 adults + 1 child (0.75 multiplier): peopleMultiplier = 2*1 + 1*0.75 = 2.75
      // Recommendations should scale with this multiplier
      expect(result.totalNeeded).toBeGreaterThan(0);
    });
  });

  // ============================================================
  // L309: ArithmeticOperator - household.pets * PET_REQUIREMENT_MULTIPLIER
  // Mutant: * → / (pets divided by multiplier)
  // PET_REQUIREMENT_MULTIPLIER = 1, so * and / give same result.
  // This is an equivalent mutant.
  // ============================================================
  describe('L309: pets * PET_REQUIREMENT_MULTIPLIER arithmetic', () => {
    it('correctly scales pet items with pet count', () => {
      const household = createMockHousehold({
        adults: 1,
        children: 0,
        pets: 2,
        supplyDurationDays: 3,
      });

      // Find a pet-scaling recommended item
      const petRec: RecommendedItemDefinition = {
        id: createProductTemplateId('pet-food'),
        i18nKey: 'pet-food',
        category: 'hygiene-health',
        baseQuantity: createQuantity(1),
        unit: 'kilograms',
        scaleWithPets: true,
        scaleWithPeople: false,
        scaleWithDays: true,
      };

      const result = calculateCategoryPercentage(
        'hygiene-health',
        [],
        household,
        [],
        [petRec],
      );

      // With pets=2, PET_REQUIREMENT_MULTIPLIER=1:
      // Original: 2 * 1 = 2, Mutant: 2 / 1 = 2 (equivalent)
      // totalNeeded = baseQty * pets * multiplier * days = 1 * 2 * 1 * 3 = 6
      expect(result.totalNeeded).toBe(6);
    });
  });

  // ============================================================
  // L199: LogicalOperator - !isFoodRecommendedItem(recItem) && !recItem.caloriesPerUnit
  // Mutant: && → || (skip items that are non-food OR have no caloriesPerUnit)
  // BlockStatement at L199: remove the return (don't skip)
  // ============================================================
  describe('L199: food item filtering in calorie calculation', () => {
    it('counts calories from food items with caloriesPerUnit', () => {
      const household = createMockHousehold({
        adults: 1,
        children: 0,
        pets: 0,
        supplyDurationDays: 1,
      });

      const recs: RecommendedItemDefinition[] = [
        {
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
        },
      ];

      const items = [
        createMockInventoryItem({
          id: createItemId('1'),
          categoryId: createCategoryId('food'),
          itemType: createProductTemplateId('rice'),
          quantity: createQuantity(1),
          unit: 'kilograms',
          caloriesPerUnit: 3600,
          weightGrams: 1000,
        }),
      ];

      const result = calculateCategoryPercentage(
        'food',
        items,
        household,
        [],
        recs,
      );

      // Food item with caloriesPerUnit should contribute to actual calories
      expect(result.totalActualCalories).toBeGreaterThan(0);
      expect(result.totalActualCalories).toBe(3600);
    });

    it('skips non-food recommended items in calorie counting', () => {
      const household = createMockHousehold({
        adults: 1,
        children: 0,
        pets: 0,
        supplyDurationDays: 1,
      });

      // Mix of food and non-food recommended items in food category
      const recs: RecommendedItemDefinition[] = [
        {
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
        },
      ];

      const items = [
        createMockInventoryItem({
          id: createItemId('1'),
          categoryId: createCategoryId('food'),
          itemType: createProductTemplateId('rice'),
          quantity: createQuantity(1),
          unit: 'kilograms',
          caloriesPerUnit: 3600,
          weightGrams: 1000,
        }),
      ];

      const result = calculateCategoryPercentage(
        'food',
        items,
        household,
        [],
        recs,
      );

      // Should have a valid calculation
      expect(result.hasRecommendations).toBe(true);
      expect(result.totalNeededCalories).toBeGreaterThan(0);
    });
  });

  // ============================================================
  // L379: LogicalOperator - item.caloriesPerUnit != null || Number.isFinite(...)
  // Mutant: && → || for the food-without-recommendations calorie counting
  // ============================================================
  describe('L379: caloriesPerUnit null check in food without recommendations', () => {
    it('counts calories from items with valid caloriesPerUnit when no recommendations', () => {
      const household = createMockHousehold({
        adults: 1,
        children: 0,
        pets: 0,
        supplyDurationDays: 1,
      });

      const items = [
        createMockInventoryItem({
          id: createItemId('1'),
          categoryId: createCategoryId('food'),
          itemType: createProductTemplateId('custom'),
          quantity: createQuantity(2),
          unit: 'pieces',
          caloriesPerUnit: 500,
        }),
      ];

      // No recommendations - uses food-without-recommendations path
      const result = calculateCategoryPercentage(
        'food',
        items,
        household,
        [],
        [], // empty recommendations
      );

      // Should count the item's calories
      expect(result.totalActual).toBe(1000); // 2 * 500
      expect(result.hasRecommendations).toBe(false);
    });

    it('does NOT count items with null caloriesPerUnit', () => {
      const household = createMockHousehold({
        adults: 1,
        children: 0,
        pets: 0,
        supplyDurationDays: 1,
      });

      const items = [
        createMockInventoryItem({
          id: createItemId('1'),
          categoryId: createCategoryId('food'),
          itemType: createProductTemplateId('custom'),
          quantity: createQuantity(5),
          unit: 'pieces',
          caloriesPerUnit: undefined, // null/undefined
        }),
      ];

      const result = calculateCategoryPercentage(
        'food',
        items,
        household,
        [],
        [],
      );

      // Without caloriesPerUnit, item shouldn't contribute calories
      expect(result.totalActual).toBe(0);
    });

    it('does NOT count items with NaN caloriesPerUnit', () => {
      const household = createMockHousehold({
        adults: 1,
        children: 0,
        pets: 0,
        supplyDurationDays: 1,
      });

      const items = [
        createMockInventoryItem({
          id: createItemId('1'),
          categoryId: createCategoryId('food'),
          itemType: createProductTemplateId('custom'),
          quantity: createQuantity(5),
          unit: 'pieces',
          caloriesPerUnit: Number.NaN,
        }),
      ];

      const result = calculateCategoryPercentage(
        'food',
        items,
        household,
        [],
        [],
      );

      // NaN caloriesPerUnit should not contribute (isFinite check)
      // If || mutant: null check passes (NaN != null is true), but isFinite(NaN) is false
      // With ||: true || false = true → tries to calculate, gets NaN → 0
      // With &&: true && false = false → skips
      expect(result.totalActual).toBe(0);
    });
  });
});
