import { useTranslation } from 'react-i18next';
import type { StandardCategoryId, ItemStatus, Unit } from '../../types';
import type { CategoryShortage } from '../../utils/dashboard/categoryStatus';
import { Badge } from '../common/Badge';
import styles from './CategoryCard.module.css';

export interface CategoryCardProps {
  categoryId: StandardCategoryId;
  itemCount: number;
  status: ItemStatus;
  completionPercentage: number;
  shortages?: CategoryShortage[];
  totalActual?: number;
  totalNeeded?: number;
  primaryUnit?: Unit | null;
  // Calorie data for food category
  totalActualCalories?: number;
  totalNeededCalories?: number;
  missingCalories?: number;
  onClick?: () => void;
}

export const CategoryCard = ({
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
  onClick,
}: CategoryCardProps) => {
  const { t } = useTranslation(['common', 'categories', 'units', 'products']);

  const getStatusVariant = (
    status: ItemStatus,
  ): 'success' | 'warning' | 'danger' => {
    switch (status) {
      case 'ok':
        return 'success';
      case 'warning':
        return 'warning';
      case 'critical':
        return 'danger';
    }
  };

  const getStatusLabel = (status: ItemStatus): string => {
    return t(`status.${status}`);
  };

  const categoryName = t(categoryId, { ns: 'categories' });

  const isFoodCategory = categoryId === 'food';

  // Format shortage summary - show calories for food, items for others
  const getShortageText = (): string | null => {
    // For food category, show missing calories
    if (isFoodCategory && missingCalories && missingCalories > 0) {
      return t('dashboard.category.missingCalories', {
        count: Math.round(missingCalories),
      });
    }

    if (shortages.length === 0) return null;

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
  const getProgressText = (): string | null => {
    // For food category, show calories
    if (isFoodCategory && totalNeededCalories && totalNeededCalories > 0) {
      const actualKcal = Math.round((totalActualCalories ?? 0) / 1000);
      const neededKcal = Math.round(totalNeededCalories / 1000);
      return `${actualKcal} / ${neededKcal} ${t('dashboard.category.kcal')}`;
    }

    if (totalNeeded === 0 || !primaryUnit) return null;
    const unitLabel = t(primaryUnit, { ns: 'units' });
    return `${Math.round(totalActual)} / ${Math.round(totalNeeded)} ${unitLabel}`;
  };

  const shortageText = getShortageText();
  const progressText = getProgressText();

  return (
    <div
      className={`${styles.card} ${onClick ? styles.clickable : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      data-testid={`category-${categoryId}`}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className={styles.header}>
        <h3 className={styles.title}>{categoryName}</h3>
        <Badge variant={getStatusVariant(status)} size="small">
          {getStatusLabel(status)}
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
        <div className={styles.statItem}>
          <span className={styles.statLabel}>
            {t('dashboard.category.completion')}
          </span>
          <span className={styles.statValue}>{completionPercentage}%</span>
        </div>
      </div>

      {shortageText && status !== 'ok' && (
        <div className={styles.shortage}>
          <span className={styles.shortageText}>{shortageText}</span>
        </div>
      )}

      <div className={styles.progressBar}>
        <div
          className={`${styles.progressFill} ${styles[`progress${status.charAt(0).toUpperCase()}${status.slice(1)}`]}`}
          style={{ width: `${completionPercentage}%` }}
        />
      </div>
    </div>
  );
};
