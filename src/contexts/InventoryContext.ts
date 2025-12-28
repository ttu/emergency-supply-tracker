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
}

export const InventoryContext = createContext<
  InventoryContextValue | undefined
>(undefined);
