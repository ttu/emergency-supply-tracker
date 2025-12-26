import { useTranslation } from 'react-i18next';
import type { Category } from '../../types';
import styles from './CategoryNav.module.css';

export interface CategoryNavProps {
  categories: Category[];
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string | null) => void;
}

export const CategoryNav = ({
  categories,
  selectedCategoryId,
  onSelectCategory,
}: CategoryNavProps) => {
  const { t } = useTranslation(['common', 'categories']);

  return (
    <nav className={styles.nav} aria-label={t('inventory.categoryNavigation')}>
      <button
        className={`${styles.categoryButton} ${
          selectedCategoryId === null ? styles.active : ''
        }`}
        onClick={() => onSelectCategory(null)}
        aria-current={selectedCategoryId === null ? 'page' : undefined}
      >
        <span className={styles.icon}>📦</span>
        <span className={styles.label}>{t('inventory.allCategories')}</span>
      </button>

      {categories.map((category) => (
        <button
          key={category.id}
          className={`${styles.categoryButton} ${
            selectedCategoryId === category.id ? styles.active : ''
          }`}
          onClick={() => onSelectCategory(category.id)}
          aria-current={selectedCategoryId === category.id ? 'page' : undefined}
        >
          <span className={styles.icon}>{category.icon}</span>
          <span className={styles.label}>
            {t(category.id, { ns: 'categories' })}
          </span>
        </button>
      ))}
    </nav>
  );
};
