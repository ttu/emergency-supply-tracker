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
import {
  CRITICAL_PERCENTAGE_THRESHOLD,
  WARNING_PERCENTAGE_THRESHOLD,
} from '@/shared/utils/constants';

const tools = createCategoryId('tools-supplies');
const otherCat = createCategoryId('first-aid');

function makeRec(
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

// ===========================================================================
// item filtering by categoryId — cross-category isolation
// ===========================================================================
describe('item filtering by categoryId', () => {
  it('only items in the requested category contribute to its shortages', () => {
    const household = createMockHousehold({
      adults: 1,
      children: 0,
      supplyDurationDays: 1,
      useFreezer: false,
    });
    const items: InventoryItem[] = [
      createMockInventoryItem({
        id: createItemId('a'),
        categoryId: tools,
        itemType: createProductTemplateId('hammer'),
        quantity: createQuantity(1),
        unit: 'pieces',
        neverExpires: true,
      }),
      createMockInventoryItem({
        id: createItemId('b'),
        categoryId: otherCat,
        itemType: createProductTemplateId('hammer'),
        quantity: createQuantity(99),
        unit: 'pieces',
        neverExpires: true,
      }),
    ];
    const recs: RecommendedItemDefinition[] = [
      makeRec('hammer', tools, { baseQuantity: createQuantity(10) }),
    ];

    const result = calculateCategoryShortages(tools, items, household, recs);

    expect(result.totalActual).toBe(1);
    expect(result.totalNeeded).toBe(10);
  });

  it('only includes items belonging to the specified category in itemCount', () => {
    const household = createMockHousehold({
      adults: 2,
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
      }),
      createMockInventoryItem({
        id: createItemId('food-1'),
        categoryId: createCategoryId('food'),
        quantity: createQuantity(5),
        unit: 'kilograms',
        itemType: createProductTemplateId('rice'),
        caloriesPerUnit: 3600,
      }),
    ];

    const waterCategory = createMockCategory({
      id: createCategoryId('water-beverages'),
      name: 'Water',
      icon: 'W',
    });

    const result = calculateCategoryStatus(
      waterCategory,
      items,
      50,
      household,
      RECOMMENDED_ITEMS,
      [],
    );

    expect(result.itemCount).toBe(1);
  });
});

// ===========================================================================
// recommended-item lookup by category string
// ===========================================================================
describe('recommended-item lookup by category', () => {
  it('returns the right number of shortages for a known category', () => {
    const household = createMockHousehold({
      adults: 1,
      children: 0,
      supplyDurationDays: 3,
      useFreezer: false,
    });

    const result = calculateCategoryShortages(
      'water-beverages',
      [],
      household,
      RECOMMENDED_ITEMS,
      [],
    );

    expect(result.shortages.length).toBe(3);
    expect(result.shortages.map((s) => s.itemId)).toEqual(
      expect.arrayContaining([
        'bottled-water',
        'long-life-milk',
        'long-life-juice',
      ]),
    );
  });

  it('does not include recommended items from other categories', () => {
    const household = createMockHousehold({
      adults: 1,
      children: 0,
      supplyDurationDays: 3,
      useFreezer: false,
    });

    const result = calculateCategoryShortages(
      'communication-info',
      [],
      household,
      RECOMMENDED_ITEMS,
      [],
    );

    expect(result.shortages.length).toBe(2);
    result.shortages.forEach((s) => {
      expect(['battery-radio', 'hand-crank-radio']).toContain(s.itemId);
    });
  });

  it('matches recommended items by category string regardless of typeof branch', () => {
    const household = createMockHousehold({
      adults: 2,
      children: 0,
      supplyDurationDays: 3,
      useFreezer: false,
    });
    const customRec: RecommendedItemDefinition[] = [
      {
        id: createProductTemplateId('test-item-1'),
        i18nKey: 'test.item1',
        category: 'test-cat' as const,
        baseQuantity: createQuantity(1),
        unit: 'pieces' as const,
        scaleWithPeople: false,
        scaleWithDays: false,
      },
      {
        id: createProductTemplateId('test-item-2'),
        i18nKey: 'test.item2',
        category: 'other-cat' as const,
        baseQuantity: createQuantity(1),
        unit: 'pieces' as const,
        scaleWithPeople: false,
        scaleWithDays: false,
      },
    ];

    const result = calculateCategoryShortages(
      'test-cat',
      [],
      household,
      customRec,
      [],
    );

    expect(result.shortages).toHaveLength(1);
    expect(result.shortages[0].itemId).toBe('test-item-1');
  });
});

