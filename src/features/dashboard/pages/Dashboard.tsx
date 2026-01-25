import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/components/Button';
import { useHousehold } from '@/features/household';
import { AlertBanner } from '@/features/alerts';
import { DashboardHeader, CategoryGrid } from '@/features/dashboard';
import { useShoppingListExport } from '@/features/settings/hooks/useShoppingListExport';
import { useCategoryStatuses } from '../hooks/useCategoryStatuses';
import { useDashboardAlerts } from '../hooks/useDashboardAlerts';
import { createAlertId } from '@/shared/types';
import type { PageType } from '@/shared/components/Navigation';
import styles from './Dashboard.module.css';

export interface DashboardProps {
  onNavigate?: (
    page: PageType,
    options?: { openAddModal?: boolean; initialCategoryId?: string },
  ) => void;
}

/**
 * Dashboard page component - displays overview of emergency supply preparedness.
 *
 * This component is now focused on presentation and navigation concerns,
 * with business logic extracted into custom hooks:
 * - useCategoryStatuses: category preparedness and status calculations
 * - useDashboardAlerts: alert generation, filtering, and management
 */
export function Dashboard({ onNavigate }: DashboardProps = {}) {
  const { t } = useTranslation();
  const { household } = useHousehold();

  // Use extracted hooks for business logic
  const { categoryStatuses, preparednessScore } = useCategoryStatuses();
  const {
    activeAlerts,
    hiddenAlertsCount,
    handleDismissAlert,
    handleDismissAllAlerts,
    handleShowAllAlerts,
  } = useDashboardAlerts();
  const { handleExport: handleExportShoppingList } = useShoppingListExport();

  // Navigation handlers - memoized to prevent unnecessary re-renders
  const handleCategoryClick = useCallback(
    (categoryId: string) => {
      onNavigate?.('inventory', { initialCategoryId: categoryId });
    },
    [onNavigate],
  );

  const handleAddItems = useCallback(() => {
    onNavigate?.('inventory', { openAddModal: true });
  }, [onNavigate]);

  const handleViewInventory = useCallback(() => {
    onNavigate?.('inventory');
  }, [onNavigate]);

  // Alert dismiss handler that converts string to AlertId
  const onDismissAlert = (alertId: string) => {
    handleDismissAlert(createAlertId(alertId));
  };

  // Alert click handler that navigates to the category
  const handleAlertClick = (categoryId: string) => {
    onNavigate?.('inventory', { initialCategoryId: categoryId });
  };

  return (
    <div className={styles.dashboard} data-testid="page-dashboard">
      <DashboardHeader
        preparednessScore={preparednessScore}
        householdSize={household.adults + household.children}
        supplyDays={household.supplyDurationDays}
      />

      {/* Alerts Section */}
      {activeAlerts.length > 0 && (
        <section className={styles.alertsSection}>
          <AlertBanner
            alerts={activeAlerts}
            onDismiss={onDismissAlert}
            onDismissAll={handleDismissAllAlerts}
            onAlertClick={handleAlertClick}
          />
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
      <section className={styles.quickActions} data-testid="quick-actions">
        <h2 className={styles.sectionTitle}>{t('dashboard.quickActions')}</h2>
        <div className={styles.actionsGrid}>
          <Button
            variant="primary"
            onClick={handleAddItems}
            data-testid="quick-add-items"
          >
            ➕ {t('dashboard.addItems')}
          </Button>
          <Button
            variant="secondary"
            onClick={handleViewInventory}
            data-testid="quick-view-inventory"
          >
            📋 {t('dashboard.viewInventory')}
          </Button>
          <Button
            variant="secondary"
            onClick={handleExportShoppingList}
            data-testid="quick-export-shopping-list"
          >
            🛒 {t('dashboard.exportShoppingList')}
          </Button>
        </div>
      </section>

      {/* Categories Overview */}
      <section
        className={styles.categoriesSection}
        data-testid="categories-overview"
      >
        <h2 className={styles.sectionTitle}>
          {t('dashboard.categoriesOverview')}
        </h2>
        <CategoryGrid
          categories={categoryStatuses.map((cat) => ({
            ...cat,
            categoryId: cat.categoryId as never,
            onCategoryClick: handleCategoryClick,
          }))}
        />
      </section>
    </div>
  );
}
