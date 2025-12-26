import type { InventoryItem, ItemStatus, Category } from '../../types';
import { calculateItemStatus } from '../calculations/status';

export interface CategoryStatusSummary {
  categoryId: string;
  itemCount: number;
  status: ItemStatus;
  completionPercentage: number;
  criticalCount: number;
  warningCount: number;
  okCount: number;
}

/**
 * Calculate status summary for a category
 */
export function calculateCategoryStatus(
  category: Category,
  items: InventoryItem[],
  completionPercentage: number,
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

  return {
    categoryId: category.id,
    itemCount: categoryItems.length,
    status: categoryStatus,
    completionPercentage,
    criticalCount,
    warningCount,
    okCount,
  };
}

/**
 * Calculate status summaries for all categories
 */
export function calculateAllCategoryStatuses(
  categories: Category[],
  items: InventoryItem[],
  categoryPreparedness: Map<string, number>,
): CategoryStatusSummary[] {
  return categories.map((category) => {
    const completionPercentage = categoryPreparedness.get(category.id) || 0;
    return calculateCategoryStatus(category, items, completionPercentage);
  });
}
