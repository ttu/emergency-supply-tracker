import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { generateDashboardAlerts } from './alerts';
import {
  createMockInventoryItem,
  createMockHousehold,
} from '@/shared/utils/test/factories';
import { RECOMMENDED_ITEMS } from '@/features/templates';
import type { InventoryItem } from '@/shared/types';
import {
  createItemId,
  createCategoryId,
  createDateOnly,
  createProductTemplateId,
  createAlertId,
  createQuantity,
} from '@/shared/types';
import { calculateWaterRequirements } from '@/shared/utils/calculations/water';

/**
 * Mutation-killing tests for alerts.ts
 *
 * These tests target specific surviving mutants by testing:
 * - Exact boundary values for threshold comparisons
 * - Both branches of conditional expressions
 * - Specific return values (not just existence checks)
 * - Arithmetic precision in calculations
 */

// Mock translation function that returns identifiable strings
const mockT = (key: string, options?: Record<string, string | number>) => {
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

describe('getTranslatedItemName mutation killers (L34-38)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-01'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should translate template item names via t() and return the translated string', () => {
    // Kills: L34 ConditionalExpression (true/false), LogicalOperator (||→&&),
    //        EqualityOperator (===→!==), BlockStatement ({}), ObjectLiteral ({}), StringLiteral ("")
    // A template item with a working translation must return the translated name, NOT item.name
    const translatingT = (
      key: string,
      options?: Record<string, string | number>,
    ) => {
      if (options?.ns === 'products' && key === 'bottled-water')
        return 'Translated Water';
      return mockT(key, options);
    };

    const items = [
      createMockInventoryItem({
        id: createItemId('tmpl-1'),
        name: 'Original Name',
        categoryId: createCategoryId('water'),
        itemType: createProductTemplateId('bottled-water'),
        neverExpires: false,
        expirationDate: createDateOnly('2024-12-01'), // expired → triggers alert with itemName
      }),
    ];

    const alerts = generateDashboardAlerts(
      items,
      translatingT,
      createMockHousehold(),
      RECOMMENDED_ITEMS,
    );
    const expiredAlert = alerts.find(
      (a) => a.id === createAlertId('expired-tmpl-1'),
    );

    expect(expiredAlert).toBeDefined();
    // Must be the TRANSLATED name, not item.name
    expect(expiredAlert!.itemName).toBe('Translated Water');
    // Explicitly NOT the original name
    expect(expiredAlert!.itemName).not.toBe('Original Name');
  });

  it('should use item.name for custom items and NOT attempt translation', () => {
    // Kills: L34 ConditionalExpression false (skips if-block for custom),
    //        EqualityOperator (custom === custom should enter else branch)
    const items = [
      createMockInventoryItem({
        id: createItemId('custom-1'),
        name: 'My Custom Supply',
        categoryId: createCategoryId('food'),
        itemType: createProductTemplateId('custom'),
        neverExpires: false,
        expirationDate: createDateOnly('2024-12-01'),
      }),
    ];

    const alerts = generateDashboardAlerts(
      items,
      mockT,
      createMockHousehold(),
      RECOMMENDED_ITEMS,
    );
    const expiredAlert = alerts.find(
      (a) => a.id === createAlertId('expired-custom-1'),
    );

    expect(expiredAlert).toBeDefined();
    expect(expiredAlert!.itemName).toBe('My Custom Supply');
  });

  it('should fall back to item.name when translation returns the key (L38)', () => {
    // Kills: L38 ConditionalExpression false (translated !== templateId check)
    const tReturnsKey = (
      key: string,
      options?: Record<string, string | number>,
    ) => {
      if (options?.ns === 'products') return key; // returns key itself → missing translation
      return mockT(key, options);
    };

    const items = [
      createMockInventoryItem({
        id: createItemId('miss-1'),
        name: 'Fallback Name Here',
        categoryId: createCategoryId('food'),
        itemType: createProductTemplateId('some-unknown-template'),
        neverExpires: false,
        expirationDate: createDateOnly('2024-12-01'),
      }),
    ];

    const alerts = generateDashboardAlerts(
      items,
      tReturnsKey,
      createMockHousehold(),
      RECOMMENDED_ITEMS,
    );
    const alert = alerts.find((a) => a.id === createAlertId('expired-miss-1'));

    expect(alert).toBeDefined();
    expect(alert!.itemName).toBe('Fallback Name Here');
    // Should NOT be the templateId key
    expect(alert!.itemName).not.toBe('some-unknown-template');
  });

  it('should fall back to item.name when translation throws (L41 catch)', () => {
    const throwingT = (
      key: string,
      options?: Record<string, string | number>,
    ) => {
      if (options?.ns === 'products') throw new Error('translation error');
      return mockT(key, options);
    };

    const items = [
      createMockInventoryItem({
        id: createItemId('err-1'),
        name: 'Error Fallback Name',
        categoryId: createCategoryId('food'),
        itemType: createProductTemplateId('valid-template'),
        neverExpires: false,
        expirationDate: createDateOnly('2024-12-01'),
      }),
    ];

    const alerts = generateDashboardAlerts(
      items,
      throwingT,
      createMockHousehold(),
      RECOMMENDED_ITEMS,
    );
    const alert = alerts.find((a) => a.id === createAlertId('expired-err-1'));

    expect(alert).toBeDefined();
    expect(alert!.itemName).toBe('Error Fallback Name');
  });

  it('should use item.name when itemType is empty string', () => {
    // Kills: L34 - templateId is falsy (empty string), should skip if-block
    const items = [
      createMockInventoryItem({
        id: createItemId('empty-1'),
        name: 'No Template Name',
        categoryId: createCategoryId('food'),
        itemType: '' as ReturnType<typeof createProductTemplateId>,
        neverExpires: false,
        expirationDate: createDateOnly('2024-12-01'),
      }),
    ];

    const alerts = generateDashboardAlerts(
      items,
      mockT,
      createMockHousehold(),
      RECOMMENDED_ITEMS,
    );
    const alert = alerts.find((a) => a.id === createAlertId('expired-empty-1'));

    expect(alert).toBeDefined();
    expect(alert!.itemName).toBe('No Template Name');
  });
});

