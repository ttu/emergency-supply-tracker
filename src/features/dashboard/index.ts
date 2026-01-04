// Components
export { CategoryCard, CategoryGrid, DashboardHeader } from './components';
export type {
  CategoryCardProps,
  CategoryGridProps,
  DashboardHeaderProps,
} from './components';

// Utils
export {
  calculateCategoryShortages,
  calculateCategoryStatus,
  calculateAllCategoryStatuses,
  getCategoryDisplayStatus,
  calculatePreparednessScore,
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
