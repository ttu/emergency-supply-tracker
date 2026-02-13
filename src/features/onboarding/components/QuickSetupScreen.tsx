import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type {
  HouseholdConfig,
  RecommendedItemDefinition,
} from '@/shared/types';
import { useRecommendedItems } from '@/features/templates';
import { Button } from '@/shared/components/Button';
import { PET_REQUIREMENT_MULTIPLIER } from '@/shared/utils/constants';
import styles from './QuickSetupScreen.module.css';

export interface QuickSetupScreenProps {
  household: HouseholdConfig;
  onAddItems: (selectedItemIds: Set<string>) => void;
  onSkip: () => void;
  onBack?: () => void;
  onCreateExampleSet?: () => void;
}

export const QuickSetupScreen = ({
  household,
  onAddItems,
  onSkip,
  onBack,
  onCreateExampleSet,
}: QuickSetupScreenProps) => {
  const { t } = useTranslation(['common', 'categories', 'products', 'units']);
  const { recommendedItems } = useRecommendedItems();
  const [showDetails, setShowDetails] = useState(false);

  // Items to offer: filtered by household (freezer, pets).
  const itemsToAdd = recommendedItems.filter((item) => {
    // Skip frozen items if not using freezer
    if (item.requiresFreezer && !household.useFreezer) {
      return false;
    }
    // Skip pet items if pets is 0
    if (item.scaleWithPets && household.pets === 0) {
      return false;
    }
    return true;
  });

  // All items selected by default (or empty if items load async)
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(
    () => new Set(itemsToAdd.map((item) => item.id)),
  );

  // When items load asynchronously (e.g. in onboarding flow), select all once available.
  // Ref ensures we only auto-select once and never overwrite user's "deselect all".
  // Defer setState to avoid synchronous setState in effect (react-hooks/set-state-in-effect).
  const initialSelectionAppliedRef = useRef(itemsToAdd.length > 0);
  useEffect(() => {
    if (
      itemsToAdd.length > 0 &&
      selectedItemIds.size === 0 &&
      !initialSelectionAppliedRef.current
    ) {
      initialSelectionAppliedRef.current = true;
      const ids = new Set(itemsToAdd.map((item) => item.id));
      const t = setTimeout(() => setSelectedItemIds(ids), 0);
      return () => clearTimeout(t);
    }
  }, [itemsToAdd, selectedItemIds.size]);

  // Calculate recommended quantity for an item
  const calculateQuantity = (item: RecommendedItemDefinition): number => {
    // Use regular number for calculations (Quantity is for storage/input boundaries)
    let quantity: number = item.baseQuantity;

    if (item.scaleWithPeople) {
      const totalPeople = household.adults + household.children;
      quantity *= totalPeople;
    }

    if (item.scaleWithPets) {
      quantity *= household.pets * PET_REQUIREMENT_MULTIPLIER;
    }

    if (item.scaleWithDays) {
      quantity *= household.supplyDurationDays;
    }

    return Math.ceil(quantity);
  };

  /**
   * Normalize i18n key by removing 'products.' or 'custom.' prefix
   */
  const normalizeI18nKey = (i18nKey: string): string => {
    return i18nKey.replace(/^(products\.|custom\.)/, '');
  };

  // Group items by category
  const itemsByCategory = itemsToAdd.reduce(
    (acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<string, typeof itemsToAdd>,
  );

  // Sort items within each category alphabetically by translated name
  Object.keys(itemsByCategory).forEach((categoryId) => {
    itemsByCategory[categoryId].sort((a, b) => {
      const keyA = normalizeI18nKey(a.i18nKey);
      const keyB = normalizeI18nKey(b.i18nKey);
      const nameA = t(keyA, { ns: 'products' });
      const nameB = t(keyB, { ns: 'products' });
      return nameA.localeCompare(nameB);
    });
  });

  const selectedCount = selectedItemIds.size;

  const handleItemToggle = (itemId: string) => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedItemIds.size === itemsToAdd.length) {
      // Deselect all
      setSelectedItemIds(new Set());
    } else {
      // Select all
      setSelectedItemIds(new Set(itemsToAdd.map((item) => item.id)));
    }
  };

  const handleAddItems = () => {
    onAddItems(selectedItemIds);
  };

  return (
    <div className={styles.container} data-testid="onboarding-quick-setup">
      <div className={styles.content}>
        <h1 className={styles.title}>{t('quickSetup.title')}</h1>
        <p className={styles.subtitle}>{t('quickSetup.subtitle')}</p>

        <div className={styles.summaryCard}>
          <div className={styles.summary}>
            <div className={styles.summaryItem}>
              <div className={styles.summaryNumber}>{selectedCount}</div>
              <div className={styles.summaryLabel}>
                {t('quickSetup.selectedItems')}
              </div>
            </div>
            <div className={styles.summaryItem}>
              <div className={styles.summaryNumber}>{itemsToAdd.length}</div>
              <div className={styles.summaryLabel}>
                {t('quickSetup.itemsCount')}
              </div>
            </div>
            <div className={styles.summaryItem}>
              <div className={styles.summaryNumber}>
                {household.supplyDurationDays}
              </div>
              <div className={styles.summaryLabel}>{t('quickSetup.days')}</div>
            </div>
          </div>

          <button
            className={styles.toggleButton}
            onClick={() => setShowDetails(!showDetails)}
            aria-expanded={showDetails}
            data-testid="show-details-button"
          >
            {showDetails
              ? t('quickSetup.hideDetails')
              : t('quickSetup.showDetails')}
          </button>

          {showDetails && (
            <div className={styles.details}>
              <div className={styles.selectAllContainer}>
                <button
                  type="button"
                  className={styles.selectAllButton}
                  onClick={handleSelectAll}
                  data-testid="select-all-button"
                >
                  {selectedItemIds.size === itemsToAdd.length &&
                  itemsToAdd.length > 0
                    ? t('quickSetup.deselectAll')
                    : t('quickSetup.selectAll')}
                </button>
              </div>
              {Object.entries(itemsByCategory).map(([categoryId, items]) => (
                <div key={categoryId} className={styles.categoryGroup}>
                  <h3 className={styles.categoryTitle}>
                    {t(categoryId, { ns: 'categories' })}
                  </h3>
                  <ul className={styles.itemList}>
                    {items.map((item) => {
                      // Normalize i18nKey to extract the key part (removes 'products.' or 'custom.' prefix)
                      const productKey = normalizeI18nKey(item.i18nKey);
                      const isSelected = selectedItemIds.has(item.id);
                      return (
                        <li key={item.id} className={styles.item}>
                          <div className={styles.itemCheckbox}>
                            <input
                              type="checkbox"
                              id={`item-${item.id}`}
                              checked={isSelected}
                              onChange={() => handleItemToggle(item.id)}
                              aria-label={t('quickSetup.selectItem', {
                                item: t(productKey, { ns: 'products' }),
                              })}
                            />
                            <label
                              htmlFor={`item-${item.id}`}
                              className={styles.itemName}
                            >
                              {t(productKey, { ns: 'products' })}
                            </label>
                          </div>
                          <div className={styles.itemRight}>
                            <span className={styles.itemQuantity}>
                              {calculateQuantity(item)}{' '}
                              {t(item.unit, { ns: 'units' })}
                            </span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.info}>
          <p>{t('quickSetup.info')}</p>
          {!household.useFreezer && (
            <p className={styles.freezerNote}>{t('quickSetup.noFreezer')}</p>
          )}
        </div>

        <div className={styles.actions}>
          {onBack && (
            <Button
              type="button"
              variant="secondary"
              onClick={onBack}
              data-testid="quick-setup-back-button"
            >
              {t('actions.back')}
            </Button>
          )}
          <Button
            type="button"
            variant="secondary"
            onClick={onSkip}
            data-testid="skip-quick-setup-button"
          >
            {t('quickSetup.skip')}
          </Button>
          {onCreateExampleSet && (
            <Button
              type="button"
              variant="secondary"
              onClick={onCreateExampleSet}
              data-testid="create-example-set-button"
            >
              {t('quickSetup.createExampleSet')}
            </Button>
          )}
          <Button
            type="button"
            variant="primary"
            onClick={handleAddItems}
            disabled={selectedCount === 0}
            data-testid="add-items-button"
          >
            {selectedCount === itemsToAdd.length && itemsToAdd.length > 0
              ? t('quickSetup.addAllItems')
              : t('quickSetup.addItems')}
          </Button>
        </div>
      </div>
    </div>
  );
};
