import { useState, useEffect, ReactNode } from 'react';
import type { InventoryItem, Category } from '../types';
import { STANDARD_CATEGORIES } from '../data/standardCategories';
import { getAppData, saveAppData } from '../utils/storage/localStorage';
import { InventoryContext } from './InventoryContext';
import {
  trackItemAdded,
  trackItemDeleted,
  trackItemsBulkAdded,
} from '../utils/analytics/localAnalytics';

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<InventoryItem[]>(() => {
    const data = getAppData();
    return data?.items || [];
  });
  const [categories] = useState<Category[]>(STANDARD_CATEGORIES);

  // Save to localStorage on change
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
      lastModified: new Date().toISOString(),
    };
    data.items = items;
    data.lastModified = new Date().toISOString();
    saveAppData(data);
  }, [items]);

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

  return (
    <InventoryContext.Provider
      value={{ items, categories, addItem, addItems, updateItem, deleteItem }}
    >
      {children}
    </InventoryContext.Provider>
  );
}
