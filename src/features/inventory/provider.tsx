import { useState, ReactNode, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type {
  InventoryItem,
  Category,
  ItemId,
  AlertId,
  ProductTemplateId,
} from '@/shared/types';
import { createAlertId, createProductTemplateId } from '@/shared/types';
import { STANDARD_CATEGORIES } from '@/features/categories';
import { useLocalStorageSync } from '@/shared/hooks';
import { InventoryContext } from './context';
import {
  trackItemAdded,
  trackItemDeleted,
  trackItemsBulkAdded,
} from '@/shared/utils/analytics';
import { InventoryItemFactory } from './factories/InventoryItemFactory';
import { useNotification } from '@/shared/hooks/useNotification';

export function InventoryProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  // Call useNotification unconditionally at top level (Rules of Hooks)
  const notification = useNotification();
  // Defensively derive showNotification with fallback, memoized to avoid dependency issues
  const showNotification = useMemo(
    () => notification?.showNotification ?? (() => {}),
    [notification?.showNotification],
  );
  const [items, setItems] = useLocalStorageSync('items', (data) => {
    return data?.items || [];
  });
  const [categories] = useState<Category[]>(STANDARD_CATEGORIES);
  const [dismissedAlertIds, setDismissedAlertIds] = useLocalStorageSync(
    'dismissedAlertIds',
    (data) => {
      return (data?.dismissedAlertIds || []).map(createAlertId);
    },
  );
  const [disabledRecommendedItems, setDisabledRecommendedItems] =
    useLocalStorageSync('disabledRecommendedItems', (data) => {
      return (data?.disabledRecommendedItems || []).map(
        createProductTemplateId,
      );
    });

  const addItem = useCallback(
    (item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => {
      const newItem = InventoryItemFactory.create(item);
      setItems((prev) => [...prev, newItem]);
      trackItemAdded(item.name, item.categoryId);
      showNotification(
        t('notifications.itemAdded', { name: item.name }),
        'success',
      );
    },
    [setItems, showNotification, t],
  );

  const updateItem = useCallback(
    (id: ItemId, updates: Partial<InventoryItem>) => {
      const item = items.find((i) => i.id === id);
      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, ...updates, updatedAt: new Date().toISOString() }
            : item,
        ),
      );
      if (item) {
        showNotification(
          t('notifications.itemUpdated', { name: item.name }),
          'success',
        );
      }
    },
    [items, setItems, showNotification, t],
  );

  const deleteItem = useCallback(
    (id: ItemId) => {
      const itemToDelete = items.find((item) => item.id === id);
      setItems((prev) => prev.filter((item) => item.id !== id));
      if (itemToDelete) {
        trackItemDeleted(itemToDelete.name, itemToDelete.categoryId);
        showNotification(
          t('notifications.itemDeleted', { name: itemToDelete.name }),
          'info',
        );
      }
    },
    [items, setItems, showNotification, t],
  );

  const addItems = useCallback(
    (newItems: InventoryItem[]) => {
      setItems((prev) => [...prev, ...newItems]);
      if (newItems.length > 0) {
        trackItemsBulkAdded(newItems.length);
        showNotification(
          t('notifications.itemsBulkAdded', { count: newItems.length }),
          'success',
        );
      }
    },
    [setItems, showNotification, t],
  );

  const dismissAlert = useCallback(
    (alertId: AlertId) => {
      setDismissedAlertIds((prev) =>
        prev.includes(alertId) ? prev : [...prev, alertId],
      );
    },
    [setDismissedAlertIds],
  );

  const reactivateAlert = useCallback(
    (alertId: AlertId) => {
      setDismissedAlertIds((prev) => prev.filter((id) => id !== alertId));
    },
    [setDismissedAlertIds],
  );

  const reactivateAllAlerts = useCallback(() => {
    setDismissedAlertIds([]);
  }, [setDismissedAlertIds]);

  const disableRecommendedItem = useCallback(
    (itemId: ProductTemplateId) => {
      setDisabledRecommendedItems((prev) =>
        prev.includes(itemId) ? prev : [...prev, itemId],
      );
    },
    [setDisabledRecommendedItems],
  );

  const enableRecommendedItem = useCallback(
    (itemId: ProductTemplateId) => {
      setDisabledRecommendedItems((prev) => prev.filter((id) => id !== itemId));
    },
    [setDisabledRecommendedItems],
  );

  const enableAllRecommendedItems = useCallback(() => {
    setDisabledRecommendedItems([]);
  }, [setDisabledRecommendedItems]);

  return (
    <InventoryContext.Provider
      value={{
        items,
        categories,
        addItem,
        addItems,
        updateItem,
        deleteItem,
        dismissedAlertIds,
        dismissAlert,
        reactivateAlert,
        reactivateAllAlerts,
        disabledRecommendedItems,
        disableRecommendedItem,
        enableRecommendedItem,
        enableAllRecommendedItems,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
}
