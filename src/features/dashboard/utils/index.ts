export {
  calculateCategoryShortages,
  calculateCategoryStatus,
  calculateAllCategoryStatuses,
  getCategoryDisplayStatus,
} from './categoryStatus';
export type {
  CategoryCalculationOptions,
  CategoryShortage,
  CategoryStatusSummary,
  CategoryDisplayStatus,
} from './categoryStatus';

export {
  calculatePreparednessScore,
  calculatePreparednessScoreFromCategoryStatuses,
  calculateCategoryPreparedness,
} from './preparedness';

// Note: backupReminder utilities are exported from the feature index with deprecation notice.
// Use useBackupTracking hook instead for new code.
