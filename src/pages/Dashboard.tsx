import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { AlertBanner } from '../components/dashboard/AlertBanner';
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
import type { PageType } from '../components/common/Navigation';
import styles from './Dashboard.module.css';

export interface DashboardProps {
  onNavigate?: (page: PageType) => void;
}

export function Dashboard({ onNavigate }: DashboardProps = {}) {
  const { t } = useTranslation();
  const { items } = useInventory();
  const { household } = useHousehold();
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(
    new Set(),
  );

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
      ),
    [items, categoryPreparedness],
  );

  // Generate alerts
  const allAlerts = useMemo(
    () => generateDashboardAlerts(items, t),
    [items, t],
  );

  // Filter out dismissed alerts
  const activeAlerts = useMemo(
    () => allAlerts.filter((alert) => !dismissedAlerts.has(alert.id)),
    [allAlerts, dismissedAlerts],
  );

  const handleDismissAlert = (alertId: string) => {
    setDismissedAlerts((prev) => new Set([...prev, alertId]));
  };

  const handleCategoryClick = (categoryId: string) => {
    // Navigate to inventory page filtered by category
    onNavigate?.('inventory');
    // TODO: Pass category filter to inventory page
    console.log('Navigate to category:', categoryId);
  };

  const handleAddItems = () => {
    // Navigate to inventory page
    onNavigate?.('inventory');
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