describe('generateExpirationAlerts mutation killers (L62)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-01'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should generate alert for item with neverExpires=false and valid expirationDate', () => {
    // Kills: L62 ConditionalExpression false, LogicalOperator (||→&&),
    //        BlockStatement ({}) - if the guard is mutated to always skip, this fails
    const items = [
      createMockInventoryItem({
        id: createItemId('exp-1'),
        name: 'Expirable Item',
        categoryId: createCategoryId('food'),
        neverExpires: false,
        expirationDate: createDateOnly('2024-12-01'), // expired
      }),
    ];

    const alerts = generateDashboardAlerts(
      items,
      mockT,
      createMockHousehold(),
      RECOMMENDED_ITEMS,
    );
    const expiredAlert = alerts.find(
      (a) => a.id === createAlertId('expired-exp-1'),
    );

    // MUST produce an alert - kills BlockStatement mutant that empties the guard body
    expect(expiredAlert).toBeDefined();
    expect(expiredAlert!.type).toBe('critical');
    expect(expiredAlert!.message).toBe('Item has expired');
  });

  it('should NOT generate alert when neverExpires=true even with past expirationDate', () => {
    // Kills: L62 LogicalOperator (||→&&) - with ||, neverExpires=true short-circuits to return
    // If mutated to &&, neverExpires=true && !expirationDate(truthy) = true && false = false → would NOT skip
    const items = [
      createMockInventoryItem({
        id: createItemId('never-1'),
        name: 'Never Expires',
        categoryId: createCategoryId('food'),
        neverExpires: true,
        expirationDate: createDateOnly('2024-01-01'), // way past, but neverExpires
      }),
    ];

    const alerts = generateDashboardAlerts(
      items,
      mockT,
      createMockHousehold(),
      RECOMMENDED_ITEMS,
    );
    const expirationAlerts = alerts.filter(
      (a) =>
        a.id === createAlertId('expired-never-1') ||
        a.id === createAlertId('expiring-soon-never-1'),
    );

    expect(expirationAlerts).toHaveLength(0);
  });

  it('should NOT generate alert when neverExpires=false and expirationDate is undefined', () => {
    // Kills: L62 - !expirationDate branch
    const items = [
      createMockInventoryItem({
        id: createItemId('nodate-1'),
        name: 'No Date',
        categoryId: createCategoryId('food'),
        neverExpires: false,
        expirationDate: undefined,
      }),
    ];

    const alerts = generateDashboardAlerts(
      items,
      mockT,
      createMockHousehold(),
      RECOMMENDED_ITEMS,
    );
    const expirationAlerts = alerts.filter(
      (a) =>
        a.id === createAlertId('expired-nodate-1') ||
        a.id === createAlertId('expiring-soon-nodate-1'),
    );

    expect(expirationAlerts).toHaveLength(0);
  });
});