// ===========================================================================
// peopleMultiplier arithmetic — children multiplier override
// ===========================================================================
describe('peopleMultiplier arithmetic', () => {
  it('applies multiplication for adults+children with custom childrenMultiplier', () => {
    const household = createMockHousehold({
      adults: 2,
      children: 2,
      supplyDurationDays: 1,
      useFreezer: false,
    });

    const customRecommendedItems: RecommendedItemDefinition[] = [
      {
        id: createProductTemplateId('test-item'),
        i18nKey: 'test.item',
        category: 'tools-supplies' as const,
        baseQuantity: createQuantity(1),
        unit: 'pieces' as const,
        scaleWithPeople: true,
        scaleWithDays: false,
      },
    ];

    // peopleMultiplier = 2*1.0 + 2*0.5 = 3.0; totalNeeded = ceil(1*3) = 3
    const result = calculateCategoryShortages(
      'tools-supplies',
      [],
      household,
      customRecommendedItems,
      [],
      { childrenMultiplier: 0.5 },
    );

    expect(result.totalNeeded).toBe(3);
  });
});

// ===========================================================================
// disabledRecommendedItems default behavior
// ===========================================================================
describe('disabledRecommendedItems default behavior', () => {
  it('omitting disabledRecommendedItems is equivalent to passing []', () => {
    const household = createMockHousehold({ adults: 1, supplyDurationDays: 1 });
    const items: InventoryItem[] = [];
    const recs = [makeRec('rope', tools, { baseQuantity: createQuantity(3) })];
    const a = calculateCategoryShortages(tools, items, household, recs);
    const b = calculateCategoryShortages(tools, items, household, recs, []);
    expect(a.totalNeeded).toBe(b.totalNeeded);
  });

  it('passing the recommendation id as disabled removes it', () => {
    const household = createMockHousehold({ adults: 1, supplyDurationDays: 1 });
    const recs = [makeRec('rope', tools, { baseQuantity: createQuantity(3) })];
    const enabled = calculateCategoryShortages(tools, [], household, recs, []);
    const disabled = calculateCategoryShortages(tools, [], household, recs, [
      'rope',
    ]);
    expect(enabled.totalNeeded).toBeGreaterThan(0);
    expect(disabled.totalNeeded).toBe(0);
  });

  it('getCategoryDisplayStatus default disabled list does not disable any items', () => {
    const household = createMockHousehold({
      adults: 1,
      children: 0,
      supplyDurationDays: 3,
      useFreezer: false,
    });

    const result = getCategoryDisplayStatus(
      'water-beverages',
      [],
      household,
      RECOMMENDED_ITEMS,
    );

    expect(result.shortages.length).toBe(3);
  });
});

