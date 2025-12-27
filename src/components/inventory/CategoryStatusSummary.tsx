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
    // For food category, show calories
    if (isFoodCategory && totalNeededCalories && totalNeededCalories > 0) {
      const actualKcal = Math.round((totalActualCalories ?? 0) / 1000);
      const neededKcal = Math.round(totalNeededCalories / 1000);
      return `${actualKcal} / ${neededKcal} ${t('dashboard.category.kcal')}`;
    }

    if (totalNeeded === 0 || !primaryUnit) {
      return `${completionPercentage}%`;
    }

    const unitLabel = t(primaryUnit, { ns: 'units' });
    return `${Math.round(totalActual)} / ${Math.round(totalNeeded)} ${unitLabel}`;
  };

  // Get missing items text (show top 3 shortages)
  const getMissingItemsText = (): string | null => {
    if (shortages.length === 0) return null;

    const topShortages = shortages.slice(0, 3);
    const missingItems = topShortages.map((shortage) => {
      // itemName is 'products.candles', need to strip prefix for namespace lookup
      const itemName = t(shortage.itemName.replace('products.', ''), {
        ns: 'products',
      });
      const unitLabel = t(shortage.unit, { ns: 'units' });
      return `${shortage.missing} ${unitLabel} ${itemName}`;
    });

    const text = missingItems.join(', ');
    if (shortages.length > 3) {
      return `${text} (+${shortages.length - 3})`;
    }
    return text;
  };

  const missingItemsText = getMissingItemsText();

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
        {missingItemsText && (
          <div className={styles.missing}>
            {t('inventory.missing')}: {missingItemsText}
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
