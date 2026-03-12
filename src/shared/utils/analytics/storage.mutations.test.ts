import { describe, it, expect, beforeEach } from 'vitest';
import { getAnalyticsData, saveAnalyticsData } from './storage';
import type { AnalyticsData } from './types';

describe('analytics storage - mutation killing tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('saveAnalyticsData event trimming (L48)', () => {
    it('does not trim events when count is exactly MAX_EVENTS (1000)', () => {
      const events = Array.from({ length: 1000 }, (_, i) => ({
        type: 'app_launch' as const,
        timestamp: `2024-01-01T00:00:${String(i).padStart(2, '0')}.000Z`,
      }));

      const data: AnalyticsData = {
        events,
        stats: {
          totalLaunches: 1000,
          totalItemsAdded: 0,
          totalItemsDeleted: 0,
        },
      };

      saveAnalyticsData(data);
      const saved = getAnalyticsData();
      // Exactly 1000 should NOT be trimmed (> not >=)
      expect(saved.events).toHaveLength(1000);
      // First event should still be present (not sliced off)
      expect(saved.events[0].timestamp).toBe('2024-01-01T00:00:00.000Z');
    });

    it('trims events when count exceeds MAX_EVENTS (1001)', () => {
      const events = Array.from({ length: 1001 }, (_, i) => ({
        type: 'app_launch' as const,
        timestamp: `event-${i}`,
      }));

      const data: AnalyticsData = {
        events,
        stats: {
          totalLaunches: 1001,
          totalItemsAdded: 0,
          totalItemsDeleted: 0,
        },
      };

      saveAnalyticsData(data);
      const saved = getAnalyticsData();
      // Should be trimmed to 1000
      expect(saved.events).toHaveLength(1000);
      // Should keep the last 1000 events (slice(-1000)), so first event is removed
      expect(saved.events[0].timestamp).toBe('event-1');
      expect(saved.events[999].timestamp).toBe('event-1000');
    });

    it('does not trim events when count is below MAX_EVENTS', () => {
      const events = Array.from({ length: 999 }, (_, i) => ({
        type: 'app_launch' as const,
        timestamp: `event-${i}`,
      }));

      const data: AnalyticsData = {
        events,
        stats: {
          totalLaunches: 999,
          totalItemsAdded: 0,
          totalItemsDeleted: 0,
        },
      };

      saveAnalyticsData(data);
      const saved = getAnalyticsData();
      expect(saved.events).toHaveLength(999);
      expect(saved.events[0].timestamp).toBe('event-0');
    });
  });
});