// ===========================================================================
// empty-recommendations early return shape
// ===========================================================================
describe('empty-recommendations early return shape', () => {
  it('returns empty shortages and zero totals for unknown category', () => {
    const household = createMockHousehold({
      adults: 1,
      children: 0,
      supplyDurationDays: 3,
      useFreezer: false,
    });

    const result = calculateCategoryShortages(
      'nonexistent-category',
      [],
      household,
      RECOMMENDED_ITEMS,
      [],
    );

    expect(result.shortages).toEqual([]);
    expect(result.totalActual).toBe(0);
    expect(result.totalNeeded).toBe(0);
    expect(result.primaryUnit).toBeUndefined();
  });

  it('returns zeros when all recommended items are disabled', () => {
    const household = createMockHousehold({
      adults: 1,
      children: 0,
      supplyDurationDays: 3,
      useFreezer: false,
    });

    const result = calculateCategoryShortages(
      'water-beverages',
      [],
      household,
      RECOMMENDED_ITEMS,
      ['bottled-water', 'long-life-milk', 'long-life-juice'],
    );

    expect(result.shortages).toEqual([]);
    expect(result.totalActual).toBe(0);
    expect(result.totalNeeded).toBe(0);
    expect(result.primaryUnit).toBeUndefined();
  });

  it('returns empty shortages when no recommendations match the category', () => {
    const household = createMockHousehold({ adults: 1, supplyDurationDays: 1 });
    const items: InventoryItem[] = [
      createMockInventoryItem({
        id: createItemId('x'),
        categoryId: tools,
        itemType: createProductTemplateId('any'),
        quantity: createQuantity(5),
        unit: 'pieces',
        neverExpires: true,
      }),
    ];
    const recs = [makeRec('bandage', otherCat)];
    const result = calculateCategoryShortages(tools, items, household, recs);
    expect(result.shortages).toEqual([]);
    expect(result.totalActual).toBe(0);
    expect(result.totalNeeded).toBe(0);
    expect(result.primaryUnit).toBeUndefined();
  });
});

// ===========================================================================
// per-item status when recommendedQuantity is 0
// ===========================================================================
describe('per-item status when recommendedQuantity is 0', () => {
  const household = createMockHousehold({
    adults: 2,
    children: 0,
    supplyDurationDays: 3,
    useFreezer: false,
  });

  it('treats item with recommendedQuantity=0 and quantity=0 as critical', () => {
    const customCategory = createMockCategory({
      id: createCategoryId('custom-cat'),
      name: 'Custom',
      icon: 'C',
    });

    const items: InventoryItem[] = [
      createMockInventoryItem({
        id: createItemId('1'),
        categoryId: createCategoryId('custom-cat'),
        quantity: createQuantity(0),
        itemType: 'custom',
      }),
    ];

    const result = calculateCategoryStatus(
      customCategory,
      items,
      0,
      household,
      [],
      [],
    );

    expect(result.criticalCount).toBe(1);
    expect(result.okCount).toBe(0);
  });

  it('treats item with recommendedQuantity=0 and quantity>0 as ok', () => {
    const customCategory = createMockCategory({
      id: createCategoryId('custom-cat'),
      name: 'Custom',
      icon: 'C',
    });

    const items: InventoryItem[] = [
      createMockInventoryItem({
        id: createItemId('1'),
        categoryId: createCategoryId('custom-cat'),
        quantity: createQuantity(3),
        itemType: 'custom',
      }),
    ];

    const result = calculateCategoryStatus(
      customCategory,
      items,
      100,
      household,
      [],
      [],
    );

    expect(result.criticalCount).toBe(0);
    expect(result.okCount).toBe(1);
  });

  it('uses calculateItemStatus when recommendedQuantity > 0', () => {
    const waterCategory = createMockCategory({
      id: createCategoryId('water-beverages'),
      name: 'Water',
      icon: 'W',
    });

    const items: InventoryItem[] = [
      createMockInventoryItem({
        id: createItemId('1'),
        categoryId: createCategoryId('water-beverages'),
        quantity: createQuantity(0),
        unit: 'liters',
        itemType: createProductTemplateId('bottled-water'),
        neverExpires: true,
      }),
    ];

    const result = calculateCategoryStatus(
      waterCategory,
      items,
      0,
      household,
      RECOMMENDED_ITEMS,
      [],
    );

    expect(result.criticalCount).toBe(1);
  });

  it('returns the literal "ok" status (not empty string) for qty>0 with no recommendation', () => {
    const customCategory = createMockCategory({
      id: createCategoryId('custom-cat'),
      name: 'Custom',
      icon: 'C',
    });

    const items: InventoryItem[] = [
      createMockInventoryItem({
        id: createItemId('1'),
        categoryId: createCategoryId('custom-cat'),
        quantity: createQuantity(5),
        itemType: 'custom',
      }),
    ];

    const result = calculateCategoryStatus(
      customCategory,
      items,
      100,
      household,
      [],
      [],
    );

    expect(result.okCount).toBe(1);
    expect(result.criticalCount).toBe(0);
    expect(result.warningCount).toBe(0);
  });
});

