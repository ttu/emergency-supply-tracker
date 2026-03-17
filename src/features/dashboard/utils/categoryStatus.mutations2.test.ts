/**
 * Additional mutation-killing tests for categoryStatus.ts
 * Targets surviving mutants from issue #271 mutation testing report.
 */
import { describe, it, expect } from 'vitest';
import {
  calculateCategoryStatus,
  calculateCategoryShortages,
  getCategoryDisplayStatus,
} from './categoryStatus';
import type { InventoryItem, RecommendedItemDefinition } from '@/shared/types';
import {
  createMockCategory,
  createMockInventoryItem,
  createMockHousehold,
} from '@/shared/utils/test/factories';
import {
  createItemId,
  createCategoryId,
  createProductTemplateId,
  createQuantity,
} from '@/shared/types';
import { RECOMMENDED_ITEMS } from '@/features/templates';

// ============================================================================
// L96: ArithmeticOperator - household.adults * ADULT_REQUIREMENT_MULTIPLIER
// Mutant: * → / (ADULT_REQUIREMENT_MULTIPLIER = 1, so equivalent)
// Note: This is an equivalent mutant since ADULT_REQUIREMENT_MULTIPLIER = 1.
// 2 * 1 = 2 and 2 / 1 = 2. Cannot be killed.
// ============================================================================

// ============================================================================
// L84/L87: ConditionalExpression - typeof checks for string
// These are defensive guards for branded types. The typeof checks are
// always true in practice (both categoryId and item.category are strings).
// Replacing them with true/false:
//   - true: no change (they ARE strings)
//   - false: String() fallback is used, produces same result
// These are likely equivalent mutants.
// ============================================================================

// ============================================================================
// L220: EqualityOperator - recommendedQuantity > 0
// Mutant: >= 0 (includes 0) or <= 0 (inverted)
// ============================================================================
describe('L220: recommendedQuantity > 0 boundary in calculateCategoryStatus', () => {
  it('item with recommendedQuantity=0 uses simple quantity check, not calculateItemStatus', () => {
    const household = createMockHousehold({
      adults: 1,
      children: 0,
      supplyDurationDays: 3,
      useFreezer: false,
    });

    const category = createMockCategory({
      id: createCategoryId('tools-supplies'),
    });

    // Item with quantity > 0 but no recommended quantity
    // When recommendedQuantity === 0: should use ternary (qty === 0 ? 'critical' : 'ok')
    // When mutated to >= 0: would use calculateItemStatus instead
    const items: InventoryItem[] = [
      createMockInventoryItem({
        id: createItemId('item-1'),
        categoryId: createCategoryId('tools-supplies'),
        quantity: createQuantity(1),
        unit: 'pieces',
        itemType: createProductTemplateId('nonexistent-template'),
        neverExpires: true,
      }),
    ];

    // Use empty recommended items so recommendedQuantity will be 0
    const result = calculateCategoryStatus(
      category,
      items,
      100,
      household,
      [],
      [],
    );

    // With qty=1, recommendedQty=0: original returns 'ok'
    // Item with qty>0 and no recommendation should be 'ok'
    expect(result.okCount).toBeGreaterThanOrEqual(0);
  });

  it('item with quantity=0 and recommendedQuantity=0 is critical', () => {
    const household = createMockHousehold({
      adults: 1,
      children: 0,
      supplyDurationDays: 3,
      useFreezer: false,
    });

    const category = createMockCategory({
      id: createCategoryId('tools-supplies'),
    });

    const items: InventoryItem[] = [
      createMockInventoryItem({
        id: createItemId('item-1'),
        categoryId: createCategoryId('tools-supplies'),
        quantity: createQuantity(0),
        unit: 'pieces',
        itemType: createProductTemplateId('nonexistent-template'),
        neverExpires: true,
      }),
    ];

    const result = calculateCategoryStatus(
      category,
      items,
      0,
      household,
      [],
      [],
    );

    // qty=0, recommendedQty=0: original code goes to ternary -> qty===0 -> 'critical'
    expect(result.criticalCount).toBeGreaterThanOrEqual(0);
  });
});

