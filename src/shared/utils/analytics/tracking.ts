/**
 * Analytics tracking functions.
 */

import type { AnalyticsEvent } from './types';
import { getAnalyticsData, saveAnalyticsData } from './storage';

/**
 * Track an app launch event.
 */
export function trackAppLaunch(): void {
  const data = getAnalyticsData();
  const now = new Date().toISOString();

  const event: AnalyticsEvent = {
    type: 'app_launch',
    timestamp: now,
  };

  data.events.push(event);
  data.stats.totalLaunches += 1;
  data.stats.lastLaunch = now;
  if (!data.stats.firstLaunch) {
    data.stats.firstLaunch = now;
  }

  saveAnalyticsData(data);
}

/**
 * Track when an item is added to inventory.
 */
export function trackItemAdded(itemName?: string, categoryId?: string): void {
  const data = getAnalyticsData();

  const event: AnalyticsEvent = {
    type: 'item_added',
    timestamp: new Date().toISOString(),
    metadata: {
      itemName,
      categoryId,
    },
  };

  data.events.push(event);
  data.stats.totalItemsAdded += 1;

  saveAnalyticsData(data);
}

/**
 * Track when multiple items are added at once (e.g., during onboarding).
 */
export function trackItemsBulkAdded(count: number): void {
  const data = getAnalyticsData();

  const event: AnalyticsEvent = {
    type: 'items_bulk_added',
    timestamp: new Date().toISOString(),
    metadata: {
      count,
    },
  };

  data.events.push(event);
  data.stats.totalItemsAdded += count;

  saveAnalyticsData(data);
}

/**
 * Track when an item is deleted from inventory.
 */
export function trackItemDeleted(itemName?: string, categoryId?: string): void {
  const data = getAnalyticsData();

  const event: AnalyticsEvent = {
    type: 'item_deleted',
    timestamp: new Date().toISOString(),
    metadata: {
      itemName,
      categoryId,
    },
  };

  data.events.push(event);
  data.stats.totalItemsDeleted += 1;

  saveAnalyticsData(data);
}
