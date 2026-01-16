import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/shared/components/Badge';
import type { ItemStatus, Unit, InventoryItem } from '@/shared/types';
import { isFoodCategory } from '@/shared/types';
import { getStatusVariant } from '@/shared/utils/calculations/itemStatus';
import { getRecommendedQuantityForItem } from '@/shared/utils/calculations/itemRecommendedQuantity';
import { useHousehold } from '@/features/household';
import { useRecommendedItems } from '@/features/templates';
import { useSettings } from '@/features/settings';
import { CHILDREN_REQUIREMENT_MULTIPLIER } from '@/shared/utils/constants';
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
  primaryUnit?: string;
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
  resolveItemName?: (itemId: string, i18nKey: string) => string | undefined;
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
  const { household } = useHousehold();
  const { recommendedItems } = useRecommendedItems();
  const { settings } = useSettings();

  const childrenMultiplier = settings.childrenRequirementPercentage
    ? settings.childrenRequirementPercentage / 100
    : CHILDREN_REQUIREMENT_MULTIPLIER;

  const categoryName = t(categoryId, { ns: 'categories' });
  const isFood = isFoodCategory(categoryId);
  const isWaterCategory = categoryId === 'water-beverages';

  // Format progress text - calories for food, units for others
  const getProgressText = (): string => {
    // For food category, show calories (values are already in kcal)
    if (isFood && totalNeededCalories && totalNeededCalories > 0) {
      const actualKcal = Math.round(totalActualCalories ?? 0);
      const neededKcal = Math.round(totalNeededCalories);
      return `${actualKcal} / ${neededKcal} ${t('dashboard.category.kcal')}`;
    }

    if (totalNeeded === 0) {
      return `${completionPercentage}%`;
    }

    // When primaryUnit is undefined, it means mixed units - show item type count
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

    // Use "missing" format when user has partial inventory
    const hasPartialInventory = shortage.actual > 0;
    const formatKey = hasPartialInventory
      ? 'inventory.shortageFormatMissing'
      : 'inventory.shortageFormat';

    return t(formatKey, {
      item: itemName,
      count: shortage.missing,
      unit: unitLabel,
    });
  };

  const getVisibleShortages = (): CategoryShortage[] => {
    if (isExpanded) {
      // Sort shortages alphabetically by translated name
      return [...shortages].sort((a, b) => {
        // Get translated names for comparison
        let nameA = resolveItemName?.(a.itemId, a.itemName);
        if (!nameA) {
          nameA = t(a.itemName.replace(/^(products\.|custom\.)/, ''), {
            ns: 'products',
          });
        }
        let nameB = resolveItemName?.(b.itemId, b.itemName);
        if (!nameB) {
          nameB = t(b.itemName.replace(/^(products\.|custom\.)/, ''), {
            ns: 'products',
          });
        }
        return nameA.localeCompare(nameB);
      });
    }
    return [];
  };

  // Find matching inventory items for a shortage that can be marked as enough
  const findMarkableItems = (shortage: CategoryShortage): InventoryItem[] => {
    if (!onMarkAsEnough || !items.length) return [];

    const shortageItemId = shortage.itemId.toLowerCase();
    return items.filter((item) => {
      // Match by itemType or normalized name
      // Note: Custom items (itemType === 'custom') should NOT match by name to avoid
      // false matches with recommended items
      const itemType = item.itemType?.toLowerCase() || '';

      const isCustomItem = item.itemType === 'custom';
      const normalizedName = isCustomItem
        ? ''
        : item.name.toLowerCase().split(' ').join('-');
      const matches =
        itemType === shortageItemId ||
        (!isCustomItem && normalizedName === shortageItemId);

      if (!matches) return false;

      // Calculate recommended quantity for this item
      const recommendedQuantity = getRecommendedQuantityForItem(
        item,
        household,
        recommendedItems,
        childrenMultiplier,
      );

      // Can be marked as enough if: not already marked, has quantity > 0, quantity < recommendedQuantity
      return (
        !item.markedAsEnough &&
        item.quantity > 0 &&
        recommendedQuantity > 0 &&
        item.quantity < recommendedQuantity
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
                            className={`${styles.actionButton} ${styles.actionButtonDanger}`}
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
        {isFood && missingCalories && missingCalories > 0 && (
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
