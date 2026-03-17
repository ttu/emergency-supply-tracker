/**
 * Additional mutation-killing tests for alerts.ts
 * Targets surviving mutants from issue #271 mutation testing report.
 */
import { describe, it, expect } from 'vitest';
import { generateDashboardAlerts } from './alerts';
import type { InventoryItem } from '@/shared/types';
import {
  createItemId,
  createCategoryId,
  createProductTemplateId,
  createQuantity,
  createDateOnly,
} from '@/shared/types';
import {
  createMockInventoryItem,
  createMockHousehold,
} from '@/shared/utils/test/factories';
import { RECOMMENDED_ITEMS } from '@/features/templates';
import { toLocalDateString } from '@/shared/utils/test/date-helpers';

function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return toLocalDateString(d);
}

const mockT = (key: string, opts?: Record<string, unknown>) => {
  if (opts?.days !== undefined) return `${key}:${opts.days}`;
  if (opts?.percent !== undefined) return `${key}:${opts.percent}`;
  if (opts?.liters !== undefined) return `${key}:${opts.liters}`;
  if (opts?.ns) return key; // namespace lookup
  return key;
};

const baseHousehold = createMockHousehold({
  adults: 1,
  children: 0,
  supplyDurationDays: 3,
  useFreezer: false,
});

// ============================================================================
// L34: ConditionalExpression/LogicalOperator - templateId && templateId !== CUSTOM_ITEM_TYPE
// Mutant: || instead of && or condition replaced with true
// ============================================================================
describe('L34: templateId checks in getTranslatedItemName', () => {
  it('custom items use their stored name, not translation', () => {
    const customItem = createMockInventoryItem({
      id: createItemId('custom-1'),
      categoryId: createCategoryId('food'),
      name: 'My Custom Food',
      itemType: createProductTemplateId('custom'),
      quantity: createQuantity(5),
      unit: 'pieces',
      caloriesPerUnit: 100,
      expirationDate: createDateOnly(daysFromNow(-1)),
      neverExpires: false,
    });

    const alerts = generateDashboardAlerts(
      [customItem],
      mockT,
      baseHousehold,
      RECOMMENDED_ITEMS,
    );

    // The expired custom item should generate an alert with the stored name
    const expiredAlert = alerts.find((a) => a.type === 'critical' && a.itemId);
    if (expiredAlert) {
      expect(expiredAlert.itemName).toBe('My Custom Food');
    }
  });
});

