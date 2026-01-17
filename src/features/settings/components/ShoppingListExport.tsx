import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/components/Button';
import { useShoppingListExport } from '../hooks';
import styles from './ShoppingListExport.module.css';

export function ShoppingListExport() {
  const { t } = useTranslation();
  const { itemsToRestock, handleExport } = useShoppingListExport();

  return (
    <div className={styles.container}>
      <Button
        variant="secondary"
        onClick={handleExport}
        disabled={itemsToRestock.length === 0}
        data-testid="export-shopping-list-button"
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
