import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { generateDashboardAlerts, countAlerts } from './alerts';
import {
  createMockInventoryItem,
  createMockHousehold,
  createMockAlert,
} from '@/shared/utils/test/factories';

// Mock translation function
const mockT = (key: string, options?: Record<string, string | number>) => {
  // Simple mock that returns the key with interpolated values
  if (key === 'alerts.expiration.expired') return 'Item has expired';
  if (key === 'alerts.expiration.expiringSoon')
    return `Expiring in ${options?.days} days`;
  if (key === 'alerts.stock.outOfStock') return 'No items in stock';
  if (key === 'alerts.stock.criticallyLow')
    return `Critically low (${options?.percent}% stocked)`;
  if (key === 'alerts.stock.runningLow')
    return `Running low (${options?.percent}% stocked)`;
  if (key === 'alerts.water.preparationShortage')
    return `Need ${options?.liters}L more water for food preparation`;
  return key;
};

const mockHousehold = createMockHousehold();

describe('generateDashboardAlerts', () => {
  beforeEach(() => {
    // Set a fixed date for testing
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-01'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return empty array for no items', () => {
    const items: InventoryItem[] = [];
    const alerts = generateDashboardAlerts(items, mockT);
    expect(alerts).toEqual([]);
  });

  it('should generate expired item alerts', () => {
    const items: InventoryItem[] = [
      createMockInventoryItem({
        id: '1',
        name: 'Expired Water',
        categoryId: 'water',
        neverExpires: false,
        expirationDate: '2024-12-01',
      }),
    ];

    const alerts = generateDashboardAlerts(items, mockT);
    const expiredAlert = alerts.find((a) => a.id === 'expired-1');

    expect(expiredAlert).toBeDefined();
    expect(expiredAlert?.type).toBe('critical');
    expect(expiredAlert?.message).toBe('Item has expired');
    expect(expiredAlert?.itemName).toBe('Expired Water');
  });

  it('should generate expiring soon alerts', () => {
    const items = [
      createMockInventoryItem({
        id: '1',
        name: 'Expiring Water',
        categoryId: 'water',
        neverExpires: false,
        expirationDate: '2025-01-05', // 4 days from test date
      }),
    ];

    const alerts = generateDashboardAlerts(items, mockT);
    const expiringAlert = alerts.find((a) => a.id === 'expiring-soon-1');

    expect(expiringAlert).toBeDefined();
    expect(expiringAlert?.type).toBe('warning');
    expect(expiringAlert?.message).toContain('Expiring in');
    expect(expiringAlert?.message).toContain('days');
  });

  it('should handle items where getDaysUntilExpiration returns undefined', () => {
    // This tests the case where daysUntilExpiration === undefined check
    const items = [
      createMockInventoryItem({
        id: '1',
        name: 'Item with undefined expiration',
        categoryId: 'food',
        neverExpires: false,
        expirationDate: undefined, // This will cause getDaysUntilExpiration to return undefined
      }),
    ];

    const alerts = generateDashboardAlerts(items, mockT);
    // Should not generate any expiration alerts
    expect(
      alerts.filter(
        (a) => a.id?.includes('expired') || a.id?.includes('expiring'),
      ),
    ).toEqual([]);
  });

  it('should not generate alerts for items that never expire', () => {
    const items = [
      createMockInventoryItem({
        id: '1',
        name: 'Salt',
        categoryId: 'food',
        neverExpires: true,
      }),
    ];

    const alerts = generateDashboardAlerts(items, mockT);
    const expirationAlerts = alerts.filter(
      (a) => a.id.includes('expired') || a.id.includes('expiring'),
    );

    expect(expirationAlerts).toHaveLength(0);
  });

  it('should generate category out of stock alerts', () => {
    const items = [
      createMockInventoryItem({
        id: '1',
        name: 'Water',
        categoryId: 'water-beverages',
        quantity: 0,
        unit: 'gallons',
        recommendedQuantity: 28,
        neverExpires: false,
        expirationDate: '2025-12-31',
      }),
    ];

    const alerts = generateDashboardAlerts(items, mockT);
    const stockAlert = alerts.find((a) =>
      a.id.includes('category-out-of-stock'),
    );

    expect(stockAlert).toBeDefined();
    expect(stockAlert?.type).toBe('critical');
    expect(stockAlert?.message).toBe('No items in stock');
  });

  it('should generate category critically low stock alerts', () => {
    const items = [
      createMockInventoryItem({
        id: '1',
        name: 'Water',
        categoryId: 'water-beverages',
        quantity: 5,
        unit: 'gallons',
        recommendedQuantity: 28, // 5/28 = 17.8% < 25%
        neverExpires: false,
        expirationDate: '2025-12-31',
      }),
    ];

    const alerts = generateDashboardAlerts(items, mockT);
    const stockAlert = alerts.find((a) =>
      a.id.includes('category-critically-low'),
    );

    expect(stockAlert).toBeDefined();
    expect(stockAlert?.type).toBe('critical');
    expect(stockAlert?.message).toContain('Critically low');
    expect(stockAlert?.message).toContain('%');
  });

  it('should generate category low stock warning alerts', () => {
    const items = [
      createMockInventoryItem({
        id: '1',
        name: 'Water',
        categoryId: 'water-beverages',
        quantity: 10,
        unit: 'gallons',
        recommendedQuantity: 28, // 10/28 = 35.7% (between 25% and 50%)
        neverExpires: false,
        expirationDate: '2025-12-31',
      }),
    ];

    const alerts = generateDashboardAlerts(items, mockT);
    const stockAlert = alerts.find((a) => a.id.includes('category-low-stock'));

    expect(stockAlert).toBeDefined();
    expect(stockAlert?.type).toBe('warning');
    expect(stockAlert?.message).toContain('Running low');
    expect(stockAlert?.message).toContain('%');
  });

  it('should not generate stock alerts when category quantity is adequate', () => {
    const items = [
      createMockInventoryItem({
        id: '1',
        name: 'Water',
        categoryId: 'water-beverages',
        quantity: 28,
        unit: 'gallons',
        recommendedQuantity: 28,
        neverExpires: false,
        expirationDate: '2025-12-31',
      }),
    ];

    const alerts = generateDashboardAlerts(items, mockT);
    const stockAlerts = alerts.filter((a) => a.id.includes('category'));

    expect(stockAlerts).toHaveLength(0);
  });

  it('should sort alerts by priority (critical first, then warning)', () => {
    const items = [
      createMockInventoryItem({
        id: '1',
        name: 'Warning Item',
        categoryId: 'food',
        neverExpires: false,
        expirationDate: '2025-01-05',
      }),
      createMockInventoryItem({
        id: '2',
        name: 'Critical Item',
        categoryId: 'water',
        quantity: 0, // Out of stock for critical alert
        recommendedQuantity: 28,
        neverExpires: false,
        expirationDate: '2024-12-01',
      }),
    ];

    const alerts = generateDashboardAlerts(items, mockT);

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
    const items = [
      createMockInventoryItem({
        id: '1',
        name: 'Custom Item',
        categoryId: 'custom',
        recommendedQuantity: 0, // No recommended quantity
        neverExpires: false,
        expirationDate: '2025-12-31',
      }),
    ];

    const alerts = generateDashboardAlerts(items, mockT);
    const stockAlerts = alerts.filter((a) => a.id.includes('stock'));

    // Should not generate stock alerts when recommended is 0
    expect(stockAlerts).toHaveLength(0);
  });

  it('should aggregate multiple items in same category for stock alerts', () => {
    const items = [
      createMockInventoryItem({
        id: '1',
        name: 'Bottled Water',
        categoryId: 'water-beverages',
        quantity: 5,
        unit: 'liters',
        recommendedQuantity: 20,
        neverExpires: false,
        expirationDate: '2025-12-31',
      }),
      createMockInventoryItem({
        id: '2',
        name: 'Juice',
        categoryId: 'water-beverages',
        quantity: 10,
        unit: 'liters',
        recommendedQuantity: 15,
        neverExpires: false,
        expirationDate: '2025-12-31',
      }),
    ];

    const alerts = generateDashboardAlerts(items, mockT);
    const categoryAlerts = alerts.filter((a) => a.id.includes('category'));

    // Total: 15 liters / 35 liters = 42.8% (between 25% and 50%)
    // Should generate ONE warning alert for the category, not two separate alerts
    expect(categoryAlerts).toHaveLength(1);
    expect(categoryAlerts[0].type).toBe('warning');
    expect(categoryAlerts[0].message).toContain('Running low');
    expect(categoryAlerts[0].message).toContain('43%'); // Rounded percentage (15/35 = 42.857 -> 43%)
  });
});

describe('countAlerts', () => {
  it('should count alerts correctly by type', () => {
    const alerts = [
      createMockAlert({ id: '1', type: 'critical', message: 'Test 1' }),
      createMockAlert({ id: '2', type: 'critical', message: 'Test 2' }),
      createMockAlert({ id: '3', type: 'warning', message: 'Test 3' }),
      createMockAlert({ id: '4', type: 'info', message: 'Test 4' }),
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
    const alerts: ReturnType<typeof createMockAlert>[] = [];
    const counts = countAlerts(alerts);

    expect(counts).toEqual({
      critical: 0,
      warning: 0,
      info: 0,
      total: 0,
    });
  });

  it('should handle all critical alerts', () => {
    const alerts = [
      createMockAlert({ id: '1', type: 'critical', message: 'Test 1' }),
      createMockAlert({ id: '2', type: 'critical', message: 'Test 2' }),
      createMockAlert({ id: '3', type: 'critical', message: 'Test 3' }),
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

describe('water shortage alerts', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-01'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should generate water shortage alert when food requires more water than available', () => {
    const items = [
      createMockInventoryItem({
        id: '1',
        name: 'Bottled Water',
        categoryId: 'water-beverages',
        quantity: 5,
        unit: 'liters',
        recommendedQuantity: 18,
        productTemplateId: 'bottled-water',
        neverExpires: false,
        expirationDate: '2025-12-31',
      }),
      createMockInventoryItem({
        id: '2',
        name: 'Pasta',
        categoryId: 'food',
        quantity: 10,
        unit: 'kilograms',
        recommendedQuantity: 1,
        productTemplateId: 'pasta', // 1.0 L/kg water requirement
        neverExpires: false,
        expirationDate: '2025-12-31',
      }),
    ];

    const alerts = generateDashboardAlerts(items, mockT, mockHousehold);
    const waterAlert = alerts.find(
      (a) => a.id === 'water-shortage-preparation',
    );

    expect(waterAlert).toBeDefined();
    expect(waterAlert?.type).toBe('warning');
    expect(waterAlert?.message).toContain('Need');
    expect(waterAlert?.message).toContain('L more water');
  });

  it('should not generate water shortage alert when enough water available', () => {
    const items = [
      createMockInventoryItem({
        id: '1',
        name: 'Bottled Water',
        categoryId: 'water-beverages',
        quantity: 50,
        unit: 'liters',
        recommendedQuantity: 18,
        productTemplateId: 'bottled-water',
        neverExpires: false,
        expirationDate: '2025-12-31',
      }),
      createMockInventoryItem({
        id: '2',
        name: 'Pasta',
        categoryId: 'food',
        quantity: 5,
        unit: 'kilograms',
        recommendedQuantity: 1,
        productTemplateId: 'pasta', // 1.0 L/kg water requirement = 5L needed
        neverExpires: false,
        expirationDate: '2025-12-31',
      }),
    ];

    const alerts = generateDashboardAlerts(items, mockT, mockHousehold);
    const waterAlert = alerts.find(
      (a) => a.id === 'water-shortage-preparation',
    );

    expect(waterAlert).toBeUndefined();
  });

  it('should not generate water shortage alert when no food requires water', () => {
    const items = [
      createMockInventoryItem({
        id: '1',
        name: 'Crackers',
        categoryId: 'food',
        neverExpires: false,
        expirationDate: '2025-12-31',
      }),
    ];

    const alerts = generateDashboardAlerts(items, mockT, mockHousehold);
    const waterAlert = alerts.find(
      (a) => a.id === 'water-shortage-preparation',
    );

    expect(waterAlert).toBeUndefined();
  });

  it('should not generate water shortage alert when household is not provided', () => {
    const items = [
      createMockInventoryItem({
        id: '1',
        name: 'Pasta',
        categoryId: 'food',
        productTemplateId: 'pasta',
        neverExpires: false,
        expirationDate: '2025-12-31',
      }),
    ];

    const alerts = generateDashboardAlerts(items, mockT); // No household
    const waterAlert = alerts.find(
      (a) => a.id === 'water-shortage-preparation',
    );

    expect(waterAlert).toBeUndefined();
  });
});
