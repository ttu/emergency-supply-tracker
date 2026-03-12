import { describe, it, expect, beforeEach } from 'vitest';
import { trackAppLaunch } from './tracking';
import { getAnalyticsData } from './storage';

describe('analytics tracking - mutation killing tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('trackAppLaunch firstLaunch logic (L23)', () => {
    it('sets firstLaunch on first launch when it is undefined', () => {
      trackAppLaunch();
      const data = getAnalyticsData();
      expect(data.stats.firstLaunch).toBeDefined();
      expect(typeof data.stats.firstLaunch).toBe('string');
      expect(data.stats.firstLaunch!.length).toBeGreaterThan(0);
    });

    it('does not overwrite firstLaunch on subsequent launches', () => {
      trackAppLaunch();
      const firstData = getAnalyticsData();
      const originalFirstLaunch = firstData.stats.firstLaunch;

      // Second launch should NOT change firstLaunch
      trackAppLaunch();
      const secondData = getAnalyticsData();
      expect(secondData.stats.firstLaunch).toBe(originalFirstLaunch);
    });

    it('firstLaunch is falsy before first launch (conditional check matters)', () => {
      const data = getAnalyticsData();
      // Before any launch, firstLaunch should be undefined/falsy
      expect(data.stats.firstLaunch).toBeFalsy();
    });

    it('firstLaunch is truthy after first launch', () => {
      trackAppLaunch();
      const data = getAnalyticsData();
      // After launch, firstLaunch must be truthy (not false/undefined)
      expect(data.stats.firstLaunch).toBeTruthy();
    });

    it('the if-block body actually executes on first launch (not empty block)', () => {
      // If the block is replaced with {}, firstLaunch stays undefined
      trackAppLaunch();
      const data = getAnalyticsData();
      expect(data.stats.firstLaunch).not.toBeUndefined();
      // Also verify it's a valid ISO timestamp
      expect(() => new Date(data.stats.firstLaunch!)).not.toThrow();
      expect(new Date(data.stats.firstLaunch!).getTime()).not.toBeNaN();
    });

    it('firstLaunch equals the timestamp from the first launch event', () => {
      trackAppLaunch();
      const data = getAnalyticsData();
      // firstLaunch should match lastLaunch for the very first launch
      expect(data.stats.firstLaunch).toBe(data.stats.lastLaunch);
    });
  });
});