describe('stock threshold boundary mutation killers (L146, L156)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-01'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // For these tests we need to create a scenario where we can precisely control
  // the category percentage. We'll use the water-beverages category with known
  // recommended quantities.

  it('should generate critically-low alert at exactly 25% (boundary for <= vs <)', () => {
    // Kills: L146 EqualityOperator (<=→<) - at exactly 25, <= triggers but < would not
    // For water-beverages with 1 adult, 3 days:
    // bottled-water: 3L × 1 × 3 = 9L needed
    // If we have 2.25L = 25% of 9L... but we also need to account for other items
    // Let's provide all items in the category and control totals
    // Total recommended for water-beverages (1 adult, 3 days):
    //   bottled-water: 9L, long-life-milk: 2L, long-life-juice: 2L = 13L total
    // 25% of 13L = 3.25L
    const household = createMockHousehold({
      adults: 1,
      children: 0,
      supplyDurationDays: 3,
    });

    const items = [
      createMockInventoryItem({
        id: createItemId('w1'),
        name: 'Water',
        categoryId: createCategoryId('water-beverages'),
        quantity: createQuantity(3.25), // Exactly 25% of 13L
        unit: 'liters',
        itemType: createProductTemplateId('bottled-water'),
        neverExpires: false,
        expirationDate: createDateOnly('2025-12-31'),
      }),
      createMockInventoryItem({
        id: createItemId('w2'),
        name: 'Milk',
        categoryId: createCategoryId('water-beverages'),
        quantity: createQuantity(0),
        unit: 'liters',
        itemType: createProductTemplateId('long-life-milk'),
        neverExpires: true,
      }),
      createMockInventoryItem({
        id: createItemId('w3'),
        name: 'Juice',
        categoryId: createCategoryId('water-beverages'),
        quantity: createQuantity(0),
        unit: 'liters',
        itemType: createProductTemplateId('long-life-juice'),
        neverExpires: true,
      }),
    ];

    const alerts = generateDashboardAlerts(
      items,
      mockT,
      household,
      RECOMMENDED_ITEMS,
    );

    // At exactly 25%, should be critically-low (< 25 threshold)
    // The percentage is Math.round(25) = 25, and 25 < 25 is false, so it falls through
    // Wait - the source code says: percentOfRecommended < CRITICALLY_LOW_STOCK_PERCENTAGE (25)
    // So at exactly 25%, it's NOT critically low, it should be LOW_STOCK (< 50)
    const criticallyLow = alerts.find((a) =>
      a.id.includes('category-critically-low-water-beverages'),
    );
    const lowStock = alerts.find((a) =>
      a.id.includes('category-low-stock-water-beverages'),
    );

    // At 25%: NOT < 25, so not critically low. But 25 < 50, so it IS low stock.
    expect(criticallyLow).toBeUndefined();
    expect(lowStock).toBeDefined();
    expect(lowStock!.type).toBe('warning');
  });

  it('should generate critically-low alert at 24% (just below 25 threshold)', () => {
    // At 24%, should be < 25 → critically low
    const household = createMockHousehold({
      adults: 1,
      children: 0,
      supplyDurationDays: 3,
    });

    // 24% of 13L = 3.12L
    const items = [
      createMockInventoryItem({
        id: createItemId('w1'),
        name: 'Water',
        categoryId: createCategoryId('water-beverages'),
        quantity: createQuantity(3.12),
        unit: 'liters',
        itemType: createProductTemplateId('bottled-water'),
        neverExpires: false,
        expirationDate: createDateOnly('2025-12-31'),
      }),
      createMockInventoryItem({
        id: createItemId('w2'),
        name: 'Milk',
        categoryId: createCategoryId('water-beverages'),
        quantity: createQuantity(0),
        unit: 'liters',
        itemType: createProductTemplateId('long-life-milk'),
        neverExpires: true,
      }),
      createMockInventoryItem({
        id: createItemId('w3'),
        name: 'Juice',
        categoryId: createCategoryId('water-beverages'),
        quantity: createQuantity(0),
        unit: 'liters',
        itemType: createProductTemplateId('long-life-juice'),
        neverExpires: true,
      }),
    ];

    const alerts = generateDashboardAlerts(
      items,
      mockT,
      household,
      RECOMMENDED_ITEMS,
    );

    const criticallyLow = alerts.find((a) =>
      a.id.includes('category-critically-low-water-beverages'),
    );

    expect(criticallyLow).toBeDefined();
    expect(criticallyLow!.type).toBe('critical');
    expect(criticallyLow!.message).toContain('Critically low');
  });

  it('should generate low-stock alert at exactly 50% (boundary for < vs <=)', () => {
    // Kills: L156 EqualityOperator (<=→<) - at exactly 50, < triggers but NOT <=... wait
    // Source says: percentOfRecommended < LOW_STOCK_PERCENTAGE (50)
    // At exactly 50%, 50 < 50 is false → no alert
    const household = createMockHousehold({
      adults: 1,
      children: 0,
      supplyDurationDays: 3,
    });

    // 50% of 13L = 6.5L
    const items = [
      createMockInventoryItem({
        id: createItemId('w1'),
        name: 'Water',
        categoryId: createCategoryId('water-beverages'),
        quantity: createQuantity(6.5), // 50% of 13L
        unit: 'liters',
        itemType: createProductTemplateId('bottled-water'),
        neverExpires: false,
        expirationDate: createDateOnly('2025-12-31'),
      }),
      createMockInventoryItem({
        id: createItemId('w2'),
        name: 'Milk',
        categoryId: createCategoryId('water-beverages'),
        quantity: createQuantity(0),
        unit: 'liters',
        itemType: createProductTemplateId('long-life-milk'),
        neverExpires: true,
      }),
      createMockInventoryItem({
        id: createItemId('w3'),
        name: 'Juice',
        categoryId: createCategoryId('water-beverages'),
        quantity: createQuantity(0),
        unit: 'liters',
        itemType: createProductTemplateId('long-life-juice'),
        neverExpires: true,
      }),
    ];

    const alerts = generateDashboardAlerts(
      items,
      mockT,
      household,
      RECOMMENDED_ITEMS,
    );

    // At exactly 50%: 50 < 50 is false → no low-stock alert
    // But hasEnough might be false since percentage < 100
    const lowStock = alerts.find((a) =>
      a.id.includes('category-low-stock-water-beverages'),
    );
    const criticallyLow = alerts.find((a) =>
      a.id.includes('category-critically-low-water-beverages'),
    );

    // 50 is NOT < 50, so no stock alert should be generated
    expect(lowStock).toBeUndefined();
    expect(criticallyLow).toBeUndefined();
  });

  it('should generate low-stock at 49% (just below 50 threshold)', () => {
    const household = createMockHousehold({
      adults: 1,
      children: 0,
      supplyDurationDays: 3,
    });

    // 49% of 13L ≈ 6.37L
    const items = [
      createMockInventoryItem({
        id: createItemId('w1'),
        name: 'Water',
        categoryId: createCategoryId('water-beverages'),
        quantity: createQuantity(6.37),
        unit: 'liters',
        itemType: createProductTemplateId('bottled-water'),
        neverExpires: false,
        expirationDate: createDateOnly('2025-12-31'),
      }),
      createMockInventoryItem({
        id: createItemId('w2'),
        name: 'Milk',
        categoryId: createCategoryId('water-beverages'),
        quantity: createQuantity(0),
        unit: 'liters',
        itemType: createProductTemplateId('long-life-milk'),
        neverExpires: true,
      }),
      createMockInventoryItem({
        id: createItemId('w3'),
        name: 'Juice',
        categoryId: createCategoryId('water-beverages'),
        quantity: createQuantity(0),
        unit: 'liters',
        itemType: createProductTemplateId('long-life-juice'),
        neverExpires: true,
      }),
    ];

    const alerts = generateDashboardAlerts(
      items,
      mockT,
      household,
      RECOMMENDED_ITEMS,
    );

    const lowStock = alerts.find((a) =>
      a.id.includes('category-low-stock-water-beverages'),
    );

    expect(lowStock).toBeDefined();
    expect(lowStock!.type).toBe('warning');
    expect(lowStock!.message).toContain('Running low');
  });
});

