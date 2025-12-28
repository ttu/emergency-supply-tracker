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
}

export const InventoryContext = createContext<
  InventoryContextValue | undefined
>(undefined);
