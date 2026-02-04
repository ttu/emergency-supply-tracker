import { createContext } from 'react';
import type {
  InventoryItem,
  Category,
  ItemId,
  AlertId,
  ProductTemplateId,
  StandardCategoryId,
  CategoryId,
  ProductTemplate,
} from '@/shared/types';
import type { CreateProductTemplateInput } from '@/features/templates/factories/ProductTemplateFactory';

export interface InventoryContextValue {
  items: InventoryItem[];
  categories: Category[];
  customCategories: Category[];
  addItem: (
    item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>,
  ) => void;
  addItems: (items: InventoryItem[]) => void;
  updateItem: (id: ItemId, updates: Partial<InventoryItem>) => void;
  deleteItem: (id: ItemId) => void;
  // Alert dismissal
  dismissedAlertIds: AlertId[];
  dismissAlert: (alertId: AlertId) => void;
  /** Dismiss multiple alerts in one go (no per-alert notification). */
  dismissAlerts: (alertIds: AlertId[]) => void;
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
  // Custom categories
  addCustomCategory: (category: Omit<Category, 'id'>) => void;
  updateCustomCategory: (id: CategoryId, updates: Partial<Category>) => void;
  deleteCustomCategory: (id: CategoryId) => {
    success: boolean;
    error?: string;
  };
  // Custom templates
  customTemplates: ProductTemplate[];
  addCustomTemplate: (
    input: Omit<CreateProductTemplateInput, 'isBuiltIn' | 'isCustom'>,
  ) => ProductTemplate | undefined;
  updateCustomTemplate: (
    id: ProductTemplateId,
    updates: Partial<
      Pick<
        ProductTemplate,
        | 'name'
        | 'names'
        | 'category'
        | 'defaultUnit'
        | 'neverExpires'
        | 'defaultExpirationMonths'
        | 'weightGrams'
        | 'caloriesPerUnit'
        | 'caloriesPer100g'
        | 'requiresWaterLiters'
      >
    >,
  ) => void;
  deleteCustomTemplate: (id: ProductTemplateId) => void;
}

export const InventoryContext = createContext<
  InventoryContextValue | undefined
>(undefined);
