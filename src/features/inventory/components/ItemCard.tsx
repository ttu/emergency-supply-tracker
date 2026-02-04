import { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { InventoryItem } from '@/shared/types';
import { isFoodItem } from '@/shared/types';
import {
  isItemExpired,
  getDaysUntilExpiration,
} from '@/shared/utils/calculations/itemStatus';
import { getWaterRequirementPerUnit } from '@/shared/utils/calculations/water';
import { calculateItemTotalCalories } from '@/shared/utils/calculations/calories';
import {
  EXPIRING_SOON_DAYS_THRESHOLD,
  CHILDREN_REQUIREMENT_MULTIPLIER,
} from '@/shared/utils/constants';
import {
  calculateMissingQuantity,
  calculateTotalMissingQuantity,
} from '../utils/status';
import { getEffectiveQuantity } from '@/shared/utils/calculations/effectiveQuantity';
import { getRecommendedQuantityForItem } from '@/shared/utils/calculations/itemRecommendedQuantity';
import { useHousehold } from '@/features/household';
import { useRecommendedItems } from '@/features/templates';
import { useSettings } from '@/features/settings';
import styles from './ItemCard.module.css';

export interface ItemCardProps {
  item: InventoryItem;
  allItems?: InventoryItem[]; // Optional: if provided, calculates total missing across all items of same type
  onItemClick?: (item: InventoryItem) => void;
}

const ItemCardComponent = ({ item, allItems, onItemClick }: ItemCardProps) => {
  const { t } = useTranslation(['common', 'units', 'products']);
  const { household } = useHousehold();
  const { recommendedItems } = useRecommendedItems();
  const { settings } = useSettings();

  const formatExpirationDate = (dateString?: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const isRotation = item.isNormalRotation === true;

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
  // Rotation items skip missing quantity calculation
  let missingQuantity: number;
  if (isRotation) {
    missingQuantity = 0;
  } else if (allItems) {
    missingQuantity = calculateTotalMissingQuantity(
      item,
      allItems,
      recommendedQuantity,
    );
  } else {
    missingQuantity = calculateMissingQuantity(item, recommendedQuantity);
  }

  // For rotation items, display effective quantity (estimated)
  const displayQuantity = isRotation
    ? getEffectiveQuantity(item)
    : item.quantity;

  const handleClick = useCallback(() => {
    onItemClick?.(item);
  }, [onItemClick, item]);

  const content = (
    <>
      <div className={styles.header}>
        <h3 className={styles.name}>{item.name}</h3>
        <span className={styles.itemType}>
          {t(item.itemType, { ns: 'products' })}
        </span>
        {isRotation && (
          <span className={styles.rotationBadge}>
            🔄 {t('itemForm.rotation.badge')}
          </span>
        )}
      </div>

      <div className={styles.body}>
        <div className={styles.quantity}>
          <span className={styles.current}>
            {isRotation ? `~${displayQuantity}` : displayQuantity}
          </span>
          <span className={styles.unit}>{t(item.unit, { ns: 'units' })}</span>
        </div>

        {isRotation && item.excludeFromCalculations && (
          <div className={styles.notCounted}>
            {t('itemForm.rotation.excludeFromCalculations')}
          </div>
        )}

        {missingQuantity > 0 && (
          <div className={styles.missingQuantity}>
            ⚠️{' '}
            {t('inventory.quantityMissing', {
              count: missingQuantity,
              unit: t(item.unit, { ns: 'units' }),
              ns: 'common',
            })}
          </div>
        )}

        {!isRotation && !item.neverExpires && item.expirationDate && (
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
            🔥 {calculateItemTotalCalories(item)} kcal
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
    </>
  );

  if (onItemClick) {
    return (
      <button
        type="button"
        className={`${styles.card} ${styles.clickable}`}
        onClick={handleClick}
        data-testid={`item-card-${item.id}`}
      >
        {content}
      </button>
    );
  }

  return (
    <div className={styles.card} data-testid={`item-card-${item.id}`}>
      {content}
    </div>
  );
};

export const ItemCard = memo(ItemCardComponent);