// ===========================================================================
// status-from-percentage threshold boundaries
// ===========================================================================
describe('status threshold boundaries', () => {
  const household = createMockHousehold({
    adults: 2,
    children: 0,
    supplyDurationDays: 3,
    useFreezer: false,
  });

  it('is NOT critical at exactly CRITICAL_PERCENTAGE_THRESHOLD (uses < not <=)', () => {
    const waterCategory = createMockCategory({
      id: createCategoryId('water-beverages'),
      name: 'Water',
      icon: 'W',
    });

    const items: InventoryItem[] = [
      createMockInventoryItem({
        id: createItemId('1'),
        categoryId: createCategoryId('water-beverages'),
        quantity: createQuantity(1),
        unit: 'liters',
        itemType: createProductTemplateId('bottled-water'),
        neverExpires: true,
      }),
    ];

    const result = calculateCategoryStatus(
      waterCategory,
      items,
      CRITICAL_PERCENTAGE_THRESHOLD,
      household,
      RECOMMENDED_ITEMS,
      [],
    );

    expect(result.status).toBe('warning');
  });

  it('is critical when percentage is below CRITICAL_PERCENTAGE_THRESHOLD', () => {
    const waterCategory = createMockCategory({
      id: createCategoryId('water-beverages'),
      name: 'Water',
      icon: 'W',
    });

    const items: InventoryItem[] = [
      createMockInventoryItem({
        id: createItemId('1'),
        categoryId: createCategoryId('water-beverages'),
        quantity: createQuantity(1),
        unit: 'liters',
        itemType: createProductTemplateId('bottled-water'),
        neverExpires: true,
      }),
    ];

    const result = calculateCategoryStatus(
      waterCategory,
      items,
      CRITICAL_PERCENTAGE_THRESHOLD - 1,
      household,
      RECOMMENDED_ITEMS,
      [],
    );

    expect(result.status).toBe('critical');
  });

  it('is ok at exactly WARNING_PERCENTAGE_THRESHOLD with no items (uses < not <=)', () => {
    const waterCategory = createMockCategory({
      id: createCategoryId('water-beverages'),
      name: 'Water',
      icon: 'W',
    });

    const result = calculateCategoryStatus(
      waterCategory,
      [],
      WARNING_PERCENTAGE_THRESHOLD,
      household,
      RECOMMENDED_ITEMS,
      [],
    );

    expect(result.status).toBe('ok');
  });

  it('is warning when percentage is just below WARNING_PERCENTAGE_THRESHOLD', () => {
    const waterCategory = createMockCategory({
      id: createCategoryId('water-beverages'),
      name: 'Water',
      icon: 'W',
    });

    const result = calculateCategoryStatus(
      waterCategory,
      [],
      WARNING_PERCENTAGE_THRESHOLD - 1,
      household,
      RECOMMENDED_ITEMS,
      [],
    );

    expect(result.status).toBe('warning');
  });
});

