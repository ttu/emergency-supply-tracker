import { describe, it, expect, beforeEach } from 'vitest';
import {
  trackAppLaunch,
  trackItemAdded,
  trackItemDeleted,
  trackItemsBulkAdded,
} from './tracking';
import { getAnalyticsStats, getAnalyticsEvents } from './storage';

describe('analytics tracking', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('trackAppLaunch', () => {
    it('increments total launches', () => {
      const initialLaunches = getAnalyticsStats().totalLaunches;

      trackAppLaunch();
      trackAppLaunch();
      trackAppLaunch();

      const stats = getAnalyticsStats();
      expect(stats.totalLaunches).toBe(initialLaunches + 3);
    });

    it('sets firstLaunch on first launch only', () => {
      trackAppLaunch();
      const firstStats = getAnalyticsStats();
      const firstLaunch = firstStats.firstLaunch;

      trackAppLaunch();
      const secondStats = getAnalyticsStats();

      expect(secondStats.firstLaunch).toBe(firstLaunch);
    });

    it('updates lastLaunch on each launch', () => {
      trackAppLaunch();
      const firstStats = getAnalyticsStats();

      expect(firstStats.lastLaunch).not.toBeNull();
      expect(firstStats.firstLaunch).not.toBeNull();
    });

    it('creates app_launch event', () => {
      const initialCount = getAnalyticsEvents().length;
      trackAppLaunch();

      const events = getAnalyticsEvents();
      expect(events.length).toBe(initialCount + 1);
      expect(events[events.length - 1].type).toBe('app_launch');
      expect(events[events.length - 1].timestamp).toBeDefined();
    });
  });

  describe('trackItemAdded', () => {
    it('increments total items added', () => {
      const initialCount = getAnalyticsStats().totalItemsAdded;

      trackItemAdded('Water', 'water-beverages');
      trackItemAdded('Rice', 'food');

      const stats = getAnalyticsStats();
      expect(stats.totalItemsAdded).toBe(initialCount + 2);
    });

    it('creates item_added event with metadata', () => {
      const initialCount = getAnalyticsEvents().length;
      trackItemAdded('Water', 'water-beverages');

      const events = getAnalyticsEvents();
      expect(events.length).toBe(initialCount + 1);

      const lastEvent = events[events.length - 1];
      expect(lastEvent.type).toBe('item_added');
      expect(lastEvent.metadata).toEqual({
        itemName: 'Water',
        categoryId: 'water-beverages',
      });
    });

    it('handles undefined metadata', () => {
      trackItemAdded();

      const events = getAnalyticsEvents();
      const lastEvent = events[events.length - 1];
      expect(lastEvent.type).toBe('item_added');
      expect(lastEvent.metadata).toEqual({
        itemName: undefined,
        categoryId: undefined,
      });
    });
  });

  describe('trackItemDeleted', () => {
    it('increments total items deleted', () => {
      const initialCount = getAnalyticsStats().totalItemsDeleted;

      trackItemDeleted('Old Water', 'water-beverages');
      trackItemDeleted('Expired Food', 'food');

      const stats = getAnalyticsStats();
      expect(stats.totalItemsDeleted).toBe(initialCount + 2);
    });

    it('creates item_deleted event with metadata', () => {
      const initialCount = getAnalyticsEvents().length;
      trackItemDeleted('Old Water', 'water-beverages');

      const events = getAnalyticsEvents();
      expect(events.length).toBe(initialCount + 1);

      const lastEvent = events[events.length - 1];
      expect(lastEvent.type).toBe('item_deleted');
      expect(lastEvent.metadata).toEqual({
        itemName: 'Old Water',
        categoryId: 'water-beverages',
      });
    });
  });

  describe('trackItemsBulkAdded', () => {
    it('increments total items added by count', () => {
      const initialCount = getAnalyticsStats().totalItemsAdded;

      trackItemsBulkAdded(10);
      trackItemsBulkAdded(5);

      const stats = getAnalyticsStats();
      expect(stats.totalItemsAdded).toBe(initialCount + 15);
    });

    it('creates items_bulk_added event with count metadata', () => {
      const initialCount = getAnalyticsEvents().length;
      trackItemsBulkAdded(10);

      const events = getAnalyticsEvents();
      expect(events.length).toBe(initialCount + 1);

      const lastEvent = events[events.length - 1];
      expect(lastEvent.type).toBe('items_bulk_added');
      expect(lastEvent.metadata).toEqual({ count: 10 });
    });
  });
});
