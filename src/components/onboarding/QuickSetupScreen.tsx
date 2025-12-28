import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { HouseholdConfig } from '../../types';
import { RECOMMENDED_ITEMS } from '../../data/recommendedItems';
import { Button } from '../common/Button';
import styles from './QuickSetupScreen.module.css';

export interface QuickSetupScreenProps {
  household: HouseholdConfig;
  onAddItems: () => void;
  onSkip: () => void;
}

export const QuickSetupScreen = ({
  household,
  onAddItems,
  onSkip,
}: QuickSetupScreenProps) => {
  const { t } = useTranslation();
  const [showDetails, setShowDetails] = useState(false);

  // Calculate which items will be added
  const itemsToAdd = RECOMMENDED_ITEMS.filter((item) => {
    // Skip frozen items if no freezer
    if (item.requiresFreezer && !household.hasFreezer) {
      return false;
    }
    return true;
  });

  // Calculate recommended quantity for an item
  const calculateQuantity = (item: (typeof RECOMMENDED_ITEMS)[0]): number => {
    let quantity = item.baseQuantity;

    if (item.scaleWithPeople) {
      const totalPeople = household.adults + household.children;
      quantity *= totalPeople;
    }

    if (item.scaleWithDays) {
      quantity *= household.supplyDurationDays;
    }

    return Math.ceil(quantity);
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

  const totalItems = itemsToAdd.length;
  const totalCategories = Object.keys(itemsByCategory).length;

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>{t('quickSetup.title')}</h1>
        <p className={styles.subtitle}>{t('quickSetup.subtitle')}</p>

        <div className={styles.summaryCard}>
          <div className={styles.summary}>
            <div className={styles.summaryItem}>
              <div className={styles.summaryNumber}>{totalItems}</div>
              <div className={styles.summaryLabel}>
                {t('quickSetup.itemsCount')}
              </div>
            </div>
            <div className={styles.summaryItem}>
              <div className={styles.summaryNumber}>{totalCategories}</div>
              <div className={styles.summaryLabel}>
                {t('quickSetup.categoriesCount')}
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
          >
            {showDetails
              ? t('quickSetup.hideDetails')
              : t('quickSetup.showDetails')}
          </button>

          {showDetails && (
            <div className={styles.details}>
              {Object.entries(itemsByCategory).map(([categoryId, items]) => (
                <div key={categoryId} className={styles.categoryGroup}>
                  <h3 className={styles.categoryTitle}>
                    {t(`categories.${categoryId}`)}
                  </h3>
                  <ul className={styles.itemList}>
                    {items.map((item) => (
                      <li key={item.id} className={styles.item}>
                        <span className={styles.itemName}>
                          {t(item.i18nKey)}
                        </span>
                        <span className={styles.itemQuantity}>
                          {calculateQuantity(item)} {t(`units.${item.unit}`)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.info}>
          <p>{t('quickSetup.info')}</p>
          {!household.hasFreezer && (
            <p className={styles.freezerNote}>{t('quickSetup.noFreezer')}</p>
          )}
        </div>

        <div className={styles.actions}>
          <Button variant="secondary" onClick={onSkip}>
            {t('quickSetup.skip')}
          </Button>
          <Button variant="primary" onClick={onAddItems}>
            {t('quickSetup.addItems')}
          </Button>
        </div>
      </div>
    </div>
  );
};
