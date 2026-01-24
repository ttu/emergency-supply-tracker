import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useInventory } from '@/features/inventory';
import { STANDARD_CATEGORIES } from '@/features/categories';
import { Button } from '@/shared/components/Button';
import styles from './DisabledCategories.module.css';

export function DisabledCategories() {
  const { t } = useTranslation(['common', 'categories']);
  const { disabledCategories, enableCategory, enableAllCategories } =
    useInventory();

  // Get the disabled categories with their details
  // Store the original StandardCategoryId from disabledCategories for type safety
  const disabledCategoryDetails = useMemo(() => {
    return disabledCategories
      .map((id) => {
        const category = STANDARD_CATEGORIES.find((cat) => cat.id === id);
        if (!category) return null;
        return {
          id, // Keep original StandardCategoryId for enableCategory call
          name: t(id, { ns: 'categories' }),
          icon: category.icon,
        };
      })
      .filter(
        (category): category is NonNullable<typeof category> =>
          category !== null,
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [disabledCategories, t]);

  if (disabledCategoryDetails.length === 0) {
    return (
      <div className={styles.container}>
        <p className={styles.emptyMessage}>
          {t('settings.disabledCategories.empty')}
        </p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <p className={styles.description}>
        {t('settings.disabledCategories.description', {
          count: disabledCategoryDetails.length,
        })}
      </p>
      <ul className={styles.categoryList}>
        {disabledCategoryDetails.map((category) => (
          <li key={category.id} className={styles.categoryItem}>
            <div className={styles.categoryContent}>
              <span className={styles.categoryIcon}>{category.icon}</span>
              <span className={styles.categoryName}>{category.name}</span>
            </div>
            <Button
              variant="secondary"
              size="small"
              className={styles.enableButton}
              onClick={() => enableCategory(category.id)}
              aria-label={`${t('settings.disabledCategories.reactivate')}: ${category.name}`}
            >
              {t('settings.disabledCategories.reactivate')}
            </Button>
          </li>
        ))}
      </ul>
      {disabledCategoryDetails.length > 1 && (
        <div className={styles.enableAllContainer}>
          <Button variant="secondary" onClick={enableAllCategories}>
            {t('settings.disabledCategories.reactivateAll')}
          </Button>
        </div>
      )}
    </div>
  );
}