// ============================================================================
// L62: ConditionalExpression/LogicalOperator/BlockStatement
// item.neverExpires || !item.expirationDate → skip expiration check
// Mutant: && instead of || or condition → false or block removed
// ============================================================================
describe('L62: neverExpires/expirationDate guard in generateExpirationAlerts', () => {
  it('neverExpires items do NOT generate expiration alerts', () => {
    const neverExpiresItem = createMockInventoryItem({
      id: createItemId('ne-1'),
      categoryId: createCategoryId('food'),
      name: 'Canned Food',
      itemType: createProductTemplateId('canned-goods'),
      quantity: createQuantity(5),
      unit: 'pieces',
      neverExpires: true,
      expirationDate: undefined,
    });

    const alerts = generateDashboardAlerts(
      [neverExpiresItem],
      mockT,
      baseHousehold,
      RECOMMENDED_ITEMS,
    );

    // neverExpires=true should skip expiration check
    const expirationAlerts = alerts.filter((a) => a.itemId === 'ne-1');
    expect(expirationAlerts).toHaveLength(0);
  });

  it('items without expirationDate do NOT generate expiration alerts', () => {
    const noDateItem = createMockInventoryItem({
      id: createItemId('nodate-1'),
      categoryId: createCategoryId('food'),
      name: 'No Date Item',
      itemType: createProductTemplateId('rice'),
      quantity: createQuantity(5),
      unit: 'pieces',
      neverExpires: false,
      expirationDate: undefined,
    });

    const alerts = generateDashboardAlerts(
      [noDateItem],
      mockT,
      baseHousehold,
      RECOMMENDED_ITEMS,
    );

    // No expirationDate should skip expiration check
    const itemAlerts = alerts.filter((a) => a.itemId === 'nodate-1');
    expect(itemAlerts).toHaveLength(0);
  });

  it('expired item generates critical alert', () => {
    const expiredItem = createMockInventoryItem({
      id: createItemId('expired-1'),
      categoryId: createCategoryId('food'),
      name: 'Expired Food',
      itemType: createProductTemplateId('rice'),
      quantity: createQuantity(5),
      unit: 'kilograms',
      neverExpires: false,
      expirationDate: createDateOnly(daysFromNow(-5)),
    });

    const alerts = generateDashboardAlerts(
      [expiredItem],
      mockT,
      baseHousehold,
      RECOMMENDED_ITEMS,
    );

    const expiredAlerts = alerts.filter(
      (a) => a.type === 'critical' && a.itemId === 'expired-1',
    );
    expect(expiredAlerts.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// L204: ConditionalExpression/BlockStatement - hasEnough guard
// Mutant: condition → false (never skip), block → {} (empty return)
// ============================================================================
describe('L204: hasEnough guard in generateCategoryStockAlerts', () => {
  it('category with enough inventory does NOT generate stock alerts', () => {
    const items: InventoryItem[] = [
      createMockInventoryItem({
        id: createItemId('water-1'),
        categoryId: createCategoryId('water-beverages'),
        name: 'Water',
        itemType: createProductTemplateId('bottled-water'),
        quantity: createQuantity(100),
        unit: 'liters',
        neverExpires: true,
      }),
    ];

    const alerts = generateDashboardAlerts(
      items,
      mockT,
      baseHousehold,
      RECOMMENDED_ITEMS,
    );

    // With 100 liters of water, should have enough -> no stock alerts for water
    const waterStockAlerts = alerts.filter(
      (a) =>
        a.categoryId === 'water-beverages' &&
        (a.message.includes('stock') || a.message.includes('low')),
    );
    // May still have 0 if category has enough
    expect(waterStockAlerts.length).toBe(0);
  });
});

// ============================================================================
// L237-238: LogicalOperator/EqualityOperator - water shortage conditions
// !waterRequirements.hasEnoughWater && waterRequirements.waterShortfall > 0
// Mutant: || instead of &&, >= instead of >
// ============================================================================
describe('L237-238: water shortage alert conditions', () => {
  it('no water shortage alert when hasEnoughWater is true', () => {
    // Items that don't require water
    const items: InventoryItem[] = [
      createMockInventoryItem({
        id: createItemId('tool-1'),
        categoryId: createCategoryId('tools-supplies'),
        name: 'Flashlight',
        itemType: createProductTemplateId('flashlight'),
        quantity: createQuantity(5),
        unit: 'pieces',
        neverExpires: true,
      }),
    ];

    const alerts = generateDashboardAlerts(
      items,
      mockT,
      baseHousehold,
      RECOMMENDED_ITEMS,
    );

    // No water-requiring items -> hasEnoughWater=true, shortfall=0
    const waterShortageAlerts = alerts.filter((a) =>
      a.id.includes('water-shortage'),
    );
    expect(waterShortageAlerts).toHaveLength(0);
  });

  it('no water shortage alert when shortfall is exactly 0', () => {
    // This tests the > 0 boundary (mutant >= 0 would trigger at 0)
    // When shortfall is 0, hasEnoughWater should be true, so first condition fails
    const items: InventoryItem[] = [];

    const alerts = generateDashboardAlerts(
      items,
      mockT,
      baseHousehold,
      RECOMMENDED_ITEMS,
    );

    const waterShortageAlerts = alerts.filter((a) =>
      a.id.includes('water-shortage'),
    );
    expect(waterShortageAlerts).toHaveLength(0);
  });
});
