import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { generateDashboardAlerts, countAlerts } from './alerts';
import {
  createMockInventoryItem,
  createMockHousehold,
  createMockAlert,
} from '@/shared/utils/test/factories';
import { RECOMMENDED_ITEMS } from '@/features/templates';
import type { InventoryItem } from '@/shared/types';
import {
  createItemId,
  createCategoryId,
  createDateOnly,
  createProductTemplateId,
  createAlertId,
} from '@/shared/types';

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
    const alerts = generateDashboardAlerts(
      items,
      mockT,
      mockHousehold,
      RECOMMENDED_ITEMS,
    );
    expect(alerts).toEqual([]);
  });

  it('should generate expired item alerts', () => {
    const items: InventoryItem[] = [
      createMockInventoryItem({
        id: createItemId('1'),
        name: 'Expired Water',
        categoryId: createCategoryId('water'),
        neverExpires: false,
        expirationDate: createDateOnly('2024-12-01'),
      }),
    ];

    const alerts = generateDashboardAlerts(
      items,
      mockT,
      mockHousehold,
      RECOMMENDED_ITEMS,
    );
    const expiredAlert = alerts.find(
      (a) => a.id === createAlertId('expired-1'),
    );

    expect(expiredAlert).toBeDefined();
    expect(expiredAlert?.type).toBe('critical');
    expect(expiredAlert?.message).toBe('Item has expired');
    expect(expiredAlert?.itemName).toBe('Expired Water');
  });

  it('should generate expiring soon alerts', () => {
    const items = [
      createMockInventoryItem({
        id: createItemId('1'),
        name: 'Expiring Water',
        categoryId: createCategoryId('water'),
        neverExpires: false,
        expirationDate: createDateOnly('2025-01-05'), // 4 days from test date
      }),
    ];

    const alerts = generateDashboardAlerts(
      items,
      mockT,
      mockHousehold,
      RECOMMENDED_ITEMS,
    );
    const expiringAlert = alerts.find(
      (a) => a.id === createAlertId('expiring-soon-1'),
    );

    expect(expiringAlert).toBeDefined();
    expect(expiringAlert?.type).toBe('warning');
    expect(expiringAlert?.message).toContain('Expiring in');
    expect(expiringAlert?.message).toContain('days');
  });

  it('should handle items where getDaysUntilExpiration returns undefined', () => {
    // This tests the case where daysUntilExpiration === undefined check
    const items = [
      createMockInventoryItem({
        id: createItemId('1'),
        name: 'Item with undefined expiration',
        categoryId: createCategoryId('food'),
        neverExpires: false,
        expirationDate: undefined, // This will cause getDaysUntilExpiration to return undefined
      }),
    ];

    const alerts = generateDashboardAlerts(
      items,
      mockT,
      mockHousehold,
      RECOMMENDED_ITEMS,
    );
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
        id: createItemId('1'),
        name: 'Salt',
        categoryId: createCategoryId('food'),
        neverExpires: true,
      }),
    ];

    const alerts = generateDashboardAlerts(
      items,
      mockT,
      mockHousehold,
      RECOMMENDED_ITEMS,
    );
    const expirationAlerts = alerts.filter(
      (a) => a.id.includes('expired') || a.id.includes('expiring'),
    );

    expect(expirationAlerts).toHaveLength(0);
  });

  it('should generate category out of stock alerts', () => {
    const items = [
      createMockInventoryItem({
        id: createItemId('1'),
        name: 'Water',
        categoryId: createCategoryId('water-beverages'),
        quantity: 0,
        unit: 'liters',
        itemType: createProductTemplateId('bottled-water'),
        productTemplateId: createProductTemplateId('bottled-water'),
        neverExpires: false,
        expirationDate: createDateOnly('2025-12-31'),
      }),
    ];

    const alerts = generateDashboardAlerts(
      items,
      mockT,
      mockHousehold,
      RECOMMENDED_ITEMS,
    );
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
        id: createItemId('1'),
        name: 'Water',
        categoryId: createCategoryId('water-beverages'),
        quantity: 5,
        unit: 'liters',
        itemType: createProductTemplateId('bottled-water'),
        productTemplateId: createProductTemplateId('bottled-water'),
        neverExpires: false,
        expirationDate: createDateOnly('2025-12-31'),
      }),
    ];

    const alerts = generateDashboardAlerts(
      items,
      mockT,
      mockHousehold,
      RECOMMENDED_ITEMS,
    );
    const stockAlert = alerts.find((a) =>
      a.id.includes('category-critically-low'),
    );

    expect(stockAlert).toBeDefined();
    expect(stockAlert?.type).toBe('critical');
    expect(stockAlert?.message).toContain('Critically low');
    expect(stockAlert?.message).toContain('%');
  });

  it('should generate category low stock warning alerts', () => {
    // Use specific household: 1 adult, 3 days
    // Total needed: 13L (9L water + 2L milk + 2L juice)
    // For warning alert: need between 25% and 50% = 3.25L to 6.5L
    // Use 5L total = 38.5% (between 25% and 50%, so warning threshold)
    const household = createMockHousehold({
      adults: 1,
      children: 0,
      supplyDurationDays: 3,
    });

    const items = [
      createMockInventoryItem({
        id: createItemId('1'),
        name: 'Water',
        categoryId: createCategoryId('water-beverages'),
        quantity: 5, // 5L out of 13L total = 38.5% (warning threshold)
        unit: 'liters',
        itemType: createProductTemplateId('bottled-water'),
        productTemplateId: createProductTemplateId('bottled-water'),
        neverExpires: false,
        expirationDate: createDateOnly('2025-12-31'),
      }),
      createMockInventoryItem({
        id: createItemId('2'),
        name: 'Milk',
        categoryId: createCategoryId('water-beverages'),
        quantity: 0, // 0L out of 2L needed
        unit: 'liters',
        itemType: createProductTemplateId('long-life-milk'),
        productTemplateId: createProductTemplateId('long-life-milk'),
        neverExpires: true,
      }),
      createMockInventoryItem({
        id: createItemId('3'),
        name: 'Juice',
        categoryId: createCategoryId('water-beverages'),
        quantity: 0, // 0L out of 2L needed
        unit: 'liters',
        itemType: createProductTemplateId('long-life-juice'),
        productTemplateId: createProductTemplateId('long-life-juice'),
        neverExpires: true,
      }),
    ];

    const alerts = generateDashboardAlerts(
      items,
      mockT,
      household,
      RECOMMENDED_ITEMS,
    );
    const stockAlert = alerts.find((a) => a.id.includes('category-low-stock'));

    expect(stockAlert).toBeDefined();
    expect(stockAlert?.type).toBe('warning');
    expect(stockAlert?.message).toContain('Running low');
    expect(stockAlert?.message).toContain('%');
  });

  it('should not generate stock alerts when category quantity is adequate', () => {
    // Use a specific household: 2 adults, 3 days
    // Water needed: 3L × 2 × 3 = 18L
    // Milk needed: 2L × 2 = 4L
    // Juice needed: 2L × 2 = 4L
    // Total needed: 26L
    // Total actual: 30L + 10L + 10L = 50L (192% - more than adequate)
    const household = createMockHousehold({
      adults: 2,
      children: 0,
      supplyDurationDays: 3,
    });

    // Add all three items with adequate quantities: 30L water, 10L milk, 10L juice
    const items = [
      createMockInventoryItem({
        id: createItemId('1'),
        name: 'Water',
        categoryId: createCategoryId('water-beverages'),
        quantity: 30, // 30L water (more than 18L needed)
        unit: 'liters',
        itemType: createProductTemplateId('bottled-water'),
        productTemplateId: createProductTemplateId('bottled-water'),
        neverExpires: false,
        expirationDate: createDateOnly('2025-12-31'),
      }),
      createMockInventoryItem({
        id: createItemId('2'),
        name: 'Milk',
        categoryId: createCategoryId('water-beverages'),
        quantity: 10, // 10L milk (more than 4L needed)
        unit: 'liters',
        itemType: createProductTemplateId('long-life-milk'),
        productTemplateId: createProductTemplateId('long-life-milk'),
        neverExpires: false,
        expirationDate: createDateOnly('2025-12-31'),
      }),
      createMockInventoryItem({
        id: createItemId('3'),
        name: 'Juice',
        categoryId: createCategoryId('water-beverages'),
        quantity: 10, // 10L juice (more than 4L needed)
        unit: 'liters',
        itemType: createProductTemplateId('long-life-juice'),
        productTemplateId: createProductTemplateId('long-life-juice'),
        neverExpires: false,
        expirationDate: createDateOnly('2025-12-31'),
      }),
    ];

    const alerts = generateDashboardAlerts(
      items,
      mockT,
      household,
      RECOMMENDED_ITEMS,
    );
    const stockAlerts = alerts.filter((a) => a.id.includes('category'));

    expect(stockAlerts).toHaveLength(0);
  });

  it('should sort alerts by priority (critical first, then warning)', () => {
    const items = [
      createMockInventoryItem({
        id: createItemId('1'),
        name: 'Warning Item',
        categoryId: createCategoryId('food'),
        neverExpires: false,
        expirationDate: createDateOnly('2025-01-05'),
      }),
      createMockInventoryItem({
        id: createItemId('2'),
        name: 'Critical Item',
        categoryId: createCategoryId('water'),
        quantity: 0, // Out of stock for critical alert
        itemType: createProductTemplateId('bottled-water'),
        productTemplateId: createProductTemplateId('bottled-water'),
        neverExpires: false,
        expirationDate: createDateOnly('2024-12-01'),
      }),
    ];

    const alerts = generateDashboardAlerts(
      items,
      mockT,
      mockHousehold,
      RECOMMENDED_ITEMS,
    );

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
        id: createItemId('1'),
        name: 'Custom Item',
        categoryId: createCategoryId('custom'),
        itemType: 'custom',
        neverExpires: false,
        expirationDate: createDateOnly('2025-12-31'),
      }),
    ];

    const alerts = generateDashboardAlerts(
      items,
      mockT,
      mockHousehold,
      RECOMMENDED_ITEMS,
    );
    const stockAlerts = alerts.filter((a) => a.id.includes('stock'));

    // Should not generate stock alerts when recommended is 0
    expect(stockAlerts).toHaveLength(0);
  });

  it('should aggregate multiple items in same category for stock alerts', () => {
    // Use specific household: 1 adult, 3 days
    // Bottled-water: 3L × 1 × 3 = 9L needed
    // Long-life-juice: 2L × 1 = 2L needed (doesn't scale with days)
    // Total needed: 9L + 2L = 11L
    // Total actual: 5L + 10L = 15L
    // But wait, juice doesn't scale with days, so let's use a simpler calculation
    // Actually, let's use 2 adults, 3 days for better numbers:
    // Bottled-water: 3L × 2 × 3 = 18L needed
    // Long-life-juice: 2L × 2 = 4L needed
    // Total needed: 18L + 4L = 22L
    // Total actual: 8L + 4L = 12L = 54.5% (above 50%, so ok, not warning)
    // Let's adjust: 5L + 3L = 8L = 36% (warning threshold)
    const household = createMockHousehold({
      adults: 2,
      children: 0,
      supplyDurationDays: 3,
    });

    const items = [
      createMockInventoryItem({
        id: createItemId('1'),
        name: 'Bottled Water',
        categoryId: createCategoryId('water-beverages'),
        quantity: 5, // 5L out of 18L needed = 28% (warning threshold)
        unit: 'liters',
        itemType: createProductTemplateId('bottled-water'),
        productTemplateId: createProductTemplateId('bottled-water'),
        neverExpires: false,
        expirationDate: createDateOnly('2025-12-31'),
      }),
      createMockInventoryItem({
        id: createItemId('2'),
        name: 'Juice',
        categoryId: createCategoryId('water-beverages'),
        quantity: 3, // 3L out of 4L needed = 75% (ok)
        // Combined: 8L out of 22L = 36% (warning threshold)
        unit: 'liters',
        itemType: createProductTemplateId('long-life-juice'),
        productTemplateId: createProductTemplateId('long-life-juice'),
        neverExpires: false,
        expirationDate: createDateOnly('2025-12-31'),
      }),
    ];

    const alerts = generateDashboardAlerts(
      items,
      mockT,
      household,
      RECOMMENDED_ITEMS,
    );
    const categoryAlerts = alerts.filter((a) => a.id.includes('category'));

    // Should generate ONE warning alert for the category, not two separate alerts
    expect(categoryAlerts).toHaveLength(1);
    expect(categoryAlerts[0].type).toBe('warning');
    expect(categoryAlerts[0].message).toContain('Running low');
    expect(categoryAlerts[0].message).toMatch(/\d+%/); // Should contain a percentage
  });
});

