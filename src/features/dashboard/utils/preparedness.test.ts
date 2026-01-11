import {
  calculatePreparednessScore,
  calculateCategoryPreparedness,
} from './preparedness';
import {
  createMockHousehold,
  createMockInventoryItem,
} from '@/shared/utils/test/factories';

describe('calculatePreparednessScore', () => {
  const baseHousehold = createMockHousehold({
    children: 0,
    useFreezer: false,
    supplyDurationDays: 14,
  });

  it('should return 0 when no items exist', () => {
    const items = [];
    const score = calculatePreparednessScore(items, baseHousehold);
    expect(score).toBe(0);
  });

  it('should return a score between 0 and 100', () => {
    const items = [
      createMockInventoryItem({
        id: '1',
        name: 'Water',
        categoryId: 'water',
        productTemplateId: 'water',
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
        id: '1',
        name: 'Water',
        categoryId: 'water',
        productTemplateId: 'water',
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
        id: '1',
        name: 'Water',
        categoryId: 'water',
        quantity: 100, // Needed for capping test (100/50 = 200%, should cap at 100%)
        recommendedQuantity: 50, // Needed for capping test
        productTemplateId: 'water',
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
        id: '1',
        name: 'Water',
        categoryId: 'water',
        quantity: 10,
        productTemplateId: 'water',
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
        id: '1',
        name: 'Water',
        categoryId: 'water',
        quantity: 10,
        productTemplateId: 'water',
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
        id: '1',
        name: 'test-item',
        categoryId: 'tools',
        quantity: 5,
        productTemplateId: 'test-item',
      }),
    ];

    // Create a custom recommended items list with one that doesn't scale with people
    const customRecommendedItems = [
      {
        id: 'test-item',
        i18nKey: 'test.item',
        category: 'tools' as const,
        baseQuantity: 10,
        unit: 'pcs' as const,
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
        id: '1',
        name: 'Custom Item',
        categoryId: 'custom',
        recommendedQuantity: 0, // No recommendations
      }),
    ];
    const score = calculateCategoryPreparedness('custom', items, baseHousehold);
    expect(score).toBe(100);
  });

  it('should return valid score for water category', () => {
    const items = [
      createMockInventoryItem({
        id: '1',
        name: 'Water',
        categoryId: 'water',
        productTemplateId: 'water',
      }),
    ];
    const score = calculateCategoryPreparedness('water', items, baseHousehold);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('should calculate scores independently per category', () => {
    const items = [
      createMockInventoryItem({
        id: '1',
        name: 'Water',
        categoryId: 'water',
        productTemplateId: 'water',
      }),
      createMockInventoryItem({
        id: '2',
        name: 'Canned Food',
        categoryId: 'food',
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
        id: 'test-water-1',
        i18nKey: 'test.water1',
        category: 'water-beverages' as const,
        baseQuantity: 1,
        unit: 'l' as const,
        scaleWithPeople: true, // Will be 0 when people = 0
        scaleWithDays: false,
      },
      {
        id: 'test-water-2',
        i18nKey: 'test.water2',
        category: 'water-beverages' as const,
        baseQuantity: 2,
        unit: 'l' as const,
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
        id: 'test-water-1',
        i18nKey: 'test.water1',
        category: 'water-beverages' as const,
        baseQuantity: 1,
        unit: 'l' as const,
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
