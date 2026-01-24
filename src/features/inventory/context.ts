import { createContext } from 'react';
import type {
  InventoryItem,
  Category,
  ItemId,
  AlertId,
  ProductTemplateId,
  StandardCategoryId,
} from '@/shared/types';

export interface InventoryContextValue {
  items: InventoryItem[];
  categories: Category[];
  addItem: (
    item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>,
  ) => void;
  addItems: (items: InventoryItem[]) => void;
  updateItem: (id: ItemId, updates: Partial<InventoryItem>) => void;
  deleteItem: (id: ItemId) => void;
  // Alert dismissal
  dismissedAlertIds: AlertId[];
  dismissAlert: (alertId: AlertId) => void;
  reactivateAlert: (alertId: AlertId) => void;
  reactivateAllAlerts: () => void;
  // Disabled recommended items
  disabledRecommendedItems: ProductTemplateId[];
  disableRecommendedItem: (itemId: ProductTemplateId) => void;
  enableRecommendedItem: (itemId: ProductTemplateId) => void;
  enableAllRecommendedItems: () => void;
  // Disabled categories
  disabledCategories: StandardCategoryId[];
  disableCategory: (categoryId: StandardCategoryId) => void;
  enableCategory: (categoryId: StandardCategoryId) => void;
  enableAllCategories: () => void;
}

export const InventoryContext = createContext<
  InventoryContextValue | undefined
>(undefined);
