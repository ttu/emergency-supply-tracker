import { useTranslation } from 'react-i18next';
import type { InventoryItem } from '@/shared/types';
import { isFoodItem } from '@/shared/types';
import {
  isItemExpired,
  getDaysUntilExpiration,
} from '@/shared/utils/calculations/itemStatus';
import { getWaterRequirementPerUnit } from '@/shared/utils/calculations/water';
import {
  EXPIRING_SOON_DAYS_THRESHOLD,
  CHILDREN_REQUIREMENT_MULTIPLIER,
} from '@/shared/utils/constants';
import {
  calculateMissingQuantity,
  calculateTotalMissingQuantity,
} from '../utils/status';
import { getRecommendedQuantityForItem } from '@/shared/utils/calculations/itemRecommendedQuantity';
import { useHousehold } from '@/features/household';
import { useRecommendedItems } from '@/features/templates';
import { useSettings } from '@/features/settings';
import styles from './ItemCard.module.css';

export interface ItemCardProps {
  item: InventoryItem;
  allItems?: InventoryItem[]; // Optional: if provided, calculates total missing across all items of same type
  onClick?: () => void;
}

export const ItemCard = ({ item, allItems, onClick }: ItemCardProps) => {
  const { t } = useTranslation(['common', 'units', 'products']);
  const { household } = useHousehold();
  const { recommendedItems } = useRecommendedItems();
  const { settings } = useSettings();

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

  // Calculate recommended quantity for this item
  const recommendedQuantity = getRecommendedQuantityForItem(
    item,
    household,
    recommendedItems,
    settings.childrenRequirementPercentage
      ? settings.childrenRequirementPercentage / 100
      : CHILDREN_REQUIREMENT_MULTIPLIER,
  );

  // If allItems is provided, calculate total missing across all items of same type
  // Otherwise, calculate missing for this individual item
  const missingQuantity = allItems
    ? calculateTotalMissingQuantity(item, allItems, recommendedQuantity)
    : calculateMissingQuantity(item, recommendedQuantity);

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
      data-testid={`item-card-${item.id}`}
    >
      <div className={styles.header}>
        <h3 className={styles.name}>{item.name}</h3>
        <span className={styles.itemType}>
          {t(item.itemType, { ns: 'products' })}
        </span>
      </div>

      <div className={styles.body}>
        <div className={styles.quantity}>
          <span className={styles.current}>{item.quantity}</span>
          <span className={styles.unit}>{t(item.unit, { ns: 'units' })}</span>
        </div>

        {missingQuantity > 0 && (
          <div className={styles.missingQuantity}>
            ⚠️{' '}
            {t('inventory.quantityMissing', {
              count: missingQuantity,
              unit: t(item.unit, { ns: 'units' }),
            })}
          </div>
        )}

        {!item.neverExpires && item.expirationDate && (
          <div className={styles.expiration}>
            {expired ? (
              <span className={styles.expired}>
                ⚠️ {t('inventory.expired')}:{' '}
                {formatExpirationDate(item.expirationDate)}
              </span>
            ) : (
              <>
                {daysUntil !== undefined &&
                  daysUntil <= EXPIRING_SOON_DAYS_THRESHOLD && (
                    <span className={styles.expiringSoon}>
                      📅 {t('inventory.expiresIn', { days: daysUntil })}
                    </span>
                  )}
                {daysUntil !== undefined &&
                  daysUntil > EXPIRING_SOON_DAYS_THRESHOLD && (
                    <span className={styles.expirationDate}>
                      📅 {formatExpirationDate(item.expirationDate)}
                    </span>
                  )}
              </>
            )}
          </div>
        )}

        {isFoodItem(item) && item.caloriesPerUnit && (
          <div className={styles.calories}>
            🔥 {Math.round(item.quantity * item.caloriesPerUnit)} kcal
          </div>
        )}

        {isFoodItem(item) && getWaterRequirementPerUnit(item) > 0 && (
          <div className={styles.waterRequirement}>
            💧 {(item.quantity * getWaterRequirementPerUnit(item)).toFixed(1)}L{' '}
            {t('itemForm.waterForPreparation')}
          </div>
        )}

        {(item.capacityMah || item.capacityWh) && (
          <div className={styles.capacity}>
            🔋 {item.capacityMah && <span>{item.capacityMah} mAh</span>}
            {item.capacityMah && item.capacityWh && ' / '}
            {item.capacityWh && <span>{item.capacityWh} Wh</span>}
          </div>
        )}

        {item.location && (
          <div className={styles.location}>📍 {item.location}</div>
        )}
      </div>
    </div>
  );
};