// ===========================================================================
// kit-empty fallbacks for water/food/other categories
// ===========================================================================
describe('kit-empty fallbacks', () => {
  const household = createMockHousehold({
    adults: 2,
    children: 0,
    supplyDurationDays: 3,
    useFreezer: false,
  });

  it('water-beverages stays critical when empty even without recommendations', () => {
    const waterCategory = createMockCategory({
      id: createCategoryId('water-beverages'),
      name: 'Water',
      icon: 'W',
    });

    const result = calculateCategoryStatus(
      waterCategory,
      [],
      0,
      household,
      [],
      [],
    );

    expect(result.status).toBe('critical');
  });

  it('non-food/non-water categories auto-ok when no recommendations', () => {
    const toolsCategory = createMockCategory({
      id: createCategoryId('tools-supplies'),
      name: 'Tools',
      icon: 'T',
    });

    const result = calculateCategoryStatus(
      toolsCategory,
      [],
      0,
      household,
      [],
      [],
    );

    expect(result.status).toBe('ok');
    expect(result.completionPercentage).toBe(100);
  });

  it('food category populates calorie data when kit has no recommendations', () => {
    const foodCategory = createMockCategory({
      id: createCategoryId('food'),
      name: 'Food',
      icon: 'F',
    });

    const items: InventoryItem[] = [
      createMockInventoryItem({
        id: createItemId('1'),
        categoryId: createCategoryId('food'),
        quantity: createQuantity(5),
        unit: 'kilograms',
        itemType: createProductTemplateId('rice'),
        caloriesPerUnit: 3600,
      }),
    ];

    const result = calculateCategoryStatus(
      foodCategory,
      items,
      0,
      household,
      [],
      [],
    );

    expect(result.totalActualCalories).toBeDefined();
    expect(result.totalActualCalories).toBeGreaterThan(0);
    expect(result.totalNeededCalories).toBeDefined();
    expect(result.totalNeededCalories).toBeGreaterThan(0);
  });

  it('water-beverages populates water totals when kit has no recommendations', () => {
    const waterCategory = createMockCategory({
      id: createCategoryId('water-beverages'),
      name: 'Water',
      icon: 'W',
    });

    const items: InventoryItem[] = [
      createMockInventoryItem({
        id: createItemId('1'),
        categoryId: createCategoryId('water-beverages'),
        quantity: createQuantity(10),
        unit: 'liters',
        itemType: createProductTemplateId('bottled-water'),
        neverExpires: true,
      }),
    ];

    const result = calculateCategoryStatus(
      waterCategory,
      items,
      0,
      household,
      [],
      [],
    );

    expect(result.totalNeeded).toBeGreaterThan(0);
    expect(result.totalActual).toBeGreaterThan(0);
    expect(result.primaryUnit).toBe('liters');
  });

  it('non-food/non-water categories fall back to item-count totals when kit empty (display)', () => {
    const householdLocal = createMockHousehold({
      adults: 1,
      supplyDurationDays: 1,
    });
    const items: InventoryItem[] = [
      createMockInventoryItem({
        id: createItemId('a'),
        categoryId: tools,
        itemType: createProductTemplateId('any'),
        quantity: createQuantity(2),
        unit: 'pieces',
        neverExpires: true,
      }),
      createMockInventoryItem({
        id: createItemId('b'),
        categoryId: tools,
        itemType: createProductTemplateId('any'),
        quantity: createQuantity(3),
        unit: 'pieces',
        neverExpires: true,
      }),
    ];
    const result = getCategoryDisplayStatus(
      tools,
      items,
      householdLocal,
      [],
      [],
    );
    expect(result.totalActual).toBe(2);
    expect(result.primaryUnit).toBeUndefined();
  });

  it('water-beverages display gets primaryUnit=liters when kit empty', () => {
    const items: InventoryItem[] = [
      createMockInventoryItem({
        id: createItemId('1'),
        categoryId: createCategoryId('water-beverages'),
        quantity: createQuantity(10),
        unit: 'liters',
        itemType: createProductTemplateId('bottled-water'),
        neverExpires: true,
      }),
    ];

    const result = getCategoryDisplayStatus(
      'water-beverages',
      items,
      household,
      [],
      [],
    );

    expect(result.primaryUnit).toBe('liters');
    expect(result.totalActual).toBeGreaterThan(0);
    expect(result.totalNeeded).toBeGreaterThan(0);
  });

  it('non-water categories auto-ok when kit empty (display)', () => {
    const result = getCategoryDisplayStatus(
      'tools-supplies',
      [],
      household,
      [],
      [],
    );

    expect(result.status).toBe('ok');
    expect(result.completionPercentage).toBe(100);
  });
});

