import type { InventoryItem, ItemStatus, Category } from '@/shared/types';
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
}

export function categoryStats(
  category: Category,
  items: InventoryItem[],
  recommendedByItem: Map<string, number>,
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
  return { category, total: inCat.length, ok, warn, crit };
}

export function readinessPercent(stats: CategoryStats[]): number {
  let total = 0;
  let ok = 0;
  for (const s of stats) {
    total += s.total;
    ok += s.ok;
  }
  if (total === 0) return 0;
  return Math.round((ok / total) * 100);
}
