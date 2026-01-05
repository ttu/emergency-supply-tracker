import { useMemo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/components/Button';
import { useInventory } from '@/features/inventory';
import { useHousehold } from '@/features/household';
import { useSettings } from '@/features/settings';
import { useRecommendedItems } from '@/shared/hooks/useRecommendedItems';
import { STANDARD_CATEGORIES } from '@/features/categories';
import {
  AlertBanner,
  generateDashboardAlerts,
  type Alert,
} from '@/features/alerts';
import {
  DashboardHeader,
  CategoryGrid,
  calculatePreparednessScore,
  calculateCategoryPreparedness,
  calculateAllCategoryStatuses,
  shouldShowBackupReminder,
  dismissBackupReminder,
  type CategoryCalculationOptions,
} from '@/features/dashboard';
import { getAppData } from '@/shared/utils/storage/localStorage';
import {
  DAILY_CALORIES_PER_PERSON,
  DAILY_WATER_PER_PERSON,
  CHILDREN_REQUIREMENT_MULTIPLIER,
} from '@/shared/utils/constants';
import type { PageType } from '@/shared/components/Navigation';
import styles from './Dashboard.module.css';

export interface DashboardProps {
  onNavigate?: (
    page: PageType,
    options?: { openAddModal?: boolean; initialCategoryId?: string },
  ) => void;
}

const BACKUP_REMINDER_ALERT_ID = 'backup-reminder';

export function Dashboard({ onNavigate }: DashboardProps = {}) {
  const { t } = useTranslation();
  const {
    items,
    dismissedAlertIds,
    dismissAlert,
    reactivateAllAlerts,
    disabledRecommendedItems,
  } = useInventory();
  const { household } = useHousehold();
  const { settings } = useSettings();
  const { recommendedItems } = useRecommendedItems();
  const [backupReminderDismissed, setBackupReminderDismissed] = useState(false);

  // Build calculation options from user settings
  const calculationOptions: CategoryCalculationOptions = useMemo(
    () => ({
      childrenMultiplier:
        (settings.childrenRequirementPercentage ??
          CHILDREN_REQUIREMENT_MULTIPLIER * 100) / 100,
      dailyCaloriesPerPerson:
        settings.dailyCaloriesPerPerson ?? DAILY_CALORIES_PER_PERSON,
      dailyWaterPerPerson:
        settings.dailyWaterPerPerson ?? DAILY_WATER_PER_PERSON,
    }),
    [
      settings.childrenRequirementPercentage,
      settings.dailyCaloriesPerPerson,
      settings.dailyWaterPerPerson,
    ],
  );

  // Calculate overall preparedness score
  const preparednessScore = useMemo(
    () => calculatePreparednessScore(items, household, recommendedItems),
    [items, household, recommendedItems],
  );

  // Calculate per-category preparedness
  const categoryPreparedness = useMemo(() => {
    const map = new Map<string, number>();
    STANDARD_CATEGORIES.forEach((category) => {
      const score = calculateCategoryPreparedness(
        category.id,
        items,
        household,
        disabledRecommendedItems,
        recommendedItems,
        calculationOptions,
      );
      map.set(category.id, score);
    });
    return map;
  }, [
    items,
    household,
    disabledRecommendedItems,
    recommendedItems,
    calculationOptions,
  ]);

  // Calculate category statuses
  const categoryStatuses = useMemo(
    () =>
      calculateAllCategoryStatuses(
        STANDARD_CATEGORIES,
        items,
        categoryPreparedness,
        household,
        disabledRecommendedItems,
        recommendedItems,
        calculationOptions,
      ),
    [
      items,
      categoryPreparedness,
      household,
      disabledRecommendedItems,
      recommendedItems,
      calculationOptions,
    ],
  );

  // Generate alerts (including water shortage alerts)
  const allAlerts = useMemo(
    () => generateDashboardAlerts(items, t, household),
    [items, t, household],
  );

  // Generate backup reminder alert if needed
  // Note: items is included in deps to re-evaluate when inventory changes
  const backupReminderAlert: Alert | null = useMemo(() => {
    if (backupReminderDismissed) return null;

    const appData = getAppData();
    if (!shouldShowBackupReminder(appData)) return null;

    return {
      id: BACKUP_REMINDER_ALERT_ID,
      type: 'info',
      message: t('alerts.backup.reminderMessage'),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backupReminderDismissed, t, items]);

  // Combine all alerts with backup reminder first
  const combinedAlerts = useMemo(() => {
    const alerts = [...allAlerts];
    if (backupReminderAlert) {
      alerts.unshift(backupReminderAlert);
    }
    return alerts;
  }, [allAlerts, backupReminderAlert]);

  // Filter out dismissed alerts
  const dismissedSet = useMemo(
    () => new Set(dismissedAlertIds),
    [dismissedAlertIds],
  );

  const activeAlerts = useMemo(
    () => combinedAlerts.filter((alert) => !dismissedSet.has(alert.id)),
    [combinedAlerts, dismissedSet],
  );

  // Count hidden alerts that still exist (excluding backup reminder)
  const hiddenAlertsCount = useMemo(
    () => allAlerts.filter((alert) => dismissedSet.has(alert.id)).length,
    [allAlerts, dismissedSet],
  );

  const handleDismissAlert = useCallback(
    (alertId: string) => {
      if (alertId === BACKUP_REMINDER_ALERT_ID) {
        dismissBackupReminder();
        setBackupReminderDismissed(true);
      } else {
        dismissAlert(alertId);
      }
    },
    [dismissAlert],
  );

  const handleShowAllAlerts = () => {
    reactivateAllAlerts();
  };

  const handleCategoryClick = (categoryId: string) => {
    // Navigate to inventory page filtered by category
    onNavigate?.('inventory', { initialCategoryId: categoryId });
  };

  const handleAddItems = () => {
    // Navigate to inventory page with add modal open
    onNavigate?.('inventory', { openAddModal: true });
  };

  const handleViewInventory = () => {
    // Navigate to inventory page
    onNavigate?.('inventory');
  };

  const handleExportShoppingList = () => {
    // TODO: Export shopping list based on low stock items
    console.log('Export shopping list');
  };

  return (
    <div className={styles.dashboard}>
      <DashboardHeader
        preparednessScore={preparednessScore}
        householdSize={household.adults + household.children}
        supplyDays={household.supplyDurationDays}
      />

      {/* Alerts Section */}
      {activeAlerts.length > 0 && (
        <section className={styles.alertsSection}>
          <AlertBanner alerts={activeAlerts} onDismiss={handleDismissAlert} />
        </section>
      )}

      {/* Hidden Alerts Indicator */}
      {hiddenAlertsCount > 0 && (
        <div className={styles.hiddenAlerts}>
          <span className={styles.hiddenAlertsText}>
            {t('dashboard.hiddenAlerts', { count: hiddenAlertsCount })}
          </span>
          <button
            className={styles.showAllButton}
            onClick={handleShowAllAlerts}
          >
            {t('dashboard.showAllAlerts')}
          </button>
        </div>
      )}

      {/* Quick Actions */}
      <section className={styles.quickActions}>
        <h2 className={styles.sectionTitle}>{t('dashboard.quickActions')}</h2>
        <div className={styles.actionsGrid}>
          <Button variant="primary" onClick={handleAddItems}>
            ➕ {t('dashboard.addItems')}
          </Button>
          <Button variant="secondary" onClick={handleViewInventory}>
            📋 {t('dashboard.viewInventory')}
          </Button>
          <Button variant="secondary" onClick={handleExportShoppingList}>
            🛒 {t('dashboard.exportShoppingList')}
          </Button>
        </div>
      </section>

      {/* Categories Overview */}
      <section className={styles.categoriesSection}>
        <h2 className={styles.sectionTitle}>
          {t('dashboard.categoriesOverview')}
        </h2>
        <CategoryGrid
          categories={categoryStatuses.map((cat) => ({
            ...cat,
            categoryId: cat.categoryId as never,
            onClick: () => handleCategoryClick(cat.categoryId),
          }))}
        />
      </section>
    </div>
  );
}
