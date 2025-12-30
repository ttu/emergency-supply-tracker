import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '../common/Badge';
import type { ItemStatus, Unit } from '../../types';
import { getStatusVariant } from '../../utils/calculations/status';
import styles from './CategoryStatusSummary.module.css';

export interface CategoryShortage {
  itemId: string;
  itemName: string;
  actual: number;
  needed: number;
  unit: Unit;
  missing: number;
}

export interface CategoryStatusSummaryProps {
  categoryId: string;
  status: ItemStatus;
  completionPercentage: number;
  totalActual: number;
  totalNeeded: number;
  primaryUnit: string | null;
  shortages?: CategoryShortage[];
  // Calorie data for food category
  totalActualCalories?: number;
  totalNeededCalories?: number;
  missingCalories?: number;
}

export const CategoryStatusSummary = ({
  categoryId,
  status,
  completionPercentage,
  totalActual,
  totalNeeded,
  primaryUnit,
  shortages = [],
  totalActualCalories,
  totalNeededCalories,
  missingCalories,
}: CategoryStatusSummaryProps) => {
  const { t } = useTranslation(['common', 'categories', 'units', 'products']);

  const categoryName = t(categoryId, { ns: 'categories' });
  const isFoodCategory = categoryId === 'food';

  // Format progress text - calories for food, units for others
  const getProgressText = (): string => {
    // For food category, show calories (values are already in kcal)
    if (isFoodCategory && totalNeededCalories && totalNeededCalories > 0) {
      const actualKcal = Math.round(totalActualCalories ?? 0);
      const neededKcal = Math.round(totalNeededCalories);
      return `${actualKcal} / ${neededKcal} ${t('dashboard.category.kcal')}`;
    }

    if (totalNeeded === 0) {
      return `${completionPercentage}%`;
    }

    // When primaryUnit is null, it means mixed units - show item type count
    if (!primaryUnit) {
      return `${Math.round(totalActual)} / ${Math.round(totalNeeded)} ${t('dashboard.category.items')}`;
    }

    const unitLabel = t(primaryUnit, { ns: 'units' });
    return `${Math.round(totalActual)} / ${Math.round(totalNeeded)} ${unitLabel}`;
  };

  const [isExpanded, setIsExpanded] = useState(false);
  const maxVisibleItems = 3;
  const hasOverflow = shortages.length > maxVisibleItems;

  const formatShortage = (shortage: CategoryShortage): string => {
    const itemName = t(shortage.itemName.replace('products.', ''), {
      ns: 'products',
    });
    const unitLabel = t(shortage.unit, { ns: 'units' });
    return `${shortage.missing} ${unitLabel} ${itemName}`;
  };

  const getVisibleShortages = (): CategoryShortage[] => {
    if (isExpanded || !hasOverflow) {
      return shortages;
    }
    return shortages.slice(0, maxVisibleItems);
  };

  return (
    <div className={styles.summary}>
      <div className={styles.header}>
        <h2 className={styles.title}>{categoryName}</h2>
        <Badge variant={getStatusVariant(status)} size="medium">
          {t(`status.${status}`)}
        </Badge>
      </div>
      <div className={styles.stats}>
        <div className={styles.progress}>
          <span className={styles.progressText}>{getProgressText()}</span>
        </div>
        <div className={styles.progressBar}>
          <div
            className={`${styles.progressFill} ${styles[`progress${status.charAt(0).toUpperCase()}${status.slice(1)}`]}`}
            style={{ width: `${Math.min(completionPercentage, 100)}%` }}
          />
        </div>
        {shortages.length > 0 && (
          <div className={styles.missingSection}>
            <div className={styles.missingLabel}>{t('inventory.missing')}:</div>
            <ul className={styles.missingList}>
              {getVisibleShortages().map((shortage) => (
                <li key={shortage.itemId} className={styles.missingItem}>
                  {formatShortage(shortage)}
                </li>
              ))}
            </ul>
            {hasOverflow && (
              <button
                type="button"
                className={styles.expandButton}
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded
                  ? t('inventory.showLess')
                  : `+${shortages.length - maxVisibleItems}`}
              </button>
            )}
          </div>
        )}
        {isFoodCategory && missingCalories && missingCalories > 0 && (
          <div className={styles.missingCalories}>
            {t('dashboard.category.missingCalories', {
              count: Math.round(missingCalories),
            })}
          </div>
        )}
      </div>
    </div>
  );
};
