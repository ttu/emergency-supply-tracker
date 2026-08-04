import { useMemo } from 'react';
import { useInventory } from '@/features/inventory';
import { useHousehold } from '@/features/household';
import { useRecommendedItems } from '@/features/templates';
import { useCategoryStatuses } from '@/features/dashboard';
import {
  calculateDaysCovered,
  type DaysCoveredResult,
} from '@/shared/utils/calculations/daysCovered';
import { calculateRecommendedQuantity } from '@/shared/utils/calculations/recommendedQuantity';
import { getDaysUntilExpiration } from '@/shared/utils/calculations/itemStatus';
import { EXPIRING_SOON_DAYS_THRESHOLD } from '@/shared/utils/constants';
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
  /** Days of water and food on hand — see {@link calculateDaysCovered}. */
  daysCovered: number;
  /** The same figure with both legs and the limiting resource. */
  daysCoveredDetail: DaysCoveredResult;
  /** The household's target duration, for comparison against `daysCovered`. */
  targetDays: number;
}

export function useDesignData(): DesignData {
  const { items, categories } = useInventory();
  const { household } = useHousehold();
  const { recommendedItems } = useRecommendedItems();
  const { categoryStatuses } = useCategoryStatuses();

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
    const expiringCount = items.filter((it) => {
      const days = getDaysUntilExpiration(it.expirationDate, it.neverExpires);
      return (
        days !== undefined && days >= 0 && days <= EXPIRING_SOON_DAYS_THRESHOLD
      );
    }).length;
    const criticalCount = totals.crit;
    const daysCoveredDetail = calculateDaysCovered(
      categoryStatuses,
      household.supplyDurationDays,
    );
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
      daysCovered: daysCoveredDetail.days,
      daysCoveredDetail,
      targetDays: household.supplyDurationDays,
    };
  }, [items, categories, household, recommendedItems, categoryStatuses]);
}
