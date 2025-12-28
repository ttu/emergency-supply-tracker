import { useMemo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { AlertBanner } from '../components/dashboard/AlertBanner';
import type { Alert } from '../components/dashboard/AlertBanner';
import { CategoryGrid } from '../components/dashboard/CategoryGrid';
import { Button } from '../components/common/Button';
import { useInventory } from '../hooks/useInventory';
import { useHousehold } from '../hooks/useHousehold';
import { STANDARD_CATEGORIES } from '../data/standardCategories';
import {
  calculatePreparednessScore,
  calculateCategoryPreparedness,
} from '../utils/dashboard/preparedness';
import { calculateAllCategoryStatuses } from '../utils/dashboard/categoryStatus';
import { generateDashboardAlerts } from '../utils/dashboard/alerts';
import { getAppData } from '../utils/storage/localStorage';
import {
  shouldShowBackupReminder,
  dismissBackupReminder,
} from '../utils/dashboard/backupReminder';
import type { PageType } from '../components/common/Navigation';
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
  const { items, dismissedAlertIds, dismissAlert, reactivateAllAlerts } =
    useInventory();
  const { household } = useHousehold();
  const [backupReminderDismissed, setBackupReminderDismissed] = useState(false);

  // Calculate overall preparedness score
  const preparednessScore = useMemo(
    () => calculatePreparednessScore(items, household),
    [items, household],
  );

  // Calculate per-category preparedness
  const categoryPreparedness = useMemo(() => {
    const map = new Map<string, number>();
    STANDARD_CATEGORIES.forEach((category) => {
      const score = calculateCategoryPreparedness(
        category.id,
        items,
        household,
      );
      map.set(category.id, score);
    });
    return map;
  }, [items, household]);

  // Calculate category statuses
  const categoryStatuses = useMemo(
    () =>
      calculateAllCategoryStatuses(
        STANDARD_CATEGORIES,
        items,
        categoryPreparedness,
        household,
      ),
    [items, categoryPreparedness, household],
  );

  // Generate alerts
  const allAlerts = useMemo(
    () => generateDashboardAlerts(items, t),
    [items, t],
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
    () =>
      allAlerts.filter((alert) => dismissedSet.has(alert.id)).length,
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