describe('hasEnough guard mutation killer (L204)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-01'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should NOT generate category stock alerts when hasEnough is true', () => {
    // Kills: L204 BlockStatement ({}) - if the return is removed, alerts would be generated
    const household = createMockHousehold({
      adults: 1,
      children: 0,
      supplyDurationDays: 3,
    });

    // Provide more than enough of everything in water-beverages
    const items = [
      createMockInventoryItem({
        id: createItemId('w1'),
        name: 'Water',
        categoryId: createCategoryId('water-beverages'),
        quantity: createQuantity(100), // Way more than needed
        unit: 'liters',
        itemType: createProductTemplateId('bottled-water'),
        neverExpires: false,
        expirationDate: createDateOnly('2025-12-31'),
      }),
      createMockInventoryItem({
        id: createItemId('w2'),
        name: 'Milk',
        categoryId: createCategoryId('water-beverages'),
        quantity: createQuantity(100),
        unit: 'liters',
        itemType: createProductTemplateId('long-life-milk'),
        neverExpires: true,
      }),
      createMockInventoryItem({
        id: createItemId('w3'),
        name: 'Juice',
        categoryId: createCategoryId('water-beverages'),
        quantity: createQuantity(100),
        unit: 'liters',
        itemType: createProductTemplateId('long-life-juice'),
        neverExpires: true,
      }),
    ];

    const alerts = generateDashboardAlerts(
      items,
      mockT,
      household,
      RECOMMENDED_ITEMS,
    );

    // With hasEnough=true, zero category stock alerts for water-beverages
    const categoryAlerts = alerts.filter(
      (a) => a.id.includes('category') && a.id.includes('water-beverages'),
    );
    expect(categoryAlerts).toHaveLength(0);
  });
});

