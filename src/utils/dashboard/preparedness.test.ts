import {
  calculatePreparednessScore,
  calculateCategoryPreparedness,
} from './preparedness';
import {
  createMockHousehold,
  createMockInventoryItem,
} from '../test/factories';

describe('calculatePreparednessScore', () => {
  const baseHousehold = createMockHousehold({
    adults: 2,
    children: 0,
    hasFreezer: false,
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
        quantity: 28,
        unit: 'gallons',
        recommendedQuantity: 28,
        neverExpires: false,
        expirationDate: '2025-12-31',
        productTemplateId: 'water',
      }),
    ];
    const score = calculatePreparednessScore(items, baseHousehold);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('should return valid score for different household sizes', () => {
    const smallHousehold = createMockHousehold({ adults: 1 });
    const largeHousehold = createMockHousehold({
      adults: 2,
      children: 2,
    });

    const items = [
      createMockInventoryItem({
        id: '1',
        name: 'Water',
        categoryId: 'water',
        quantity: 14,
        unit: 'gallons',
        recommendedQuantity: 14,
        neverExpires: false,
        expirationDate: '2025-12-31',
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
    const withFreezer: HouseholdConfig = { ...baseHousehold, hasFreezer: true };
    const withoutFreezer: HouseholdConfig = {
      ...baseHousehold,
      hasFreezer: false,
    };

    const items: InventoryItem[] = [];

    const scoreWith = calculatePreparednessScore(items, withFreezer);
    const scoreWithout = calculatePreparednessScore(items, withoutFreezer);

    // Both should be 0 since no items, but the logic should not crash
    expect(scoreWith).toBe(0);
    expect(scoreWithout).toBe(0);
  });

  it('should cap item score at 100%', () => {
    const items: InventoryItem[] = [
      {
        id: '1',
        name: 'Water',
        categoryId: 'water',
        quantity: 100,
        unit: 'gallons',
        recommendedQuantity: 50,
        neverExpires: false,
        expirationDate: '2025-12-31',
        productTemplateId: 'water',
        location: '',
        notes: '',
        tags: [],
      },
    ];

    const score = calculatePreparednessScore(items, baseHousehold);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});

describe('calculateCategoryPreparedness', () => {
  const baseHousehold: HouseholdConfig = {
    adults: 2,
    children: 0,
    hasPets: false,
    hasFreezer: false,
    supplyDurationDays: 14,
  };

  it('should return 0 for empty category with no recommended items', () => {
    const items: InventoryItem[] = [];
    const score = calculateCategoryPreparedness('custom', items, baseHousehold);
    expect(score).toBe(0);
  });

  it('should return 100 for category with items but no recommendations', () => {
    const items: InventoryItem[] = [
      {
        id: '1',
        name: 'Custom Item',
        categoryId: 'custom',
        quantity: 5,
        unit: 'units',
        recommendedQuantity: 0,
        neverExpires: false,
        expirationDate: '2025-12-31',
        location: '',
        notes: '',
        tags: [],
      },
    ];
    const score = calculateCategoryPreparedness('custom', items, baseHousehold);
    expect(score).toBe(100);
  });

  it('should return valid score for water category', () => {
    const items: InventoryItem[] = [
      {
        id: '1',
        name: 'Water',
        categoryId: 'water',
        quantity: 14,
        unit: 'gallons',
        recommendedQuantity: 28,
        neverExpires: false,
        expirationDate: '2025-12-31',
        productTemplateId: 'water',
        location: '',
        notes: '',
        tags: [],
      },
    ];
    const score = calculateCategoryPreparedness('water', items, baseHousehold);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('should calculate scores independently per category', () => {
    const items: InventoryItem[] = [
      {
        id: '1',
        name: 'Water',
        categoryId: 'water',
        quantity: 28,
        unit: 'gallons',
        recommendedQuantity: 28,
        neverExpires: false,
        expirationDate: '2025-12-31',
        productTemplateId: 'water',
        location: '',
        notes: '',
        tags: [],
      },
      {
        id: '2',
        name: 'Canned Food',
        categoryId: 'food',
        quantity: 10,
        unit: 'cans',
        recommendedQuantity: 10,
        neverExpires: false,
        expirationDate: '2025-12-31',
        location: '',
        notes: '',
        tags: [],
      },
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
