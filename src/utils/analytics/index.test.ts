import {
  getAnalyticsStats,
  getAnalyticsEvents,
  clearAnalyticsData,
  trackAppLaunch,
  trackItemAdded,
  trackItemsBulkAdded,
  trackItemDeleted,
} from './index';

describe('analytics index exports', () => {
  it('exports storage functions', () => {
    expect(typeof getAnalyticsStats).toBe('function');
    expect(typeof getAnalyticsEvents).toBe('function');
    expect(typeof clearAnalyticsData).toBe('function');
  });

  it('exports tracking functions', () => {
    expect(typeof trackAppLaunch).toBe('function');
    expect(typeof trackItemAdded).toBe('function');
    expect(typeof trackItemsBulkAdded).toBe('function');
    expect(typeof trackItemDeleted).toBe('function');
  });
});
