import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

vi.mock('@/features/inventory', () => ({ useInventory: vi.fn() }));
vi.mock('@/features/household', () => ({ useHousehold: vi.fn() }));
vi.mock('@/features/templates', () => ({ useRecommendedItems: vi.fn() }));
vi.mock('@/features/dashboard', () => ({ useCategoryStatuses: vi.fn() }));
// calculatePreparednessScoreFromCategoryStatuses and calculateDaysCovered
// each have their own dedicated test files — mock them here so this suite
// verifies useDesignData's own wiring (recommendation mapping, applicability,
// count totals, expiration count) rather than re-testing their internals.
vi.mock('@/features/dashboard/utils/preparedness', () => ({
  calculatePreparednessScoreFromCategoryStatuses: vi.fn(),
}));
vi.mock('@/shared/utils/calculations/daysCovered', () => ({
  calculateDaysCovered: vi.fn(),
}));

import { useInventory } from '@/features/inventory';
import { useHousehold } from '@/features/household';
import { useRecommendedItems } from '@/features/templates';
import { useCategoryStatuses } from '@/features/dashboard';
import { calculatePreparednessScoreFromCategoryStatuses } from '@/features/dashboard/utils/preparedness';
import { calculateDaysCovered } from '@/shared/utils/calculations/daysCovered';
import { useDesignData } from './useDesignData';
import {
  createMockCategory,
  createMockHousehold,
  createMockInventoryItem,
  createMockRecommendedItem,
} from '@/shared/utils/test/factories';
import {
  createCategoryId,
  createDateOnly,
  createItemId,
  createProductTemplateId,
  createQuantity,
} from '@/shared/types';
import type { CategoryStatusSummary } from '@/features/dashboard/utils';
import type { DaysCoveredResult } from '@/shared/utils/calculations/daysCovered';

const foodCategory = createMockCategory({
  id: createCategoryId('food'),
  name: 'Food',
  icon: '🍚',
});
const petsCategory = createMockCategory({
  id: createCategoryId('pets'),
  name: 'Pets',
  icon: '🐾',
});

const statusSummary = (
  categoryId: string,
  status: CategoryStatusSummary['status'],
  totalNeeded: number,
): CategoryStatusSummary =>
  ({
    categoryId,
    status,
    completionPercentage: 0,
    totalNeeded,
    shortages: [],
  }) as unknown as CategoryStatusSummary;

const stubDaysCovered: DaysCoveredResult = {
  days: 5,
  foodDays: 5,
  waterDays: 7,
  limitedBy: 'food',
};

function setup({
  items = [],
  categories = [foodCategory],
  household = createMockHousehold(),
  recommendedItems = [],
  categoryStatuses = [],
}: {
  items?: ReturnType<typeof createMockInventoryItem>[];
  categories?: ReturnType<typeof createMockCategory>[];
  household?: ReturnType<typeof createMockHousehold>;
  recommendedItems?: ReturnType<typeof createMockRecommendedItem>[];
  categoryStatuses?: CategoryStatusSummary[];
} = {}) {
  vi.mocked(useInventory).mockReturnValue({
    items,
    categories,
  } as unknown as ReturnType<typeof useInventory>);
  vi.mocked(useHousehold).mockReturnValue({
    household,
  } as unknown as ReturnType<typeof useHousehold>);
  vi.mocked(useRecommendedItems).mockReturnValue({
    recommendedItems,
  } as unknown as ReturnType<typeof useRecommendedItems>);
  vi.mocked(useCategoryStatuses).mockReturnValue({
    categoryStatuses,
  } as unknown as ReturnType<typeof useCategoryStatuses>);
  vi.mocked(calculatePreparednessScoreFromCategoryStatuses).mockReturnValue(42);
  vi.mocked(calculateDaysCovered).mockReturnValue(stubDaysCovered);

  return renderHook(() => useDesignData()).result;
}

beforeEach(() => vi.clearAllMocks());

