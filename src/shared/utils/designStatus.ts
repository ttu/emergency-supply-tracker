import type { InventoryItem, ItemStatus, Category } from '@/shared/types';
import type { AlertType } from '@/features/alerts';
import { calculateItemStatus } from '@/shared/utils/calculations/itemStatus';

/**
 * Compact status name used by the v2 design system. The canonical status
 * vocabulary is {@link ItemStatus} (`'ok' | 'warning' | 'critical'`); v2 maps
 * these to shorter labels for the cockpit/civil/pantry visual language.
 */
export type DesignStatus = 'ok' | 'warn' | 'crit';

/** Map the canonical {@link ItemStatus} to the compact v2 vocabulary. */
export function toDesignStatus(s: ItemStatus): DesignStatus {
  if (s === 'critical') return 'crit';
  if (s === 'warning') return 'warn';
  return 'ok';
}

/**
 * Map an {@link AlertType} to the compact {@link DesignStatus} so v2 alert
 * components can drive the status dot/pill colour from the alert severity.
 * `info` alerts render with the `ok` status colour by design — they are
 * informational and shouldn't read as warnings.
 */
export const ALERT_TYPE_TO_DESIGN_STATUS: Record<AlertType, DesignStatus> = {
  critical: 'crit',
  warning: 'warn',
  info: 'ok',
};

/**
 * v2 wrapper around {@link calculateItemStatus} returning the compact
 * {@link DesignStatus} variant. Routes through the canonical implementation
 * so v1 and v2 always agree on what "ok"/"warn"/"crit" means (including
 * timezone-safe expiration handling).
 */
export function statusOf(
  item: InventoryItem,
  recommendedQuantity: number | undefined,
): DesignStatus {
  return toDesignStatus(calculateItemStatus(item, recommendedQuantity ?? 0));
}

export interface CategoryStats {
  category: Category;
  total: number;
  ok: number;
  warn: number;
  crit: number;
  /**
   * How the category stands against its recommendations, as v1 judges it.
   *
   * The ok/warn/crit counts above only describe items the household already
   * owns, so a category it owns nothing in counts zero of each — indisting-
   * uishable from one that is fully stocked. Coverage is the answer to "is
   * this category a gap?", and comes from the same v1 calculation that drives
   * the classic dashboard, so both designs agree on what a gap is.
   */
  coverage: DesignStatus;
  /**
   * False when the category has nothing to meet for this household — pets
   * with no pets, or any category the active kit makes no recommendation for.
   * Such a category is neither covered nor a gap, so readiness ignores it.
   */
  applicable: boolean;
}

export function categoryStats(
  category: Category,
  items: InventoryItem[],
  recommendedByItem: Map<string, number>,
  coverage: DesignStatus,
  applicable = true,
): CategoryStats {
  const inCat = items.filter((i) => i.categoryId === category.id);
  let ok = 0;
  let warn = 0;
  let crit = 0;
  for (const item of inCat) {
    const s = statusOf(item, recommendedByItem.get(String(item.id)));
    if (s === 'ok') ok++;
    else if (s === 'warn') warn++;
    else crit++;
  }
  return {
    category,
    total: inCat.length,
    ok,
    warn,
    crit,
    coverage,
    applicable,
  };
}

/**
 * How many categories are covered, and how many are in play at all.
 *
 * Categories with nothing to meet — no recommendations for this household,
 * such as pets with no pets — are left out of both halves, so they neither
 * flatter nor drag down the count.
 */
export function coverageCounts(stats: CategoryStats[]): {
  total: number;
  ok: number;
  warn: number;
  crit: number;
} {
  const counts = { total: 0, ok: 0, warn: 0, crit: 0 };
  for (const s of stats) {
    if (!s.applicable) continue;
    counts.total += 1;
    counts[s.coverage] += 1;
  }
  return counts;
}
