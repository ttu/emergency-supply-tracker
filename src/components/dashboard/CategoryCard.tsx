import { useTranslation } from 'react-i18next';
import type { StandardCategoryId, ItemStatus } from '../../types';
import { Badge } from '../common/Badge';
import styles from './CategoryCard.module.css';

export interface CategoryCardProps {
  categoryId: StandardCategoryId;
  itemCount: number;
  status: ItemStatus;
  completionPercentage: number;
  onClick?: () => void;
}

export const CategoryCard = ({
  categoryId,
  itemCount,
  status,
  completionPercentage,
  onClick,
}: CategoryCardProps) => {
  const { t } = useTranslation(['common', 'categories']);

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

  return (
    <div
      className={`${styles.card} ${onClick ? styles.clickable : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
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
            {t('dashboard.category.items')}
          </span>
          <span className={styles.statValue}>{itemCount}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>
            {t('dashboard.category.completion')}
          </span>
          <span className={styles.statValue}>{completionPercentage}%</span>
        </div>
      </div>

      <div className={styles.progressBar}>
        <div
          className={`${styles.progressFill} ${styles[`progress${status.charAt(0).toUpperCase()}${status.slice(1)}`]}`}
          style={{ width: `${completionPercentage}%` }}
        />
      </div>
    </div>
  );
};