describe('useDesignData', () => {
  describe('recommendation mapping', () => {
    it('maps each row to the recommended quantity for its product template', () => {
      const template = createProductTemplateId('rice');
      const item = createMockInventoryItem({
        id: createItemId('rice-1'),
        itemType: template,
        categoryId: foodCategory.id,
        quantity: createQuantity(2),
        neverExpires: true,
      });
      const recommended = createMockRecommendedItem({
        id: template,
        category: foodCategory.id,
        baseQuantity: createQuantity(10),
        scaleWithPeople: false,
        scaleWithDays: false,
        scaleWithPets: false,
      });

      const result = setup({ items: [item], recommendedItems: [recommended] });

      expect(result.current.rows).toHaveLength(1);
      expect(result.current.rows[0].recommended).toBe(10);
      expect(result.current.recommendedByItem.get(String(item.id))).toBe(10);
    });

    it('falls back to 0 for a product with no matching recommendation', () => {
      const item = createMockInventoryItem({
        id: createItemId('mystery-1'),
        itemType: createProductTemplateId('no-such-template'),
        categoryId: foodCategory.id,
        quantity: createQuantity(2),
        neverExpires: true,
      });

      const result = setup({ items: [item] });

      expect(result.current.rows[0].recommended).toBe(0);
      expect(result.current.recommendedByItem.has(String(item.id))).toBe(false);
    });
  });

  describe('category applicability', () => {
    it('marks a category with recommendations as applicable', () => {
      const result = setup({
        categories: [foodCategory],
        categoryStatuses: [statusSummary('food', 'ok', 10)],
      });
      const stat = result.current.stats.find(
        (s) => s.category.id === foodCategory.id,
      )!;
      expect(stat.applicable).toBe(true);
    });

    it('marks a category with nothing needed (e.g. pets, no pets) as not applicable', () => {
      const result = setup({
        categories: [petsCategory],
        categoryStatuses: [statusSummary('pets', 'ok', 0)],
      });
      const stat = result.current.stats.find(
        (s) => s.category.id === petsCategory.id,
      )!;
      expect(stat.applicable).toBe(false);
    });

    it('treats a category with no status summary at all as not applicable', () => {
      const result = setup({
        categories: [foodCategory],
        categoryStatuses: [],
      });
      const stat = result.current.stats[0];
      expect(stat.applicable).toBe(false);
      expect(stat.coverage).toBe('ok');
    });
  });

  describe('readiness', () => {
    it('passes the category statuses through to the preparedness calculator', () => {
      const statuses = [statusSummary('food', 'ok', 10)];
      const result = setup({ categoryStatuses: statuses });

      expect(
        calculatePreparednessScoreFromCategoryStatuses,
      ).toHaveBeenCalledWith(statuses);
      expect(result.current.readiness).toBe(42);
    });
  });

  describe('expiration counts', () => {
    it('counts items expiring within the threshold, ignoring never-expiring ones', () => {
      const today = new Date();
      const soon = new Date(today);
      soon.setDate(soon.getDate() + 5);
      const far = new Date(today);
      far.setDate(far.getDate() + 400);

      const items = [
        createMockInventoryItem({
          id: createItemId('soon'),
          categoryId: foodCategory.id,
          quantity: createQuantity(1),
          neverExpires: false,
          expirationDate: createDateOnly(soon.toISOString().slice(0, 10)),
        }),
        createMockInventoryItem({
          id: createItemId('far'),
          categoryId: foodCategory.id,
          quantity: createQuantity(1),
          neverExpires: false,
          expirationDate: createDateOnly(far.toISOString().slice(0, 10)),
        }),
        createMockInventoryItem({
          id: createItemId('never'),
          categoryId: foodCategory.id,
          quantity: createQuantity(1),
          neverExpires: true,
        }),
      ];

      const result = setup({ items });

      expect(result.current.expiringCount).toBe(1);
    });
  });

  describe('daysCovered', () => {
    it('passes the household target duration and exposes both the figure and its detail', () => {
      const household = createMockHousehold({ supplyDurationDays: 9 });
      const result = setup({ household });

      expect(calculateDaysCovered).toHaveBeenCalledWith([], 9);
      expect(result.current.daysCovered).toBe(stubDaysCovered.days);
      expect(result.current.daysCoveredDetail).toBe(stubDaysCovered);
      expect(result.current.targetDays).toBe(9);
    });
  });
});
