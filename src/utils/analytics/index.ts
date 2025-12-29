/**
 * Local Analytics Module
 * Tracks app usage events and stores them in localStorage.
 * All data stays local - no external tracking.
 */

// Types
export type {
  AnalyticsEventType,
  AnalyticsEvent,
  AnalyticsStats,
  AnalyticsData,
} from './types';

// Storage operations
export {
  getAnalyticsStats,
  getAnalyticsEvents,
  clearAnalyticsData,
} from './storage';

// Tracking functions
export {
  trackAppLaunch,
  trackItemAdded,
  trackItemsBulkAdded,
  trackItemDeleted,
} from './tracking';
