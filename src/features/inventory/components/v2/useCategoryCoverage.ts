import { useMemo } from 'react';
import { useCategoryStatuses } from '@/features/dashboard';
import { toDesignStatus } from '@/shared/utils/designStatus';
import type { DesignStatus } from '@/shared/utils/designStatus';

export interface CategoryCoverage {
  status: DesignStatus;
  /** Percent of the requirement that is stocked, 0–100. */
  coverage: number;
  /** Recommended items that are below the household's target. */
  shortCount: number;
}

const SEVERITY: Record<DesignStatus, number> = { ok: 0, warn: 1, crit: 2 };

/** Overstocking a category does not buy coverage in another one. */
const clampPercent = (pct: number) => Math.min(100, Math.round(pct));

/**
 * The headline figures for the inventory's status strip.
 *
 * These come from the same category statuses that drive the dashboard and the
 * detailed summary panel, rather than from a second count over the table rows.
 * The strip sits directly above that panel, so two derivations of "how covered
 * is this category?" would sit side by side disagreeing — item counts and
 * litres of water do not reduce to the same percentage.
 *
 * @param categoryId Category to describe, or undefined for the whole inventory.
 */
export function useCategoryCoverage(categoryId?: string): CategoryCoverage {
  const { categoryStatuses } = useCategoryStatuses();

  return useMemo(() => {
    if (categoryId) {
      const summary = categoryStatuses.find((c) => c.categoryId === categoryId);
      if (!summary) return { status: 'ok', coverage: 0, shortCount: 0 };
      return {
        status: toDesignStatus(summary.status),
        coverage: clampPercent(summary.completionPercentage),
        shortCount: summary.shortages.length,
      };
    }

    // Across everything, coverage has to keep meaning the same thing it means
    // for one category — the share of the requirement that is stocked. So it
    // is the mean of the per-category figures, not the dashboard's readiness
    // score, which counts how many categories are OK rather than how full
    // they are. Categories with nothing to stock (pets with no pets) are left
    // out rather than counted as 0%.
    let status: DesignStatus = 'ok';
    let shortCount = 0;
    let coverageSum = 0;
    let applicable = 0;
    for (const c of categoryStatuses) {
      const s = toDesignStatus(c.status);
      if (SEVERITY[s] > SEVERITY[status]) status = s;
      shortCount += c.shortages.length;
      if (c.totalNeeded > 0) {
        coverageSum += clampPercent(c.completionPercentage);
        applicable++;
      }
    }
    return {
      status,
      coverage: applicable > 0 ? Math.round(coverageSum / applicable) : 0,
      shortCount,
    };
  }, [categoryStatuses, categoryId]);
}
