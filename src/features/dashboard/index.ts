// Components
export { CategoryCard, CategoryGrid, DashboardHeader } from './components';
export type {
  CategoryCardProps,
  CategoryGridProps,
  DashboardHeaderProps,
} from './components';

// Pages
export { Dashboard } from './pages/Dashboard';
export type { DashboardProps } from './pages/Dashboard';

// Hooks
export {
  useBackupTracking,
  useCalculationOptions,
  useCategoryStatuses,
  useDashboardAlerts,
} from './hooks';
export type {
  UseBackupTrackingResult,
  UseCategoryStatusesResult,
  UseDashboardAlertsResult,
} from './hooks';

// Utils
export {
  calculateCategoryShortages,
  calculateCategoryStatus,
  calculateAllCategoryStatuses,
  getCategoryDisplayStatus,
  calculatePreparednessScore,
  calculatePreparednessScoreFromCategoryStatuses,
  calculateCategoryPreparedness,
} from './utils';
export type {
  CategoryCalculationOptions,
  CategoryShortage,
  CategoryStatusSummary,
  CategoryDisplayStatus,
} from './utils';

/**
 * @deprecated Use useBackupTracking hook instead.
 * These functions are kept for backward compatibility but will be removed in a future version.
 */
export {
  shouldShowBackupReminder,
  dismissBackupReminder,
  recordBackupDate,
} from './utils/backupReminder';
