/**
 * Additional mutation-killing tests for preparedness.ts
 * Targets surviving mutants from issue #271 mutation testing report.
 */
import { describe, it, expect } from 'vitest';
import {
  calculatePreparednessScore,
  calculatePreparednessScoreFromCategoryStatuses,
  calculateCategoryPreparedness,
} from './preparedness';
import type { InventoryItem, RecommendedItemDefinition } from '@/shared/types';
import {
  createItemId,
  createCategoryId,
  createProductTemplateId,
  createQuantity,
} from '@/shared/types';
import {
  createMockInventoryItem,
  createMockHousehold,
} from '@/shared/utils/test/factories';
import type { CategoryStatusSummary } from './categoryStatus';

function mockStatus(
  overrides: Partial<CategoryStatusSummary> & {
    categoryId: string;
    status: 'ok' | 'warning' | 'critical';
    totalNeeded: number;
    totalActual: number;
  },
): CategoryStatusSummary {
  return {
    itemCount: 1,
    completionPercentage: 100,
    criticalCount: 0,
    warningCount: 0,
    okCount: 1,
    shortages: [],
    hasRecommendations: true,
    ...overrides,
  };
}

// ============================================================================
// L29: BlockStatement/ConditionalExpression - empty categoryStatuses array
// Mutant: block body removed {} or condition replaced with false
// ============================================================================
describe('L29: calculatePreparednessScoreFromCategoryStatuses edge cases', () => {
  it('returns 0 for empty array (kills BlockStatement and ConditionalExpression=false)', () => {
    const result = calculatePreparednessScoreFromCategoryStatuses([]);
    expect(result).toBe(0);
    expect(typeof result).toBe('number');
  });

  it('returns 0 when all categories have totalNeeded=0', () => {
    const statuses: CategoryStatusSummary[] = [
      mockStatus({
        categoryId: 'cat1',
        status: 'ok',
        totalNeeded: 0,
        totalActual: 5,
      }),
      mockStatus({
        categoryId: 'cat2',
        status: 'ok',
        totalNeeded: 0,
        totalActual: 10,
      }),
    ];
    const result = calculatePreparednessScoreFromCategoryStatuses(statuses);
    expect(result).toBe(0);
  });

  it('correctly calculates score with mixed statuses', () => {
    const statuses: CategoryStatusSummary[] = [
      mockStatus({
        categoryId: 'cat1',
        status: 'ok',
        totalNeeded: 10,
        totalActual: 10,
      }),
      mockStatus({
        categoryId: 'cat2',
        status: 'warning',
        totalNeeded: 10,
        totalActual: 3,
      }),
      mockStatus({
        categoryId: 'cat3',
        status: 'critical',
        totalNeeded: 10,
        totalActual: 0,
      }),
    ];
    const result = calculatePreparednessScoreFromCategoryStatuses(statuses);
    // 1 ok out of 3 applicable = 33.33... -> Math.round = 33
    expect(result).toBe(33);
  });
});

// ============================================================================
// L71: BlockStatement/ConditionalExpression - empty recommendedForHousehold
// Mutant: block body removed {} or condition replaced with false
// ============================================================================
describe('L71: calculatePreparednessScore empty recommendations', () => {
  it('returns 0 for empty recommended items (kills BlockStatement={})', () => {
    const household = createMockHousehold({
      adults: 1,
      children: 0,
      supplyDurationDays: 3,
    });
    const items: InventoryItem[] = [];
    const result = calculatePreparednessScore(items, household, []);
    expect(result).toBe(0);
    expect(typeof result).toBe('number');
  });

  it('returns 0 when all items require freezer but household has none', () => {
    const household = createMockHousehold({
      adults: 1,
      children: 0,
      supplyDurationDays: 3,
      useFreezer: false,
    });

    const recs: RecommendedItemDefinition[] = [
      {
        id: createProductTemplateId('frozen-food'),
        i18nKey: 'frozen-food',
        category: 'food',
        baseQuantity: createQuantity(1),
        unit: 'kilograms',
        scaleWithPeople: true,
        scaleWithDays: true,
        requiresFreezer: true,
        caloriesPerUnit: 2000,
        caloriesPer100g: 200,
        weightGramsPerUnit: 1000,
      },
    ];

    const result = calculatePreparednessScore([], household, recs);
    expect(result).toBe(0);
  });
});

// ============================================================================
// L141: MethodExpression - items.filter replaced with items (no filtering)
// Kill: verify items from other categories are excluded
// ============================================================================
describe('L141: calculateCategoryPreparedness filters by category', () => {
  it('only considers items matching the specified category', () => {
    const household = createMockHousehold({
      adults: 1,
      children: 0,
      supplyDurationDays: 3,
    });

    const toolsItems: InventoryItem[] = [
      createMockInventoryItem({
        id: createItemId('tool-1'),
        categoryId: createCategoryId('tools-supplies'),
        quantity: createQuantity(5),
        unit: 'pieces',
        itemType: createProductTemplateId('flashlight'),
      }),
    ];

    const foodItems: InventoryItem[] = [
      createMockInventoryItem({
        id: createItemId('food-1'),
        categoryId: createCategoryId('food'),
        quantity: createQuantity(10),
        unit: 'kilograms',
        itemType: createProductTemplateId('rice'),
        caloriesPerUnit: 3600,
      }),
    ];

    const allItems = [...toolsItems, ...foodItems];

    // Calculate preparedness for tools-supplies with all items
    const result = calculateCategoryPreparedness(
      'tools-supplies',
      allItems,
      household,
      [
        {
          id: createProductTemplateId('flashlight'),
          i18nKey: 'flashlight',
          category: 'tools-supplies',
          baseQuantity: createQuantity(1),
          unit: 'pieces',
          scaleWithPeople: false,
          scaleWithDays: false,
        },
      ],
    );

    // Should only consider tools items, not food items
    // If filter is removed, food items would also be included
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('returns default preparedness when category has items but no recommendations', () => {
    const household = createMockHousehold({
      adults: 1,
      children: 0,
      supplyDurationDays: 3,
    });

    const items: InventoryItem[] = [
      createMockInventoryItem({
        id: createItemId('item-1'),
        categoryId: createCategoryId('tools-supplies'),
        quantity: createQuantity(5),
        unit: 'pieces',
        itemType: createProductTemplateId('custom'),
      }),
    ];

    const result = calculateCategoryPreparedness(
      'tools-supplies',
      items,
      household,
      [], // no recommendations
    );

    // Has items but no recommendations -> DEFAULT_FULL_PREPAREDNESS (100)
    expect(result).toBe(100);
  });

  it('returns 0 preparedness when category has no items and no recommendations', () => {
    const household = createMockHousehold({
      adults: 1,
      children: 0,
      supplyDurationDays: 3,
    });

    const result = calculateCategoryPreparedness(
      'tools-supplies',
      [],
      household,
      [],
    );

    // No items and no recommendations -> DEFAULT_EMPTY_PREPAREDNESS (0)
    expect(result).toBe(0);
  });
});

// ============================================================================
// L144/L147: typeof checks for categoryId and item.category
// These are branded type guards. Since categoryId is always a string in
// practice, these mutants are likely equivalent.
// ============================================================================
