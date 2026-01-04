import { useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { Category } from '@/shared/types';
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

  // Use effectiveIndex for tabindex and keyboard navigation
  // Falls back to 0 when selectedCategoryId is not found (-1)
  const effectiveIndex = currentIndex === -1 ? 0 : currentIndex;

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      const itemCount = allItems.length;
      let newIndex = effectiveIndex;

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          newIndex = effectiveIndex > 0 ? effectiveIndex - 1 : itemCount - 1;
          break;
        case 'ArrowRight':
          event.preventDefault();
          newIndex = effectiveIndex < itemCount - 1 ? effectiveIndex + 1 : 0;
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

      if (newIndex !== effectiveIndex) {
        const newItem = allItems[newIndex];
        onSelectCategory(newItem.id);
        // Focus the new button
        const buttons = navRef.current?.querySelectorAll('button');
        buttons?.[newIndex]?.focus();
      }
    },
    [allItems, effectiveIndex, onSelectCategory],
  );

  const getTabIndex = (index: number) => (index === effectiveIndex ? 0 : -1);

  // Get translated category name for "All" button
  const allCategoriesLabel = t('inventory.allCategories');

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
        aria-label={allCategoriesLabel}
        title={allCategoriesLabel}
        tabIndex={getTabIndex(0)}
        data-testid="category-all"
      >
        <span className={styles.icon}>📦</span>
        <span className={styles.label}>{allCategoriesLabel}</span>
      </button>

      {categories.map((category, index) => {
        const categoryName = t(category.id, { ns: 'categories' });
        return (
          <button
            key={category.id}
            className={`${styles.categoryButton} ${
              selectedCategoryId === category.id ? styles.active : ''
            }`}
            onClick={() => onSelectCategory(category.id)}
            aria-current={
              selectedCategoryId === category.id ? 'page' : undefined
            }
            aria-label={categoryName}
            title={categoryName}
            tabIndex={getTabIndex(index + 1)}
            data-testid={`category-${category.id}`}
          >
            <span className={styles.icon}>{category.icon}</span>
            <span className={styles.label}>{categoryName}</span>
          </button>
        );
      })}
    </nav>
  );
};
