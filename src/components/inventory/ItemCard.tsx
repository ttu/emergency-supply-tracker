import { useTranslation } from 'react-i18next';
import type { InventoryItem } from '../../types';
import styles from './ItemCard.module.css';

export interface ItemCardProps {
  item: InventoryItem;
  onClick?: () => void;
}

export const ItemCard = ({ item, onClick }: ItemCardProps) => {
  const { t } = useTranslation();

  const formatExpirationDate = (dateString?: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const isExpired = (): boolean => {
    if (item.neverExpires || !item.expirationDate) return false;
    return new Date(item.expirationDate) < new Date();
  };

  const daysUntilExpiration = (): number | null => {
    if (item.neverExpires || !item.expirationDate) return null;
    const today = new Date();
    const expiration = new Date(item.expirationDate);
    const diffTime = expiration.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

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
          <span className={styles.unit}>{t(`units.${item.unit}`)}</span>
        </div>

        {!item.neverExpires && item.expirationDate && (
          <div className={styles.expiration}>
            {isExpired() ? (
              <span className={styles.expired}>
                ⚠️ {t('inventory.expired')}:{' '}
                {formatExpirationDate(item.expirationDate)}
              </span>
            ) : (
              <>
                {daysUntilExpiration() !== null &&
                  daysUntilExpiration()! <= 30 && (
                    <span className={styles.expiringSoon}>
                      📅{' '}
                      {t('inventory.expiresIn', {
                        days: daysUntilExpiration(),
                      })}
                    </span>
                  )}
                {daysUntilExpiration() !== null &&
                  daysUntilExpiration()! > 30 && (
                    <span className={styles.expirationDate}>
                      📅 {formatExpirationDate(item.expirationDate)}
                    </span>
                  )}
              </>
            )}
          </div>
        )}

        {item.location && (
          <div className={styles.location}>📍 {item.location}</div>
        )}
      </div>
    </div>
  );
};
