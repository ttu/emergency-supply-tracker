import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/shared/components/Badge';
import type { ItemStatus, Unit, InventoryItem } from '@/shared/types';
import { getStatusVariant } from '@/shared/utils/calculations/status';
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
  // Water breakdown for water-beverages category
  drinkingWaterNeeded?: number;
  preparationWaterNeeded?: number;
  // Action handlers for recommended items
  onAddToInventory?: (itemId: string) => void;
  onDisableRecommended?: (itemId: string) => void;
  onMarkAsEnough?: (itemId: string) => void;
  // Items to check if they can be marked as enough
  items?: InventoryItem[];
  // Optional custom item name resolver for custom recommendations
  resolveItemName?: (itemId: string, i18nKey: string) => string | null;
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
  drinkingWaterNeeded,
  preparationWaterNeeded,
  onAddToInventory,
  onDisableRecommended,
  onMarkAsEnough,
  items = [],
  resolveItemName,
}: CategoryStatusSummaryProps) => {
  const { t } = useTranslation(['common', 'categories', 'units', 'products']);

  const categoryName = t(categoryId, { ns: 'categories' });
  const isFoodCategory = categoryId === 'food';
  const isWaterCategory = categoryId === 'water-beverages';

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

  const formatShortage = (shortage: CategoryShortage): string => {
    // Try custom resolver first (for custom recommendations with inline names)
    let itemName = resolveItemName?.(shortage.itemId, shortage.itemName);
    if (!itemName) {
      // Fall back to translation lookup
      itemName = t(shortage.itemName.replace('products.', ''), {
        ns: 'products',
      });
    }
    const unitLabel = t(shortage.unit, { ns: 'units' });
    return `${shortage.missing} ${unitLabel} ${itemName}`;
  };

  const getVisibleShortages = (): CategoryShortage[] => {
    if (isExpanded) {
      return shortages;
    }
    return [];
  };

  // Find matching inventory items for a shortage that can be marked as enough
  const findMarkableItems = (shortage: CategoryShortage): InventoryItem[] => {
    if (!onMarkAsEnough || !items.length) return [];

    const shortageItemId = shortage.itemId.toLowerCase();
    return items.filter((item) => {
      // Match by productTemplateId, itemType, or normalized name
      const itemTemplateId = item.productTemplateId?.toLowerCase() || '';
      const itemType = item.itemType?.toLowerCase() || '';
      const itemName = item.name.toLowerCase().replace(/\s+/g, '-');

      const matches =
        itemTemplateId === shortageItemId ||
        itemType === shortageItemId ||
        itemName === shortageItemId;

      if (!matches) return false;

      // Can be marked as enough if: not already marked, has quantity > 0, quantity < recommendedQuantity
      return (
        !item.markedAsEnough &&
        item.quantity > 0 &&
        item.quantity < item.recommendedQuantity
      );
    });
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
            <div className={styles.missingLabel}>
              {t('inventory.recommended')}:
            </div>
            <ul className={styles.missingList}>
              {getVisibleShortages().map((shortage) => {
                const markableItems = findMarkableItems(shortage);
                const hasMarkableItems = markableItems.length > 0;

                return (
                  <li key={shortage.itemId} className={styles.missingItem}>
                    <span className={styles.missingItemText}>
                      {formatShortage(shortage)}
                    </span>
                    {(onAddToInventory ||
                      onDisableRecommended ||
                      hasMarkableItems) && (
                      <span className={styles.missingItemActions}>
                        {hasMarkableItems && onMarkAsEnough && (
                          <button
                            type="button"
                            className={`${styles.actionButton} ${styles.actionButtonMark}`}
                            onClick={() => {
                              // Mark the first matching item as enough
                              if (markableItems[0]) {
                                onMarkAsEnough(markableItems[0].id);
                              }
                            }}
                            title={t('inventory.markAsEnough')}
                            aria-label={t('inventory.markAsEnough')}
                          >
                            ✓
                          </button>
                        )}
                        {onAddToInventory && (
                          <button
                            type="button"
                            className={styles.actionButton}
                            onClick={() => onAddToInventory(shortage.itemId)}
                            title={t('inventory.addToInventory')}
                            aria-label={t('inventory.addToInventory')}
                          >
                            +
                          </button>
                        )}
                        {onDisableRecommended && (
                          <button
                            type="button"
                            className={`${styles.actionButton} ${styles.actionButtonSecondary}`}
                            onClick={() =>
                              onDisableRecommended(shortage.itemId)
                            }
                            title={t('inventory.disableRecommended')}
                            aria-label={t('inventory.disableRecommended')}
                          >
                            ×
                          </button>
                        )}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
            {shortages.length > 0 && (
              <button
                type="button"
                className={styles.expandButton}
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded
                  ? t('inventory.showLess')
                  : t('inventory.showRecommended', { count: shortages.length })}
              </button>
            )}
          </div>
        )}
        {isFoodCategory && missingCalories && missingCalories > 0 && (
          <div className={styles.missingCalories}>
            {t('dashboard.category.recommendedCalories', {
              count: Math.round(missingCalories),
            })}
          </div>
        )}
        {isWaterCategory && drinkingWaterNeeded !== undefined && (
          <div className={styles.waterBreakdown}>
            <div className={styles.waterBreakdownItem}>
              <span className={styles.waterBreakdownLabel}>
                {t('dashboard.category.waterForPeople')}:
              </span>
              <span className={styles.waterBreakdownValue}>
                {Math.round(drinkingWaterNeeded)} {t('liters', { ns: 'units' })}
              </span>
            </div>
            {preparationWaterNeeded !== undefined &&
              preparationWaterNeeded > 0 && (
                <div className={styles.waterBreakdownItem}>
                  <span className={styles.waterBreakdownLabel}>
                    {t('dashboard.category.waterForPreparation')}:
                  </span>
                  <span className={styles.waterBreakdownValue}>
                    {Math.round(preparationWaterNeeded)}{' '}
                    {t('liters', { ns: 'units' })}
                  </span>
                </div>
              )}
            <div className={styles.waterBreakdownItem}>
              <span className={styles.waterBreakdownLabel}>
                {t('dashboard.category.totalWater')}:
              </span>
              <span className={styles.waterBreakdownValue}>
                {Math.round(totalNeeded)} {t('liters', { ns: 'units' })}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
