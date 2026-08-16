import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

vi.mock('@/features/dashboard', () => ({ useCategoryStatuses: vi.fn() }));

import { useCategoryStatuses } from '@/features/dashboard';
import { useCategoryCoverage } from './useCategoryCoverage';
import type { CategoryStatusSummary } from '@/features/dashboard/utils';
import type { ItemStatus } from '@/shared/types';

const summary = (
  categoryId: string,
  status: ItemStatus,
  completionPercentage: number,
  shortageCount: number,
  totalNeeded = 10,
): CategoryStatusSummary =>
  ({
    categoryId,
    status,
    completionPercentage,
    totalNeeded,
    shortages: Array.from({ length: shortageCount }, (_, i) => ({
      itemId: `${categoryId}-${i}`,
    })),
  }) as unknown as CategoryStatusSummary;

const mockStatuses = (categoryStatuses: CategoryStatusSummary[]) =>
  vi.mocked(useCategoryStatuses).mockReturnValue({
    categoryStatuses,
    preparednessScore: 0,
    categoryPreparedness: new Map(),
  });

beforeEach(() => vi.clearAllMocks());

describe('useCategoryCoverage', () => {
  describe('for one category', () => {
    it('reports that category’s completion and shortages', () => {
      mockStatuses([
        summary('water-beverages', 'warning', 76.4, 2),
        summary('food', 'ok', 100, 0),
      ]);
      const { result } = renderHook(() =>
        useCategoryCoverage('water-beverages'),
      );
      expect(result.current).toEqual({
        status: 'warn',
        coverage: 76,
        shortCount: 2,
      });
    });

    it('caps completion at 100% when overstocked', () => {
      mockStatuses([summary('food', 'ok', 143, 0)]);
      const { result } = renderHook(() => useCategoryCoverage('food'));
      expect(result.current.coverage).toBe(100);
    });

    it('reads empty for a category with no status of its own', () => {
      mockStatuses([summary('food', 'ok', 100, 0)]);
      const { result } = renderHook(() => useCategoryCoverage('pets'));
      expect(result.current).toEqual({
        status: 'ok',
        coverage: 0,
        shortCount: 0,
      });
    });
  });

  describe('across every category', () => {
    // Coverage has to keep meaning "share of the requirement stocked" when the
    // category filter clears, so it averages the same per-category figure.
    it('averages the per-category coverage', () => {
      mockStatuses([
        summary('water-beverages', 'warning', 50, 2),
        summary('food', 'ok', 90, 0),
        summary('medical', 'critical', 10, 4),
      ]);
      expect(
        renderHook(() => useCategoryCoverage()).result.current.coverage,
      ).toBe(50);
    });

    it('does not let an overstocked category inflate the average', () => {
      mockStatuses([
        summary('food', 'ok', 400, 0),
        summary('medical', 'critical', 20, 4),
      ]);
      expect(
        renderHook(() => useCategoryCoverage()).result.current.coverage,
      ).toBe(60);
    });

    it('ignores categories the household has no need for', () => {
      mockStatuses([
        summary('food', 'ok', 80, 0),
        summary('pets', 'ok', 0, 0, 0),
      ]);
      expect(
        renderHook(() => useCategoryCoverage()).result.current.coverage,
      ).toBe(80);
    });

    it('reads 0% when nothing is required at all', () => {
      mockStatuses([summary('pets', 'ok', 0, 0, 0)]);
      expect(
        renderHook(() => useCategoryCoverage()).result.current.coverage,
      ).toBe(0);
    });

    it('adds up shortages from every category', () => {
      mockStatuses([
        summary('water-beverages', 'warning', 76, 2),
        summary('food', 'ok', 100, 0),
        summary('medical', 'critical', 10, 4),
      ]);
      expect(
        renderHook(() => useCategoryCoverage()).result.current.shortCount,
      ).toBe(6);
    });

    it('takes the worst status any category is in', () => {
      mockStatuses([
        summary('food', 'ok', 100, 0),
        summary('medical', 'critical', 10, 4),
        summary('water-beverages', 'warning', 76, 2),
      ]);
      expect(
        renderHook(() => useCategoryCoverage()).result.current.status,
      ).toBe('crit');
    });

    it('is ok only when no category needs attention', () => {
      mockStatuses([summary('food', 'ok', 100, 0)]);
      expect(
        renderHook(() => useCategoryCoverage()).result.current.status,
      ).toBe('ok');
    });
  });
});
