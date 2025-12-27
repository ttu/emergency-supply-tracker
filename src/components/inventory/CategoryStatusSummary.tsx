import { useTranslation } from 'react-i18next';
import { Badge } from '../common/Badge';
import type { ItemStatus } from '../../types';
import { getStatusVariant } from '../../utils/calculations/status';
import styles from './CategoryStatusSummary.module.css';

export interface CategoryStatusSummaryProps {
  categoryId: string;
  status: ItemStatus;
  completionPercentage: number;
  totalActual: number;
  totalNeeded: number;
  primaryUnit: string | null;
  // Calorie data for food category
  totalActualCalories?: number;
  totalNeededCalories?: number;
}

export const CategoryStatusSummary = ({
  categoryId,
  status,
  completionPercentage,
  totalActual,
  totalNeeded,
  primaryUnit,
  totalActualCalories,
  totalNeededCalories,
}: CategoryStatusSummaryProps) => {
  const { t } = useTranslation(['common', 'categories', 'units']);

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
      </div>
    </div>
  );
};
