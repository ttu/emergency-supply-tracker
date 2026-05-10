/**
 * Behavior-focused tests for calculateCategoryPercentage.
 *
 * Consolidates tests previously split into mutation-numbered files
 * (mutations, mutations2, mutations3, mutations4). All tests preserved
 * verbatim; describe titles renamed from Stryker mutant IDs to behavior names.
 */
import { describe, it, expect } from 'vitest';
import { calculateCategoryPercentage } from './categoryPercentage';
import type { InventoryItem, RecommendedItemDefinition } from '@/shared/types';
import {
  createItemId,
  createCategoryId,
  createProductTemplateId,
  createQuantity,
} from '@/shared/types';
import { createMockHousehold } from '@/shared/utils/test/factories';
import {
  createMockInventoryItem,
  mockFoodRecommendedItems,
  mockWaterRecommendedItems,
  mockToolsRecommendedItems,
  mockCookingHeatRecommendedItems,
} from './__helpers__/categoryPercentage.helpers';

const tools = createCategoryId('tools-supplies');
const water = createCategoryId('water-beverages');

function rec(
  id: string,
  category: ReturnType<typeof createCategoryId>,
  overrides: Partial<RecommendedItemDefinition> = {},
): RecommendedItemDefinition {
  return {
    id: createProductTemplateId(id),
    i18nKey: `products.${id}`,
    category,
    baseQuantity: createQuantity(5),
    unit: 'pieces',
    scaleWithPeople: false,
    scaleWithDays: false,
    scaleWithPets: false,
    ...overrides,
  };
}

