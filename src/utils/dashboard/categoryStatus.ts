import type {
  InventoryItem,
  ItemStatus,
  Category,
  HouseholdConfig,
  Unit,
} from '../../types';
import { calculateItemStatus } from '../calculations/status';
import { RECOMMENDED_ITEMS } from '../../data/recommendedItems';

export interface CategoryShortage {
  itemId: string;
  itemName: string;
  actual: number;
  needed: number;
  unit: Unit;
  missing: number;
}

export interface CategoryStatusSummary {
  categoryId: string;
  itemCount: number;
  status: ItemStatus;
  completionPercentage: number;
  criticalCount: number;
  warningCount: number;
  okCount: number;
  shortages: CategoryShortage[];
  totalActual: number;
  totalNeeded: number;
  primaryUnit: Unit | null;
}

/**
 * Calculate shortages for a category based on recommended items
 */
export function calculateCategoryShortages(
  categoryId: string,
  items: InventoryItem[],
  household: HouseholdConfig,
): {
  shortages: CategoryShortage[];
  totalActual: number;
  totalNeeded: number;
  primaryUnit: Unit | null;
} {
  const categoryItems = items.filter((item) => item.categoryId === categoryId);
  const recommendedForCategory = RECOMMENDED_ITEMS.filter(
    (item) => item.category === categoryId,
  );

  if (recommendedForCategory.length === 0) {
    return { shortages: [], totalActual: 0, totalNeeded: 0, primaryUnit: null };
  }

  const totalPeople = household.adults + household.children;
  const shortages: CategoryShortage[] = [];
  let totalActual = 0;
  let totalNeeded = 0;

  // Track units to find the most common one
  const unitCounts = new Map<Unit, number>();

  recommendedForCategory.forEach((recItem) => {
    let recommendedQty = recItem.baseQuantity;

    if (recItem.scaleWithPeople) {
      recommendedQty *= totalPeople;
    }

    if (recItem.scaleWithDays) {
      recommendedQty *= household.supplyDurationDays;
    }

    recommendedQty = Math.ceil(recommendedQty);

    const matchingItems = categoryItems.filter(
      (item) =>
        item.productTemplateId === recItem.id || item.name === recItem.id,
    );

    const actualQty = matchingItems.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );

    const missing = Math.max(0, recommendedQty - actualQty);

    // Track unit frequency
    unitCounts.set(
      recItem.unit,
      (unitCounts.get(recItem.unit) || 0) + recommendedQty,
    );

    // Add to totals (only if same unit type for meaningful aggregation)
    totalActual += actualQty;
    totalNeeded += recommendedQty;

    if (missing > 0) {
      shortages.push({
        itemId: recItem.id,
        itemName: recItem.i18nKey,
        actual: actualQty,
        needed: recommendedQty,
        unit: recItem.unit,
        missing,
      });
    }
  });

  // Find the most common unit by quantity
  let primaryUnit: Unit | null = null;
  let maxCount = 0;
  unitCounts.forEach((count, unit) => {
    if (count > maxCount) {
      maxCount = count;
      primaryUnit = unit;
    }
  });

  // Sort shortages by missing amount (descending)
  shortages.sort((a, b) => b.missing - a.missing);

  return { shortages, totalActual, totalNeeded, primaryUnit };
}

/**
 * Calculate status summary for a category
 */
export function calculateCategoryStatus(
  category: Category,
  items: InventoryItem[],
  completionPercentage: number,
  household?: HouseholdConfig,
): CategoryStatusSummary {
  const categoryItems = items.filter((item) => item.categoryId === category.id);

  // Count items by status
  let criticalCount = 0;
  let warningCount = 0;
  let okCount = 0;

  categoryItems.forEach((item) => {
    const status = calculateItemStatus(item);
    if (status === 'critical') criticalCount++;
    else if (status === 'warning') warningCount++;
    else okCount++;
  });

  // Determine overall category status
  let categoryStatus: ItemStatus;
  if (criticalCount > 0 || completionPercentage < 30) {
    categoryStatus = 'critical';
  } else if (warningCount > 0 || completionPercentage < 70) {
    categoryStatus = 'warning';
  } else {
    categoryStatus = 'ok';
  }

  // Calculate shortages if household config is provided
  const shortageInfo = household
    ? calculateCategoryShortages(category.id, items, household)
    : { shortages: [], totalActual: 0, totalNeeded: 0, primaryUnit: null };

  return {
    categoryId: category.id,
    itemCount: categoryItems.length,
    status: categoryStatus,
    completionPercentage,
    criticalCount,
    warningCount,
    okCount,
    shortages: shortageInfo.shortages,
    totalActual: shortageInfo.totalActual,
    totalNeeded: shortageInfo.totalNeeded,
    primaryUnit: shortageInfo.primaryUnit,
  };
}

/**
 * Calculate status summaries for all categories
 */
export function calculateAllCategoryStatuses(
  categories: Category[],
  items: InventoryItem[],
  categoryPreparedness: Map<string, number>,
  household?: HouseholdConfig,
): CategoryStatusSummary[] {
  return categories.map((category) => {
    const completionPercentage = categoryPreparedness.get(category.id) || 0;
    return calculateCategoryStatus(
      category,
      items,
      completionPercentage,
      household,
    );
  });
}
