import { memo, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { InventoryItem, Quantity } from '@/shared/types';
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
import { getRecommendedQuantityForItem } from '@/shared/utils/calculations/itemRecommendedQuantity';
import { useHousehold } from '@/features/household';
import { useRecommendedItems } from '@/features/templates';
import { useSettings } from '@/features/settings';
import { QuantityEditor } from './QuantityEditor';
import styles from './ItemCard.module.css';

export interface ItemCardProps {
  item: InventoryItem;
  allItems?: InventoryItem[]; // Optional: if provided, calculates total missing across all items of same type
  onItemClick?: (item: InventoryItem) => void;
  onQuantityChange?: (itemId: string, newQuantity: Quantity) => void;
}

// Helper component for expiration display
const ExpirationDisplay = ({
  item,
  expired,
  daysUntil,
  formatDate,
  t,
}: {
  item: InventoryItem;
  expired: boolean;
  daysUntil: number | undefined;
  formatDate: (dateString?: string) => string;
  t: (key: string, options?: { days?: number }) => string;
}) => {
  if (!item.expirationDate || item.neverExpires) {
    return null;
  }

  if (expired) {
    return (
      <div className={styles.expiration}>
        <span className={styles.expired}>
          ⚠️ {t('inventory.expired')}: {formatDate(item.expirationDate)}
        </span>
      </div>
    );
  }

  if (daysUntil !== undefined && daysUntil <= EXPIRING_SOON_DAYS_THRESHOLD) {
    return (
      <div className={styles.expiration}>
        <span className={styles.expiringSoon}>
          📅 {t('inventory.expiresIn', { days: daysUntil })}
        </span>
      </div>
    );
  }

  if (daysUntil !== undefined && daysUntil > EXPIRING_SOON_DAYS_THRESHOLD) {
    return (
      <div className={styles.expiration}>
        <span className={styles.expirationDate}>
          📅 {formatDate(item.expirationDate)}
        </span>
      </div>
    );
  }

  return null;
};

// Helper component for food-related displays
const FoodDetails = ({
  item,
  t,
}: {
  item: InventoryItem;
  t: (key: string) => string;
}) => {
  if (!isFoodItem(item)) {
    return null;
  }

  return (
    <>
      {item.caloriesPerUnit && (
        <div className={styles.calories}>
          🔥 {calculateItemTotalCalories(item)} kcal
        </div>
      )}
      {getWaterRequirementPerUnit(item) > 0 && (
        <div className={styles.waterRequirement}>
          💧 {(item.quantity * getWaterRequirementPerUnit(item)).toFixed(1)}L{' '}
          {t('itemForm.waterForPreparation')}
        </div>
      )}
    </>
  );
};

const ItemCardComponent = ({
  item,
  allItems,
  onItemClick,
  onQuantityChange,
}: ItemCardProps) => {
  const { t } = useTranslation(['common', 'units', 'products']);
  const { household } = useHousehold();
  const { recommendedItems } = useRecommendedItems();
  const { settings } = useSettings();
  const [isQuickEditing, setIsQuickEditing] = useState(false);

  const formatExpirationDate = useCallback((dateString?: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  }, []);

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

  const handleClick = useCallback(() => {
    onItemClick?.(item);
  }, [onItemClick, item]);

  const handleQuantityClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    setIsQuickEditing(true);
  }, []);

  const handleQuantityChange = useCallback(
    (newQuantity: Quantity) => {
      onQuantityChange?.(item.id, newQuantity);
      setIsQuickEditing(false);
    },
    [item.id, onQuantityChange],
  );

  const handleFullEdit = useCallback(() => {
    setIsQuickEditing(false);
    onItemClick?.(item);
  }, [onItemClick, item]);

  const handleCancelEdit = useCallback(() => {
    setIsQuickEditing(false);
  }, []);

  // Determine if decimal values are allowed based on unit
  const allowDecimal = ['kilograms', 'grams', 'liters', 'meters'].includes(
    item.unit,
  );

  const content = (
    <>
      <div className={styles.header}>
        <h3 className={styles.name}>{item.name}</h3>
        <span className={styles.itemType}>
          {t(item.itemType, { ns: 'products' })}
        </span>
      </div>

      <div className={styles.body}>
        {isQuickEditing ? (
          <QuantityEditor
            quantity={item.quantity}
            unit={item.unit}
            onQuantityChange={handleQuantityChange}
            onFullEdit={onItemClick ? handleFullEdit : undefined}
            onCancel={handleCancelEdit}
            allowDecimal={allowDecimal}
          />
        ) : onQuantityChange ? (
          <button
            type="button"
            className={`${styles.quantity} ${styles.quantityEditable}`}
            onClick={handleQuantityClick}
            aria-label={t('inventory.quickEdit.editQuantity')}
            data-testid="quantity-display"
          >
            <span className={styles.current}>{item.quantity}</span>
            <span className={styles.unit}>{t(item.unit, { ns: 'units' })}</span>
            <span className={styles.editIcon}>✏️</span>
          </button>
        ) : (
          <div className={styles.quantity} data-testid="quantity-display">
            <span className={styles.current}>{item.quantity}</span>
            <span className={styles.unit}>{t(item.unit, { ns: 'units' })}</span>
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

        <ExpirationDisplay
          item={item}
          expired={expired}
          daysUntil={daysUntil}
          formatDate={formatExpirationDate}
          t={t}
        />

        <FoodDetails item={item} t={t} />

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
