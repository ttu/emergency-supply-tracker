import { useState, useEffect, ReactNode, useCallback } from 'react';
import type { InventoryItem, Category } from '@/shared/types';
import { STANDARD_CATEGORIES } from '@/features/categories';
import {
  getAppData,
  saveAppData,
  createDefaultAppData,
} from '@/shared/utils/storage/localStorage';
import { InventoryContext } from './InventoryContext';
import {
  trackItemAdded,
  trackItemDeleted,
  trackItemsBulkAdded,
} from '@/shared/utils/analytics';

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<InventoryItem[]>(() => {
    const data = getAppData();
    return data?.items || [];
  });
  const [categories] = useState<Category[]>(STANDARD_CATEGORIES);
  const [dismissedAlertIds, setDismissedAlertIds] = useState<string[]>(() => {
    const data = getAppData();
    return data?.dismissedAlertIds || [];
  });
  const [disabledRecommendedItems, setDisabledRecommendedItems] = useState<
    string[]
  >(() => {
    const data = getAppData();
    return data?.disabledRecommendedItems || [];
  });

  // Save items, dismissedAlertIds, and disabledRecommendedItems to localStorage on change
  // Consolidated into single effect to avoid race conditions
  useEffect(() => {
    const data = getAppData() || createDefaultAppData();
    data.items = items;
    data.dismissedAlertIds = dismissedAlertIds;
    data.disabledRecommendedItems = disabledRecommendedItems;
    data.lastModified = new Date().toISOString();
    saveAppData(data);
  }, [items, dismissedAlertIds, disabledRecommendedItems]);

  const addItem = (
    item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>,
  ) => {
    const now = new Date().toISOString();
    const newItem: InventoryItem = {
      ...item,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    setItems((prev) => [...prev, newItem]);
    trackItemAdded(item.name, item.categoryId);
  };

  const updateItem = (id: string, updates: Partial<InventoryItem>) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, ...updates, updatedAt: new Date().toISOString() }
          : item,
      ),
    );
  };

  const deleteItem = (id: string) => {
    const itemToDelete = items.find((item) => item.id === id);
    setItems((prev) => prev.filter((item) => item.id !== id));
    if (itemToDelete) {
      trackItemDeleted(itemToDelete.name, itemToDelete.categoryId);
    }
  };

  const addItems = (newItems: InventoryItem[]) => {
    setItems((prev) => [...prev, ...newItems]);
    if (newItems.length > 0) {
      trackItemsBulkAdded(newItems.length);
    }
  };

  const dismissAlert = useCallback((alertId: string) => {
    setDismissedAlertIds((prev) =>
      prev.includes(alertId) ? prev : [...prev, alertId],
    );
  }, []);

  const reactivateAlert = useCallback((alertId: string) => {
    setDismissedAlertIds((prev) => prev.filter((id) => id !== alertId));
  }, []);

  const reactivateAllAlerts = useCallback(() => {
    setDismissedAlertIds([]);
  }, []);

  const disableRecommendedItem = useCallback((itemId: string) => {
    setDisabledRecommendedItems((prev) =>
      prev.includes(itemId) ? prev : [...prev, itemId],
    );
  }, []);

  const enableRecommendedItem = useCallback((itemId: string) => {
    setDisabledRecommendedItems((prev) => prev.filter((id) => id !== itemId));
  }, []);

  const enableAllRecommendedItems = useCallback(() => {
    setDisabledRecommendedItems([]);
  }, []);

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
