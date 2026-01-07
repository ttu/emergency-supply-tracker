/**
 * Analytics type definitions.
 */

export type AnalyticsEventType =
  | 'app_launch'
  | 'item_added'
  | 'item_deleted'
  | 'items_bulk_added';

export interface AnalyticsEvent {
  type: AnalyticsEventType;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface AnalyticsStats {
  totalLaunches: number;
  totalItemsAdded: number;
  totalItemsDeleted: number;
  firstLaunch?: string;
  lastLaunch?: string;
}

export interface AnalyticsData {
  events: AnalyticsEvent[];
  stats: AnalyticsStats;
}
