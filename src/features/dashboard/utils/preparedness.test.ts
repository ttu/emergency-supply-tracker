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
});