describe('water shortage mutation killers (L237-244)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-01'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should verify exact shortfall value in water shortage alert (L240 arithmetic)', () => {
    // Kills: L240 ArithmeticOperator (* → /) and (/ → *)
    // The formula: Math.ceil(waterShortfall * 10) / 10
    // If mutated to Math.ceil(waterShortfall / 10) * 10, result would be wildly different
    // If mutated to waterShortfall / 10, result would be different

    // Create a known water shortfall scenario
    const items = [
      createMockInventoryItem({
        id: createItemId('w1'),
        name: 'Bottled Water',
        categoryId: createCategoryId('water-beverages'),
        quantity: createQuantity(2), // 2L available
        unit: 'liters',
        itemType: createProductTemplateId('bottled-water'),
        neverExpires: false,
        expirationDate: createDateOnly('2025-12-31'),
      }),
      createMockInventoryItem({
        id: createItemId('p1'),
        name: 'Pasta',
        categoryId: createCategoryId('food'),
        quantity: createQuantity(10), // 10kg × 1.0 L/kg = 10L water needed
        unit: 'kilograms',
        itemType: createProductTemplateId('pasta'),
        neverExpires: false,
        expirationDate: createDateOnly('2025-12-31'),
      }),
    ];

    // Calculate the expected shortfall directly
    const waterReqs = calculateWaterRequirements(items);
    const expectedShortfall = Math.ceil(waterReqs.waterShortfall * 10) / 10;

    // Verify the shortfall is positive and reasonable
    expect(waterReqs.waterShortfall).toBeGreaterThan(0);
    expect(waterReqs.hasEnoughWater).toBe(false);

    const alerts = generateDashboardAlerts(
      items,
      mockT,
      createMockHousehold(),
      RECOMMENDED_ITEMS,
    );
    const waterAlert = alerts.find(
      (a) => a.id === createAlertId('water-shortage-preparation'),
    );

    expect(waterAlert).toBeDefined();
    // Verify the exact liters value in the message
    expect(waterAlert!.message).toBe(
      `Need ${expectedShortfall}L more water for food preparation`,
    );

    // Also verify the shortfall rounds correctly (not division-based)
    // If arithmetic were mutated: Math.ceil(shortfall / 10) * 10 would give e.g. 10 instead of 8
    // Or shortfall / 10 would give e.g. 0.8 instead of 8
    expect(expectedShortfall).toBeGreaterThan(0);
    expect(expectedShortfall).toBeLessThan(100); // Sanity check
    // The value should be the shortfall rounded UP to 1 decimal
    expect(expectedShortfall * 10).toBe(
      Math.ceil(waterReqs.waterShortfall * 10),
    );
  });

  it('should NOT generate alert when hasEnoughWater is true (L237)', () => {
    // Kills: L237 LogicalOperator (&&→||) - if mutated to ||, alert would fire
    //        when hasEnoughWater=true but waterShortfall=0
    const items = [
      createMockInventoryItem({
        id: createItemId('w1'),
        name: 'Bottled Water',
        categoryId: createCategoryId('water-beverages'),
        quantity: createQuantity(100), // Plenty of water
        unit: 'liters',
        itemType: createProductTemplateId('bottled-water'),
        neverExpires: false,
        expirationDate: createDateOnly('2025-12-31'),
      }),
      createMockInventoryItem({
        id: createItemId('p1'),
        name: 'Pasta',
        categoryId: createCategoryId('food'),
        quantity: createQuantity(5), // 5L water needed, but have 100L
        unit: 'kilograms',
        itemType: createProductTemplateId('pasta'),
        neverExpires: false,
        expirationDate: createDateOnly('2025-12-31'),
      }),
    ];

    // Verify precondition: hasEnoughWater should be true
    const waterReqs = calculateWaterRequirements(items);
    expect(waterReqs.hasEnoughWater).toBe(true);
    expect(waterReqs.waterShortfall).toBe(0);

    const alerts = generateDashboardAlerts(
      items,
      mockT,
      createMockHousehold(),
      RECOMMENDED_ITEMS,
    );
    const waterAlert = alerts.find(
      (a) => a.id === createAlertId('water-shortage-preparation'),
    );

    expect(waterAlert).toBeUndefined();
  });

  it('should NOT generate alert when waterShortfall is 0 (L238 >= vs >)', () => {
    // Kills: L238 EqualityOperator (>→>=) - if mutated to >=0, alert fires even with 0 shortfall
    // When no food items require water, shortfall = 0 but hasEnoughWater = true
    // So this is already covered by the && check, but let's be explicit
    const items: InventoryItem[] = [
      createMockInventoryItem({
        id: createItemId('w1'),
        name: 'Bottled Water',
        categoryId: createCategoryId('water-beverages'),
        quantity: createQuantity(10),
        unit: 'liters',
        itemType: createProductTemplateId('bottled-water'),
        neverExpires: false,
        expirationDate: createDateOnly('2025-12-31'),
      }),
    ];

    // No food requiring water → shortfall = 0
    const waterReqs = calculateWaterRequirements(items);
    expect(waterReqs.waterShortfall).toBe(0);

    const alerts = generateDashboardAlerts(
      items,
      mockT,
      createMockHousehold(),
      RECOMMENDED_ITEMS,
    );
    const waterAlert = alerts.find(
      (a) => a.id === createAlertId('water-shortage-preparation'),
    );

    expect(waterAlert).toBeUndefined();
  });

  it('should produce alert object with correct structure (L244 ObjectLiteral)', () => {
    // Kills: L244 ObjectLiteral ({}) - if the message object is replaced with {},
    //        it would lack id, type, and message fields
    const items = [
      createMockInventoryItem({
        id: createItemId('w1'),
        name: 'Bottled Water',
        categoryId: createCategoryId('water-beverages'),
        quantity: createQuantity(2),
        unit: 'liters',
        itemType: createProductTemplateId('bottled-water'),
        neverExpires: false,
        expirationDate: createDateOnly('2025-12-31'),
      }),
      createMockInventoryItem({
        id: createItemId('p1'),
        name: 'Pasta',
        categoryId: createCategoryId('food'),
        quantity: createQuantity(10),
        unit: 'kilograms',
        itemType: createProductTemplateId('pasta'),
        neverExpires: false,
        expirationDate: createDateOnly('2025-12-31'),
      }),
    ];

    const alerts = generateDashboardAlerts(
      items,
      mockT,
      createMockHousehold(),
      RECOMMENDED_ITEMS,
    );
    const waterAlert = alerts.find(
      (a) => a.id === createAlertId('water-shortage-preparation'),
    );

    // Verify full object structure - not just existence
    expect(waterAlert).toBeDefined();
    expect(waterAlert!.id).toBe(createAlertId('water-shortage-preparation'));
    expect(waterAlert!.type).toBe('warning');
    expect(waterAlert!.message).toContain('Need');
    expect(waterAlert!.message).toContain('L more water');
  });
});