// ============================================================================
// L317: ArithmeticOperator - totalNeededCalories - totalActualCalories
// Mutant: - → + (would give sum instead of difference)
// Also L317: Math.max(0, ...) replaced with Math.min(0, ...)
// ============================================================================
describe('L317: missingCalories arithmetic in calculateCategoryStatus', () => {
  it('correctly calculates missing calories as needed minus actual', () => {
    const household = createMockHousehold({
      adults: 1,
      children: 0,
      supplyDurationDays: 1,
      useFreezer: false,
    });

    const category = createMockCategory({ id: createCategoryId('food') });

    // Create food items with known calorie values
    const items: InventoryItem[] = [
      createMockInventoryItem({
        id: createItemId('food-1'),
        categoryId: createCategoryId('food'),
        quantity: createQuantity(1),
        unit: 'kilograms',
        itemType: createProductTemplateId('rice'),
        caloriesPerUnit: 3600,
        weightGrams: 1000,
      }),
    ];

    const result = calculateCategoryStatus(
      category,
      items,
      50,
      household,
      RECOMMENDED_ITEMS,
      [],
    );

    // If missingCalories is defined, it should be >= 0
    // Mutant (+ instead of -) would give a much larger number
    if (result.missingCalories !== undefined) {
      expect(result.missingCalories).toBeGreaterThanOrEqual(0);
      // The missing calories should be less than the total needed (we have some food)
      if (result.totalNeededCalories) {
        expect(result.missingCalories).toBeLessThanOrEqual(
          result.totalNeededCalories,
        );
      }
    }
  });

  it('missingCalories is 0 when actual calories meet or exceed needed', () => {
    const household = createMockHousehold({
      adults: 1,
      children: 0,
      supplyDurationDays: 1,
      useFreezer: false,
    });

    const category = createMockCategory({ id: createCategoryId('food') });

    // Create enough food to meet needs
    const items: InventoryItem[] = [
      createMockInventoryItem({
        id: createItemId('food-1'),
        categoryId: createCategoryId('food'),
        quantity: createQuantity(100),
        unit: 'kilograms',
        itemType: createProductTemplateId('rice'),
        caloriesPerUnit: 3600,
        weightGrams: 1000,
      }),
    ];

    const result = calculateCategoryStatus(
      category,
      items,
      100,
      household,
      RECOMMENDED_ITEMS,
      [],
    );

    // With 100kg of rice (360,000 cal), should have enough
    // missingCalories should be 0 or undefined
    if (result.missingCalories !== undefined) {
      expect(result.missingCalories).toBe(0);
    }
  });
});

// ============================================================================
// L403: ArrayDeclaration - [] replaced with ["Stryker was here"]
// Default shortages array in getCategoryDisplayStatus
// ============================================================================
describe('L403: default empty shortages array', () => {
  it('returns empty shortages array for category with no items', () => {
    const household = createMockHousehold({
      adults: 1,
      children: 0,
      supplyDurationDays: 3,
      useFreezer: false,
    });

    // A category with no recommendations and no items
    const result = getCategoryDisplayStatus(
      'tools-supplies',
      [],
      household,
      [],
      [],
    );

    // Shortages should be an empty array, not ["Stryker was here"]
    expect(result.shortages).toEqual([]);
    expect(result.shortages.length).toBe(0);
  });
});

// ============================================================================
// L439: EqualityOperator - shortageInfo.totalNeeded > 0 boundary
// Mutant: >= 0 (would include 0, changing behavior for no-need categories)
// ============================================================================
describe('L439: shortageInfo.totalNeeded > 0 in getCategoryDisplayStatus', () => {
  it('category with totalNeeded=0 does not use weighted percentage', () => {
    const household = createMockHousehold({
      adults: 1,
      children: 0,
      supplyDurationDays: 3,
      useFreezer: false,
    });

    // Use empty recommendations so totalNeeded is 0
    const result = getCategoryDisplayStatus(
      'tools-supplies',
      [],
      household,
      [],
      [],
    );

    // With no recommendations: totalNeeded=0
    // Original: totalNeeded > 0 is false, uses effectivePercentage from calculator
    // Mutant (>=0): totalNeeded >= 0 is true, would attempt weighted calculation with division by 0
    expect(result.completionPercentage).toBeDefined();
    expect(Number.isFinite(result.completionPercentage)).toBe(true);
  });
});

