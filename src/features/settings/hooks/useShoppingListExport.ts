import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useInventory } from '@/features/inventory';
import { useHousehold } from '@/features/household';
import { useRecommendedItems } from '@/features/templates';
import { useSettings } from './useSettings';
import type { InventoryItem } from '@/shared/types';
import { STANDARD_CATEGORIES } from '@/features/categories';
import { getRecommendedQuantityForItem } from '@/shared/utils/calculations/itemRecommendedQuantity';
import { CHILDREN_REQUIREMENT_MULTIPLIER } from '@/shared/utils/constants';

export interface UseShoppingListExportResult {
  /** Items that need restocking (quantity below recommended) */
  itemsToRestock: InventoryItem[];
  /** Generate the shopping list text content */
  generateShoppingList: () => string;
  /** Export the shopping list as a downloadable file */
  handleExport: () => void;
}

/**
 * Hook for shopping list export functionality.
 * Identifies items needing restock and provides export capabilities.
 */
export function useShoppingListExport(): UseShoppingListExportResult {
  const { t } = useTranslation();
  const { items } = useInventory();
  const { household } = useHousehold();
  const { recommendedItems } = useRecommendedItems();
  const { settings } = useSettings();

  // Extract children multiplier to avoid duplication
  // Use nullish coalescing to preserve 0% as a valid value
  const childrenMultiplier =
    (settings.childrenRequirementPercentage ??
      CHILDREN_REQUIREMENT_MULTIPLIER * 100) / 100;

  // Memoize items needing restock to avoid redundant computation
  const itemsToRestock = useMemo(() => {
    return items.filter((item) => {
      // Skip items marked as enough by the user
      if (item.markedAsEnough) {
        return false;
      }
      const recommendedQuantity = getRecommendedQuantityForItem(
        item,
        household,
        recommendedItems,
        childrenMultiplier,
      );
      return item.quantity < recommendedQuantity;
    });
  }, [items, household, recommendedItems, childrenMultiplier]);

  const generateShoppingList = (): string => {
    if (itemsToRestock.length === 0) {
      return t('settings.shoppingList.noItems');
    }

    const header = `${t('settings.shoppingList.title')}\n${t('settings.shoppingList.generated')}: ${new Date().toLocaleDateString()}\n\n`;

    // Group by category
    const byCategory = itemsToRestock.reduce(
      (acc, item) => {
        if (!acc[item.categoryId]) {
          acc[item.categoryId] = [];
        }
        acc[item.categoryId].push(item);
        return acc;
      },
      {} as Record<string, InventoryItem[]>,
    );

    let list = header;

    // Sort categories and generate list
    Object.keys(byCategory)
      .sort((a, b) => a.localeCompare(b))
      .forEach((categoryId) => {
        const category = STANDARD_CATEGORIES.find((c) => c.id === categoryId);
        const categoryName = category
          ? t(`categories.${category.id}`)
          : categoryId;

        list += `${category?.icon || '📦'} ${categoryName}\n`;
        list += '─'.repeat(40) + '\n';

        byCategory[categoryId].forEach((item) => {
          const recommendedQuantity = getRecommendedQuantityForItem(
            item,
            household,
            recommendedItems,
            childrenMultiplier,
          );
          const needed = recommendedQuantity - item.quantity;
          list += `□ ${item.name}: ${needed} ${t(`units.${item.unit}`)}\n`;
          list += `  ${t('settings.shoppingList.current')}: ${item.quantity}, ${t('settings.shoppingList.recommended')}: ${recommendedQuantity}\n`;
        });

        list += '\n';
      });

    return list;
  };

  const handleExport = () => {
    if (itemsToRestock.length === 0) {
      alert(t('settings.shoppingList.noItemsAlert'));
      return;
    }

    const text = generateShoppingList();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `shopping-list-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return {
    itemsToRestock,
    generateShoppingList,
    handleExport,
  };
}