// ===========================================================================
// missingCalories arithmetic in getCategoryDisplayStatus
// ===========================================================================
describe('missingCalories arithmetic', () => {
  it('returns positive missingCalories when actual < needed', () => {
    const household = createMockHousehold({
      adults: 2,
      children: 0,
      supplyDurationDays: 3,
      useFreezer: false,
    });

    const items: InventoryItem[] = [
      createMockInventoryItem({
        id: createItemId('1'),
        categoryId: createCategoryId('food'),
        quantity: createQuantity(1),
        unit: 'kilograms',
        itemType: createProductTemplateId('rice'),
        caloriesPerUnit: 3600,
      }),
    ];

    const result = getCategoryDisplayStatus(
      'food',
      items,
      household,
      RECOMMENDED_ITEMS,
      [],
    );

    expect(result.missingCalories).toBeDefined();
    expect(result.missingCalories).toBeGreaterThan(0);

    const expectedMissing = Math.max(
      0,
      result.totalNeededCalories! - result.totalActualCalories!,
    );
    expect(result.missingCalories).toBe(expectedMissing);
  });

  it('returns 0 missingCalories when actual >= needed (clamped, not negative)', () => {
    const household = createMockHousehold({
      adults: 1,
      children: 0,
      supplyDurationDays: 3,
      useFreezer: false,
    });

    const neededCalories = Math.ceil(1 * 3 * 2000);
    const riceQuantity = createQuantity(Math.ceil((neededCalories / 3600) * 2));

    const items: InventoryItem[] = [
      createMockInventoryItem({
        id: createItemId('1'),
        categoryId: createCategoryId('food'),
        quantity: riceQuantity,
        unit: 'kilograms',
        itemType: createProductTemplateId('rice'),
        caloriesPerUnit: 3600,
      }),
    ];

    const result = getCategoryDisplayStatus(
      'food',
      items,
      household,
      RECOMMENDED_ITEMS,
      [],
    );

    expect(result.missingCalories).toBe(0);
  });

  it('calculates missingCalories as needed - actual (not needed + actual)', () => {
    const household = createMockHousehold({
      adults: 1,
      children: 0,
      supplyDurationDays: 3,
      useFreezer: false,
    });

    const items: InventoryItem[] = [
      createMockInventoryItem({
        id: createItemId('1'),
        categoryId: createCategoryId('food'),
        quantity: createQuantity(1),
        unit: 'kilograms',
        itemType: createProductTemplateId('rice'),
        caloriesPerUnit: 3600,
      }),
    ];

    const result = getCategoryDisplayStatus(
      'food',
      items,
      household,
      RECOMMENDED_ITEMS,
      [],
    );

    const needed = result.totalNeededCalories!;
    const actual = result.totalActualCalories!;
    expect(result.missingCalories).toBe(Math.max(0, needed - actual));
    expect(result.missingCalories).toBeLessThan(needed + actual);
    expect(result.missingCalories).toBe(needed - actual);
  });

  it('produces non-negative missingCalories for partial food coverage', () => {
    const household = createMockHousehold({
      adults: 1,
      children: 0,
      supplyDurationDays: 1,
      useFreezer: false,
    });

    const category = createMockCategory({ id: createCategoryId('food') });

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

    if (result.missingCalories !== undefined) {
      expect(result.missingCalories).toBeGreaterThanOrEqual(0);
      if (result.totalNeededCalories) {
        expect(result.missingCalories).toBeLessThanOrEqual(
          result.totalNeededCalories,
        );
      }
    }
  });
});

