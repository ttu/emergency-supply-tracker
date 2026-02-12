import { memo, useCallback, useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { InventoryItem } from '@/shared/types';
import { isFoodItem, createQuantity } from '@/shared/types';
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
import { QuantityStepper } from './QuantityStepper';
import styles from './ItemCard.module.css';

export interface ItemCardProps {
  item: InventoryItem;
  allItems?: InventoryItem[]; // Optional: if provided, calculates total missing across all items of same type
  onItemClick?: (item: InventoryItem) => void;
  onQuantityChange?: (item: InventoryItem, newQuantity: number) => void;
}

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
  const [isStepperActive, setIsStepperActive] = useState(false);
  const stepperRef = useRef<HTMLDivElement>(null);

  // Local quantity for optimistic updates (immediate visual feedback)
  // Track previous item.quantity to detect external changes
  const [localQuantity, setLocalQuantity] = useState(item.quantity);
  const [prevItemQuantity, setPrevItemQuantity] = useState(item.quantity);

  // Sync local quantity when item.quantity changes externally (without useEffect)
  if (item.quantity !== prevItemQuantity) {
    setPrevItemQuantity(item.quantity);
    setLocalQuantity(item.quantity);
  }

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

  const handleClick = useCallback(() => {
    onItemClick?.(item);
  }, [onItemClick, item]);

  const handleQuantityChange = useCallback(
    (newQuantity: number) => {
      // Update local state immediately for visual feedback
      setLocalQuantity(createQuantity(newQuantity));
      // Trigger debounced save to storage
      onQuantityChange?.(item, newQuantity);
    },
    [onQuantityChange, item],
  );

  const handleQuantityClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsStepperActive(true);
  }, []);

  // Close stepper when clicking outside
  useEffect(() => {
    if (!isStepperActive) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        stepperRef.current &&
        !stepperRef.current.contains(e.target as Node)
      ) {
        setIsStepperActive(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isStepperActive]);

  const content = (
    <>
      <div className={styles.header}>
        <h3 className={styles.name}>{item.name}</h3>
        <span className={styles.itemType}>
          {t(item.itemType, { ns: 'products' })}
        </span>
      </div>

      <div className={styles.body}>
        <div className={styles.quantityRow} ref={stepperRef}>
          {isStepperActive ? (
            <QuantityStepper
              quantity={localQuantity}
              unit={item.unit}
              onChange={handleQuantityChange}
            />
          ) : (
            <button
              type="button"
              className={styles.quantityButton}
              onClick={handleQuantityClick}
              aria-label={t('inventory.quantityStepper.edit')}
            >
              <span className={styles.quantityValue}>{localQuantity}</span>
              <span className={styles.quantityUnit}>
                {t(item.unit, { ns: 'units' })}
              </span>
            </button>
          )}
        </div>

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
            🔥 {calculateItemTotalCalories(item)} kcal
          </div>
        )}

        {isFoodItem(item) && getWaterRequirementPerUnit(item) > 0 && (
          <div className={styles.waterRequirement}>
            💧 {(localQuantity * getWaterRequirementPerUnit(item)).toFixed(1)}L{' '}
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

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (onItemClick && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        onItemClick(item);
      }
    },
    [onItemClick, item],
  );

  // Always render as div to avoid nested button issue with QuantityStepper
  // Use role="button" and keyboard handling for accessibility when clickable
  return (
    <div
      className={`${styles.card} ${onItemClick ? styles.clickable : ''}`}
      onClick={onItemClick ? handleClick : undefined}
      onKeyDown={onItemClick ? handleKeyDown : undefined}
      role={onItemClick ? 'button' : undefined}
      tabIndex={onItemClick ? 0 : undefined}
      data-testid={`item-card-${item.id}`}
    >
      {content}
    </div>
  );
};

export const ItemCard = memo(ItemCardComponent);
