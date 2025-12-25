import { generateDashboardAlerts, countAlerts } from './alerts';
import type { InventoryItem } from '../../types';
import type { Alert } from '../../components/dashboard/AlertBanner';

describe('generateDashboardAlerts', () => {
  beforeEach(() => {
    // Set a fixed date for testing
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-01-01'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should return empty array for no items', () => {
    const items: InventoryItem[] = [];
    const alerts = generateDashboardAlerts(items);
    expect(alerts).toEqual([]);
  });

  it('should generate expired item alerts', () => {
    const items: InventoryItem[] = [
      {
        id: '1',
        name: 'Expired Water',
        categoryId: 'water',
        quantity: 10,
        unit: 'gallons',
        recommendedQuantity: 28,
        neverExpires: false,
        expirationDate: '2024-12-01',
        location: '',
        notes: '',
        tags: [],
      },
    ];

    const alerts = generateDashboardAlerts(items);
    const expiredAlert = alerts.find((a) => a.id === 'expired-1');

    expect(expiredAlert).toBeDefined();
    expect(expiredAlert?.type).toBe('critical');
    expect(expiredAlert?.message).toBe('Item has expired');
    expect(expiredAlert?.itemName).toBe('Expired Water');
  });

  it('should generate expiring soon alerts', () => {
    const items: InventoryItem[] = [
      {
        id: '1',
        name: 'Expiring Water',
        categoryId: 'water',
        quantity: 10,
        unit: 'gallons',
        recommendedQuantity: 28,
        neverExpires: false,
        expirationDate: '2025-01-05', // 4 days from test date
        location: '',
        notes: '',
        tags: [],
      },
    ];

    const alerts = generateDashboardAlerts(items);
    const expiringAlert = alerts.find((a) => a.id === 'expiring-soon-1');

    expect(expiringAlert).toBeDefined();
    expect(expiringAlert?.type).toBe('warning');
    expect(expiringAlert?.message).toContain('Expiring in');
    expect(expiringAlert?.message).toContain('days');
  });

  it('should not generate alerts for items that never expire', () => {
    const items: InventoryItem[] = [
      {
        id: '1',
        name: 'Salt',
        categoryId: 'food',
        quantity: 5,
        unit: 'boxes',
        recommendedQuantity: 5,
        neverExpires: true,
        location: '',
        notes: '',
        tags: [],
      },
    ];

    const alerts = generateDashboardAlerts(items);
    const expirationAlerts = alerts.filter(
      (a) => a.id.includes('expired') || a.id.includes('expiring'),
    );

    expect(expirationAlerts).toHaveLength(0);
  });

  it('should generate out of stock alerts', () => {
    const items: InventoryItem[] = [
      {
        id: '1',
        name: 'Water',
        categoryId: 'water',
        quantity: 0,
        unit: 'gallons',
        recommendedQuantity: 28,
        neverExpires: false,
        expirationDate: '2025-12-31',
        location: '',
        notes: '',
        tags: [],
      },
    ];

    const alerts = generateDashboardAlerts(items);
    const stockAlert = alerts.find((a) => a.id === 'out-of-stock-1');

    expect(stockAlert).toBeDefined();
    expect(stockAlert?.type).toBe('critical');
    expect(stockAlert?.message).toBe('Out of stock');
  });

  it('should generate critically low stock alerts', () => {
    const items: InventoryItem[] = [
      {
        id: '1',
        name: 'Water',
        categoryId: 'water',
        quantity: 5,
        unit: 'gallons',
        recommendedQuantity: 28, // 5/28 = 17.8% < 25%
        neverExpires: false,
        expirationDate: '2025-12-31',
        location: '',
        notes: '',
        tags: [],
      },
    ];

    const alerts = generateDashboardAlerts(items);
    const stockAlert = alerts.find((a) => a.id === 'critically-low-1');

    expect(stockAlert).toBeDefined();
    expect(stockAlert?.type).toBe('critical');
    expect(stockAlert?.message).toBe('Critically low stock');
  });

  it('should generate low stock warning alerts', () => {
    const items: InventoryItem[] = [
      {
        id: '1',
        name: 'Water',
        categoryId: 'water',
        quantity: 10,
        unit: 'gallons',
        recommendedQuantity: 28, // 10/28 = 35.7% (between 25% and 50%)
        neverExpires: false,
        expirationDate: '2025-12-31',
        location: '',
        notes: '',
        tags: [],
      },
    ];

    const alerts = generateDashboardAlerts(items);
    const stockAlert = alerts.find((a) => a.id === 'low-stock-1');

    expect(stockAlert).toBeDefined();
    expect(stockAlert?.type).toBe('warning');
    expect(stockAlert?.message).toBe('Running low on stock');
  });

  it('should not generate stock alerts when quantity is adequate', () => {
    const items: InventoryItem[] = [
      {
        id: '1',
        name: 'Water',
        categoryId: 'water',
        quantity: 28,
        unit: 'gallons',
        recommendedQuantity: 28,
        neverExpires: false,
        expirationDate: '2025-12-31',
        location: '',
        notes: '',
        tags: [],
      },
    ];

    const alerts = generateDashboardAlerts(items);
    const stockAlerts = alerts.filter(
      (a) =>
        a.id.includes('stock') ||
        a.id.includes('out-of') ||
        a.id.includes('critically-low'),
    );

    expect(stockAlerts).toHaveLength(0);
  });

  it('should sort alerts by priority (critical first, then warning)', () => {
    const items: InventoryItem[] = [
      {
        id: '1',
        name: 'Warning Item',
        categoryId: 'food',
        quantity: 10,
        unit: 'cans',
        recommendedQuantity: 28,
        neverExpires: false,
        expirationDate: '2025-01-05',
        location: '',
        notes: '',
        tags: [],
      },
      {
        id: '2',
        name: 'Critical Item',
        categoryId: 'water',
        quantity: 0,
        unit: 'gallons',
        recommendedQuantity: 28,
        neverExpires: false,
        expirationDate: '2024-12-01',
        location: '',
        notes: '',
        tags: [],
      },
    ];

    const alerts = generateDashboardAlerts(items);

    // Critical alerts should come before warning alerts
    const criticalIndices = alerts
      .map((a, i) => (a.type === 'critical' ? i : -1))
      .filter((i) => i >= 0);
    const warningIndices = alerts
      .map((a, i) => (a.type === 'warning' ? i : -1))
      .filter((i) => i >= 0);

    if (criticalIndices.length > 0 && warningIndices.length > 0) {
      expect(Math.max(...criticalIndices)).toBeLessThan(
        Math.min(...warningIndices),
      );
    }
  });

  it('should handle items with no recommended quantity', () => {
    const items: InventoryItem[] = [
      {
        id: '1',
        name: 'Custom Item',
        categoryId: 'custom',
        quantity: 5,
        unit: 'units',
        recommendedQuantity: 0,
        neverExpires: false,
        expirationDate: '2025-12-31',
        location: '',
        notes: '',
        tags: [],
      },
    ];

    const alerts = generateDashboardAlerts(items);
    const stockAlerts = alerts.filter((a) => a.id.includes('stock'));

    // Should not generate stock alerts when recommended is 0
    expect(stockAlerts).toHaveLength(0);
  });
});

describe('countAlerts', () => {
  it('should count alerts correctly by type', () => {
    const alerts: Alert[] = [
      { id: '1', type: 'critical', message: 'Test 1' },
      { id: '2', type: 'critical', message: 'Test 2' },
      { id: '3', type: 'warning', message: 'Test 3' },
      { id: '4', type: 'info', message: 'Test 4' },
    ];

    const counts = countAlerts(alerts);

    expect(counts).toEqual({
      critical: 2,
      warning: 1,
      info: 1,
      total: 4,
    });
  });

  it('should return zeros for empty alerts array', () => {
    const alerts: Alert[] = [];
    const counts = countAlerts(alerts);

    expect(counts).toEqual({
      critical: 0,
      warning: 0,
      info: 0,
      total: 0,
    });
  });

  it('should handle all critical alerts', () => {
    const alerts: Alert[] = [
      { id: '1', type: 'critical', message: 'Test 1' },
      { id: '2', type: 'critical', message: 'Test 2' },
      { id: '3', type: 'critical', message: 'Test 3' },
    ];

    const counts = countAlerts(alerts);

    expect(counts).toEqual({
      critical: 3,
      warning: 0,
      info: 0,
      total: 3,
    });
  });
});
