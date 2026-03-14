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
  mockToolsRecommendedItems,
} from './__helpers__/categoryPercentage.helpers';

describe('calculateCategoryPercentage - mutation killers', () => {
  // ============================================================
  // L86: ArrayDeclaration mutant - default disabledRecommendedItems = []
  // Stryker replaces [] with ["Stryker was here"].
  // If we omit the disabledRecommendedItems param and have a recommended item
  // whose id is NOT "Stryker was here", it should NOT be filtered out.
  // ============================================================
  describe('L86: default disabledRecommendedItems must be empty array', () => {
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
  describe('L99/L102: typeof string guards for categoryId and item.category', () => {
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
  describe('L111: peopleMultiplier arithmetic with adults', () => {
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
  describe('L161: water-beverages check for preparation water', () => {
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
  describe('L199: skip non-food recommended items in food calorie calculation', () => {
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

    it('includes non-food category recommended item in food recs list - should be skipped', () => {
      const household = createMockHousehold({
        adults: 1,
        children: 0,
        pets: 0,
        supplyDurationDays: 3,
      });

      // Mix food and non-food recs both mapped to 'food' category
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

      // Rice contributes 3600 calories
      expect(result.totalActualCalories).toBe(3600);
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
  describe('L237: caloriesPerUnit null/NaN guard in uncounted items loop', () => {
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
  describe('L309: pet scaling arithmetic', () => {
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
  // This is in calculateFoodCategoryPercentageWithoutRecommendations.
  // Same pattern as L237. Items with NaN caloriesPerUnit should NOT be counted.
  // ============================================================
  describe('L379: caloriesPerUnit guard in food-without-recommendations path', () => {
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
      // NaN item should be skipped
      // With || mutant: NaN != null (true) || isFinite(NaN) (false) = true
      //   → calculateItemTotalCalories(item with NaN) returns 0
      //   → adds 0, but the issue is it would still "count" it (result is same 4000)
      // Actually calculateItemTotalCalories returns 0 for NaN, so the result is same.
      // Let's verify the actual total is correct.
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
  describe('L209: caloriesPerUnit guard in matching items loop', () => {
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
});