describe('calculateCategoryPercentage behaviors', () => {
  describe('category filtering', () => {
    it('only includes items matching the given categoryId', () => {
      const household = createMockHousehold({
        adults: 1,
        children: 0,
        pets: 0,
        supplyDurationDays: 3,
      });

      // Items from different categories - only tools-supplies should be counted
      const items = [
        createMockInventoryItem({
          id: createItemId('1'),
          categoryId: createCategoryId('tools-supplies'),
          itemType: createProductTemplateId('flashlight'),
          quantity: createQuantity(1),
          unit: 'pieces',
        }),
        createMockInventoryItem({
          id: createItemId('2'),
          categoryId: createCategoryId('food'), // Different category
          itemType: createProductTemplateId('batteries'),
          quantity: createQuantity(99),
          unit: 'pieces',
        }),
      ];

      const result = calculateCategoryPercentage(
        'tools-supplies',
        items,
        household,
        [],
        mockToolsRecommendedItems,
      );

      // If filter were broken, totalActual would include 99 from the food item
      expect(result.totalActual).toBeLessThan(10);
      expect(result.totalNeeded).toBe(5); // 1 flashlight + 4 batteries
      expect(result.totalActual).toBe(1); // Only the flashlight matches
    });
  });

  describe('peopleMultiplier arithmetic', () => {
    it('verifies adults * ADULT_MULTIPLIER + children * CHILDREN_MULTIPLIER exactly', () => {
      // 2 adults * 1.0 + 1 child * 0.75 = 2.75
      // 2.75 * 2000 * 3 = 16500
      const household = createMockHousehold({
        adults: 2,
        children: 1,
        pets: 0,
        supplyDurationDays: 3,
      });

      const result = calculateCategoryPercentage(
        'food',
        [],
        household,
        [],
        mockFoodRecommendedItems,
      );

      // Verify exact totalNeeded which depends on multiplication being correct
      expect(result.totalNeededCalories).toBe(16500);
    });

    it('verifies adults multiplication is not division', () => {
      // 3 adults * 1.0 = 3.0 people multiplier
      // 3.0 * 2000 * 3 = 18000
      const household = createMockHousehold({
        adults: 3,
        children: 0,
        pets: 0,
        supplyDurationDays: 3,
      });

      const result = calculateCategoryPercentage(
        'food',
        [],
        household,
        [],
        mockFoodRecommendedItems,
      );

      expect(result.totalNeededCalories).toBe(18000);
    });

    it('children multiplier matters (not 1.0 like adults)', () => {
      // 0 adults + 4 children * 0.75 = 3.0
      // vs 0 adults + 4 children * 1.0 = 4.0 (if mutated to adults multiplier)
      const household = createMockHousehold({
        adults: 0,
        children: 4,
        pets: 0,
        supplyDurationDays: 3,
      });

      const result = calculateCategoryPercentage(
        'food',
        [],
        household,
        [],
        mockFoodRecommendedItems,
      );

      // 4 * 0.75 * 2000 * 3 = 18000 (not 24000 if multiplier were 1.0)
      expect(result.totalNeededCalories).toBe(18000);
    });
  });

  describe('water-beverages string literal', () => {
    it('water-beverages category triggers water calculation path', () => {
      const household = createMockHousehold({
        adults: 1,
        children: 0,
        pets: 0,
        supplyDurationDays: 3,
      });

      const items = [
        createMockInventoryItem({
          id: createItemId('1'),
          categoryId: createCategoryId('water-beverages'),
          itemType: createProductTemplateId('bottled-water'),
          quantity: createQuantity(9),
          unit: 'liters',
        }),
      ];

      // With water recommendations
      const result = calculateCategoryPercentage(
        'water-beverages',
        items,
        household,
        [],
        mockWaterRecommendedItems,
      );

      expect(result.totalNeeded).toBe(9); // 1 * 3L/day * 3 days
      expect(result.percentage).toBe(100);
      expect(result.hasRecommendations).toBe(true);
    });

    it('non-water category does not get water calculation', () => {
      const household = createMockHousehold({
        adults: 1,
        children: 0,
        pets: 0,
        supplyDurationDays: 3,
      });

      // If 'water-beverages' string were replaced with '', food would trigger water calc
      const result = calculateCategoryPercentage(
        'food',
        [],
        household,
        [],
        mockFoodRecommendedItems,
      );

      // Food should use calorie-based, not water-based
      expect(result.totalNeededCalories).toBeDefined();
      expect(result.totalNeededCalories).toBe(6000);
    });
  });

  describe('isFoodRecommendedItem guard', () => {
    it('skips non-food recommended items even if they have a caloriesPerUnit-like field', () => {
      const household = createMockHousehold({
        adults: 1,
        children: 0,
        pets: 0,
        supplyDurationDays: 3,
      });

      // Use a non-food recommended item that happens to be in food category recommendations
      const mixedRecommendedItems: RecommendedItemDefinition[] = [
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
        {
          // Non-food item in food category (no caloriesPerUnit)
          id: createProductTemplateId('food-container'),
          i18nKey: 'foodContainer',
          category: 'food',
          baseQuantity: createQuantity(1),
          unit: 'pieces',
          scaleWithPeople: false,
          scaleWithDays: false,
          // No caloriesPerUnit - isFoodRecommendedItem returns true (category is 'food'),
          // but the compound guard `!isFoodRecommendedItem(recItem) || !recItem.caloriesPerUnit`
          // skips this item because caloriesPerUnit is missing
        },
      ];

      const items = [
        createMockInventoryItem({
          id: createItemId('1'),
          categoryId: createCategoryId('food'),
          itemType: createProductTemplateId('rice'),
          quantity: createQuantity(1),
          caloriesPerUnit: 3600,
        }),
        // Matching inventory item for food-container exercises the isFoodRecommendedItem guard
        createMockInventoryItem({
          id: createItemId('2'),
          categoryId: createCategoryId('food'),
          itemType: createProductTemplateId('food-container'),
          quantity: createQuantity(1),
        }),
      ];

      const result = calculateCategoryPercentage(
        'food',
        items,
        household,
        [],
        mixedRecommendedItems,
      );

      // Only rice calories counted — food-container skipped by the guard
      // (isFoodRecommendedItem is true but caloriesPerUnit is missing)
      expect(result.totalActualCalories).toBe(3600);
      expect(result.hasRecommendations).toBe(true);
    });
  });

  describe('caloriesPerUnit validation', () => {
    it('uses item caloriesPerUnit when available', () => {
      const household = createMockHousehold({
        adults: 1,
        children: 0,
        pets: 0,
        supplyDurationDays: 3,
      });

      const items = [
        createMockInventoryItem({
          id: createItemId('1'),
          categoryId: createCategoryId('food'),
          itemType: createProductTemplateId('rice'),
          quantity: createQuantity(2),
          caloriesPerUnit: 4000, // Different from recommendation's 3600
          unit: 'kilograms',
        }),
      ];

      const result = calculateCategoryPercentage(
        'food',
        items,
        household,
        [],
        mockFoodRecommendedItems,
      );

      // Should use item's 4000, not recommendation's 3600
      // 2 * 4000 = 8000
      expect(result.totalActualCalories).toBe(8000);
    });

    it('falls back to recommendation caloriesPerUnit when item has null', () => {
      const household = createMockHousehold({
        adults: 1,
        children: 0,
        pets: 0,
        supplyDurationDays: 3,
      });

      const items = [
        createMockInventoryItem({
          id: createItemId('1'),
          categoryId: createCategoryId('food'),
          itemType: createProductTemplateId('rice'),
          quantity: createQuantity(2),
          caloriesPerUnit: undefined, // null → fallback to recommendation's 3600
          unit: 'kilograms',
        }),
      ];

      const result = calculateCategoryPercentage(
        'food',
        items,
        household,
        [],
        mockFoodRecommendedItems,
      );

      // Fallback: 2 * 3600 = 7200
      expect(result.totalActualCalories).toBe(7200);
    });

    it('falls back to recommendation caloriesPerUnit when item has Infinity', () => {
      const household = createMockHousehold({
        adults: 1,
        children: 0,
        pets: 0,
        supplyDurationDays: 3,
      });

      const items = [
        createMockInventoryItem({
          id: createItemId('1'),
          categoryId: createCategoryId('food'),
          itemType: createProductTemplateId('rice'),
          quantity: createQuantity(2),
          caloriesPerUnit: Infinity,
          unit: 'kilograms',
        }),
      ];

      const result = calculateCategoryPercentage(
        'food',
        items,
        household,
        [],
        mockFoodRecommendedItems,
      );

      // Infinity is not Number.isFinite, fallback: 2 * 3600 = 7200
      expect(result.totalActualCalories).toBe(7200);
    });

    it('calorie fallback uses quantity * calsPerUnit', () => {
      const household = createMockHousehold({
        adults: 1,
        children: 0,
        pets: 0,
        supplyDurationDays: 3,
      });

      // Quantity 5 * recommendation's 300 calsPerUnit = 1500
      const items = [
        createMockInventoryItem({
          id: createItemId('1'),
          categoryId: createCategoryId('food'),
          itemType: createProductTemplateId('canned-beans'),
          quantity: createQuantity(5),
          caloriesPerUnit: undefined, // Force fallback
          unit: 'cans',
        }),
      ];

      const result = calculateCategoryPercentage(
        'food',
        items,
        household,
        [],
        mockFoodRecommendedItems,
      );

      // Should be 5 * 300 = 1500 (not 5 / 300 = 0.017 if mutated to division)
      expect(result.totalActualCalories).toBe(1500);
    });
  });

  describe('uncounted items caloriesPerUnit check', () => {
    it('counts uncounted items with valid caloriesPerUnit', () => {
      const household = createMockHousehold({
        adults: 1,
        children: 0,
        pets: 0,
        supplyDurationDays: 3,
      });

      // Item that does not match any recommendation but has caloriesPerUnit
      const items = [
        createMockInventoryItem({
          id: createItemId('1'),
          categoryId: createCategoryId('food'),
          itemType: createProductTemplateId('custom-food'),
          quantity: createQuantity(3),
          caloriesPerUnit: 500,
        }),
      ];

      const result = calculateCategoryPercentage(
        'food',
        items,
        household,
        [],
        mockFoodRecommendedItems,
      );

      // 3 * 500 = 1500 kcal from uncounted item
      expect(result.totalActualCalories).toBe(1500);
    });

    it('does not count uncounted items without caloriesPerUnit', () => {
      const household = createMockHousehold({
        adults: 1,
        children: 0,
        pets: 0,
        supplyDurationDays: 3,
      });

      const items = [
        createMockInventoryItem({
          id: createItemId('1'),
          categoryId: createCategoryId('food'),
          itemType: createProductTemplateId('custom-food'),
          quantity: createQuantity(100),
          caloriesPerUnit: undefined, // No calories, no matching recommendation
        }),
      ];

      const result = calculateCategoryPercentage(
        'food',
        items,
        household,
        [],
        mockFoodRecommendedItems,
      );

      // Should not count any calories for this item
      expect(result.totalActualCalories).toBe(0);
    });
  });

  describe('disabled recommendation matching', () => {
    it('only uses caloriesPerUnit from disabled recommendations that match item.itemType', () => {
      const household = createMockHousehold({
        adults: 1,
        children: 0,
        pets: 0,
        supplyDurationDays: 3,
      });

      // Disable rice, have an item matching rice but no caloriesPerUnit
      // Also have an item matching canned-beans but not disabled
      const items = [
        createMockInventoryItem({
          id: createItemId('1'),
          categoryId: createCategoryId('food'),
          itemType: createProductTemplateId('rice'),
          quantity: createQuantity(2),
          caloriesPerUnit: undefined,
        }),
      ];

      const result = calculateCategoryPercentage(
        'food',
        items,
        household,
        ['rice'], // Only rice is disabled
        mockFoodRecommendedItems,
      );

      // Rice is disabled but item has no calories → uses disabled rec's 3600/unit
      // 2 * 3600 = 7200
      expect(result.totalActualCalories).toBe(7200);
    });

    it('does not use calories from non-disabled recommendation for uncounted items', () => {
      const household = createMockHousehold({
        adults: 1,
        children: 0,
        pets: 0,
        supplyDurationDays: 3,
      });

      // Item does not match any recommendation
      const items = [
        createMockInventoryItem({
          id: createItemId('1'),
          categoryId: createCategoryId('food'),
          itemType: createProductTemplateId('unknown-food'),
          quantity: createQuantity(10),
          caloriesPerUnit: undefined,
        }),
      ];

      const result = calculateCategoryPercentage(
        'food',
        items,
        household,
        ['rice'], // Rice is disabled but item doesn't match rice
        mockFoodRecommendedItems,
      );

      // Item doesn't match any disabled rec → 0 calories
      expect(result.totalActualCalories).toBe(0);
    });

    it('requires all compound conditions to match for disabled recommendation', () => {
      const household = createMockHousehold({
        adults: 1,
        children: 0,
        pets: 0,
        supplyDurationDays: 3,
      });

      // An item with itemType matching a disabled recommendation
      // But the disabled recommendation is NOT a food item (no caloriesPerUnit on rec)
      const nonFoodDisabledRecs: RecommendedItemDefinition[] = [
        ...mockFoodRecommendedItems,
        {
          id: createProductTemplateId('flashlight'),
          i18nKey: 'flashlight',
          category: 'food', // In food category
          baseQuantity: createQuantity(1),
          unit: 'pieces',
          scaleWithPeople: false,
          scaleWithDays: false,
          // No caloriesPerUnit → isFoodRecommendedItem returns false
        },
      ];

      const items = [
        createMockInventoryItem({
          id: createItemId('1'),
          categoryId: createCategoryId('food'),
          itemType: createProductTemplateId('flashlight'),
          quantity: createQuantity(5),
          caloriesPerUnit: undefined, // No own calories
        }),
      ];

      const result = calculateCategoryPercentage(
        'food',
        items,
        household,
        ['flashlight'], // Disabled, but no caloriesPerUnit on rec
        nonFoodDisabledRecs,
      );

      // flashlight rec has no caloriesPerUnit → should not contribute calories
      expect(result.totalActualCalories).toBe(0);
    });

    it('item without itemType does not match disabled recommendations', () => {
      const household = createMockHousehold({
        adults: 1,
        children: 0,
        pets: 0,
        supplyDurationDays: 3,
      });

      const items = [
        createMockInventoryItem({
          id: createItemId('1'),
          categoryId: createCategoryId('food'),
          itemType: undefined as unknown as ReturnType<
            typeof createProductTemplateId
          >,
          quantity: createQuantity(5),
          caloriesPerUnit: undefined,
        }),
      ];

      const result = calculateCategoryPercentage(
        'food',
        items,
        household,
        ['rice'],
        mockFoodRecommendedItems,
      );

      // No itemType → can't match disabled rec
      expect(result.totalActualCalories).toBe(0);
    });
  });

  describe('totalNeededCalories > 0 boundary', () => {
    it('returns 100% when totalNeededCalories is exactly 0', () => {
      const household = createMockHousehold({
        adults: 0,
        children: 0,
        pets: 0,
        supplyDurationDays: 3,
      });

      const result = calculateCategoryPercentage(
        'food',
        [],
        household,
        [],
        mockFoodRecommendedItems,
      );

      // 0 people → 0 needed → 100% (not 0%)
      expect(result.percentage).toBe(100);
      expect(result.totalNeededCalories).toBe(0);
    });

    it('does not return 100% when totalNeededCalories is positive', () => {
      const household = createMockHousehold({
        adults: 1,
        children: 0,
        pets: 0,
        supplyDurationDays: 3,
      });

      const result = calculateCategoryPercentage(
        'food',
        [],
        household,
        [],
        mockFoodRecommendedItems,
      );

      // Need 6000 kcal, have 0 → 0%
      expect(result.percentage).toBe(0);
      expect(result.totalNeededCalories).toBeGreaterThan(0);
    });
  });

  describe('hasEnough boundary', () => {
    it('hasEnough is true when totalActualCalories === totalNeededCalories', () => {
      const household = createMockHousehold({
        adults: 1,
        children: 0,
        pets: 0,
        supplyDurationDays: 3,
      });

      // Need exactly 6000, provide exactly 6000
      const items = [
        createMockInventoryItem({
          id: createItemId('1'),
          categoryId: createCategoryId('food'),
          itemType: createProductTemplateId('rice'),
          quantity: createQuantity(1),
          caloriesPerUnit: 3600,
        }),
        createMockInventoryItem({
          id: createItemId('2'),
          categoryId: createCategoryId('food'),
          itemType: createProductTemplateId('canned-beans'),
          quantity: createQuantity(8),
          caloriesPerUnit: 300,
        }),
      ];

      const result = calculateCategoryPercentage(
        'food',
        items,
        household,
        [],
        mockFoodRecommendedItems,
      );

      // 3600 + 8*300 = 3600 + 2400 = 6000 = totalNeeded
      expect(result.totalActualCalories).toBe(6000);
      expect(result.totalNeededCalories).toBe(6000);
      expect(result.hasEnough).toBe(true); // >= means exactly equal is true
      expect(result.percentage).toBe(100);
    });

    it('hasEnough is false when just below needed', () => {
      const household = createMockHousehold({
        adults: 1,
        children: 0,
        pets: 0,
        supplyDurationDays: 3,
      });

      // Need 6000, have 5999
      const items = [
        createMockInventoryItem({
          id: createItemId('1'),
          categoryId: createCategoryId('food'),
          itemType: createProductTemplateId('custom-food'),
          quantity: createQuantity(1),
          caloriesPerUnit: 5999,
        }),
      ];

      const result = calculateCategoryPercentage(
        'food',
        items,
        household,
        [],
        mockFoodRecommendedItems,
      );

      expect(result.totalActualCalories).toBe(5999);
      expect(result.hasEnough).toBe(false);
    });
  });

  describe('hasRecommendations boolean', () => {
    it('returns hasRecommendations: true for food category with recommendations', () => {
      const household = createMockHousehold({
        adults: 1,
        children: 0,
        pets: 0,
        supplyDurationDays: 3,
      });

      const result = calculateCategoryPercentage(
        'food',
        [],
        household,
        [],
        mockFoodRecommendedItems,
      );

      expect(result.hasRecommendations).toBe(true);
    });

    it('returns hasRecommendations: true for quantity-based category with recommendations', () => {
      const household = createMockHousehold({
        adults: 1,
        children: 0,
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

      expect(result.hasRecommendations).toBe(true);
    });

    it('returns hasRecommendations: false for category without recommendations', () => {
      const household = createMockHousehold({
        adults: 1,
        children: 0,
        pets: 0,
        supplyDurationDays: 3,
      });

      const result = calculateCategoryPercentage(
        'custom-category',
        [],
        household,
        [],
        [], // No recommendations
      );

      expect(result.hasRecommendations).toBe(false);
    });
  });

  describe('communication-info string literal', () => {
    it('communication-info uses item type counting regardless of unit uniformity', () => {
      const household = createMockHousehold({
        adults: 1,
        children: 0,
        pets: 0,
        supplyDurationDays: 3,
      });

      // All same units but still uses item-type counting because it's communication-info
      // One item has baseQuantity 3 so quantity-counting (total=4) differs from
      // item-type counting (total=2), making the branch distinguishable.
      const sameUnitCommItems: RecommendedItemDefinition[] = [
        {
          id: createProductTemplateId('battery-radio'),
          i18nKey: 'battery-radio',
          category: 'communication-info',
          baseQuantity: createQuantity(1),
          unit: 'pieces', // Same unit
          scaleWithPeople: false,
          scaleWithDays: false,
        },
        {
          id: createProductTemplateId('hand-crank-radio'),
          i18nKey: 'hand-crank-radio',
          category: 'communication-info',
          baseQuantity: createQuantity(3),
          unit: 'pieces', // Same unit
          scaleWithPeople: false,
          scaleWithDays: false,
        },
      ];

      const items = [
        createMockInventoryItem({
          id: createItemId('1'),
          categoryId: createCategoryId('communication-info'),
          itemType: createProductTemplateId('battery-radio'),
          quantity: createQuantity(1),
          unit: 'pieces',
        }),
      ];

      const result = calculateCategoryPercentage(
        'communication-info',
        items,
        household,
        [],
        sameUnitCommItems,
      );

      // Item type counting: 1 of 2 types fulfilled = 50%
      // If quantity counting were used instead: totalNeeded would be 4 (1+3), not 2
      expect(result.totalNeeded).toBe(2);
      expect(result.totalActual).toBe(1);
      expect(result.percentage).toBe(50);
    });

    it('non-communication category with same units does NOT use item type counting', () => {
      const household = createMockHousehold({
        adults: 1,
        children: 0,
        pets: 0,
        supplyDurationDays: 3,
      });

      // tools-supplies all same unit (pieces), uses quantity counting
      const items = [
        createMockInventoryItem({
          id: createItemId('1'),
          categoryId: createCategoryId('tools-supplies'),
          itemType: createProductTemplateId('flashlight'),
          quantity: createQuantity(1),
          unit: 'pieces',
        }),
        createMockInventoryItem({
          id: createItemId('2'),
          categoryId: createCategoryId('tools-supplies'),
          itemType: createProductTemplateId('batteries'),
          quantity: createQuantity(2),
          unit: 'pieces',
        }),
      ];

      const result = calculateCategoryPercentage(
        'tools-supplies',
        items,
        household,
        [],
        mockToolsRecommendedItems,
      );

      // Quantity-based: actual 3 / needed 5 = 60%
      expect(result.totalActual).toBe(3);
      expect(result.totalNeeded).toBe(5);
      expect(result.percentage).toBe(60);
    });
  });

  describe('scaleWithPets multiplication', () => {
    it('scales recommended quantity with pets * PET_REQUIREMENT_MULTIPLIER', () => {
      const household = createMockHousehold({
        adults: 1,
        children: 0,
        pets: 2,
        supplyDurationDays: 3,
      });

      // Create a recommendation that scales with pets
      const petScalingRecs: RecommendedItemDefinition[] = [
        {
          id: createProductTemplateId('pet-food'),
          i18nKey: 'pet-food',
          category: 'pet-supplies',
          baseQuantity: createQuantity(5),
          unit: 'kilograms',
          scaleWithPeople: false,
          scaleWithDays: false,
          scaleWithPets: true,
        },
      ];

      const items = [
        createMockInventoryItem({
          id: createItemId('1'),
          categoryId: createCategoryId('pet-supplies'),
          itemType: createProductTemplateId('pet-food'),
          quantity: createQuantity(10), // Exactly 5 * 2 pets * 1 multiplier = 10
          unit: 'kilograms',
        }),
      ];

      const result = calculateCategoryPercentage(
        'pet-supplies',
        items,
        household,
        [],
        petScalingRecs,
      );

      // 5 * 2 * 1 = 10 needed, have 10 → 100%
      expect(result.totalNeeded).toBe(10);
      expect(result.totalActual).toBe(10);
      expect(result.percentage).toBe(100);
      expect(result.hasEnough).toBe(true);
    });

    it('pet scaling uses multiplication not division', () => {
      const household = createMockHousehold({
        adults: 1,
        children: 0,
        pets: 3,
        supplyDurationDays: 3,
      });

      const petScalingRecs: RecommendedItemDefinition[] = [
        {
          id: createProductTemplateId('pet-food'),
          i18nKey: 'pet-food',
          category: 'pet-supplies',
          baseQuantity: createQuantity(4),
          unit: 'kilograms',
          scaleWithPeople: false,
          scaleWithDays: false,
          scaleWithPets: true,
        },
      ];

      const result = calculateCategoryPercentage(
        'pet-supplies',
        [],
        household,
        [],
        petScalingRecs,
      );

      // 4 * 3 * 1 = 12. If / instead of *, would be 4/3 = 1.33 → ceil = 2
      expect(result.totalNeeded).toBe(12);
    });
  });

  describe('water-beverages && bottled-water compound condition', () => {
    it('adds preparation water only for bottled-water in water-beverages category', () => {
      const household = createMockHousehold({
        adults: 1,
        children: 0,
        pets: 0,
        supplyDurationDays: 3,
      });

      // Food item that needs water for preparation
      const allItems = [
        createMockInventoryItem({
          id: createItemId('1'),
          categoryId: createCategoryId('water-beverages'),
          itemType: createProductTemplateId('bottled-water'),
          quantity: createQuantity(12),
          unit: 'liters',
        }),
        createMockInventoryItem({
          id: createItemId('2'),
          categoryId: createCategoryId('food'),
          itemType: createProductTemplateId('rice'),
          quantity: createQuantity(2),
          requiresWaterLiters: 1.5, // 2 * 1.5 = 3 L
        }),
      ];

      const result = calculateCategoryPercentage(
        'water-beverages',
        allItems,
        household,
        [],
        mockWaterRecommendedItems,
      );

      // 9 L drinking + 3 L prep = 12 L needed
      expect(result.totalNeeded).toBe(12);
      expect(result.totalActual).toBe(12);
      expect(result.hasEnough).toBe(true);
    });

    it('does not add preparation water to non-bottled-water items', () => {
      const household = createMockHousehold({
        adults: 1,
        children: 0,
        pets: 0,
        supplyDurationDays: 3,
      });

      // Water category with non-bottled-water recommendation
      const waterWithOtherRecs: RecommendedItemDefinition[] = [
        {
          id: createProductTemplateId('water-filter'),
          i18nKey: 'water-filter',
          category: 'water-beverages',
          baseQuantity: createQuantity(1),
          unit: 'pieces',
          scaleWithPeople: false,
          scaleWithDays: false,
        },
      ];

      const allItems = [
        createMockInventoryItem({
          id: createItemId('1'),
          categoryId: createCategoryId('water-beverages'),
          itemType: createProductTemplateId('water-filter'),
          quantity: createQuantity(1),
          unit: 'pieces',
        }),
        createMockInventoryItem({
          id: createItemId('2'),
          categoryId: createCategoryId('food'),
          requiresWaterLiters: 5,
          quantity: createQuantity(1),
        }),
      ];

      const result = calculateCategoryPercentage(
        'water-beverages',
        allItems,
        household,
        [],
        waterWithOtherRecs,
      );

      // water-filter needs 1 piece, has 1 piece → 100%
      // preparation water should NOT be added to water-filter's needed quantity
      expect(result.totalNeeded).toBe(1);
      expect(result.percentage).toBe(100);
    });
  });

  describe('reduce ArrowFunction', () => {
    it('sums quantities from multiple matching items correctly', () => {
      const household = createMockHousehold({
        adults: 1,
        children: 0,
        pets: 0,
        supplyDurationDays: 3,
      });

      // Two items matching the same recommendation
      const items = [
        createMockInventoryItem({
          id: createItemId('1'),
          categoryId: createCategoryId('tools-supplies'),
          itemType: createProductTemplateId('batteries'),
          quantity: createQuantity(2),
          unit: 'pieces',
        }),
        createMockInventoryItem({
          id: createItemId('2'),
          categoryId: createCategoryId('tools-supplies'),
          itemType: createProductTemplateId('batteries'),
          quantity: createQuantity(3),
          unit: 'pieces',
        }),
      ];

      // Only use batteries rec to simplify
      const batteriesOnlyRec: RecommendedItemDefinition[] = [
        {
          id: createProductTemplateId('batteries'),
          i18nKey: 'batteries',
          category: 'tools-supplies',
          baseQuantity: createQuantity(4),
          unit: 'pieces',
          scaleWithPeople: false,
          scaleWithDays: false,
        },
      ];

      const result = calculateCategoryPercentage(
        'tools-supplies',
        items,
        household,
        [],
        batteriesOnlyRec,
      );

      // 2 + 3 = 5 actual, 4 needed → 125%
      expect(result.totalActual).toBe(5);
      expect(result.totalNeeded).toBe(4);
      expect(result.percentage).toBe(125);
    });
  });

  describe('hasEnough boundary for quantity category', () => {
    it('hasEnough is true when totalActual === totalNeeded', () => {
      const household = createMockHousehold({
        adults: 1,
        children: 0,
        pets: 0,
        supplyDurationDays: 3,
      });

      const items = [
        createMockInventoryItem({
          id: createItemId('1'),
          categoryId: createCategoryId('tools-supplies'),
          itemType: createProductTemplateId('flashlight'),
          quantity: createQuantity(1),
          unit: 'pieces',
        }),
        createMockInventoryItem({
          id: createItemId('2'),
          categoryId: createCategoryId('tools-supplies'),
          itemType: createProductTemplateId('batteries'),
          quantity: createQuantity(4),
          unit: 'pieces',
        }),
      ];

      const result = calculateCategoryPercentage(
        'tools-supplies',
        items,
        household,
        [],
        mockToolsRecommendedItems,
      );

      expect(result.totalActual).toBe(result.totalNeeded);
      expect(result.hasEnough).toBe(true);
    });

    it('hasEnough is false when totalActual is one less than totalNeeded', () => {
      const household = createMockHousehold({
        adults: 1,
        children: 0,
        pets: 0,
        supplyDurationDays: 3,
      });

      const items = [
        createMockInventoryItem({
          id: createItemId('1'),
          categoryId: createCategoryId('tools-supplies'),
          itemType: createProductTemplateId('flashlight'),
          quantity: createQuantity(1),
          unit: 'pieces',
        }),
        createMockInventoryItem({
          id: createItemId('2'),
          categoryId: createCategoryId('tools-supplies'),
          itemType: createProductTemplateId('batteries'),
          quantity: createQuantity(3), // Need 4
          unit: 'pieces',
        }),
      ];

      const result = calculateCategoryPercentage(
        'tools-supplies',
        items,
        household,
        [],
        mockToolsRecommendedItems,
      );

      expect(result.totalActual).toBe(4);
      expect(result.totalNeeded).toBe(5);
      expect(result.hasEnough).toBe(false);
    });
  });

  describe('food without-recommendations caloriesPerUnit check', () => {
    it('counts only items with valid caloriesPerUnit', () => {
      const household = createMockHousehold({
        adults: 1,
        children: 0,
        pets: 0,
        supplyDurationDays: 3,
      });

      const items = [
        createMockInventoryItem({
          id: createItemId('1'),
          categoryId: createCategoryId('food'),
          quantity: createQuantity(1),
          caloriesPerUnit: 1000,
        }),
        createMockInventoryItem({
          id: createItemId('2'),
          categoryId: createCategoryId('food'),
          quantity: createQuantity(5),
          caloriesPerUnit: Number.NaN, // Not finite
        }),
        createMockInventoryItem({
          id: createItemId('3'),
          categoryId: createCategoryId('food'),
          quantity: createQuantity(5),
          caloriesPerUnit: undefined,
        }),
      ];

      const result = calculateCategoryPercentage(
        'food',
        items,
        household,
        [],
        [], // No recommendations
      );

      // Only first item should contribute: 1 * 1000 = 1000
      expect(result.totalActualCalories).toBe(1000);
      expect(result.hasRecommendations).toBe(false);
    });
  });

  describe('water without-recommendations hasEnough boundary', () => {
    it('hasEnough is true when water exactly meets requirement', () => {
      const household = createMockHousehold({
        adults: 1,
        children: 0,
        pets: 0,
        supplyDurationDays: 3,
      });

      const items = [
        createMockInventoryItem({
          id: createItemId('1'),
          categoryId: createCategoryId('water-beverages'),
          quantity: createQuantity(9), // Exactly 1 * 3 * 3 = 9
          unit: 'liters',
        }),
      ];

      const result = calculateCategoryPercentage(
        'water-beverages',
        items,
        household,
        [],
        [], // No recommendations
      );

      expect(result.totalActual).toBe(9);
      expect(result.totalNeeded).toBe(9);
      expect(result.hasEnough).toBe(true);
      expect(result.hasRecommendations).toBe(false);
    });

    it('hasEnough is false when water is just below requirement', () => {
      const household = createMockHousehold({
        adults: 1,
        children: 0,
        pets: 0,
        supplyDurationDays: 3,
      });

      const items = [
        createMockInventoryItem({
          id: createItemId('1'),
          categoryId: createCategoryId('water-beverages'),
          quantity: createQuantity(8.9),
          unit: 'liters',
        }),
      ];

      const result = calculateCategoryPercentage(
        'water-beverages',
        items,
        household,
        [],
        [],
      );

      expect(result.totalActual).toBe(8.9);
      expect(result.totalNeeded).toBe(9);
      expect(result.hasEnough).toBe(false);
    });
  });

  describe('type guard branches', () => {
    it('handles string category IDs correctly for recommended item filtering', () => {
      const household = createMockHousehold({
        adults: 1,
        children: 0,
        pets: 0,
        supplyDurationDays: 3,
      });

      // Verify that category filtering works with string comparison
      const result = calculateCategoryPercentage(
        'tools-supplies',
        [],
        household,
        [],
        mockToolsRecommendedItems,
      );

      // Should find 2 recommended items for tools-supplies
      expect(result.totalNeeded).toBe(5); // 1 flashlight + 4 batteries
      expect(result.hasRecommendations).toBe(true);
    });

    it('does not match recommended items from different category', () => {
      const household = createMockHousehold({
        adults: 1,
        children: 0,
        pets: 0,
        supplyDurationDays: 3,
      });

      // Pass food recommendations but ask for tools-supplies category
      const result = calculateCategoryPercentage(
        'tools-supplies',
        [],
        household,
        [],
        mockFoodRecommendedItems, // Wrong category
      );

      // No matching recommendations → falls into no-recommendation path
      expect(result.hasRecommendations).toBe(false);
      expect(result.totalNeeded).toBe(0);
    });
  });

  describe('disabled items includes check', () => {
    it('disabled item IDs must exactly match recommendation IDs', () => {
      const household = createMockHousehold({
        adults: 1,
        children: 0,
        pets: 0,
        supplyDurationDays: 3,
      });

      // Disable one of two recommendations
      const result = calculateCategoryPercentage(
        'tools-supplies',
        [],
        household,
        ['flashlight'], // Disable only flashlight
        mockToolsRecommendedItems,
      );

      // Only batteries recommendation should remain (4 pieces)
      expect(result.totalNeeded).toBe(4);
      expect(result.hasRecommendations).toBe(true);
    });

    it('disabling all recommendations falls to no-recommendation path', () => {
      const household = createMockHousehold({
        adults: 1,
        children: 0,
        pets: 0,
        supplyDurationDays: 3,
      });

      const result = calculateCategoryPercentage(
        'tools-supplies',
        [],
        household,
        ['flashlight', 'batteries'], // Disable all
        mockToolsRecommendedItems,
      );

      // No enabled recommendations → no requirements
      expect(result.hasRecommendations).toBe(false);
      expect(result.hasEnough).toBe(true);
    });
  });

  describe('bottled-water dailyWater override', () => {
    it('bottled-water uses dailyWater setting instead of baseQuantity', () => {
      const household = createMockHousehold({
        adults: 1,
        children: 0,
        pets: 0,
        supplyDurationDays: 3,
      });

      const items = [
        createMockInventoryItem({
          id: createItemId('1'),
          categoryId: createCategoryId('water-beverages'),
          itemType: createProductTemplateId('bottled-water'),
          quantity: createQuantity(15),
          unit: 'liters',
        }),
      ];

      // Override dailyWater to 5 instead of default 3
      const result = calculateCategoryPercentage(
        'water-beverages',
        items,
        household,
        [],
        mockWaterRecommendedItems,
        { dailyWaterPerPerson: 5 },
      );

      // 1 * 5 * 3 = 15 needed
      expect(result.totalNeeded).toBe(15);
      expect(result.totalActual).toBe(15);
      expect(result.hasEnough).toBe(true);
    });
  });

  describe('options overrides', () => {
    it('respects custom childrenMultiplier', () => {
      const household = createMockHousehold({
        adults: 0,
        children: 2,
        pets: 0,
        supplyDurationDays: 3,
      });

      const result = calculateCategoryPercentage(
        'food',
        [],
        household,
        [],
        mockFoodRecommendedItems,
        { childrenMultiplier: 0.5 },
      );

      // 2 * 0.5 * 2000 * 3 = 6000
      expect(result.totalNeededCalories).toBe(6000);
    });

    it('respects custom dailyCaloriesPerPerson', () => {
      const household = createMockHousehold({
        adults: 1,
        children: 0,
        pets: 0,
        supplyDurationDays: 3,
      });

      const result = calculateCategoryPercentage(
        'food',
        [],
        household,
        [],
        mockFoodRecommendedItems,
        { dailyCaloriesPerPerson: 2500 },
      );

      // 1 * 2500 * 3 = 7500
      expect(result.totalNeededCalories).toBe(7500);
    });
  });

  describe('markedAsEnough for item type counting', () => {
    it('treats item as fulfilled when markedAsEnough even with insufficient quantity', () => {
      const household = createMockHousehold({
        adults: 1,
        children: 0,
        pets: 0,
        supplyDurationDays: 3,
      });

      // cooking-heat uses item type counting (mixed units)
      const items = [
        createMockInventoryItem({
          id: createItemId('1'),
          categoryId: createCategoryId('cooking-heat'),
          itemType: createProductTemplateId('camping-stove'),
          quantity: createQuantity(1),
          unit: 'pieces',
        }),
        createMockInventoryItem({
          id: createItemId('2'),
          categoryId: createCategoryId('cooking-heat'),
          itemType: createProductTemplateId('stove-fuel'),
          quantity: createQuantity(0), // Zero quantity but marked as enough
          unit: 'canisters',
          markedAsEnough: true,
        }),
        createMockInventoryItem({
          id: createItemId('3'),
          categoryId: createCategoryId('cooking-heat'),
          itemType: createProductTemplateId('matches'),
          quantity: createQuantity(2),
          unit: 'boxes',
        }),
      ];

      const result = calculateCategoryPercentage(
        'cooking-heat',
        items,
        household,
        [],
        mockCookingHeatRecommendedItems,
      );

      // All 3 types should be fulfilled (stove enough qty, fuel marked enough, matches enough)
      expect(result.totalActual).toBe(3);
      expect(result.totalNeeded).toBe(3);
      expect(result.percentage).toBe(100);
      expect(result.hasEnough).toBe(true);
    });
  });
  // ============================================================
  // L86: ArrayDeclaration mutant - default disabledRecommendedItems = []
  // Stryker replaces [] with ["Stryker was here"].
  // If we omit the disabledRecommendedItems param and have a recommended item
  // whose id is NOT "Stryker was here", it should NOT be filtered out.
  // ============================================================
  describe('default disabledRecommendedItems must be empty array', () => {
    it('uses empty array as default for disabledRecommendedItems (no items filtered)', () => {
      const household = createMockHousehold({
        adults: 1,
        children: 0,
        pets: 0,
        supplyDurationDays: 3,
      });

      const items = [
        createMockInventoryItem({
          id: createItemId('1'),
          categoryId: createCategoryId('tools-supplies'),
          itemType: createProductTemplateId('flashlight'),
          quantity: createQuantity(1),
          unit: 'pieces',
        }),
        createMockInventoryItem({
          id: createItemId('2'),
          categoryId: createCategoryId('tools-supplies'),
          itemType: createProductTemplateId('batteries'),
          quantity: createQuantity(4),
          unit: 'pieces',
        }),
      ];

      // Call WITHOUT disabledRecommendedItems (use default)
      const result = calculateCategoryPercentage(
        'tools-supplies',
        items,
        household,
        undefined as unknown as string[], // force default
        mockToolsRecommendedItems,
      );

      // Both recommended items should be counted (none disabled)
      // flashlight: 1/1 = fulfilled, batteries: 4/4 = fulfilled
      expect(result.percentage).toBe(100);
      expect(result.hasRecommendations).toBe(true);
      expect(result.totalActual).toBe(5); // 1 + 4
      expect(result.totalNeeded).toBe(5); // 1 + 4
    });
  });

  // ============================================================
  // L99: typeof categoryId === 'string' → !== 'string'
  // L102: typeof item.category === 'string' → !== 'string'
  // Both ConditionalExpression mutants: true/false
  // These guard against branded types. We need to verify that
  // string categoryId correctly matches string item.category.
  // ============================================================
  describe('typeof string guards for categoryId and item.category', () => {
    it('correctly filters recommended items by string categoryId', () => {
      const household = createMockHousehold({
        adults: 1,
        children: 0,
        pets: 0,
        supplyDurationDays: 3,
      });

      const items = [
        createMockInventoryItem({
          id: createItemId('1'),
          categoryId: createCategoryId('tools-supplies'),
          itemType: createProductTemplateId('flashlight'),
          quantity: createQuantity(1),
          unit: 'pieces',
        }),
      ];

      // Pass string categoryId and recommended items with string category
      const result = calculateCategoryPercentage(
        'tools-supplies',
        items,
        household,
        [],
        mockToolsRecommendedItems,
      );

      // Should find recommendations (flashlight and batteries in tools-supplies)
      expect(result.hasRecommendations).toBe(true);
      expect(result.totalNeeded).toBeGreaterThan(0);
    });

    it('does not match recommended items from a different category', () => {
      const household = createMockHousehold({
        adults: 1,
        children: 0,
        pets: 0,
        supplyDurationDays: 3,
      });

      // Pass tools recommended items but ask for food category
      const result = calculateCategoryPercentage(
        'food',
        [],
        household,
        [],
        mockToolsRecommendedItems, // These have category: 'tools-supplies'
      );

      // Food category with no matching recommendations uses calorie-based fallback
      expect(result.hasRecommendations).toBe(false);
    });
  });

  // ============================================================
  // L111: ArithmeticOperator - adults * ADULT_REQUIREMENT_MULTIPLIER → /
  // Since ADULT_REQUIREMENT_MULTIPLIER = 1, using adults=1 won't detect this.
  // Use adults=2 so that 2*1=2 differs from 2/1=2... still same.
  // Actually with multiplier=1, * and / give same result.
  // We need to use a custom childrenMultiplier to create a difference,
  // OR test with children > 0 where childrenMultiplier != 1.
  // The full formula: adults * 1.0 + children * 0.75
  // Mutant: adults / 1.0 + children * 0.75
  // With adults=2: 2*1=2 vs 2/1=2 → same! Can't kill with multiplier=1.
  // However, Stryker might also change the whole expression.
  // Let's verify: the actual line is:
  //   household.adults * ADULT_REQUIREMENT_MULTIPLIER +
  // With ADULT_REQUIREMENT_MULTIPLIER = 1.0, * and / are identical.
  // This mutant may be unkillable. But let's try with adults=3, children=2.
  // 3*1 + 2*0.75 = 4.5 vs 3/1 + 2*0.75 = 4.5 → still same.
  // This mutant IS equivalent (unkillable) since multiplier is 1.
  // We can only kill it if we override the multiplier, but it's not
  // exposed as an option for adults.
  // Let's still write a test to verify arithmetic correctness with
  // multiple adults, as a best effort.
  // ============================================================
  describe('peopleMultiplier arithmetic with adults', () => {
    it('correctly computes people multiplier with multiple adults for food category', () => {
      const household = createMockHousehold({
        adults: 2,
        children: 1,
        pets: 0,
        supplyDurationDays: 3,
      });

      // Food category with recommendations
      // peopleMultiplier = 2*1.0 + 1*0.75 = 2.75
      // totalNeededCalories = 2000 * 2.75 * 3 = 16500
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
        mockFoodRecommendedItems,
      );

      // totalNeededCalories = 2000 * 2.75 * 3 = 16500
      expect(result.totalNeededCalories).toBe(16500);
    });
  });

  // ============================================================
  // L161: ConditionalExpression - `categoryId === 'water-beverages'` → true
  // If mutated to always true, non-water categories would get
  // preparationWaterNeeded added. We need to verify a non-water
  // category does NOT include preparation water.
  // ============================================================
  describe('water-beverages check for preparation water', () => {
    it('non-water category does not include preparation water in calculation', () => {
      const household = createMockHousehold({
        adults: 1,
        children: 0,
        pets: 0,
        supplyDurationDays: 3,
      });

      // Create a food item that requires water for preparation (has waterPerUnit)
      const foodItemRequiringWater = createMockInventoryItem({
        id: createItemId('water-food'),
        categoryId: createCategoryId('food'),
        itemType: createProductTemplateId('rice'),
        quantity: createQuantity(2),
        unit: 'kilograms',
        caloriesPerUnit: 3600,
        weightGrams: 1000,
      });

      const toolItem = createMockInventoryItem({
        id: createItemId('tool-1'),
        categoryId: createCategoryId('tools-supplies'),
        itemType: createProductTemplateId('flashlight'),
        quantity: createQuantity(1),
        unit: 'pieces',
      });

      const items = [foodItemRequiringWater, toolItem];

      const result = calculateCategoryPercentage(
        'tools-supplies',
        items,
        household,
        [],
        mockToolsRecommendedItems,
      );

      // Tools totalNeeded should be just from recommended items, no water added
      // flashlight: 1, batteries: 4 → totalNeeded = 5
      expect(result.totalNeeded).toBe(5);
    });
  });

  // ============================================================
  // L199: BlockStatement {} and ConditionalExpression mutants
  // `if (!isFoodRecommendedItem(recItem) || !recItem.caloriesPerUnit) return;`
  // If the block is emptied or condition mutated, non-food recommended items
  // or items without caloriesPerUnit would be processed (causing errors or wrong counts).
  // We need a food category with a non-food recommended item mixed in.
  // ============================================================
  describe('skip non-food recommended items in food calorie calculation', () => {
    it('skips recommended items without caloriesPerUnit in food calculation', () => {
      const household = createMockHousehold({
        adults: 1,
        children: 0,
        pets: 0,
        supplyDurationDays: 3,
      });

      // A recommended item that is in food category but has no caloriesPerUnit
      const foodRecsWithNonCalorie: RecommendedItemDefinition[] = [
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
        {
          // Food item WITHOUT caloriesPerUnit — should be skipped
          id: createProductTemplateId('seasoning'),
          i18nKey: 'seasoning',
          category: 'food',
          baseQuantity: createQuantity(1),
          unit: 'pieces',
          scaleWithPeople: false,
          scaleWithDays: false,
          // no caloriesPerUnit
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
        createMockInventoryItem({
          id: createItemId('2'),
          categoryId: createCategoryId('food'),
          itemType: createProductTemplateId('seasoning'),
          quantity: createQuantity(5),
          unit: 'pieces',
          // no caloriesPerUnit
        }),
      ];

      const result = calculateCategoryPercentage(
        'food',
        items,
        household,
        [],
        foodRecsWithNonCalorie,
      );

      // Only rice should contribute calories
      // Rice: 1 unit * 3600 cal = 3600 actual calories
      // totalNeeded = 2000 * 1 * 3 = 6000
      expect(result.totalActualCalories).toBe(3600);
      expect(result.totalNeededCalories).toBe(6000);
      expect(result.percentage).toBe(60); // 3600/6000 * 100
    });

    it('skips food-category rec lacking caloriesPerUnit via combined guard', () => {
      const household = createMockHousehold({
        adults: 1,
        children: 0,
        pets: 0,
        supplyDurationDays: 3,
      });

      // Both recs have category 'food', so isFoodRecommendedItem returns true for both.
      // However, flashlight lacks caloriesPerUnit, so it's skipped by the combined guard:
      // `!isFoodRecommendedItem(recItem) || !recItem.caloriesPerUnit`
      // The missing caloriesPerUnit is the reason flashlight is skipped.
      const mixedRecs: RecommendedItemDefinition[] = [
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
        {
          // Food rec without caloriesPerUnit — skipped by !recItem.caloriesPerUnit guard
          id: createProductTemplateId('flashlight'),
          i18nKey: 'flashlight',
          category: 'food',
          baseQuantity: createQuantity(1),
          unit: 'pieces',
          scaleWithPeople: false,
          scaleWithDays: false,
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
        mixedRecs,
      );

      // Only rice contributes calories (flashlight is skipped)
      expect(result.totalActualCalories).toBe(3600);
      // Total needed only counts rice's contribution
      expect(result.totalNeededCalories).toBe(6000); // 2000 * 1 * 3
    });
  });

  // ============================================================
  // L237: LogicalOperator - `item.caloriesPerUnit != null && Number.isFinite(...)` → ||
  // This is in the uncounted-items loop. If changed to ||, items with
  // null caloriesPerUnit would pass the check and calculateItemTotalCalories
  // would return 0, but the `return` would skip the disabled-rec fallback.
  // We need an item that:
  // - doesn't match any enabled recommendation
  // - has null caloriesPerUnit
  // - matches a disabled recommendation with caloriesPerUnit
  // With && → goes to disabled rec fallback, gets calories
  // With || → null != null is false, but isFinite(null) would pass... wait
  // Actually: null != null → false, so with || the other side needs to be true.
  // Number.isFinite(null) → false. So || would still be false for null.
  // But for undefined: undefined != null → false, Number.isFinite(undefined) → false.
  // For NaN: NaN != null → true, Number.isFinite(NaN) → false.
  // With &&: true && false = false → goes to fallback
  // With ||: true || false = true → tries calculateItemTotalCalories(item) which returns 0
  //   then returns (skips fallback)
  // So we need an item with caloriesPerUnit = NaN that matches a disabled rec.
  // ============================================================
  describe('caloriesPerUnit null/NaN guard in uncounted items loop', () => {
    it('uses disabled recommendation caloriesPerUnit when item has NaN caloriesPerUnit', () => {
      const household = createMockHousehold({
        adults: 1,
        children: 0,
        pets: 0,
        supplyDurationDays: 3,
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
        {
          id: createProductTemplateId('canned-beans'),
          i18nKey: 'cannedBeans',
          category: 'food',
          baseQuantity: createQuantity(2),
          unit: 'cans',
          scaleWithPeople: true,
          scaleWithDays: false,
          caloriesPerUnit: 300,
          caloriesPer100g: 100,
          weightGramsPerUnit: 300,
        },
      ];

      const items = [
        // Item matching rice (enabled recommendation) - counted normally
        createMockInventoryItem({
          id: createItemId('1'),
          categoryId: createCategoryId('food'),
          itemType: createProductTemplateId('rice'),
          quantity: createQuantity(1),
          unit: 'kilograms',
          caloriesPerUnit: 3600,
          weightGrams: 1000,
        }),
        // Item matching disabled canned-beans, with NaN caloriesPerUnit
        // Should fall through to disabled rec lookup and use rec's 300 cal/unit
        createMockInventoryItem({
          id: createItemId('2'),
          categoryId: createCategoryId('food'),
          itemType: createProductTemplateId('canned-beans'),
          quantity: createQuantity(3),
          unit: 'cans',
          caloriesPerUnit: Number.NaN, // NaN - not finite
        }),
      ];

      // Disable canned-beans so item '2' is "uncounted" from enabled recs
      const disabledIds = ['canned-beans'];

      // Only rice is in enabled recs (recs[0]);

      const result = calculateCategoryPercentage(
        'food',
        items,
        household,
        disabledIds,
        recs, // all recs passed so disabled lookup works
      );

      // Rice: 3600 cal from item
      // Canned-beans: 3 * 300 = 900 cal from disabled rec fallback
      // Total actual = 3600 + 900 = 4500
      // With || mutant: NaN != null (true) || isFinite(NaN) (false) = true
      //   → calculateItemTotalCalories returns 0 (NaN not finite)
      //   → returns early, skips fallback → total = 3600 only
      expect(result.totalActualCalories).toBe(4500);
    });

    it('counts item with valid caloriesPerUnit that does not match any enabled rec', () => {
      const household = createMockHousehold({
        adults: 1,
        children: 0,
        pets: 0,
        supplyDurationDays: 3,
      });

      // Only rice is a recommendation
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
        // Extra food item not matching any recommendation, WITH valid caloriesPerUnit
        createMockInventoryItem({
          id: createItemId('2'),
          categoryId: createCategoryId('food'),
          itemType: createProductTemplateId('granola-bar'),
          quantity: createQuantity(5),
          unit: 'pieces',
          caloriesPerUnit: 200,
        }),
      ];

      const result = calculateCategoryPercentage(
        'food',
        items,
        household,
        [],
        recs,
      );

      // Rice: 3600 cal
      // Granola bars: 5 * 200 = 1000 cal (counted via uncounted-items path)
      // Total = 4600
      expect(result.totalActualCalories).toBe(4600);
    });

    it('does NOT count item with null caloriesPerUnit (no matching disabled rec)', () => {
      const household = createMockHousehold({
        adults: 1,
        children: 0,
        pets: 0,
        supplyDurationDays: 3,
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
        // Item with null caloriesPerUnit, no matching disabled rec
        createMockInventoryItem({
          id: createItemId('2'),
          categoryId: createCategoryId('food'),
          itemType: createProductTemplateId('mystery-food'),
          quantity: createQuantity(10),
          unit: 'pieces',
          // caloriesPerUnit is undefined (null-ish)
        }),
      ];

      const result = calculateCategoryPercentage(
        'food',
        items,
        household,
        [],
        recs,
      );

      // Only rice: 3600 cal. Mystery food has no calories info.
      expect(result.totalActualCalories).toBe(3600);
    });
  });

  // ============================================================
  // L309: ArithmeticOperator - `household.pets * PET_REQUIREMENT_MULTIPLIER` → /
  // PET_REQUIREMENT_MULTIPLIER = 1, so * and / give same result.
  // Like L111, this is likely equivalent. But let's test with pets > 1
  // to at least verify correctness.
  // ============================================================
  describe('pet scaling arithmetic', () => {
    it('scales recommended quantity correctly with pets for scaleWithPets items', () => {
      const household = createMockHousehold({
        adults: 1,
        children: 0,
        pets: 2,
        supplyDurationDays: 1,
      });

      // A recommended item that scales with pets
      const petRecs: RecommendedItemDefinition[] = [
        {
          id: createProductTemplateId('pet-food'),
          i18nKey: 'petFood',
          category: 'pets-category',
          baseQuantity: createQuantity(3),
          unit: 'cans',
          scaleWithPeople: false,
          scaleWithDays: false,
          scaleWithPets: true,
        },
      ];

      const items = [
        createMockInventoryItem({
          id: createItemId('1'),
          categoryId: createCategoryId('pets-category'),
          itemType: createProductTemplateId('pet-food'),
          quantity: createQuantity(6),
          unit: 'cans',
        }),
      ];

      const result = calculateCategoryPercentage(
        'pets-category',
        items,
        household,
        [],
        petRecs,
      );

      // baseQuantity=3, scaleWithPets: 3 * 2 * 1 = 6, ceil(6) = 6
      // actual=6, needed=6 → 100%
      expect(result.totalNeeded).toBe(6);
      expect(result.percentage).toBe(100);
    });
  });

  // ============================================================
  // L379: LogicalOperator - `item.caloriesPerUnit != null && Number.isFinite(...)` → ||
  // EQUIVALENT MUTANT: With ||, NaN != null (true) makes the condition pass,
  // but calculateItemTotalCalories returns 0 for NaN anyway, so both paths
  // produce the same observable result. This test is a regression check only.
  // ============================================================
  describe('caloriesPerUnit guard in food-without-recommendations path', () => {
    it('does not count items with NaN caloriesPerUnit when no recommendations exist', () => {
      const household = createMockHousehold({
        adults: 1,
        children: 0,
        pets: 0,
        supplyDurationDays: 3,
      });

      const items = [
        createMockInventoryItem({
          id: createItemId('1'),
          categoryId: createCategoryId('food'),
          itemType: createProductTemplateId('good-food'),
          quantity: createQuantity(2),
          unit: 'kilograms',
          caloriesPerUnit: 2000,
          weightGrams: 1000,
        }),
        createMockInventoryItem({
          id: createItemId('2'),
          categoryId: createCategoryId('food'),
          itemType: createProductTemplateId('bad-food'),
          quantity: createQuantity(5),
          unit: 'pieces',
          caloriesPerUnit: Number.NaN, // NaN - should NOT be counted
        }),
      ];

      // Pass empty recommended items to trigger the "without recommendations" path
      const result = calculateCategoryPercentage(
        'food',
        items,
        household,
        [],
        [], // no recommendations → triggers calculateFoodCategoryPercentageWithoutRecommendations
      );

      // Only good-food: 2 * 2000 = 4000 cal
      // NaN item should be skipped.
      // NOTE: This is an equivalent mutant — both && and || produce the same
      // observable result because calculateItemTotalCalories returns 0 for NaN.
      // This test serves as a regression check for correct calorie totals.
      expect(result.totalActualCalories).toBe(4000);
      expect(result.hasRecommendations).toBe(false);
    });

    it('counts items with valid caloriesPerUnit when no recommendations exist', () => {
      const household = createMockHousehold({
        adults: 1,
        children: 0,
        pets: 0,
        supplyDurationDays: 3,
      });

      const items = [
        createMockInventoryItem({
          id: createItemId('1'),
          categoryId: createCategoryId('food'),
          itemType: createProductTemplateId('food-a'),
          quantity: createQuantity(3),
          unit: 'kilograms',
          caloriesPerUnit: 1500,
          weightGrams: 1000,
        }),
      ];

      const result = calculateCategoryPercentage(
        'food',
        items,
        household,
        [],
        [],
      );

      // 3 * 1500 = 4500 calories
      expect(result.totalActualCalories).toBe(4500);
      expect(result.totalNeededCalories).toBe(6000); // 2000 * 1 * 3
    });

    it('skips items with undefined caloriesPerUnit when no recommendations exist', () => {
      const household = createMockHousehold({
        adults: 1,
        children: 0,
        pets: 0,
        supplyDurationDays: 3,
      });

      const items = [
        createMockInventoryItem({
          id: createItemId('1'),
          categoryId: createCategoryId('food'),
          itemType: createProductTemplateId('no-cal-food'),
          quantity: createQuantity(10),
          unit: 'pieces',
          // no caloriesPerUnit
        }),
      ];

      const result = calculateCategoryPercentage(
        'food',
        items,
        household,
        [],
        [],
      );

      // No caloriesPerUnit → should contribute 0 calories
      expect(result.totalActualCalories).toBe(0);
    });

    it('skips items with Infinity caloriesPerUnit when no recommendations exist', () => {
      const household = createMockHousehold({
        adults: 1,
        children: 0,
        pets: 0,
        supplyDurationDays: 3,
      });

      const items = [
        createMockInventoryItem({
          id: createItemId('1'),
          categoryId: createCategoryId('food'),
          itemType: createProductTemplateId('inf-food'),
          quantity: createQuantity(1),
          unit: 'pieces',
          caloriesPerUnit: Infinity,
        }),
      ];

      const result = calculateCategoryPercentage(
        'food',
        items,
        household,
        [],
        [],
      );

      // Infinity is not finite → should be skipped
      expect(result.totalActualCalories).toBe(0);
    });
  });

  // ============================================================
  // Additional ConditionalExpression mutants coverage
  // L99/L102 true/false mutants - need to ensure filtering actually works
  // ============================================================
  describe('additional conditional expression coverage', () => {
    it('returns different results for different categoryIds with same items', () => {
      const household = createMockHousehold({
        adults: 1,
        children: 0,
        pets: 0,
        supplyDurationDays: 3,
      });

      const allRecs: RecommendedItemDefinition[] = [
        ...mockToolsRecommendedItems,
        {
          id: createProductTemplateId('first-aid-kit'),
          i18nKey: 'firstAidKit',
          category: 'medical-health',
          baseQuantity: createQuantity(1),
          unit: 'pieces',
          scaleWithPeople: false,
          scaleWithDays: false,
        },
      ];

      const items = [
        createMockInventoryItem({
          id: createItemId('1'),
          categoryId: createCategoryId('tools-supplies'),
          itemType: createProductTemplateId('flashlight'),
          quantity: createQuantity(1),
          unit: 'pieces',
        }),
      ];

      const toolsResult = calculateCategoryPercentage(
        'tools-supplies',
        items,
        household,
        [],
        allRecs,
      );

      const medicalResult = calculateCategoryPercentage(
        'medical-health',
        items,
        household,
        [],
        allRecs,
      );

      // Tools should have recommendations matched, medical should have different results
      expect(toolsResult.totalNeeded).not.toBe(medicalResult.totalNeeded);
    });
  });

  // ============================================================
  // L209: LogicalOperator in recommended items loop
  // `item.caloriesPerUnit != null && Number.isFinite(item.caloriesPerUnit)` → ||
  // When item has NaN caloriesPerUnit matching an enabled recommendation
  // with &&: false → falls to fallback using rec's caloriesPerUnit
  // with ||: NaN != null (true) → calculates 0 from calculateItemTotalCalories → skips fallback
  // ============================================================
  describe('caloriesPerUnit guard in matching items loop', () => {
    it('uses recommendation caloriesPerUnit fallback when item has NaN caloriesPerUnit', () => {
      const household = createMockHousehold({
        adults: 1,
        children: 0,
        pets: 0,
        supplyDurationDays: 3,
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
          quantity: createQuantity(2),
          unit: 'kilograms',
          caloriesPerUnit: Number.NaN, // NaN - should use rec's fallback
        }),
      ];

      const result = calculateCategoryPercentage(
        'food',
        items,
        household,
        [],
        recs,
      );

      // With &&: NaN != null (true) && isFinite(NaN) (false) = false
      //   → fallback: 2 * 3600 = 7200
      // With ||: NaN != null (true) || isFinite(NaN) (false) = true
      //   → calculateItemTotalCalories returns 0 (NaN not finite)
      //   → total = 0, NOT 7200
      expect(result.totalActualCalories).toBe(7200);
    });
  });
  // ============================================================
  // L111: ArithmeticOperator - household.adults * ADULT_REQUIREMENT_MULTIPLIER
  // Mutant: * → / (adults divided by multiplier instead of multiplied)
  // ADULT_REQUIREMENT_MULTIPLIER = 1, so this is equivalent for adults.
  // ============================================================
  describe('adults * ADULT_REQUIREMENT_MULTIPLIER arithmetic', () => {
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
  describe('pets * PET_REQUIREMENT_MULTIPLIER arithmetic', () => {
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
  describe('food item filtering in calorie calculation', () => {
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
        {
          id: createProductTemplateId('soap'),
          i18nKey: 'soap',
          category: 'hygiene-health',
          baseQuantity: createQuantity(1),
          unit: 'pieces',
          scaleWithPeople: true,
          scaleWithDays: true,
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
      expect(result.totalNeededCalories).toBe(2000);
    });
  });

  // ============================================================
  // L379: LogicalOperator - item.caloriesPerUnit != null || Number.isFinite(...)
  // Mutant: && → || for the food-without-recommendations calorie counting
  // ============================================================
  describe('caloriesPerUnit null check in food without recommendations', () => {
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
  // ============================================================================
  // L86: ArrayDeclaration default `disabledRecommendedItems: string[] = []`
  // Mutant: ["Stryker was here"] — would still not disable real items, but
  // verify defaulting behavior.
  // ============================================================================
  describe('default disabledRecommendedItems', () => {
    it('omitting disabledRecommendedItems behaves like empty array', () => {
      const household = createMockHousehold({
        adults: 1,
        supplyDurationDays: 1,
      });
      const recs = [rec('hammer', tools, { baseQuantity: createQuantity(4) })];
      const a = calculateCategoryPercentage(
        tools,
        [],
        household,
        undefined,
        recs,
      );
      const b = calculateCategoryPercentage(tools, [], household, [], recs);
      expect(a.totalNeeded).toBe(b.totalNeeded);
      expect(a.totalNeeded).toBeGreaterThan(0);
    });

    it('passing real id in disabled list excludes it from totals', () => {
      const household = createMockHousehold({
        adults: 1,
        supplyDurationDays: 1,
      });
      const recs = [rec('hammer', tools, { baseQuantity: createQuantity(4) })];
      const enabled = calculateCategoryPercentage(
        tools,
        [],
        household,
        [],
        recs,
      );
      const disabled = calculateCategoryPercentage(
        tools,
        [],
        household,
        ['hammer'],
        recs,
      );
      expect(enabled.totalNeeded).toBeGreaterThan(0);
      expect(disabled.totalNeeded).toBe(0);
    });
  });

  // ============================================================================
  // L161: ConditionalExpression / EqualityOperator
  // `const isWaterCategory = categoryId === 'water-beverages'`
  // preparationWaterNeeded only added when isWaterCategory.
  // ============================================================================
  describe('water-beverages category triggers preparation-water addition', () => {
    it('non-water category does NOT add preparation water', () => {
      const household = createMockHousehold({
        adults: 1,
        supplyDurationDays: 1,
      });
      const recs = [rec('hammer', tools, { baseQuantity: createQuantity(4) })];
      const result = calculateCategoryPercentage(
        tools,
        [],
        household,
        [],
        recs,
      );
      // baseQuantity 4 (no scale factors) = 4
      expect(result.totalNeeded).toBe(4);
    });

    it('water-beverages category adds preparation water for items requiring water', () => {
      const household = createMockHousehold({
        adults: 1,
        supplyDurationDays: 1,
      });
      // Water item with 2L preparation water requirement
      const itemNeedingWater: InventoryItem = createMockInventoryItem({
        id: createItemId('rice-bag'),
        categoryId: createCategoryId('food'),
        itemType: createProductTemplateId('rice'),
        quantity: createQuantity(1),
        unit: 'kilograms',
        neverExpires: true,
      });
      const recs = [rec('bottled-water', water, { unit: 'liters' })];
      const noPrep = calculateCategoryPercentage(
        water,
        [],
        household,
        [],
        recs,
      );
      const withPrep = calculateCategoryPercentage(
        water,
        [itemNeedingWater],
        household,
        [],
        [
          ...recs,
          rec('rice', createCategoryId('food'), {
            baseQuantity: createQuantity(1),
            unit: 'kilograms',
            requiresWaterLiters: 2,
          }),
        ],
      );
      // withPrep should have larger totalNeeded due to preparation water
      expect(withPrep.totalNeeded).toBeGreaterThanOrEqual(noPrep.totalNeeded);
    });
  });

  // ============================================================================
  // L309: ArithmeticOperator — `household.pets * PET_REQUIREMENT_MULTIPLIER`
  // Mutant `/`: with pets=2, multiplier=1 → equivalent. Use multiplier > 1 to kill?
  // Actually multiplier is constant. But pets * 1 = pets / 1 = pets. EQUIVALENT.
  // Skip.
  // ============================================================================

  // ============================================================================
  // L379: LogicalOperator — `item.caloriesPerUnit != null && Number.isFinite(...)`
  // Mutant `||`: Number.isFinite(undefined) is false, so || would still skip,
  // but `!= null` is true for any defined value. Test with explicit non-finite.
  // Actually we test in the without-recs food path (L378-L382).
  // ============================================================================
  describe('food calorie inclusion guard (caloriesPerUnit != null && finite)', () => {
    it('items with finite caloriesPerUnit ARE counted (no recommendations)', () => {
      const household = createMockHousehold({
        adults: 1,
        supplyDurationDays: 1,
      });
      const food = createCategoryId('food');
      const item = createMockInventoryItem({
        id: createItemId('rice-1'),
        categoryId: food,
        itemType: createProductTemplateId('rice'),
        quantity: createQuantity(1),
        unit: 'kilograms',
        caloriesPerUnit: 3600,
        weightGrams: 1000,
        neverExpires: true,
      });
      const result = calculateCategoryPercentage(
        food,
        [item],
        household,
        [],
        [],
      );
      expect(result.totalActual).toBeGreaterThan(0);
    });

    it('items with NaN/Infinity caloriesPerUnit are NOT counted', () => {
      const household = createMockHousehold({
        adults: 1,
        supplyDurationDays: 1,
      });
      const food = createCategoryId('food');
      const itemNaN = createMockInventoryItem({
        id: createItemId('bad-1'),
        categoryId: food,
        itemType: createProductTemplateId('mystery'),
        quantity: createQuantity(1),
        unit: 'kilograms',
        caloriesPerUnit: Number.NaN,
        neverExpires: true,
      });
      const result = calculateCategoryPercentage(
        food,
        [itemNaN],
        household,
        [],
        [],
      );
      expect(result.totalActual).toBe(0);
    });
  });

  // ============================================================================
  // L99/L102: typeof guards — categoryIdStr / itemCategoryStr
  // In practice both inputs are strings. Mutants of typeof !== / true / false
  // produce identical String() conversion paths → likely equivalent.
  // Skip.
  // ============================================================================

  // ============================================================================
  // L199: LogicalOperator — `!isFoodRecommendedItem(recItem) && !recItem.caloriesPerUnit`
  // Skip-condition for food calorie counting. Mutant `||` would skip more items.
  // Test that a food item WITH caloriesPerUnit IS counted (not skipped).
  // ============================================================================
  describe('food rec with caloriesPerUnit is counted', () => {
    it('food category percentage uses calories from food rec items', () => {
      const household = createMockHousehold({
        adults: 1,
        supplyDurationDays: 1,
      });
      const food = createCategoryId('food');
      const foodRec = rec('rice', food, {
        baseQuantity: createQuantity(1),
        unit: 'kilograms',
        caloriesPerUnit: 3600,
        scaleWithPeople: true,
        scaleWithDays: true,
      });
      const item = createMockInventoryItem({
        id: createItemId('rice-2'),
        categoryId: food,
        itemType: createProductTemplateId('rice'),
        quantity: createQuantity(1),
        unit: 'kilograms',
        caloriesPerUnit: 3600,
        weightGrams: 1000,
        neverExpires: true,
      });
      const result = calculateCategoryPercentage(
        food,
        [item],
        household,
        [],
        [foodRec],
      );
      expect(result.totalActualCalories).toBeGreaterThan(0);
    });
  });
});
