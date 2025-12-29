import { useTranslation } from 'react-i18next';
import type { InventoryItem } from '../../types';
import {
  isItemExpired,
  getDaysUntilExpiration,
} from '../../utils/calculations/status';
import { EXPIRING_SOON_DAYS_THRESHOLD } from '../../utils/constants';
import styles from './ItemCard.module.css';

export interface ItemCardProps {
  item: InventoryItem;
  onClick?: () => void;
}

export const ItemCard = ({ item, onClick }: ItemCardProps) => {
  const { t } = useTranslation(['common', 'units']);

  const formatExpirationDate = (dateString?: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const expired = isItemExpired(item.expirationDate, item.neverExpires);
  const daysUntil = getDaysUntilExpiration(
    item.expirationDate,
    item.neverExpires,
  );

  return (
    <div
      className={`${styles.card} ${onClick ? styles.clickable : ''}`}
      onClick={onClick}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className={styles.header}>
        <h3 className={styles.name}>{item.name}</h3>
      </div>

      <div className={styles.body}>
        <div className={styles.quantity}>
          <span className={styles.current}>{item.quantity}</span>
          <span className={styles.unit}>{t(item.unit, { ns: 'units' })}</span>
        </div>

        {!item.neverExpires && item.expirationDate && (
          <div className={styles.expiration}>
            {expired ? (
              <span className={styles.expired}>
                ⚠️ {t('inventory.expired')}:{' '}
                {formatExpirationDate(item.expirationDate)}
              </span>
            ) : (
              <>
                {daysUntil !== null &&
                  daysUntil <= EXPIRING_SOON_DAYS_THRESHOLD && (
                    <span className={styles.expiringSoon}>
                      📅 {t('inventory.expiresIn', { days: daysUntil })}
                    </span>
                  )}
                {daysUntil !== null &&
                  daysUntil > EXPIRING_SOON_DAYS_THRESHOLD && (
                    <span className={styles.expirationDate}>
                      📅 {formatExpirationDate(item.expirationDate)}
                    </span>
                  )}
              </>
            )}
          </div>
        )}

        {item.categoryId === 'food' && item.caloriesPerUnit && (
          <div className={styles.calories}>
            🔥 {Math.round(item.quantity * item.caloriesPerUnit)} kcal
          </div>
        )}

        {item.location && (
          <div className={styles.location}>📍 {item.location}</div>
        )}
      </div>
    </div>
  );
};
