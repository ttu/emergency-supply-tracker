import { useTranslation } from 'react-i18next';
import { useInventory } from '@/features/inventory';
import { Button } from '@/shared/components/Button';
import type { Category } from '@/shared/types';
import styles from './CategoryList.module.css';

export interface CategoryListProps {
  onEdit: (category: Category) => void;
}

export function CategoryList({ onEdit }: CategoryListProps) {
  const { t, i18n } = useTranslation('common');
  const { customCategories, deleteCustomCategory } = useInventory();

  const getCategoryName = (category: Category): string => {
    const lang = i18n.language as 'en' | 'fi';
    if (category.names) {
      return (
        category.names[lang] ||
        category.names.en ||
        category.name ||
        category.id
      );
    }
    return category.name || category.id;
  };

  const handleDelete = (category: Category) => {
    const confirmed = window.confirm(
      t('settings.customCategories.confirmDelete'),
    );
    if (confirmed) {
      const result = deleteCustomCategory(category.id);
      if (!result.success && result.error) {
        window.alert(result.error);
      }
    }
  };

  if (customCategories.length === 0) {
    return (
      <div className={styles.container}>
        <p className={styles.emptyMessage}>
          {t('settings.customCategories.empty')}
        </p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <p className={styles.description}>
        {t('settings.customCategories.description', {
          count: customCategories.length,
        })}
      </p>
      <ul className={styles.categoryList}>
        {customCategories.map((category) => {
          const name = getCategoryName(category);
          return (
            <li key={category.id} className={styles.categoryItem}>
              <div className={styles.categoryContent}>
                <span className={styles.categoryIcon}>{category.icon}</span>
                <span className={styles.categoryName}>{name}</span>
              </div>
              <div className={styles.buttonGroup}>
                <Button
                  variant="secondary"
                  size="small"
                  className={styles.actionButton}
                  onClick={() => onEdit(category)}
                  aria-label={`${t('settings.customCategories.edit')}: ${name}`}
                >
                  {t('settings.customCategories.edit')}
                </Button>
                <Button
                  variant="danger"
                  size="small"
                  className={styles.actionButton}
                  onClick={() => handleDelete(category)}
                  aria-label={`${t('settings.customCategories.delete')}: ${name}`}
                >
                  {t('settings.customCategories.delete')}
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
