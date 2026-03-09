import { calculateCategoryPreparedness } from './preparedness';
import {
  createMockHousehold,
  createMockInventoryItem,
} from '@/shared/utils/test/factories';
import { RECOMMENDED_ITEMS } from '@/features/templates';
import {
  createItemId,
  createCategoryId,
  createProductTemplateId,
  createQuantity,
} from '@/shared/types';

describe('calculateCategoryPreparedness', () => {
  const baseHousehold = createMockHousehold({
    children: 0,
    useFreezer: false,
    supplyDurationDays: 14,
  });

  it('should return 0 for empty category with no recommended items', () => {
    const items: ReturnType<typeof createMockInventoryItem>[] = [];
    const score = calculateCategoryPreparedness(
      'custom',
      items,
      baseHousehold,
      RECOMMENDED_ITEMS,
      [],
    );
    expect(score).toBe(0);
  });

  it('should return 100 for category with items but no recommendations', () => {
    const items = [
      createMockInventoryItem({
        id: createItemId('1'),
        name: 'Custom Item',
        categoryId: createCategoryId('custom'),
        // No recommendations
      }),
    ];
    const score = calculateCategoryPreparedness(
      'custom',
      items,
      baseHousehold,
      RECOMMENDED_ITEMS,
      [],
    );
    expect(score).toBe(100);
  });

  it('should return valid score for water category', () => {
    const items = [
      createMockInventoryItem({
        id: createItemId('1'),
        name: 'Water',
        categoryId: createCategoryId('water'),
        itemType: createProductTemplateId('water'),
      }),
    ];
    const score = calculateCategoryPreparedness(
      'water',
      items,
      baseHousehold,
      RECOMMENDED_ITEMS,
      [],
    );
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('should calculate scores independently per category', () => {
    const items = [
      createMockInventoryItem({
        id: createItemId('1'),
        name: 'Water',
        categoryId: createCategoryId('water'),
        itemType: createProductTemplateId('water'),
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
      RECOMMENDED_ITEMS,
      [],
    );
    const foodScore = calculateCategoryPreparedness(
      'food',
      items,
      baseHousehold,
      RECOMMENDED_ITEMS,
      [],
    );

    // Both should return valid scores
    expect(waterScore).toBeGreaterThanOrEqual(0);
    expect(waterScore).toBeLessThanOrEqual(100);
    expect(foodScore).toBeGreaterThanOrEqual(0);
    expect(foodScore).toBeLessThanOrEqual(100);
  });

  it('should only include items matching the category (not other categories)', () => {
    const items = [
      createMockInventoryItem({
        id: createItemId('1'),
        name: 'Radio',
        categoryId: createCategoryId('communication-info'),
        itemType: createProductTemplateId('battery-radio'),
        quantity: createQuantity(1),
      }),
      createMockInventoryItem({
        id: createItemId('2'),
        name: 'Water',
        categoryId: createCategoryId('water-beverages'),
        itemType: createProductTemplateId('water'),
        quantity: createQuantity(99),
      }),
    ];
    const customRecommendedItems = [
      {
        id: createProductTemplateId('battery-radio'),
        i18nKey: 'products.battery-radio',
        category: 'communication-info' as const,
        baseQuantity: createQuantity(1),
        unit: 'pieces' as const,
        scaleWithPeople: false,
        scaleWithDays: false,
      },
    ];
    // Only communication-info items should be counted
    const score = calculateCategoryPreparedness(
      'communication-info',
      items,
      baseHousehold,
      customRecommendedItems,
      [],
    );
    expect(score).toBe(100);
  });

  it('should use options.childrenMultiplier when provided', () => {
    const household = createMockHousehold({
      adults: 1,
      children: 1,
      useFreezer: false,
      supplyDurationDays: 1,
    });
    const items = [
      createMockInventoryItem({
        id: createItemId('1'),
        categoryId: createCategoryId('communication-info'),
        itemType: createProductTemplateId('battery-radio'),
        quantity: createQuantity(2),
      }),
    ];
    const customRecommendedItems = [
      {
        id: createProductTemplateId('battery-radio'),
        i18nKey: 'products.battery-radio',
        category: 'communication-info' as const,
        baseQuantity: createQuantity(1),
        unit: 'pieces' as const,
        scaleWithPeople: true,
        scaleWithDays: false,
      },
    ];
    // With default children multiplier (0.75), need 1*1 + 1*0.75 = 1.75, ceil = 2
    const score = calculateCategoryPreparedness(
      'communication-info',
      items,
      household,
      customRecommendedItems,
      [],
      { childrenMultiplier: 0.75 },
    );
    expect(score).toBe(100);
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
        baseQuantity: createQuantity(1),
        unit: 'liters' as const,
        scaleWithPeople: true, // Will be 0 when people = 0
        scaleWithDays: false,
      },
      {
        id: createProductTemplateId('test-water-2'),
        i18nKey: 'test.water2',
        category: 'water-beverages' as const,
        baseQuantity: createQuantity(2),
        unit: 'liters' as const,
        scaleWithPeople: true, // Will be 0 when people = 0
        scaleWithDays: false,
      },
    ];

    // When all recommended quantities are 0 (0 people), totalNeeded is 0
    // Unified calculator returns 100% when totalNeeded is 0 (no requirements = fully prepared)
    // But we cap at 100 for preparedness score
    const score = calculateCategoryPreparedness(
      'water-beverages',
      items,
      zeroPeopleHousehold,
      customRecommendedItems,
      [],
    );
    expect(score).toBe(100); // No requirements = 100% prepared
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
        baseQuantity: createQuantity(1),
        unit: 'liters' as const,
        scaleWithPeople: true, // Will be 0 when people = 0
        scaleWithDays: true, // Will be 0 when days = 0
      },
    ];

    // When all recommended quantities are 0 (0 people, 0 days), totalNeeded is 0
    // Unified calculator returns 100% when totalNeeded is 0 (no requirements = fully prepared)
    // But we cap at 100 for preparedness score
    const score = calculateCategoryPreparedness(
      'water-beverages',
      items,
      zeroHousehold,
      customRecommendedItems,
      [],
    );
    expect(score).toBe(100); // No requirements = 100% prepared
    expect(Number.isFinite(score)).toBe(true);
  });

  it('should exclude disabled recommended items from calculation', () => {
    const items = [
      createMockInventoryItem({
        id: createItemId('1'),
        name: 'Radio',
        categoryId: createCategoryId('communication-info'),
        itemType: createProductTemplateId('battery-radio'),
        quantity: createQuantity(1),
      }),
    ];
    const customRecommendedItems = [
      {
        id: createProductTemplateId('battery-radio'),
        i18nKey: 'products.battery-radio',
        category: 'communication-info' as const,
        baseQuantity: createQuantity(1),
        unit: 'pieces' as const,
        scaleWithPeople: false,
        scaleWithDays: false,
      },
      {
        id: createProductTemplateId('hand-crank-radio'),
        i18nKey: 'products.hand-crank-radio',
        category: 'communication-info' as const,
        baseQuantity: createQuantity(1),
        unit: 'pieces' as const,
        scaleWithPeople: false,
        scaleWithDays: false,
      },
    ];
    // Disable one item - score should be 100% (1/1 matched)
    const scoreWithDisabled = calculateCategoryPreparedness(
      'communication-info',
      items,
      baseHousehold,
      customRecommendedItems,
      ['hand-crank-radio'],
    );
    expect(scoreWithDisabled).toBe(100);

    // Without disabling - score should be 50% (1/2 matched)
    const scoreWithoutDisabled = calculateCategoryPreparedness(
      'communication-info',
      items,
      baseHousehold,
      customRecommendedItems,
      [],
    );
    expect(scoreWithoutDisabled).toBeLessThan(100);
  });

  it('should cap result at 100 even when overstocked', () => {
    const items = [
      createMockInventoryItem({
        id: createItemId('1'),
        name: 'Radio',
        categoryId: createCategoryId('communication-info'),
        itemType: createProductTemplateId('battery-radio'),
        quantity: createQuantity(99),
      }),
    ];
    const customRecommendedItems = [
      {
        id: createProductTemplateId('battery-radio'),
        i18nKey: 'products.battery-radio',
        category: 'communication-info' as const,
        baseQuantity: createQuantity(1),
        unit: 'pieces' as const,
        scaleWithPeople: false,
        scaleWithDays: false,
      },
    ];
    const score = calculateCategoryPreparedness(
      'communication-info',
      items,
      baseHousehold,
      customRecommendedItems,
      [],
    );
    expect(score).toBe(100);
  });

  it('should show very low preparedness score when only one item from one category exists', () => {
    // Bug reproduction: user reported 10% score with just 1 aluminum foil
    // Expected: score should be much lower (0%) since no category is fully prepared
    const household = createMockHousehold({
      adults: 2,
      children: 0,
      pets: 0,
      supplyDurationDays: 3,
      useFreezer: true,
    });

    // Create just one aluminum foil item (tools-supplies category has 11 recommended items)
    const items = [
      createMockInventoryItem({
        id: createItemId('test-aluminum-foil-1'),
        categoryId: createCategoryId('tools-supplies'),
        itemType: createProductTemplateId('aluminum-foil'),
        name: 'Aluminum Foil',
        quantity: createQuantity(1),
        unit: 'rolls',
      }),
    ];

    // Calculate preparedness for tools-supplies category
    // Aluminum foil requires 1 roll, user has 1 roll, but it's only 1 out of 11 items
    const toolsPreparedness = calculateCategoryPreparedness(
      'tools-supplies',
      items,
      household,
      RECOMMENDED_ITEMS,
      [],
    );

    // Having 1 out of 11 recommended items should give ~9% preparedness
    // This should NOT be enough to mark the category as "ok"
    expect(toolsPreparedness).toBeLessThan(30); // Below critical threshold
  });
});
