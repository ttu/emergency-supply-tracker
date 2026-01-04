import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useInventory } from '@/shared/hooks/useInventory';
import { RECOMMENDED_ITEMS } from '@/features/templates';
import { Button } from '@/shared/components/Button';
import styles from './DisabledRecommendations.module.css';

export function DisabledRecommendations() {
  const { t } = useTranslation(['common', 'products', 'categories']);
  const {
    disabledRecommendedItems,
    enableRecommendedItem,
    enableAllRecommendedItems,
  } = useInventory();

  // Get the disabled recommended items with their details
  const disabledItems = useMemo(() => {
    return disabledRecommendedItems
      .map((id) => {
        const item = RECOMMENDED_ITEMS.find((rec) => rec.id === id);
        if (!item) return null;
        return {
          id: item.id,
          name: t(item.i18nKey.replace('products.', ''), { ns: 'products' }),
          category: t(item.category, { ns: 'categories' }),
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [disabledRecommendedItems, t]);

  if (disabledItems.length === 0) {
    return (
      <div className={styles.container}>
        <p className={styles.emptyMessage}>
          {t('settings.disabledRecommendations.empty')}
        </p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <p className={styles.description}>
        {t('settings.disabledRecommendations.description', {
          count: disabledItems.length,
        })}
      </p>
      <ul className={styles.alertsList} role="list">
        {disabledItems.map((item) => (
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
              onClick={() => enableRecommendedItem(item.id)}
              aria-label={`${t('settings.disabledRecommendations.reactivate')}: ${item.name}`}
            >
              {t('settings.disabledRecommendations.reactivate')}
            </Button>
          </li>
        ))}
      </ul>
      {disabledItems.length > 1 && (
        <div className={styles.reactivateAllContainer}>
          <Button variant="secondary" onClick={enableAllRecommendedItems}>
            {t('settings.disabledRecommendations.reactivateAll')}
          </Button>
        </div>
      )}
    </div>
  );
}
