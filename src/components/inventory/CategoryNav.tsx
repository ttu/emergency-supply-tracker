import { useCallback, useMemo, useRef } from 'react';
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
  const navRef = useRef<HTMLElement>(null);

  // Create array with "All" as first item followed by categories
  const allItems = useMemo(
    () => [
      { id: null as string | null, icon: '📦', isAll: true },
      ...categories,
    ],
    [categories],
  );

  const currentIndex = allItems.findIndex(
    (item) => item.id === selectedCategoryId,
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      const itemCount = allItems.length;
      let newIndex = currentIndex;

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          newIndex = currentIndex > 0 ? currentIndex - 1 : itemCount - 1;
          break;
        case 'ArrowRight':
          event.preventDefault();
          newIndex = currentIndex < itemCount - 1 ? currentIndex + 1 : 0;
          break;
        case 'Home':
          event.preventDefault();
          newIndex = 0;
          break;
        case 'End':
          event.preventDefault();
          newIndex = itemCount - 1;
          break;
        default:
          return;
      }

      if (newIndex !== currentIndex) {
        const newItem = allItems[newIndex];
        onSelectCategory(newItem.id);
        // Focus the new button
        const buttons = navRef.current?.querySelectorAll('button');
        buttons?.[newIndex]?.focus();
      }
    },
    [allItems, currentIndex, onSelectCategory],
  );

  const getTabIndex = (index: number) => (index === currentIndex ? 0 : -1);

  return (
    <nav
      ref={navRef}
      className={styles.nav}
      aria-label={t('accessibility.categoryNavigation')}
      onKeyDown={handleKeyDown}
    >
      <button
        className={`${styles.categoryButton} ${
          selectedCategoryId === null ? styles.active : ''
        }`}
        onClick={() => onSelectCategory(null)}
        aria-current={selectedCategoryId === null ? 'page' : undefined}
        tabIndex={getTabIndex(0)}
        data-testid="category-all"
      >
        <span className={styles.icon}>📦</span>
        <span className={styles.label}>{t('inventory.allCategories')}</span>
      </button>

      {categories.map((category, index) => (
        <button
          key={category.id}
          className={`${styles.categoryButton} ${
            selectedCategoryId === category.id ? styles.active : ''
          }`}
          onClick={() => onSelectCategory(category.id)}
          aria-current={selectedCategoryId === category.id ? 'page' : undefined}
          tabIndex={getTabIndex(index + 1)}
          data-testid={`category-${category.id}`}
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