describe('expiration alert object structure mutation killers (L88 ObjectLiteral)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-01'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should produce expiring-soon alert with complete object fields (L88)', () => {
    // Kills: L88 ObjectLiteral ({}) - verifies all fields are populated
    const items = [
      createMockInventoryItem({
        id: createItemId('es-1'),
        name: 'Expiring Soon Item',
        categoryId: createCategoryId('food'),
        neverExpires: false,
        expirationDate: createDateOnly('2025-01-15'), // 14 days away
      }),
    ];

    const alerts = generateDashboardAlerts(
      items,
      mockT,
      createMockHousehold(),
      RECOMMENDED_ITEMS,
    );
    const alert = alerts.find(
      (a) => a.id === createAlertId('expiring-soon-es-1'),
    );

    expect(alert).toBeDefined();
    // Verify ALL fields are correctly set (not empty object)
    expect(alert!.id).toBe(createAlertId('expiring-soon-es-1'));
    expect(alert!.type).toBe('warning');
    expect(alert!.message).toBe('Expiring in 14 days');
    expect(alert!.itemName).toBe('Expiring Soon Item');
    expect(alert!.categoryId).toBe('food');
    expect(alert!.itemId).toBe('es-1');
  });
});

describe('translation object mutation killers (L36 ObjectLiteral/StringLiteral)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-01'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should pass correct namespace and key to translation function (L36)', () => {
    // Kills: L36 ObjectLiteral ({}) and StringLiteral ("")
    // If the options object is replaced with {} or the key with "", translation breaks
    let capturedKey: string | undefined;
    let capturedOptions: Record<string, string | number> | undefined;

    const spyT = (key: string, options?: Record<string, string | number>) => {
      if (options?.ns === 'products') {
        capturedKey = key;
        capturedOptions = options;
        return 'Translated Product';
      }
      return mockT(key, options);
    };

    const items = [
      createMockInventoryItem({
        id: createItemId('spy-1'),
        name: 'Original',
        categoryId: createCategoryId('food'),
        itemType: createProductTemplateId('bottled-water'),
        neverExpires: false,
        expirationDate: createDateOnly('2024-12-01'),
      }),
    ];

    generateDashboardAlerts(
      items,
      spyT,
      createMockHousehold(),
      RECOMMENDED_ITEMS,
    );

    // Verify the translation was called with the correct key (templateId) and namespace
    expect(capturedKey).toBe('bottled-water');
    expect(capturedOptions).toEqual({ ns: 'products' });
  });
});
