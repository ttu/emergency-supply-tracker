import { useMemo } from 'react';
import { useInventory } from './useInventory';
import {
  useHousehold,
  calculateRecommendedQuantity,
} from '@/features/household';
import { getItemStatus } from '@/shared/utils/calculations/status';
import { RECOMMENDED_ITEMS } from '@/data/recommendedItems';

export interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  message: string;
  itemId?: string;
}

export function useAlerts() {
  const { items } = useInventory();
  const { household } = useHousehold();

  const alerts = useMemo<Alert[]>(() => {
    const alertList: Alert[] = [];

    // Check each inventory item for critical/warning status
    items.forEach((item) => {
      const status = getItemStatus(
        item.quantity,
        item.recommendedQuantity,
        item.expirationDate,
        item.neverExpires,
      );

      if (status === 'critical') {
        if (item.quantity === 0) {
          alertList.push({
            id: `${item.id}-empty`,
            type: 'critical',
            message: `${item.name} is out of stock`,
            itemId: item.id,
          });
        } else if (
          !item.neverExpires &&
          item.expirationDate &&
          new Date(item.expirationDate) < new Date()
        ) {
          alertList.push({
            id: `${item.id}-expired`,
            type: 'critical',
            message: `${item.name} has expired`,
            itemId: item.id,
          });
        }
      } else if (status === 'warning') {
        if (item.quantity < item.recommendedQuantity * 0.5) {
          alertList.push({
            id: `${item.id}-low`,
            type: 'warning',
            message: `${item.name} is below 50% of recommended quantity`,
            itemId: item.id,
          });
        } else if (item.expirationDate) {
          const daysUntilExpiration = Math.floor(
            (new Date(item.expirationDate).getTime() - new Date().getTime()) /
              (1000 * 60 * 60 * 24),
          );
          if (daysUntilExpiration <= 30) {
            alertList.push({
              id: `${item.id}-expiring`,
              type: 'warning',
              message: `${item.name} expires in ${daysUntilExpiration} days`,
              itemId: item.id,
            });
          }
        }
      }
    });

    // Check for missing recommended items
    const inventoryItemTemplateIds = new Set(
      items.map((item) => item.productTemplateId).filter(Boolean),
    );

    RECOMMENDED_ITEMS.forEach((recommendedItem) => {
      // Skip freezer items if household doesn't use a freezer
      if (recommendedItem.requiresFreezer && !household.useFreezer) {
        return;
      }

      if (!inventoryItemTemplateIds.has(recommendedItem.id)) {
        const recommendedQty = calculateRecommendedQuantity(
          recommendedItem,
          household,
        );
        alertList.push({
          id: `missing-${recommendedItem.id}`,
          type: 'info',
          message: `Consider adding ${recommendedItem.i18nKey} (recommended: ${recommendedQty} ${recommendedItem.unit})`,
        });
      }
    });

    return alertList;
  }, [items, household]);

  const criticalAlerts = alerts.filter((alert) => alert.type === 'critical');
  const warningAlerts = alerts.filter((alert) => alert.type === 'warning');
  const infoAlerts = alerts.filter((alert) => alert.type === 'info');

  return {
    alerts,
    criticalAlerts,
    warningAlerts,
    infoAlerts,
    hasAlerts: alerts.length > 0,
    hasCritical: criticalAlerts.length > 0,
  };
}
