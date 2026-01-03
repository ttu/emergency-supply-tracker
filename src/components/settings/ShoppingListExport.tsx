import { useTranslation } from 'react-i18next';
import { useInventory } from '@/shared/hooks/useInventory';
import { Button } from '@/shared/components/Button';
import type { InventoryItem } from '@/shared/types';
import { STANDARD_CATEGORIES } from '@/features/categories';
import styles from './ShoppingListExport.module.css';

export function ShoppingListExport() {
  const { t } = useTranslation();
  const { items } = useInventory();

  const getItemsNeedingRestock = (): InventoryItem[] => {
    return items.filter((item) => item.quantity < item.recommendedQuantity);
  };

  const generateShoppingList = (): string => {
    const itemsToRestock = getItemsNeedingRestock();

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
      .sort()
      .forEach((categoryId) => {
        const category = STANDARD_CATEGORIES.find((c) => c.id === categoryId);
        const categoryName = category
          ? t(`categories.${category.standardCategoryId}`)
          : categoryId;

        list += `${category?.icon || '📦'} ${categoryName}\n`;
        list += '─'.repeat(40) + '\n';

        byCategory[categoryId].forEach((item) => {
          const needed = item.recommendedQuantity - item.quantity;
          list += `□ ${item.name}: ${needed} ${t(`units.${item.unit}`)}\n`;
          list += `  ${t('settings.shoppingList.current')}: ${item.quantity}, ${t('settings.shoppingList.recommended')}: ${item.recommendedQuantity}\n`;
        });

        list += '\n';
      });

    return list;
  };

  const handleExport = () => {
    const itemsToRestock = getItemsNeedingRestock();

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

  const itemsToRestock = getItemsNeedingRestock();

  return (
    <div className={styles.container}>
      <Button
        variant="secondary"
        onClick={handleExport}
        disabled={itemsToRestock.length === 0}
      >
        {t('settings.shoppingList.button')}
      </Button>
      <p className={styles.description}>
        {t('settings.shoppingList.description')}
        {itemsToRestock.length > 0 && (
          <span className={styles.count}>
            {' '}
            ({itemsToRestock.length} {t('settings.shoppingList.items')})
          </span>
        )}
      </p>
    </div>
  );
}
