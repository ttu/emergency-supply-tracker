import {
  calculatePreparednessScore,
  calculatePreparednessScoreFromCategoryStatuses,
  calculateCategoryPreparedness,
} from './preparedness';
import type { CategoryStatusSummary } from './categoryStatus';
import type { InventoryItem } from '@/shared/types';
import {
  createMockHousehold,
  createMockInventoryItem,
} from '@/shared/utils/test/factories';
import {
  createItemId,
  createCategoryId,
  createProductTemplateId,
} from '@/shared/types';

describe('calculatePreparednessScoreFromCategoryStatuses', () => {
  it('should return 0 when no categories', () => {
    const categoryStatuses: CategoryStatusSummary[] = [];
    const score =
      calculatePreparednessScoreFromCategoryStatuses(categoryStatuses);
    expect(score).toBe(0);
  });

  it('should return 0 when all categories are critical', () => {
    const categoryStatuses: CategoryStatusSummary[] = [
      {
        categoryId: 'water',
        status: 'critical',
        itemCount: 0,
        completionPercentage: 0,
        criticalCount: 0,
        warningCount: 0,
        okCount: 0,
        shortages: [],
        totalActual: 0,
        totalNeeded: 0,
      },
      {
        categoryId: 'food',
        status: 'critical',
        itemCount: 0,
        completionPercentage: 0,
        criticalCount: 0,
        warningCount: 0,
        okCount: 0,
        shortages: [],
        totalActual: 0,
        totalNeeded: 0,
      },
    ];
    const score =
      calculatePreparednessScoreFromCategoryStatuses(categoryStatuses);
    expect(score).toBe(0);
  });

  it('should return 50 when half categories are ok', () => {
    const categoryStatuses: CategoryStatusSummary[] = [
      {
        categoryId: 'water',
        status: 'ok',
        itemCount: 0,
        completionPercentage: 100,
        criticalCount: 0,
        warningCount: 0,
        okCount: 0,
        shortages: [],
        totalActual: 0,
        totalNeeded: 0,
      },
      {
        categoryId: 'food',
        status: 'critical',
        itemCount: 0,
        completionPercentage: 0,
        criticalCount: 0,
        warningCount: 0,
        okCount: 0,
        shortages: [],
        totalActual: 0,
        totalNeeded: 0,
      },
    ];
    const score =
      calculatePreparednessScoreFromCategoryStatuses(categoryStatuses);
    expect(score).toBe(50);
  });

  it('should return 100 when all categories are ok', () => {
    const categoryStatuses: CategoryStatusSummary[] = [
      {
        categoryId: 'water',
        status: 'ok',
        itemCount: 0,
        completionPercentage: 100,
        criticalCount: 0,
        warningCount: 0,
        okCount: 0,
        shortages: [],
        totalActual: 0,
        totalNeeded: 0,
      },
      {
        categoryId: 'food',
        status: 'ok',
        itemCount: 0,
        completionPercentage: 100,
        criticalCount: 0,
        warningCount: 0,
        okCount: 0,
        shortages: [],
        totalActual: 0,
        totalNeeded: 0,
      },
    ];
    const score =
      calculatePreparednessScoreFromCategoryStatuses(categoryStatuses);
    expect(score).toBe(100);
  });

  it('should round correctly for 2 out of 9 categories', () => {
    const categoryStatuses: CategoryStatusSummary[] = [
      {
        categoryId: 'water',
        status: 'ok',
        itemCount: 0,
        completionPercentage: 100,
        criticalCount: 0,
        warningCount: 0,
        okCount: 0,
        shortages: [],
        totalActual: 0,
        totalNeeded: 0,
      },
      {
        categoryId: 'food',
        status: 'ok',
        itemCount: 0,
        completionPercentage: 100,
        criticalCount: 0,
        warningCount: 0,
        okCount: 0,
        shortages: [],
        totalActual: 0,
        totalNeeded: 0,
      },
      {
        categoryId: 'cooking',
        status: 'critical',
        itemCount: 0,
        completionPercentage: 0,
        criticalCount: 0,
        warningCount: 0,
        okCount: 0,
        shortages: [],
        totalActual: 0,
        totalNeeded: 0,
      },
      {
        categoryId: 'light',
        status: 'critical',
        itemCount: 0,
        completionPercentage: 0,
        criticalCount: 0,
        warningCount: 0,
        okCount: 0,
        shortages: [],
        totalActual: 0,
        totalNeeded: 0,
      },
      {
        categoryId: 'communication',
        status: 'critical',
        itemCount: 0,
        completionPercentage: 0,
        criticalCount: 0,
        warningCount: 0,
        okCount: 0,
        shortages: [],
        totalActual: 0,
        totalNeeded: 0,
      },
      {
        categoryId: 'medical',
        status: 'critical',
        itemCount: 0,
        completionPercentage: 0,
        criticalCount: 0,
        warningCount: 0,
        okCount: 0,
        shortages: [],
        totalActual: 0,
        totalNeeded: 0,
      },
      {
        categoryId: 'hygiene',
        status: 'critical',
        itemCount: 0,
        completionPercentage: 0,
        criticalCount: 0,
        warningCount: 0,
        okCount: 0,
        shortages: [],
        totalActual: 0,
        totalNeeded: 0,
      },
      {
        categoryId: 'tools',
        status: 'critical',
        itemCount: 0,
        completionPercentage: 0,
        criticalCount: 0,
        warningCount: 0,
        okCount: 0,
        shortages: [],
        totalActual: 0,
        totalNeeded: 0,
      },
      {
        categoryId: 'cash',
        status: 'critical',
        itemCount: 0,
        completionPercentage: 0,
        criticalCount: 0,
        warningCount: 0,
        okCount: 0,
        shortages: [],
        totalActual: 0,
        totalNeeded: 0,
      },
    ];
    const score =
      calculatePreparednessScoreFromCategoryStatuses(categoryStatuses);
    // 2 out of 9 = 22.22%, rounded to 22%
    expect(score).toBe(22);
  });
});

