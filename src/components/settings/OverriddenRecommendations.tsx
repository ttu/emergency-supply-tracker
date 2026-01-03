import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useInventory } from '@/shared/hooks/useInventory';
import { RECOMMENDED_ITEMS } from '@/data/recommendedItems';
import { Button } from '@/shared/components/Button';
import styles from './HiddenAlerts.module.css';

export function OverriddenRecommendations() {
  const { t } = useTranslation(['common', 'products', 'categories']);
  const { items, updateItem } = useInventory();

  // Get items that are marked as enough and match recommended items
  const overriddenItems = useMemo(() => {
    return items
      .filter((item) => item.markedAsEnough)
      .map((item) => {
        // Try to find matching recommended item
        const recommendedItem = RECOMMENDED_ITEMS.find(
          (rec) =>
            rec.id === item.productTemplateId ||
            rec.id === item.itemType?.toLowerCase().replace(/\s+/g, '-'),
        );

        if (!recommendedItem) {
          // If no match found, still show the item with its name
          return {
            id: item.id,
            name: item.name,
            category: item.categoryId
              ? t(item.categoryId, { ns: 'categories' })
              : '',
            inventoryItem: item,
          };
        }

        return {
          id: item.id,
          name: t(recommendedItem.i18nKey.replace('products.', ''), {
            ns: 'products',
          }),
          category: t(recommendedItem.category, { ns: 'categories' }),
          inventoryItem: item,
        };
      })
      .filter((item) => item !== null);
  }, [items, t]);

  const handleUnmark = (itemId: string) => {
    updateItem(itemId, { markedAsEnough: false });
  };

  const handleUnmarkAll = () => {
    overriddenItems.forEach((item) => {
      updateItem(item.inventoryItem.id, { markedAsEnough: false });
    });
  };

  if (overriddenItems.length === 0) {
    return (
      <div className={styles.container}>
        <p className={styles.emptyMessage}>
          {t('settings.overriddenRecommendations.empty')}
        </p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <p className={styles.description}>
        {t('settings.overriddenRecommendations.description', {
          count: overriddenItems.length,
        })}
      </p>
      <ul className={styles.alertsList} role="list">
        {overriddenItems.map((item) => (
          <li key={item.id} className={styles.alertItem}>
            <div className={styles.alertContent}>
              <span className={styles.alertMessage}>
                <strong>{item.name}</strong>
                <span style={{ color: 'var(--color-text-secondary)' }}>
                  {' '}
                  ({item.category})
                </span>
              </span>
            </div>
            <Button
              variant="secondary"
              size="small"
              className={styles.reactivateButton}
              onClick={() => handleUnmark(item.inventoryItem.id)}
              aria-label={`${t('settings.overriddenRecommendations.unmark')}: ${item.name}`}
            >
              {t('settings.overriddenRecommendations.unmark')}
            </Button>
          </li>
        ))}
      </ul>
      {overriddenItems.length > 1 && (
        <div className={styles.reactivateAllContainer}>
          <Button variant="secondary" onClick={handleUnmarkAll}>
            {t('settings.overriddenRecommendations.unmarkAll')}
          </Button>
        </div>
      )}
    </div>
  );
}
