import type { InventoryItem, Category } from '@/shared/types';

export type DesignStatus = 'ok' | 'warn' | 'crit';

const MS_PER_DAY = 86_400_000;

export function statusOf(
  item: InventoryItem,
  recommendedQuantity: number | undefined,
  now: Date = new Date(),
): DesignStatus {
  if (item.markedAsEnough) return 'ok';
  if (item.quantity === 0) return 'crit';
  if (item.expirationDate && !item.neverExpires) {
    const exp = new Date(item.expirationDate);
    const days = (exp.getTime() - now.getTime()) / MS_PER_DAY;
    if (days < 0) return 'crit';
    if (days < 30) return 'warn';
  }
  if (recommendedQuantity && recommendedQuantity > 0) {
    if (item.quantity < recommendedQuantity * 0.5) return 'crit';
    if (item.quantity < recommendedQuantity) return 'warn';
  }
  return 'ok';
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