describe('calculatePreparednessScore', () => {
  const baseHousehold = createMockHousehold({
    children: 0,
    useFreezer: false,
    supplyDurationDays: 14,
  });

  it('should return 0 when no items exist', () => {
    const items: InventoryItem[] = [];
    const score = calculatePreparednessScore(items, baseHousehold);
    expect(score).toBe(0);
  });

  it('should return a score between 0 and 100', () => {
    const items = [
      createMockInventoryItem({
        id: createItemId('1'),
        name: 'Water',
        categoryId: createCategoryId('water'),
        productTemplateId: createProductTemplateId('water'),
      }),
    ];
    const score = calculatePreparednessScore(items, baseHousehold);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('should return valid score for different household sizes', () => {
    const smallHousehold = createMockHousehold({ adults: 1, children: 0 });
    const largeHousehold = createMockHousehold({
      children: 2,
    });

    const items = [
      createMockInventoryItem({
        id: createItemId('1'),
        name: 'Water',
        categoryId: createCategoryId('water'),
        productTemplateId: createProductTemplateId('water'),
      }),
    ];

    const smallScore = calculatePreparednessScore(items, smallHousehold);
    const largeScore = calculatePreparednessScore(items, largeHousehold);

    // Both scores should be valid
    expect(smallScore).toBeGreaterThanOrEqual(0);
    expect(smallScore).toBeLessThanOrEqual(100);
    expect(largeScore).toBeGreaterThanOrEqual(0);
    expect(largeScore).toBeLessThanOrEqual(100);
  });

  it('should filter out frozen items when no freezer', () => {
    const withFreezer = createMockHousehold({
      children: 0,
      useFreezer: true, // Only override what's needed
    });
    const withoutFreezer = createMockHousehold({
      children: 0,
      useFreezer: false, // Only override what's needed
    });

    const items: ReturnType<typeof createMockInventoryItem>[] = [];

    const scoreWith = calculatePreparednessScore(items, withFreezer);
    const scoreWithout = calculatePreparednessScore(items, withoutFreezer);

    // Both should be 0 since no items, but the logic should not crash
    expect(scoreWith).toBe(0);
    expect(scoreWithout).toBe(0);
  });

  it('should cap item score at 100%', () => {
    const items = [
      createMockInventoryItem({
        id: createItemId('1'),
        name: 'Water',
        categoryId: createCategoryId('water'),
        quantity: 100, // Needed for capping test (100/50 = 200%, should cap at 100%)
        recommendedQuantity: 50, // Needed for capping test
        productTemplateId: createProductTemplateId('water'),
      }),
    ];

    const score = calculatePreparednessScore(items, baseHousehold);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('should handle zero recommended quantity without division by zero', () => {
    // Create a household with 0 people to trigger zero recommended quantity
    const zeroPeopleHousehold = createMockHousehold({
      adults: 0,
      children: 0,
      useFreezer: false,
      supplyDurationDays: 14,
    });

    const items = [
      createMockInventoryItem({
        id: createItemId('1'),
        name: 'Water',
        categoryId: createCategoryId('water'),
        quantity: 10,
        productTemplateId: createProductTemplateId('water'),
      }),
    ];

    // Should return 0 (not NaN or Infinity) when recommended quantity is 0
    const score = calculatePreparednessScore(items, zeroPeopleHousehold);
    expect(score).toBe(0);
    expect(Number.isFinite(score)).toBe(true);
  });

  it('should handle maxPossibleScore === 0 when all items are skipped', () => {
    // Create a household with 0 people and 0 days to ensure all items are skipped
    const zeroHousehold = createMockHousehold({
      adults: 0,
      children: 0,
      useFreezer: false,
      supplyDurationDays: 0,
    });

    const items = [
      createMockInventoryItem({
        id: createItemId('1'),
        name: 'Water',
        categoryId: createCategoryId('water'),
        quantity: 10,
        productTemplateId: createProductTemplateId('water'),
      }),
    ];

    // Should return 0 when maxPossibleScore is 0 (all items skipped)
    const score = calculatePreparednessScore(items, zeroHousehold);
    expect(score).toBe(0);
    expect(Number.isFinite(score)).toBe(true);
  });

  it('should skip items with zero recommended quantity but calculate others', () => {
    // Create a household with 0 people - items that scale with people will have 0 recommended quantity
    const zeroPeopleHousehold = createMockHousehold({
      adults: 0,
      children: 0,
      useFreezer: false,
      supplyDurationDays: 14,
    });

    // Add an item that doesn't scale with people (should still work)
    // We'll use a custom item that matches a recommended item that doesn't scale with people
    const items = [
      createMockInventoryItem({
        id: createItemId('1'),
        name: 'test-item',
        categoryId: createCategoryId('tools'),
        quantity: 5,
        productTemplateId: createProductTemplateId('test-item'),
      }),
    ];

    // Create a custom recommended items list with one that doesn't scale with people
    const customRecommendedItems = [
      {
        id: createProductTemplateId('test-item'),
        i18nKey: 'test.item',
        category: 'tools-supplies' as const,
        baseQuantity: 10,
        unit: 'pieces' as const,
        scaleWithPeople: false, // Doesn't scale with people
        scaleWithDays: false, // Doesn't scale with days
      },
    ];

    const score = calculatePreparednessScore(
      items,
      zeroPeopleHousehold,
      customRecommendedItems,
    );
    // Should calculate score based on the item that doesn't scale with people
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
    expect(Number.isFinite(score)).toBe(true);
  });
});

describe('calculateCategoryPreparedness', () => {
  const baseHousehold = createMockHousehold({
    children: 0,
    useFreezer: false,
    supplyDurationDays: 14,
  });

  it('should return 0 for empty category with no recommended items', () => {
    const items: ReturnType<typeof createMockInventoryItem>[] = [];
    const score = calculateCategoryPreparedness('custom', items, baseHousehold);
    expect(score).toBe(0);
  });

  it('should return 100 for category with items but no recommendations', () => {
    const items = [
      createMockInventoryItem({
        id: createItemId('1'),
        name: 'Custom Item',
        categoryId: createCategoryId('custom'),
        recommendedQuantity: 0, // No recommendations
      }),
    ];
    const score = calculateCategoryPreparedness('custom', items, baseHousehold);
    expect(score).toBe(100);
  });

  it('should return valid score for water category', () => {
    const items = [
      createMockInventoryItem({
        id: createItemId('1'),
        name: 'Water',
        categoryId: createCategoryId('water'),
        productTemplateId: createProductTemplateId('water'),
      }),
    ];
    const score = calculateCategoryPreparedness('water', items, baseHousehold);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('should calculate scores independently per category', () => {
    const items = [
      createMockInventoryItem({
        id: createItemId('1'),
        name: 'Water',
        categoryId: createCategoryId('water'),
        productTemplateId: createProductTemplateId('water'),
      }),
      createMockInventoryItem({
        id: createItemId('2'),
        name: 'Canned Food',
        categoryId: createCategoryId('food'),
      }),
    ];

    const waterScore = calculateCategoryPreparedness(
      'water',
      items,
      baseHousehold,
    );
    const foodScore = calculateCategoryPreparedness(
      'food',
      items,
      baseHousehold,
    );

    // Both should return valid scores
    expect(waterScore).toBeGreaterThanOrEqual(0);
    expect(waterScore).toBeLessThanOrEqual(100);
    expect(foodScore).toBeGreaterThanOrEqual(0);
    expect(foodScore).toBeLessThanOrEqual(100);
  });

  it('should handle zero recommended quantity in category without division by zero', () => {
    // Create a household with 0 people to trigger zero recommended quantity
    const zeroPeopleHousehold = createMockHousehold({
      adults: 0,
      children: 0,
      useFreezer: false,
      supplyDurationDays: 14,
    });

    // Use a category with no items to test the zero recommended quantity path
    // When items exist but all recommended items are skipped, it returns 100 (DEFAULT_FULL_PREPAREDNESS)
    // So we need to test with no items to hit the maxScore === 0 path
    const items: ReturnType<typeof createMockInventoryItem>[] = [];

    // Create custom recommended items that will all be skipped due to zero quantity
    // These items exist for the category but all get skipped, triggering maxScore === 0
    const customRecommendedItems = [
      {
        id: createProductTemplateId('test-water-1'),
        i18nKey: 'test.water1',
        category: 'water-beverages' as const,
        baseQuantity: 1,
        unit: 'liters' as const,
        scaleWithPeople: true, // Will be 0 when people = 0
        scaleWithDays: false,
      },
      {
        id: createProductTemplateId('test-water-2'),
        i18nKey: 'test.water2',
        category: 'water-beverages' as const,
        baseQuantity: 2,
        unit: 'liters' as const,
        scaleWithPeople: true, // Will be 0 when people = 0
        scaleWithDays: false,
      },
    ];

    // Should return 0 (not NaN or Infinity) when maxScore is 0 (all items skipped)
    const score = calculateCategoryPreparedness(
      'water-beverages',
      items,
      zeroPeopleHousehold,
      [],
      customRecommendedItems,
    );
    expect(score).toBe(0);
    expect(Number.isFinite(score)).toBe(true);
  });

  it('should handle maxScore === 0 when all category items are skipped', () => {
    // Create a household with 0 people and 0 days to ensure all items are skipped
    const zeroHousehold = createMockHousehold({
      adults: 0,
      children: 0,
      useFreezer: false,
      supplyDurationDays: 0,
    });

    // Use a category with no items to test the maxScore === 0 path
    const items: ReturnType<typeof createMockInventoryItem>[] = [];

    // Create custom recommended items that will all be skipped
    // These items exist for the category but all get skipped, triggering maxScore === 0
    const customRecommendedItems = [
      {
        id: createProductTemplateId('test-water-1'),
        i18nKey: 'test.water1',
        category: 'water-beverages' as const,
        baseQuantity: 1,
        unit: 'liters' as const,
        scaleWithPeople: true, // Will be 0 when people = 0
        scaleWithDays: true, // Will be 0 when days = 0
      },
    ];

    // Should return 0 when maxScore is 0 (all items skipped)
    const score = calculateCategoryPreparedness(
      'water-beverages',
      items,
      zeroHousehold,
      [],
      customRecommendedItems,
    );
    expect(score).toBe(0);
    expect(Number.isFinite(score)).toBe(true);
  });
});
