import { ReactNode, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type {
  InventoryItem,
  Category,
  ItemId,
  AlertId,
  ProductTemplateId,
  StandardCategoryId,
  CategoryId,
} from '@/shared/types';
import {
  createAlertId,
  createProductTemplateId,
  VALID_CATEGORIES,
} from '@/shared/types';
import { STANDARD_CATEGORIES, canDeleteCategory } from '@/features/categories';
import { CategoryFactory } from '@/features/categories/factories/CategoryFactory';
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
  const [customCategories, setCustomCategories] = useLocalStorageSync(
    'customCategories',
    (data) => {
      return data?.customCategories || [];
    },
  );
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
  const [disabledCategories, setDisabledCategories] = useLocalStorageSync(
    'disabledCategories',
    (data) => {
      return (data?.disabledCategories || []).filter(
        (id): id is StandardCategoryId =>
          (VALID_CATEGORIES as readonly string[]).includes(id),
      );
    },
  );

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

  const disableCategory = useCallback(
    (categoryId: StandardCategoryId) => {
      setDisabledCategories((prev) =>
        prev.includes(categoryId) ? prev : [...prev, categoryId],
      );
    },
    [setDisabledCategories],
  );

  const enableCategory = useCallback(
    (categoryId: StandardCategoryId) => {
      setDisabledCategories((prev) => prev.filter((id) => id !== categoryId));
    },
    [setDisabledCategories],
  );

  const enableAllCategories = useCallback(() => {
    setDisabledCategories([]);
  }, [setDisabledCategories]);

  // Combine standard and custom categories, filtering out disabled standard ones
  const categories = useMemo(() => {
    const disabledSet = new Set(disabledCategories);
    const activeStandard = STANDARD_CATEGORIES.filter(
      (c) => !disabledSet.has(c.id as StandardCategoryId),
    );
    return [...activeStandard, ...customCategories];
  }, [disabledCategories, customCategories]);

  // Add custom category
  const addCustomCategory = useCallback(
    (input: Omit<Category, 'id'>) => {
      const newCategory = CategoryFactory.createCustom(input, customCategories);
      setCustomCategories((prev) => [...prev, newCategory]);
      showNotification(
        t('notifications.categoryAdded', { name: input.name }),
        'success',
      );
    },
    [customCategories, setCustomCategories, showNotification, t],
  );

  // Update custom category
  const updateCustomCategory = useCallback(
    (id: CategoryId, updates: Partial<Category>) => {
      setCustomCategories((prev) =>
        prev.map((cat) => (cat.id === id ? { ...cat, ...updates } : cat)),
      );
      showNotification(t('notifications.categoryUpdated'), 'success');
    },
    [setCustomCategories, showNotification, t],
  );

  // Delete custom category
  const deleteCustomCategory = useCallback(
    (id: CategoryId): { success: boolean; error?: string } => {
      const result = canDeleteCategory(id, items);
      if (!result.canDelete) {
        return {
          success: false,
          error: t('settings.categories.deleteBlocked', {
            count: result.blockingItems?.length,
          }),
        };
      }

      setCustomCategories((prev) => prev.filter((cat) => cat.id !== id));
      showNotification(t('notifications.categoryDeleted'), 'success');
      return { success: true };
    },
    [items, setCustomCategories, showNotification, t],
  );

  return (
    <InventoryContext.Provider
      value={{
        items,
        categories,
        customCategories,
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
        disabledCategories,
        disableCategory,
        enableCategory,
        enableAllCategories,
        addCustomCategory,
        updateCustomCategory,
        deleteCustomCategory,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
}