// ===========================================================================
// completionPercentage clamping and overrides
// ===========================================================================
describe('completionPercentage clamping and overrides', () => {
  const household = createMockHousehold({
    adults: 2,
    children: 0,
    supplyDurationDays: 3,
    useFreezer: false,
  });

  it('caps completionPercentage at 100 when not hasEnough but percentage > 100', () => {
    const waterCategory = createMockCategory({
      id: createCategoryId('water-beverages'),
      name: 'Water',
      icon: 'W',
    });

    const items: InventoryItem[] = [
      createMockInventoryItem({
        id: createItemId('1'),
        categoryId: createCategoryId('water-beverages'),
        quantity: createQuantity(1),
        unit: 'liters',
        itemType: createProductTemplateId('bottled-water'),
        neverExpires: true,
      }),
    ];

    const result = calculateCategoryStatus(
      waterCategory,
      items,
      150,
      household,
      RECOMMENDED_ITEMS,
      [],
    );

    expect(result.completionPercentage).toBeLessThanOrEqual(100);
  });

  it('uses weighted fulfillment when primaryUnit is undefined and totalNeeded > 0', () => {
    const cashDocsCategory = createMockCategory({
      id: createCategoryId('cash-documents'),
      name: 'Cash & Documents',
      icon: 'C',
    });

    const items: InventoryItem[] = [
      createMockInventoryItem({
        id: createItemId('1'),
        categoryId: createCategoryId('cash-documents'),
        quantity: createQuantity(150),
        unit: 'euros',
        itemType: createProductTemplateId('cash'),
      }),
    ];

    const result = calculateCategoryStatus(
      cashDocsCategory,
      items,
      0,
      household,
      RECOMMENDED_ITEMS,
      [],
    );

    expect(result.completionPercentage).toBeGreaterThan(0);
  });

  it('does not produce NaN/Infinity completionPercentage when totalNeeded is 0', () => {
    const householdLocal = createMockHousehold({
      adults: 1,
      supplyDurationDays: 1,
    });
    const result = getCategoryDisplayStatus(tools, [], householdLocal, [], []);
    expect(Number.isFinite(result.completionPercentage)).toBe(true);
    expect(result.completionPercentage).toBeGreaterThanOrEqual(0);
    expect(result.completionPercentage).toBeLessThanOrEqual(100);
  });
});

// ===========================================================================
// getCategoryDisplayStatus return-shape guarantees
// ===========================================================================
describe('getCategoryDisplayStatus return-shape guarantees', () => {
  const household = createMockHousehold({
    adults: 1,
    children: 0,
    supplyDurationDays: 3,
    useFreezer: false,
  });

  it('uses RECOMMENDED_ITEMS as default when not passed', () => {
    const result = getCategoryDisplayStatus('water-beverages', [], household);

    expect(result.shortages.length).toBeGreaterThan(0);
    expect(result.totalNeeded).toBeGreaterThan(0);
  });

  it('returns undefined missingCalories for non-food category', () => {
    const result = getCategoryDisplayStatus(
      'water-beverages',
      [],
      household,
      RECOMMENDED_ITEMS,
      [],
    );

    expect(result.missingCalories).toBeUndefined();
    expect(result.totalActualCalories).toBeUndefined();
    expect(result.totalNeededCalories).toBeUndefined();
  });

  it('hasRecommendations is true when category has recommendations', () => {
    const result = getCategoryDisplayStatus(
      'water-beverages',
      [],
      household,
      RECOMMENDED_ITEMS,
      [],
    );
    expect(result.hasRecommendations).toBe(true);
  });

  it('hasRecommendations is false when category has no recommendations', () => {
    const result = getCategoryDisplayStatus(
      'water-beverages',
      [],
      household,
      [],
      [],
    );
    expect(result.hasRecommendations).toBe(false);
  });

  it('returns shortages as array (not Stryker placeholder) for empty case', () => {
    const householdLocal = createMockHousehold({
      adults: 1,
      children: 0,
      supplyDurationDays: 3,
      useFreezer: false,
    });

    const result = getCategoryDisplayStatus(
      'tools-supplies',
      [],
      householdLocal,
      [],
      [],
    );

    expect(result.shortages).toEqual([]);
    expect(result.shortages.length).toBe(0);
  });
});

// ===========================================================================
// status-count invariant
// ===========================================================================
describe('status-count invariant', () => {
  it('okCount + warningCount + criticalCount equals itemCount', () => {
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

    expect(result.okCount).toBeGreaterThanOrEqual(0);
    expect(result.warningCount).toBeGreaterThanOrEqual(0);
    expect(result.criticalCount).toBeGreaterThanOrEqual(0);
    expect(result.okCount + result.warningCount + result.criticalCount).toBe(
      result.itemCount,
    );
  });
});
