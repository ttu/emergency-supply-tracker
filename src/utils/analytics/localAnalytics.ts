/**
 * Local Analytics Service
 * Tracks app usage events and stores them in localStorage.
 * All data stays local - no external tracking.
 */

// =============================================================================
// TYPES
// =============================================================================

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

export interface AnalyticsData {
  events: AnalyticsEvent[];
  stats: {
    totalLaunches: number;
    totalItemsAdded: number;
    totalItemsDeleted: number;
    firstLaunch: string | null;
    lastLaunch: string | null;
  };
}

// =============================================================================
// CONSTANTS
// =============================================================================

const ANALYTICS_STORAGE_KEY = 'emergencySupplyTracker_analytics';

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

/**
 * Maximum number of events to store (to prevent localStorage bloat).
 */
const MAX_EVENTS = 1000;

// =============================================================================
// STORAGE FUNCTIONS
// =============================================================================

function getAnalyticsData(): AnalyticsData {
  try {
    const json = localStorage.getItem(ANALYTICS_STORAGE_KEY);
    if (!json) return { ...DEFAULT_ANALYTICS_DATA };
    return JSON.parse(json) as AnalyticsData;
  } catch (error) {
    console.error('Failed to load analytics data:', error);
    return { ...DEFAULT_ANALYTICS_DATA };
  }
}

function saveAnalyticsData(data: AnalyticsData): void {
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

// =============================================================================
// TRACKING FUNCTIONS
// =============================================================================

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

// =============================================================================
// QUERY FUNCTIONS
// =============================================================================

/**
 * Get current analytics statistics.
 */
export function getAnalyticsStats(): AnalyticsData['stats'] {
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
