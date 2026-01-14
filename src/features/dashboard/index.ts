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
  useCalculationOptions,
  useCategoryStatuses,
  useDashboardAlerts,
} from './hooks';
export type {
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
  shouldShowBackupReminder,
  dismissBackupReminder,
  recordBackupDate,
} from './utils';
export type {
  CategoryCalculationOptions,
  CategoryShortage,
  CategoryStatusSummary,
  CategoryDisplayStatus,
} from './utils';
