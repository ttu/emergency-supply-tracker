/**
 * Analytics localStorage operations.
 */

import type { AnalyticsData, AnalyticsEvent, AnalyticsStats } from './types';

const ANALYTICS_STORAGE_KEY = 'emergencySupplyTracker_analytics';

/**
 * Maximum number of events to store (to prevent localStorage bloat).
 */
const MAX_EVENTS = 1000;

const DEFAULT_ANALYTICS_DATA: AnalyticsData = {
  events: [],
  stats: {
    totalLaunches: 0,
    totalItemsAdded: 0,
    totalItemsDeleted: 0,
    firstLaunch: null,
    lastLaunch: null,
  },
};

export function getAnalyticsData(): AnalyticsData {
  try {
    const json = localStorage.getItem(ANALYTICS_STORAGE_KEY);
    if (!json) return { ...DEFAULT_ANALYTICS_DATA };
    return JSON.parse(json) as AnalyticsData;
  } catch (error) {
    console.error('Failed to load analytics data:', error);
    return { ...DEFAULT_ANALYTICS_DATA };
  }
}

export function saveAnalyticsData(data: AnalyticsData): void {
  try {
    // Trim events if exceeding max
    if (data.events.length > MAX_EVENTS) {
      data.events = data.events.slice(-MAX_EVENTS);
    }
    const json = JSON.stringify(data);
    localStorage.setItem(ANALYTICS_STORAGE_KEY, json);
  } catch (error) {
    console.error('Failed to save analytics data:', error);
  }
}

/**
 * Get current analytics statistics.
 */
export function getAnalyticsStats(): AnalyticsStats {
  return getAnalyticsData().stats;
}

/**
 * Get all analytics events.
 */
export function getAnalyticsEvents(): AnalyticsEvent[] {
  return getAnalyticsData().events;
}

/**
 * Clear all analytics data.
 */
export function clearAnalyticsData(): void {
  localStorage.removeItem(ANALYTICS_STORAGE_KEY);
}