describe('countAlerts', () => {
  it('should count alerts correctly by type', () => {
    const alerts = [
      createMockAlert({
        id: createAlertId('1'),
        type: 'critical',
        message: 'Test 1',
      }),
      createMockAlert({
        id: createAlertId('2'),
        type: 'critical',
        message: 'Test 2',
      }),
      createMockAlert({
        id: createAlertId('3'),
        type: 'warning',
        message: 'Test 3',
      }),
      createMockAlert({
        id: createAlertId('4'),
        type: 'info',
        message: 'Test 4',
      }),
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
      createMockAlert({
        id: createAlertId('1'),
        type: 'critical',
        message: 'Test 1',
      }),
      createMockAlert({
        id: createAlertId('2'),
        type: 'critical',
        message: 'Test 2',
      }),
      createMockAlert({
        id: createAlertId('3'),
        type: 'critical',
        message: 'Test 3',
      }),
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
        id: createItemId('1'),
        name: 'Bottled Water',
        categoryId: createCategoryId('water-beverages'),
        quantity: 5,
        unit: 'liters',
        itemType: createProductTemplateId('bottled-water'),
        productTemplateId: createProductTemplateId('bottled-water'),
        neverExpires: false,
        expirationDate: createDateOnly('2025-12-31'),
      }),
      createMockInventoryItem({
        id: createItemId('2'),
        name: 'Pasta',
        categoryId: createCategoryId('food'),
        quantity: 10,
        unit: 'kilograms',
        itemType: createProductTemplateId('pasta'),
        productTemplateId: createProductTemplateId('pasta'), // 1.0 L/kg water requirement
        neverExpires: false,
        expirationDate: createDateOnly('2025-12-31'),
      }),
    ];

    const alerts = generateDashboardAlerts(
      items,
      mockT,
      mockHousehold,
      RECOMMENDED_ITEMS,
    );
    const waterAlert = alerts.find(
      (a) => a.id === createAlertId('water-shortage-preparation'),
    );

    expect(waterAlert).toBeDefined();
    expect(waterAlert?.type).toBe('warning');
    expect(waterAlert?.message).toContain('Need');
    expect(waterAlert?.message).toContain('L more water');
  });

  it('should not generate water shortage alert when enough water available', () => {
    const items = [
      createMockInventoryItem({
        id: createItemId('1'),
        name: 'Bottled Water',
        categoryId: createCategoryId('water-beverages'),
        quantity: 50,
        unit: 'liters',
        itemType: createProductTemplateId('bottled-water'),
        productTemplateId: createProductTemplateId('bottled-water'),
        neverExpires: false,
        expirationDate: createDateOnly('2025-12-31'),
      }),
      createMockInventoryItem({
        id: createItemId('2'),
        name: 'Pasta',
        categoryId: createCategoryId('food'),
        quantity: 5,
        unit: 'kilograms',
        itemType: createProductTemplateId('pasta'),
        productTemplateId: createProductTemplateId('pasta'), // 1.0 L/kg water requirement = 5L needed
        neverExpires: false,
        expirationDate: createDateOnly('2025-12-31'),
      }),
    ];

    const alerts = generateDashboardAlerts(
      items,
      mockT,
      mockHousehold,
      RECOMMENDED_ITEMS,
    );
    const waterAlert = alerts.find(
      (a) => a.id === createAlertId('water-shortage-preparation'),
    );

    expect(waterAlert).toBeUndefined();
  });

  it('should not generate water shortage alert when no food requires water', () => {
    const items = [
      createMockInventoryItem({
        id: createItemId('1'),
        name: 'Crackers',
        categoryId: createCategoryId('food'),
        neverExpires: false,
        expirationDate: createDateOnly('2025-12-31'),
      }),
    ];

    const alerts = generateDashboardAlerts(
      items,
      mockT,
      mockHousehold,
      RECOMMENDED_ITEMS,
    );
    const waterAlert = alerts.find(
      (a) => a.id === createAlertId('water-shortage-preparation'),
    );

    expect(waterAlert).toBeUndefined();
  });

  it('should not generate water shortage alert when no food requires water', () => {
    // Create items that don't require water for preparation
    const items = [
      createMockInventoryItem({
        id: createItemId('1'),
        name: 'Canned Food',
        categoryId: createCategoryId('food'),
        productTemplateId: createProductTemplateId('canned-fish'),
        neverExpires: false,
        expirationDate: createDateOnly('2025-12-31'),
      }),
    ];

    const alerts = generateDashboardAlerts(
      items,
      mockT,
      mockHousehold,
      RECOMMENDED_ITEMS,
    );
    const waterAlert = alerts.find(
      (a) => a.id === createAlertId('water-shortage-preparation'),
    );

    expect(waterAlert).toBeUndefined();
  });
});

