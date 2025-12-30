import { createContext } from 'react';
import type { InventoryItem, Category } from '../types';

export interface InventoryContextValue {
  items: InventoryItem[];
  categories: Category[];
  addItem: (
    item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>,
  ) => void;
  addItems: (items: InventoryItem[]) => void;
  updateItem: (id: string, updates: Partial<InventoryItem>) => void;
  deleteItem: (id: string) => void;
  // Alert dismissal
  dismissedAlertIds: string[];
  dismissAlert: (alertId: string) => void;
  reactivateAlert: (alertId: string) => void;
  reactivateAllAlerts: () => void;
  // Disabled recommended items
  disabledRecommendedItems: string[];
  disableRecommendedItem: (itemId: string) => void;
  enableRecommendedItem: (itemId: string) => void;
  enableAllRecommendedItems: () => void;
}

export const InventoryContext = createContext<
  InventoryContextValue | undefined
>(undefined);
