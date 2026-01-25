import { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { StandardCategoryId, ItemStatus, Unit } from '@/shared/types';
import { isFoodCategory } from '@/shared/types';
import type { CategoryShortage } from '../utils/categoryStatus';
import { getStatusVariant } from '@/shared/utils/calculations/itemStatus';
import { Badge } from '@/shared/components/Badge';
import styles from './CategoryCard.module.css';

export interface CategoryCardProps {
  categoryId: StandardCategoryId;
  itemCount: number;
  status: ItemStatus;
  completionPercentage: number;
  shortages?: CategoryShortage[];
  totalActual?: number;
  totalNeeded?: number;
  primaryUnit?: Unit;
  // Calorie data for food category
  totalActualCalories?: number;
  totalNeededCalories?: number;
  missingCalories?: number;
  onCategoryClick?: (categoryId: StandardCategoryId) => void;
  // False when category has no recommendations (except food/water which always calculate)
  hasRecommendations?: boolean;
}

const CategoryCardComponent = ({
  categoryId,
  itemCount,
  status,
  completionPercentage,
  shortages = [],
  totalActual = 0,
  totalNeeded = 0,
  primaryUnit,
  totalActualCalories,
  totalNeededCalories,
  missingCalories,
  onCategoryClick,
  hasRecommendations = true,
}: CategoryCardProps) => {
  const { t } = useTranslation(['common', 'categories', 'units', 'products']);

  const categoryName = t(categoryId, { ns: 'categories' });

  const isFood = isFoodCategory(categoryId);
  const isWater = categoryId === 'water-beverages';

  // Show percentage for categories with recommendations, or food/water (which always calculate)
  const showPercentage = hasRecommendations || isFood || isWater;

  // Format shortage summary - show calories for food, items for others
  const getShortageText = (): string | undefined => {
    // For food category, show missing calories
    if (isFood && missingCalories && missingCalories > 0) {
      return t('dashboard.category.missingCalories', {
        count: Math.round(missingCalories),
      });
    }

    if (shortages.length === 0) return undefined;

    // Show the most critical shortage
    const topShortage = shortages[0];
    const itemName = t(topShortage.itemName.replace('products.', ''), {
      ns: 'products',
    });
    const unitLabel = t(topShortage.unit, { ns: 'units' });

    if (shortages.length === 1) {
      return t('dashboard.category.missing', {
        count: topShortage.missing,
        unit: unitLabel,
        item: itemName,
      });
    }

    return t('dashboard.category.missingMultiple', {
      count: topShortage.missing,
      unit: unitLabel,
      item: itemName,
      more: shortages.length - 1,
    });
  };

  // Format progress text - calories for food, units for others
  const getProgressText = (): string | undefined => {
    // For food category, show calories
    if (isFood && totalNeededCalories && totalNeededCalories > 0) {
      const actualKcal = Math.round((totalActualCalories ?? 0) / 1000);
      const neededKcal = Math.round(totalNeededCalories / 1000);
      return `${actualKcal} / ${neededKcal} ${t('dashboard.category.kcal')}`;
    }

    if (totalNeeded === 0 || !primaryUnit) return undefined;
    const unitLabel = t(primaryUnit, { ns: 'units' });
    return `${Math.round(totalActual)} / ${Math.round(totalNeeded)} ${unitLabel}`;
  };

  const shortageText = getShortageText();
  const progressText = getProgressText();

  const handleClick = useCallback(() => {
    onCategoryClick?.(categoryId);
  }, [onCategoryClick, categoryId]);

  const content = (
    <>
      <div className={styles.header}>
        <h3 className={styles.title}>{categoryName}</h3>
        <Badge variant={getStatusVariant(status)} size="small">
          {t(`status.${status}`)}
        </Badge>
      </div>

      <div className={styles.stats}>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>
            {t('dashboard.category.stocked')}
          </span>
          <span className={styles.statValue}>
            {progressText || `${itemCount} ${t('dashboard.category.items')}`}
          </span>
        </div>
        {showPercentage ? (
          <div className={styles.statItem}>
            <span className={styles.statLabel}>
              {t('dashboard.category.completion')}
            </span>
            <span className={styles.statValue}>{completionPercentage}%</span>
          </div>
        ) : (
          <div className={styles.statItem}>
            <span className={styles.statLabel}>
              {t('dashboard.category.items')}
            </span>
            <span className={styles.statValue}>{itemCount}</span>
          </div>
        )}
      </div>

      {shortageText && status !== 'ok' && (
        <div className={styles.shortage}>
          <span className={styles.shortageText}>{shortageText}</span>
        </div>
      )}

      {showPercentage && (
        <div className={styles.progressBar}>
          <div
            className={`${styles.progressFill} ${styles[`progress${status.charAt(0).toUpperCase()}${status.slice(1)}`]}`}
            style={{ width: `${Math.min(completionPercentage, 100)}%` }}
          />
        </div>
      )}
    </>
  );

  if (onCategoryClick) {
    return (
      <button
        type="button"
        className={`${styles.card} ${styles.clickable}`}
        onClick={handleClick}
        data-testid={`category-${categoryId}`}
      >
        {content}
      </button>
    );
  }

  return (
    <div className={styles.card} data-testid={`category-${categoryId}`}>
      {content}
    </div>
  );
};

export const CategoryCard = memo(CategoryCardComponent);