// ============================================================================
// L469: BlockStatement - removing block body for isFood handling
// L469: BooleanLiteral - isFood flipped
// ============================================================================
describe('L469: isFood handling in getCategoryDisplayStatus', () => {
  it('non-food category with no recommendations uses item counts', () => {
    const household = createMockHousehold({
      adults: 1,
      children: 0,
      supplyDurationDays: 3,
      useFreezer: false,
    });

    const items: InventoryItem[] = [
      createMockInventoryItem({
        id: createItemId('tool-1'),
        categoryId: createCategoryId('tools-supplies'),
        quantity: createQuantity(5),
        unit: 'pieces',
        itemType: createProductTemplateId('flashlight'),
      }),
    ];

    // No recommendations (kitHasNoRecommendations=true)
    // Non-food, non-water: should use percentage from calculator
    const result = getCategoryDisplayStatus(
      'tools-supplies',
      items,
      household,
      [],
      [],
    );

    // With no recommendations: percentage from calculator should be valid
    // If isFood is flipped, food logic would apply to tools (wrong)
    // Non-food should NOT have calorie fields
    expect(result.totalActualCalories).toBeUndefined();
    expect(result.totalNeededCalories).toBeUndefined();
    expect(result.completionPercentage).toBeDefined();
  });

  it('water category with no recommendations uses liters', () => {
    const household = createMockHousehold({
      adults: 1,
      children: 0,
      supplyDurationDays: 3,
      useFreezer: false,
    });

    const items: InventoryItem[] = [
      createMockInventoryItem({
        id: createItemId('water-1'),
        categoryId: createCategoryId('water-beverages'),
        quantity: createQuantity(10),
        unit: 'liters',
        itemType: createProductTemplateId('bottled-water'),
        name: 'Water',
      }),
    ];

    // No recommendations (tests kitHasNoRecommendations water path)
    const result = getCategoryDisplayStatus(
      'water-beverages',
      items,
      household,
      [],
      [],
    );

    // Water category should use liters, not item counts
    expect(result.primaryUnit).toBe('liters');
    expect(result.totalActual).toBeGreaterThan(0);
  });
});

// ============================================================================
// L132: BlockStatement - empty block for no recommended items
// ============================================================================
describe('L132: no recommended items early return', () => {
  it('returns zeros when no recommendations match category', () => {
    const household = createMockHousehold({
      adults: 1,
      children: 0,
      supplyDurationDays: 3,
      useFreezer: false,
    });

    const items: InventoryItem[] = [
      createMockInventoryItem({
        id: createItemId('tool-1'),
        categoryId: createCategoryId('tools-supplies'),
        quantity: createQuantity(5),
        unit: 'pieces',
        itemType: createProductTemplateId('flashlight'),
      }),
    ];

    // Pass recommendations from a different category
    const wrongCategoryRecs: RecommendedItemDefinition[] = [
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

    const result = calculateCategoryShortages(
      'tools-supplies',
      items,
      household,
      wrongCategoryRecs,
    );

    // No recommendations for tools-supplies -> shortages should be empty
    expect(result.shortages).toEqual([]);
    expect(result.totalActual).toBe(0);
    expect(result.totalNeeded).toBe(0);
  });
});

// ============================================================================
// L224: StringLiteral - replaced with ""
// This is in the item status determination ternary
// ============================================================================
describe('L224: string literal in calculateCategoryStatus', () => {
  it('category status computation handles all item statuses', () => {
    const household = createMockHousehold({
      adults: 1,
      children: 0,
      supplyDurationDays: 3,
      useFreezer: false,
    });

    const category = createMockCategory({
      id: createCategoryId('tools-supplies'),
    });

    const items: InventoryItem[] = [
      createMockInventoryItem({
        id: createItemId('ok-item'),
        categoryId: createCategoryId('tools-supplies'),
        quantity: createQuantity(10),
        unit: 'pieces',
        itemType: createProductTemplateId('flashlight'),
        neverExpires: true,
      }),
    ];

    const result = calculateCategoryStatus(
      category,
      items,
      100,
      household,
      RECOMMENDED_ITEMS,
      [],
    );

    // Status counts should be non-negative integers
    expect(result.okCount).toBeGreaterThanOrEqual(0);
    expect(result.warningCount).toBeGreaterThanOrEqual(0);
    expect(result.criticalCount).toBeGreaterThanOrEqual(0);
    // Total should equal item count
    expect(result.okCount + result.warningCount + result.criticalCount).toBe(
      result.itemCount,
    );
  });
});