describe('food category calorie-based alerts', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-01'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should not generate food alert when calories are sufficient even if quantity is low', () => {
    // Create a household that needs 6000 calories (1 adult * 2000 * 3 days)
    const household = createMockHousehold({
      adults: 1,
      children: 0,
      supplyDurationDays: 3,
    });

    // Create one high-calorie item that provides all needed calories
    // e.g., 1 kg of rice = 3600 calories per kg, but we need 6000
    // So we need 6000/3600 = 1.67 kg, but let's say we have 2 kg = 7200 calories (enough)
    const items = [
      createMockInventoryItem({
        id: createItemId('1'),
        name: 'Rice',
        categoryId: createCategoryId('food'),
        itemType: createProductTemplateId('rice'), // Set itemType to match recommended item ID
        productTemplateId: createProductTemplateId('rice'),
        quantity: 2, // 2 kg
        caloriesPerUnit: 3600, // 3600 calories per kg
        unit: 'kilograms',
        neverExpires: false,
        expirationDate: createDateOnly('2025-12-31'),
      }),
    ];

    // Total calories: 2 * 3600 = 7200, which is more than needed (6000)
    const alerts = generateDashboardAlerts(
      items,
      mockT,
      household,
      RECOMMENDED_ITEMS,
    );
    const foodAlerts = alerts.filter((a) => a.id?.includes('food'));

    // Should not generate food alerts because calories are sufficient
    expect(foodAlerts).toHaveLength(0);
  });

  it('should generate food alert when calories are insufficient', () => {
    // Create a household that needs 6000 calories (1 adult * 2000 * 3 days)
    const household = createMockHousehold({
      adults: 1,
      children: 0,
      supplyDurationDays: 3,
    });

    // Create one item with insufficient calories
    // e.g., 0.4 kg of rice = 0.4 * 3600 = 1440 calories (24% of needed, below 25% critical threshold)
    const items = [
      createMockInventoryItem({
        id: createItemId('1'),
        name: 'Rice',
        categoryId: createCategoryId('food'),
        itemType: createProductTemplateId('rice'), // Set itemType to match recommended item ID
        productTemplateId: createProductTemplateId('rice'),
        quantity: 0.4, // 0.4 kg = 1440 calories (24% of 6000)
        caloriesPerUnit: 3600, // 3600 calories per kg
        unit: 'kilograms',
        neverExpires: false,
        expirationDate: createDateOnly('2025-12-31'),
      }),
    ];

    // Total calories: 0.4 * 3600 = 1440, which is 24% of needed (6000) - below 25% critical threshold
    const alerts = generateDashboardAlerts(
      items,
      mockT,
      household,
      RECOMMENDED_ITEMS,
    );
    const foodAlert = alerts.find((a) =>
      a.id?.includes('category-critically-low-food'),
    );

    expect(foodAlert).toBeDefined();
    expect(foodAlert?.type).toBe('critical');
    expect(foodAlert?.message).toContain('Critically low');
    // The percentage might be rounded, so check for 24% or 23% or 25%
    expect(
      foodAlert?.message.includes('24%') ||
        foodAlert?.message.includes('23%') ||
        foodAlert?.message.includes('25%'),
    ).toBe(true);
  });

  it('should generate food alert based on calories when multiple items exist', () => {
    // Create a household that needs 12000 calories (2 adults * 2000 * 3 days)
    const household = createMockHousehold({
      adults: 2,
      children: 0,
      supplyDurationDays: 3,
    });

    // Create multiple items with total calories = 40% of needed
    const items = [
      createMockInventoryItem({
        id: createItemId('1'),
        name: 'Rice',
        categoryId: createCategoryId('food'),
        itemType: createProductTemplateId('rice'), // Set itemType to match recommended item ID
        productTemplateId: createProductTemplateId('rice'),
        quantity: 1, // 1 kg = 3600 calories
        caloriesPerUnit: 3600,
        unit: 'kilograms',
        neverExpires: false,
        expirationDate: createDateOnly('2025-12-31'),
      }),
      createMockInventoryItem({
        id: createItemId('2'),
        name: 'Pasta',
        categoryId: createCategoryId('food'),
        itemType: createProductTemplateId('pasta'), // Set itemType to match recommended item ID
        productTemplateId: createProductTemplateId('pasta'),
        quantity: 1, // 1 kg = 1200 calories (but pasta has 3500 per kg, let me fix this)
        caloriesPerUnit: 1200, // Actually pasta is 3500 per kg, but let's use 1200 for this test
        unit: 'kilograms',
        neverExpires: false,
        expirationDate: createDateOnly('2025-12-31'),
      }),
    ];

    // Total calories: 3600 + 1200 = 4800, which is 40% of needed (12000)
    const alerts = generateDashboardAlerts(
      items,
      mockT,
      household,
      RECOMMENDED_ITEMS,
    );
    const foodAlert = alerts.find((a) =>
      a.id?.includes('category-low-stock-food'),
    );

    expect(foodAlert).toBeDefined();
    expect(foodAlert?.type).toBe('warning');
    expect(foodAlert?.message).toContain('Running low');
    expect(foodAlert?.message).toContain('40%'); // 4800/12000 = 40%
  });

  it('should not generate stock alerts when calories are sufficient for the household', () => {
    // Items with enough calories should not generate stock alerts
    // Use a specific household: 1 adult, 3 days = 6000 calories needed
    const household = createMockHousehold({
      adults: 1,
      children: 0,
      supplyDurationDays: 3,
    });

    const items = [
      createMockInventoryItem({
        id: createItemId('1'),
        name: 'Rice',
        categoryId: createCategoryId('food'),
        itemType: createProductTemplateId('rice'),
        productTemplateId: createProductTemplateId('rice'),
        quantity: 2, // 2 kg = 7200 calories (enough for 1 adult for 3 days = 6000 calories)
        caloriesPerUnit: 3600,
        unit: 'kilograms',
        neverExpires: false,
        expirationDate: createDateOnly('2025-12-31'),
      }),
    ];

    const alerts = generateDashboardAlerts(
      items,
      mockT,
      household,
      RECOMMENDED_ITEMS,
    );
    const stockAlerts = alerts.filter((a) => a.id?.includes('category'));

    // Should not generate stock alerts when calories are sufficient
    expect(stockAlerts).toHaveLength(0);
  });
});
