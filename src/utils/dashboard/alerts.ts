import type { InventoryItem } from '../../types';
import type { Alert } from '../../components/dashboard/AlertBanner';
import { STANDARD_CATEGORIES } from '../../data/standardCategories';

/**
 * Generate alerts for expired items
 */
function generateExpirationAlerts(items: InventoryItem[]): Alert[] {
  const alerts: Alert[] = [];
  const now = new Date();

  items.forEach((item) => {
    if (item.neverExpires || !item.expirationDate) {
      return;
    }

    const expirationDate = new Date(item.expirationDate);
    const daysUntilExpiration = Math.ceil(
      (expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysUntilExpiration < 0) {
      alerts.push({
        id: `expired-${item.id}`,
        type: 'critical',
        message: 'Item has expired',
        itemName: item.name,
      });
    } else if (daysUntilExpiration <= 7) {
      alerts.push({
        id: `expiring-soon-${item.id}`,
        type: 'warning',
        message: `Expiring in ${daysUntilExpiration} days`,
        itemName: item.name,
      });
    }
  });

  return alerts;
}

/**
 * Generate alerts for categories with low stock (aggregated by category)
 */
function generateCategoryStockAlerts(items: InventoryItem[]): Alert[] {
  const alerts: Alert[] = [];

  STANDARD_CATEGORIES.forEach((category) => {
    const categoryItems = items.filter(
      (item) => item.categoryId === category.id,
    );

    if (categoryItems.length === 0) {
      // No items in this category yet
      return;
    }

    // Calculate total quantity vs total recommended for the category
    let totalQuantity = 0;
    let totalRecommended = 0;

    categoryItems.forEach((item) => {
      totalQuantity += item.quantity;
      totalRecommended += item.recommendedQuantity;
    });

    const percentOfRecommended =
      totalRecommended > 0 ? (totalQuantity / totalRecommended) * 100 : 100;

    if (totalQuantity === 0) {
      alerts.push({
        id: `category-out-of-stock-${category.id}`,
        type: 'critical',
        message: 'No items in stock',
        itemName: category.name,
      });
    } else if (percentOfRecommended < 25) {
      alerts.push({
        id: `category-critically-low-${category.id}`,
        type: 'critical',
        message: `Critically low (${Math.round(percentOfRecommended)}% stocked)`,
        itemName: category.name,
      });
    } else if (percentOfRecommended < 50) {
      alerts.push({
        id: `category-low-stock-${category.id}`,
        type: 'warning',
        message: `Running low (${Math.round(percentOfRecommended)}% stocked)`,
        itemName: category.name,
      });
    }
  });

  return alerts;
}

/**
 * Generate all alerts for dashboard
 */
export function generateDashboardAlerts(items: InventoryItem[]): Alert[] {
  const expirationAlerts = generateExpirationAlerts(items);
  const categoryStockAlerts = generateCategoryStockAlerts(items);

  // Combine alerts (removed item-level critical alerts as they're now covered by category alerts)
  const allAlerts = [...expirationAlerts, ...categoryStockAlerts];

  // Sort by priority: critical first, then warning, then info
  const priorityOrder = { critical: 0, warning: 1, info: 2 };
  allAlerts.sort((a, b) => priorityOrder[a.type] - priorityOrder[b.type]);

  return allAlerts;
}

/**
 * Count alerts by type
 */
export function countAlerts(alerts: Alert[]): {
  critical: number;
  warning: number;
  info: number;
  total: number;
} {
  const counts = {
    critical: 0,
    warning: 0,
    info: 0,
    total: alerts.length,
  };

  alerts.forEach((alert) => {
    counts[alert.type]++;
  });

  return counts;
}
