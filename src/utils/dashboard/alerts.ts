import type { InventoryItem } from '../../types';
import { calculateItemStatus } from '../calculations/status';
import type { Alert } from '../../components/dashboard/AlertBanner';

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
 * Generate alerts for items with low stock
 */
function generateLowStockAlerts(items: InventoryItem[]): Alert[] {
  const alerts: Alert[] = [];

  items.forEach((item) => {
    const percentOfRecommended =
      item.recommendedQuantity > 0
        ? (item.quantity / item.recommendedQuantity) * 100
        : 100;

    if (item.quantity === 0) {
      alerts.push({
        id: `out-of-stock-${item.id}`,
        type: 'critical',
        message: 'Out of stock',
        itemName: item.name,
      });
    } else if (percentOfRecommended < 25) {
      alerts.push({
        id: `critically-low-${item.id}`,
        type: 'critical',
        message: 'Critically low stock',
        itemName: item.name,
      });
    } else if (percentOfRecommended < 50) {
      alerts.push({
        id: `low-stock-${item.id}`,
        type: 'warning',
        message: 'Running low on stock',
        itemName: item.name,
      });
    }
  });

  return alerts;
}

/**
 * Generate alerts for items with critical status
 */
function generateCriticalItemAlerts(items: InventoryItem[]): Alert[] {
  const alerts: Alert[] = [];

  items.forEach((item) => {
    const status = calculateItemStatus(item);
    if (status === 'critical') {
      // Check if we already have an expiration or stock alert for this item
      const hasExpirationIssue = item.expirationDate && !item.neverExpires;
      const hasStockIssue = item.quantity < item.recommendedQuantity * 0.5;

      if (!hasExpirationIssue && !hasStockIssue) {
        alerts.push({
          id: `critical-${item.id}`,
          type: 'critical',
          message: 'Needs attention',
          itemName: item.name,
        });
      }
    }
  });

  return alerts;
}

/**
 * Generate all alerts for dashboard
 */
export function generateDashboardAlerts(items: InventoryItem[]): Alert[] {
  const expirationAlerts = generateExpirationAlerts(items);
  const lowStockAlerts = generateLowStockAlerts(items);
  const criticalAlerts = generateCriticalItemAlerts(items);

  // Combine and deduplicate alerts
  const allAlerts = [...expirationAlerts, ...lowStockAlerts, ...criticalAlerts];

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
