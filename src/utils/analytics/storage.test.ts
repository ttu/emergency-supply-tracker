import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  getAnalyticsStats,
  getAnalyticsEvents,
  clearAnalyticsData,
} from './storage';
import { trackAppLaunch, trackItemAdded, trackItemDeleted } from './tracking';

describe('analytics storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('getAnalyticsStats', () => {
    it('returns default stats when no data exists', () => {
      const stats = getAnalyticsStats();
      expect(stats.totalLaunches).toBe(0);
      expect(stats.totalItemsAdded).toBe(0);
      expect(stats.totalItemsDeleted).toBe(0);
      expect(stats.firstLaunch).toBeNull();
      expect(stats.lastLaunch).toBeNull();
    });

    it('returns accumulated stats after tracking events', () => {
      const initialStats = getAnalyticsStats();
      const initialLaunches = initialStats.totalLaunches;
      const initialAdded = initialStats.totalItemsAdded;
      const initialDeleted = initialStats.totalItemsDeleted;

      trackAppLaunch();
      trackItemAdded('Water', 'water-beverages');
      trackItemAdded('Rice', 'food');
      trackItemDeleted('Old Item', 'food');

      const stats = getAnalyticsStats();
      expect(stats.totalLaunches).toBe(initialLaunches + 1);
      expect(stats.totalItemsAdded).toBe(initialAdded + 2);
      expect(stats.totalItemsDeleted).toBe(initialDeleted + 1);
      expect(stats.firstLaunch).not.toBeNull();
      expect(stats.lastLaunch).not.toBeNull();
    });
  });

  describe('getAnalyticsEvents', () => {
    it('returns array of events', () => {
      const events = getAnalyticsEvents();
      expect(Array.isArray(events)).toBe(true);
    });

    it('includes new events after tracking', () => {
      const initialCount = getAnalyticsEvents().length;

      trackAppLaunch();
      trackItemAdded('Water', 'water-beverages');
      trackItemDeleted('Old Item', 'food');

      const events = getAnalyticsEvents();
      expect(events.length).toBe(initialCount + 3);

      const types = events.slice(-3).map((e) => e.type);
      expect(types).toContain('app_launch');
      expect(types).toContain('item_added');
      expect(types).toContain('item_deleted');
    });
  });

  describe('clearAnalyticsData', () => {
    it('resets analytics data to defaults', () => {
      // First clear any existing data
      clearAnalyticsData();

      // Verify starting clean
      expect(getAnalyticsStats().totalLaunches).toBe(0);

      // Add some data
      trackAppLaunch();
      trackItemAdded('Water', 'water-beverages');

      // Verify data was added
      expect(getAnalyticsStats().totalLaunches).toBe(1);
      expect(getAnalyticsEvents().length).toBe(2);

      // Clear and verify
      clearAnalyticsData();

      const stats = getAnalyticsStats();
      const events = getAnalyticsEvents();

      expect(stats.totalLaunches).toBe(0);
      expect(stats.totalItemsAdded).toBe(0);
      expect(events).toEqual([]);
    });
  });
});
