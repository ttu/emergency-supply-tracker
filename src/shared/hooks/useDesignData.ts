import { useMemo } from 'react';
import { useInventory } from '@/features/inventory';
import { useHousehold } from '@/features/household';
import { useRecommendedItems } from '@/features/templates';
import { calculateRecommendedQuantity } from '@/shared/utils/calculations/recommendedQuantity';
import {
  categoryStats,
  readinessPercent,
  statusOf,
  type CategoryStats,
  type DesignStatus,
} from '@/shared/utils/designStatus';
import { categoryCode } from '@/shared/i18n/voice';
import type { Category, InventoryItem } from '@/shared/types';

export interface DesignItemRow {
  item: InventoryItem;
  recommended: number;
  category: Category | undefined;
  categoryCode: string;
  status: DesignStatus;
}

export interface DesignData {
  categories: Category[];
  items: InventoryItem[];
  rows: DesignItemRow[];
  recommendedByItem: Map<string, number>;
  stats: CategoryStats[];
  readiness: number;
  totals: { total: number; ok: number; warn: number; crit: number };
  expiringCount: number;
  criticalCount: number;
  daysCovered: number;
}

const MS_PER_DAY = 86_400_000;

export function useDesignData(): DesignData {
  const { items, categories } = useInventory();
  const { household } = useHousehold();
  const { recommendedItems } = useRecommendedItems();

  return useMemo(() => {
    const recommendedByTemplate = new Map<string, number>();
    for (const r of recommendedItems) {
      recommendedByTemplate.set(
        String(r.id),
        calculateRecommendedQuantity(r, household),
      );
    }
    const recommendedByItem = new Map<string, number>();
    for (const it of items) {
      const r = recommendedByTemplate.get(String(it.itemType));
      if (r !== undefined) recommendedByItem.set(String(it.id), r);
    }
    const rows: DesignItemRow[] = items.map((item) => {
      const cat = categories.find((c) => c.id === item.categoryId);
      const recommended = recommendedByItem.get(String(item.id)) ?? 0;
      return {
        item,
        recommended,
        category: cat,
        categoryCode: categoryCode(String(item.categoryId)),
        status: statusOf(item, recommended),
      };
    });
    const stats = categories.map((c) =>
      categoryStats(c, items, recommendedByItem),
    );
    const readiness = readinessPercent(stats);
    const totals = stats.reduce(
      (acc, s) => ({
        total: acc.total + s.total,
        ok: acc.ok + s.ok,
        warn: acc.warn + s.warn,
        crit: acc.crit + s.crit,
      }),
      { total: 0, ok: 0, warn: 0, crit: 0 },
    );
    // eslint-disable-next-line react-hooks/purity
    const now = Date.now();
    const expiringCount = items.filter((it) => {
      if (it.neverExpires || !it.expirationDate) return false;
      const days = (new Date(it.expirationDate).getTime() - now) / MS_PER_DAY;
      return days >= 0 && days < 30;
    }).length;
    const criticalCount = totals.crit;
    const daysCovered = household.supplyDurationDays
      ? Math.round(
          (totals.total > 0 ? totals.ok / totals.total : 0) *
            household.supplyDurationDays *
            10,
        ) / 10
      : 0;
    return {
      categories,
      items,
      rows,
      recommendedByItem,
      stats,
      readiness,
      totals,
      expiringCount,
      criticalCount,
      daysCovered,
    };
  }, [items, categories, household, recommendedItems]);
}
