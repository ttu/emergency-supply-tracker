import type { InventoryItem } from '../../types';
import type { Alert } from '../../components/dashboard/AlertBanner';
import { STANDARD_CATEGORIES } from '../../data/standardCategories';
import {
  MS_PER_DAY,
  EXPIRING_SOON_ALERT_DAYS,
  CRITICALLY_LOW_STOCK_PERCENTAGE,
  LOW_STOCK_PERCENTAGE,
} from '../constants';

type TranslationFunction = (
  key: string,
  options?: Record<string, string | number>,
) => string;

/**
 * Generate alerts for expired items
 */
function generateExpirationAlerts(
  items: InventoryItem[],
  t: TranslationFunction,
): Alert[] {
  const alerts: Alert[] = [];
  const now = new Date();

  items.forEach((item) => {
    if (item.neverExpires || !item.expirationDate) {
      return;
    }

    const expirationDate = new Date(item.expirationDate);
    const daysUntilExpiration = Math.ceil(
      (expirationDate.getTime() - now.getTime()) / MS_PER_DAY,
    );

    if (daysUntilExpiration < 0) {
      alerts.push({
        id: `expired-${item.id}`,
        type: 'critical',
        message: t('alerts.expiration.expired'),
        itemName: item.name,
      });
    } else if (daysUntilExpiration <= EXPIRING_SOON_ALERT_DAYS) {
      alerts.push({
        id: `expiring-soon-${item.id}`,
        type: 'warning',
        message: t('alerts.expiration.expiringSoon', {
          days: daysUntilExpiration,
        }),
        itemName: item.name,
      });
    }
  });

  return alerts;
}

/**
 * Generate alerts for categories with low stock (aggregated by category)
 */
function generateCategoryStockAlerts(
  items: InventoryItem[],
  t: TranslationFunction,
): Alert[] {
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
        message: t('alerts.stock.outOfStock'),
        itemName: category.name,
      });
    } else if (percentOfRecommended < CRITICALLY_LOW_STOCK_PERCENTAGE) {
      alerts.push({
        id: `category-critically-low-${category.id}`,
        type: 'critical',
        message: t('alerts.stock.criticallyLow', {
          percent: Math.round(percentOfRecommended),
        }),
        itemName: category.name,
      });
    } else if (percentOfRecommended < LOW_STOCK_PERCENTAGE) {
      alerts.push({
        id: `category-low-stock-${category.id}`,
        type: 'warning',
        message: t('alerts.stock.runningLow', {
          percent: Math.round(percentOfRecommended),
        }),
        itemName: category.name,
      });
    }
  });

  return alerts;
}

/**
 * Generate all alerts for dashboard
 */
export function generateDashboardAlerts(
  items: InventoryItem[],
  t: TranslationFunction,
): Alert[] {
  const expirationAlerts = generateExpirationAlerts(items, t);
  const categoryStockAlerts = generateCategoryStockAlerts(items, t);

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
