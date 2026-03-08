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
  mockFoodRecommendedItems,
  mockWaterRecommendedItems,
  mockToolsRecommendedItems,
  mockCookingHeatRecommendedItems,
} from './__helpers__/categoryPercentage.helpers';

describe('calculateCategoryPercentage', () => {
  describe('mutation test: category filtering', () => {
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

  describe('mutation test: peopleMultiplier arithmetic', () => {
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

  describe('mutation test: water-beverages string literal', () => {
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

  describe('mutation test: isFoodRecommendedItem guard', () => {
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

  describe('mutation test: caloriesPerUnit validation', () => {
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

  describe('mutation test: uncounted items caloriesPerUnit check', () => {
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

  describe('mutation test: disabled recommendation matching', () => {
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

  describe('mutation test: totalNeededCalories > 0 boundary', () => {
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

  describe('mutation test: hasEnough boundary', () => {
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

  describe('mutation test: hasRecommendations boolean', () => {
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

  describe('mutation test: communication-info string literal', () => {
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

  describe('mutation test: scaleWithPets multiplication', () => {
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

  describe('mutation test: water-beverages && bottled-water compound condition', () => {
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

  describe('mutation test: reduce ArrowFunction', () => {
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

  describe('mutation test: hasEnough boundary for quantity category', () => {
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

  describe('mutation test: food without-recommendations caloriesPerUnit check', () => {
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

  describe('mutation test: water without-recommendations hasEnough boundary', () => {
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

  describe('mutation test: type guard branches', () => {
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

  describe('mutation test: disabled items includes check', () => {
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

  describe('mutation test: bottled-water dailyWater override', () => {
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

  describe('mutation test: options overrides', () => {
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

  describe('mutation test: markedAsEnough for item type counting', () => {
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
});
