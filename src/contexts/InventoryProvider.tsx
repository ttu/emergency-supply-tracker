import { useState, useEffect, ReactNode, useCallback } from 'react';
import type { InventoryItem, Category } from '../types';
import { STANDARD_CATEGORIES } from '../data/standardCategories';
import { getAppData, saveAppData } from '../utils/storage/localStorage';
import { InventoryContext } from './InventoryContext';

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

  // Save items to localStorage on change
  useEffect(() => {
    const data = getAppData() || {
      version: '1.0.0',
      household: {
        adults: 2,
        children: 0,
        supplyDurationDays: 7,
        useFreezer: false,
      },
      settings: {
        language: 'en',
        theme: 'light',
        advancedFeatures: {
          calorieTracking: false,
          powerManagement: false,
          waterTracking: false,
        },
      },
      customCategories: [], // Only custom categories, STANDARD_CATEGORIES are always available
      items: [],
      customTemplates: [],
      dismissedAlertIds: [],
      lastModified: new Date().toISOString(),
    };
    data.items = items;
    data.lastModified = new Date().toISOString();
    saveAppData(data);
  }, [items]);

  // Save dismissedAlertIds to localStorage on change
  useEffect(() => {
    const data = getAppData();
    if (data) {
      data.dismissedAlertIds = dismissedAlertIds;
      data.lastModified = new Date().toISOString();
      saveAppData(data);
    }
  }, [dismissedAlertIds]);

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
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const addItems = (newItems: InventoryItem[]) => {
    setItems((prev) => [...prev, ...newItems]);
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
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
}
