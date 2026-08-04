import { describe, it, expect } from 'vitest';
import {
  getItemStatus,
  getDaysUntilExpiration,
  isItemExpired,
  getStatusFromPercentage,
  getStatusFromScore,
  getStatusVariant,
} from '@/shared/utils/calculations/itemStatus';
import {
  calculateMissingQuantity,
  calculateTotalMissingQuantity,
} from './status';
import {
  createDateOnly,
  createItemId,
  createCategoryId,
  createProductTemplateId,
  createQuantity,
} from '@/shared/types';
import { createMockInventoryItem } from '@/shared/utils/test/factories';
import { toLocalDateString } from '@/shared/utils/test/date-helpers';

function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return toLocalDateString(d);
}

describe('getItemStatus', () => {
  it('returns critical when quantity is 0', () => {
    expect(getItemStatus(0, 10)).toBe('critical');
  });

  it('returns warning when quantity < 50% of recommended', () => {
    expect(getItemStatus(4, 10)).toBe('warning');
  });

  it('returns ok when quantity is exactly at 50% threshold', () => {
    // LOW_QUANTITY_WARNING_RATIO = 0.5, so 5 < 10*0.5 is false
    expect(getItemStatus(5, 10)).toBe('ok');
  });

  it('returns warning when quantity is just below 50% threshold', () => {
    expect(getItemStatus(4.99, 10)).toBe('warning');
  });

  it('returns ok when quantity >= recommended', () => {
    expect(getItemStatus(10, 10)).toBe('ok');
  });

  it('returns ok when no expirationDate and neverExpires is false', () => {
    expect(getItemStatus(10, 10, undefined, false)).toBe('ok');
  });

  it('returns warning when expiring in exactly 30 days', () => {
    const in30Days = new Date();
    in30Days.setDate(in30Days.getDate() + 30);
    expect(
      getItemStatus(10, 10, createDateOnly(toLocalDateString(in30Days)), false),
    ).toBe('warning');
  });

  it('returns ok when expiring in 31 days', () => {
    const in31Days = new Date();
    in31Days.setDate(in31Days.getDate() + 31);
    expect(
      getItemStatus(10, 10, createDateOnly(toLocalDateString(in31Days)), false),
    ).toBe('ok');
  });

  it('returns warning (not critical) when expiring today', () => {
    const today = new Date();
    expect(
      getItemStatus(10, 10, createDateOnly(toLocalDateString(today)), false),
    ).toBe('warning');
  });

  it('returns ok when markedAsEnough with sufficient quantity', () => {
    expect(getItemStatus(10, 10, undefined, false, true)).toBe('ok');
  });

  it('returns ok when markedAsEnough overrides low quantity', () => {
    expect(getItemStatus(1, 10, undefined, false, true)).toBe('ok');
  });

  it('returns critical when expired even if markedAsEnough', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(
      getItemStatus(
        10,
        10,
        createDateOnly(toLocalDateString(yesterday)),
        false,
        true,
      ),
    ).toBe('critical');
  });

  it('returns warning when expiring soon even if markedAsEnough', () => {
    const in10Days = new Date();
    in10Days.setDate(in10Days.getDate() + 10);
    expect(
      getItemStatus(
        10,
        10,
        createDateOnly(toLocalDateString(in10Days)),
        false,
        true,
      ),
    ).toBe('warning');
  });

  it('returns critical when expired', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(
      getItemStatus(10, 10, createDateOnly(toLocalDateString(yesterday))),
    ).toBe('critical');
  });

  it('returns warning when expiring within 30 days', () => {
    const in20Days = new Date();
    in20Days.setDate(in20Days.getDate() + 20);
    expect(
      getItemStatus(10, 10, createDateOnly(toLocalDateString(in20Days))),
    ).toBe('warning');
  });

  it('ignores expiration when neverExpires is true', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(
      getItemStatus(10, 10, createDateOnly(toLocalDateString(yesterday)), true),
    ).toBe('ok');
  });

  describe('neverExpires guards expiration branch', () => {
    // These guard the `!neverExpires && expirationDate` condition: if mutated
    // to OR or always-true, neverExpires=true would still trigger expiration.

    it('neverExpires=true with future expirationDate returns ok (not warning)', () => {
      const futureDate = createDateOnly(daysFromNow(10));
      expect(getItemStatus(10, 10, futureDate, true)).toBe('ok');
    });

    it('neverExpires=true without date and qty=0 returns critical from quantity check', () => {
      expect(getItemStatus(0, 10, undefined, true)).toBe('critical');
    });

    it('neverExpires=undefined (falsy) with past date returns critical', () => {
      const pastDate = createDateOnly(daysFromNow(-1));
      expect(getItemStatus(10, 10, pastDate)).toBe('critical');
    });

    it('neverExpires=undefined (falsy) without date returns ok for sufficient quantity', () => {
      expect(getItemStatus(10, 10)).toBe('ok');
    });
  });
});

describe('getDaysUntilExpiration', () => {
  it('returns undefined when neverExpires is true', () => {
    expect(
      getDaysUntilExpiration(createDateOnly('2025-12-31'), true),
    ).toBeUndefined();
  });

  it('returns undefined when no expiration date', () => {
    expect(getDaysUntilExpiration(undefined, false)).toBeUndefined();
  });

  it('returns positive days for future date', () => {
    const future = new Date();
    future.setDate(future.getDate() + 10);
    expect(
      getDaysUntilExpiration(createDateOnly(toLocalDateString(future)), false),
    ).toBe(10);
  });

  it('returns negative days for past date', () => {
    const past = new Date();
    past.setDate(past.getDate() - 5);
    expect(
      getDaysUntilExpiration(createDateOnly(toLocalDateString(past)), false),
    ).toBe(-5);
  });

  it('returns 0 for today', () => {
    const today = new Date();
    expect(
      getDaysUntilExpiration(createDateOnly(toLocalDateString(today)), false),
    ).toBe(0);
  });

  it('handles date-only strings correctly regardless of timezone', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(
      getDaysUntilExpiration(
        createDateOnly(toLocalDateString(tomorrow)),
        false,
      ),
    ).toBe(1);
  });

  describe('parseDateOnly month is zero-indexed', () => {
    // Guards against `month - 1` being mutated to `month + 1` etc.
    // A 30-day-from-now date should resolve to ~30 days, not ~60+.
    it('30 days from today resolves to ~30 days until expiration', () => {
      const days = getDaysUntilExpiration(
        createDateOnly(daysFromNow(30)),
        false,
      );
      expect(days).toBeGreaterThanOrEqual(29);
      expect(days).toBeLessThanOrEqual(30);
    });
  });
});

describe('isItemExpired', () => {
  it('returns false when neverExpires is true', () => {
    const past = new Date();
    past.setDate(past.getDate() - 5);
    expect(isItemExpired(createDateOnly(toLocalDateString(past)), true)).toBe(
      false,
    );
  });

  it('returns false when no expiration date', () => {
    expect(isItemExpired(undefined, false)).toBe(false);
  });

  it('returns true for past date', () => {
    const past = new Date();
    past.setDate(past.getDate() - 1);
    expect(isItemExpired(createDateOnly(toLocalDateString(past)), false)).toBe(
      true,
    );
  });

  it('returns false for future date', () => {
    const future = new Date();
    future.setDate(future.getDate() + 10);
    expect(
      isItemExpired(createDateOnly(toLocalDateString(future)), false),
    ).toBe(false);
  });

  it('returns false for today (not expired yet)', () => {
    const today = new Date();
    expect(isItemExpired(createDateOnly(toLocalDateString(today)), false)).toBe(
      false,
    );
  });

  it('returns true for yesterday', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(
      isItemExpired(createDateOnly(toLocalDateString(yesterday)), false),
    ).toBe(true);
  });

  it('neverExpires=true with no date returns false', () => {
    expect(isItemExpired(undefined, true)).toBe(false);
  });
});

describe('getStatusFromPercentage', () => {
  it('returns critical when percentage < 30', () => {
    expect(getStatusFromPercentage(0)).toBe('critical');
    expect(getStatusFromPercentage(29)).toBe('critical');
  });

  it('returns warning when percentage >= 30 and < 70', () => {
    expect(getStatusFromPercentage(30)).toBe('warning');
    expect(getStatusFromPercentage(69)).toBe('warning');
  });

  it('returns ok when percentage >= 70', () => {
    expect(getStatusFromPercentage(70)).toBe('ok');
    expect(getStatusFromPercentage(100)).toBe('ok');
  });
});

describe('getStatusFromScore', () => {
  it('returns critical when score < 50', () => {
    expect(getStatusFromScore(0)).toBe('critical');
    expect(getStatusFromScore(49)).toBe('critical');
  });

  it('returns warning when score >= 50 and < 80', () => {
    expect(getStatusFromScore(50)).toBe('warning');
    expect(getStatusFromScore(79)).toBe('warning');
  });

  it('returns ok when score >= 80', () => {
    expect(getStatusFromScore(80)).toBe('ok');
    expect(getStatusFromScore(100)).toBe('ok');
  });
});

describe('getStatusVariant', () => {
  it('returns success for ok status', () => {
    expect(getStatusVariant('ok')).toBe('success');
  });

  it('returns warning for warning status', () => {
    expect(getStatusVariant('warning')).toBe('warning');
  });

  it('returns danger for critical status', () => {
    expect(getStatusVariant('critical')).toBe('danger');
  });
});

describe('calculateMissingQuantity', () => {
  const baseItem = createMockInventoryItem({
    id: createItemId('1'),
    name: 'Test Item',
    itemType: createProductTemplateId('test-item'),
    categoryId: createCategoryId('tools-supplies'),
    quantity: createQuantity(1),
    unit: 'pieces',
    neverExpires: true,
    expirationDate: undefined,
  });
  const baseRecommendedQuantity = 10;

  describe('returns missing quantity for quantity-based warnings', () => {
    it('returns missing quantity when status is warning due to low quantity', () => {
      const item = createMockInventoryItem({
        ...baseItem,
        quantity: createQuantity(4),
        neverExpires: true,
        expirationDate: undefined,
      });
      expect(calculateMissingQuantity(item, baseRecommendedQuantity)).toBe(6);
    });

    it('returns missing quantity when status is critical due to zero quantity', () => {
      const item = createMockInventoryItem({
        ...baseItem,
        quantity: createQuantity(0),
        neverExpires: true,
        expirationDate: undefined,
      });
      expect(calculateMissingQuantity(item, baseRecommendedQuantity)).toBe(10);
    });

    it('returns correct missing quantity for rope example (1 meter, 10 recommended)', () => {
      const ropeItem = createMockInventoryItem({
        ...baseItem,
        quantity: createQuantity(1),
        unit: 'meters',
        neverExpires: true,
        expirationDate: undefined,
      });
      expect(calculateMissingQuantity(ropeItem, baseRecommendedQuantity)).toBe(
        9,
      );
    });

    it('returns correct missing quantity for rope example (2 meters, 10 recommended)', () => {
      const ropeItem = createMockInventoryItem({
        ...baseItem,
        quantity: createQuantity(2),
        unit: 'meters',
        neverExpires: true,
        expirationDate: undefined,
      });
      expect(calculateMissingQuantity(ropeItem, baseRecommendedQuantity)).toBe(
        8,
      );
    });

    it('returns correct missing quantity for toilet paper (1 roll, 3 recommended)', () => {
      const tpItem = createMockInventoryItem({
        ...baseItem,
        quantity: createQuantity(1),
        unit: 'rolls',
        neverExpires: true,
        expirationDate: undefined,
      });
      expect(calculateMissingQuantity(tpItem, 3)).toBe(2);
    });

    it('returns missing quantity 1 step below recommended', () => {
      const item = createMockInventoryItem({
        ...baseItem,
        quantity: createQuantity(9),
      });
      expect(calculateMissingQuantity(item, 10)).toBe(1);
    });
  });

  describe('returns 0 when not a quantity issue', () => {
    it('returns 0 when status is ok (sufficient quantity)', () => {
      const item = createMockInventoryItem({
        ...baseItem,
        quantity: createQuantity(10),
        neverExpires: true,
        expirationDate: undefined,
      });
      expect(calculateMissingQuantity(item, baseRecommendedQuantity)).toBe(0);
    });

    it('returns 0 when quantity equals recommendedQuantity', () => {
      const item = createMockInventoryItem({
        ...baseItem,
        quantity: createQuantity(10),
        neverExpires: true,
        expirationDate: undefined,
      });
      expect(calculateMissingQuantity(item, baseRecommendedQuantity)).toBe(0);
    });

    it('returns 0 when quantity exceeds recommendedQuantity', () => {
      const item = createMockInventoryItem({
        ...baseItem,
        quantity: createQuantity(15),
        neverExpires: true,
        expirationDate: undefined,
      });
      expect(calculateMissingQuantity(item, baseRecommendedQuantity)).toBe(0);
    });

    it('returns 0 when item has shortage AND is expired (expiration takes precedence)', () => {
      const expiredDate = createDateOnly(daysFromNow(-5));
      const item = createMockInventoryItem({
        ...baseItem,
        quantity: createQuantity(1),
        expirationDate: expiredDate,
        neverExpires: false,
      });
      expect(calculateMissingQuantity(item, baseRecommendedQuantity)).toBe(0);
    });

    it('returns 0 when item has shortage AND is expiring soon', () => {
      const soonDate = createDateOnly(daysFromNow(10));
      const item = createMockInventoryItem({
        ...baseItem,
        quantity: createQuantity(1),
        expirationDate: soonDate,
        neverExpires: false,
      });
      expect(calculateMissingQuantity(item, baseRecommendedQuantity)).toBe(0);
    });

    it('returns 0 when status is warning due to expiration (not quantity)', () => {
      const soonDate = createDateOnly(daysFromNow(10));
      const item = createMockInventoryItem({
        ...baseItem,
        quantity: createQuantity(30),
        expirationDate: soonDate,
        neverExpires: false,
      });
      expect(calculateMissingQuantity(item, baseRecommendedQuantity)).toBe(0);
    });

    it('returns 0 when status is critical due to expiration (not quantity)', () => {
      const expiredDate = createDateOnly(daysFromNow(-10));
      const item = createMockInventoryItem({
        ...baseItem,
        quantity: createQuantity(30),
        expirationDate: expiredDate,
        neverExpires: false,
      });
      expect(calculateMissingQuantity(item, baseRecommendedQuantity)).toBe(0);
    });

    it('returns 0 when marked as enough (even with shortage)', () => {
      const item = createMockInventoryItem({
        ...baseItem,
        quantity: createQuantity(1),
        markedAsEnough: true,
        neverExpires: true,
        expirationDate: undefined,
      });
      expect(calculateMissingQuantity(item, baseRecommendedQuantity)).toBe(0);
    });

    it('returns 0 when recommendedQuantity is 0', () => {
      const item = createMockInventoryItem({
        ...baseItem,
        quantity: createQuantity(1),
        neverExpires: true,
        expirationDate: undefined,
      });
      expect(calculateMissingQuantity(item, 0)).toBe(0);
    });

    it('returns 0 when recommendedQuantity is negative (edge case)', () => {
      const item = createMockInventoryItem({
        ...baseItem,
        quantity: createQuantity(1),
        neverExpires: true,
        expirationDate: undefined,
      });
      expect(calculateMissingQuantity(item, -1)).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('handles decimal quantities correctly', () => {
      const item = createMockInventoryItem({
        ...baseItem,
        quantity: createQuantity(2.5),
        neverExpires: true,
        expirationDate: undefined,
      });
      expect(calculateMissingQuantity(item, baseRecommendedQuantity)).toBe(7.5);
    });

    it('returns 0 when missing quantity would be negative (quantity > recommended)', () => {
      const item = createMockInventoryItem({
        ...baseItem,
        quantity: createQuantity(15),
        neverExpires: true,
        expirationDate: undefined,
      });
      expect(calculateMissingQuantity(item, baseRecommendedQuantity)).toBe(0);
    });

    it('handles items expiring in exactly 30 days (boundary)', () => {
      const in30DaysDateOnly = createDateOnly(daysFromNow(30));
      const item = createMockInventoryItem({
        ...baseItem,
        quantity: createQuantity(1),
        expirationDate: in30DaysDateOnly,
        neverExpires: false,
      });
      expect(calculateMissingQuantity(item, baseRecommendedQuantity)).toBe(0);
    });

    it('handles items expiring in 31 days (not expiring soon)', () => {
      const in31DaysDateOnly = createDateOnly(daysFromNow(31));
      const item = createMockInventoryItem({
        ...baseItem,
        quantity: createQuantity(1),
        expirationDate: in31DaysDateOnly,
        neverExpires: false,
      });
      expect(calculateMissingQuantity(item, baseRecommendedQuantity)).toBe(9);
    });
  });
});

describe('calculateTotalMissingQuantity', () => {
  const baseRecommendedQuantity = 10;
  const baseItem = createMockInventoryItem({
    id: createItemId('1'),
    name: 'Rope',
    itemType: createProductTemplateId('rope'),
    categoryId: createCategoryId('tools-supplies'),
    quantity: createQuantity(2),
    unit: 'meters',
    neverExpires: true,
    expirationDate: undefined,
  });

  it('calculates total missing across multiple items of same type', () => {
    const item1 = createMockInventoryItem({
      ...baseItem,
      id: createItemId('1'),
      quantity: createQuantity(2),
    });
    const item2 = createMockInventoryItem({
      ...baseItem,
      id: createItemId('2'),
      quantity: createQuantity(1),
    });
    expect(
      calculateTotalMissingQuantity(
        item1,
        [item1, item2],
        baseRecommendedQuantity,
      ),
    ).toBe(7);
    expect(
      calculateTotalMissingQuantity(
        item2,
        [item1, item2],
        baseRecommendedQuantity,
      ),
    ).toBe(7);
  });

  it('returns same missing quantity for all items of same type', () => {
    const item1 = createMockInventoryItem({
      ...baseItem,
      id: createItemId('1'),
      quantity: createQuantity(1),
    });
    const item2 = createMockInventoryItem({
      ...baseItem,
      id: createItemId('2'),
      quantity: createQuantity(2),
    });
    const allItems = [item1, item2];
    expect(
      calculateTotalMissingQuantity(item1, allItems, baseRecommendedQuantity),
    ).toBe(7);
    expect(
      calculateTotalMissingQuantity(item2, allItems, baseRecommendedQuantity),
    ).toBe(7);
  });

  it('returns 0 when any matching item is marked as enough', () => {
    const item1 = createMockInventoryItem({
      ...baseItem,
      id: createItemId('1'),
      quantity: createQuantity(2),
      markedAsEnough: false,
    });
    const item2 = createMockInventoryItem({
      ...baseItem,
      id: createItemId('2'),
      quantity: createQuantity(1),
      markedAsEnough: true,
    });
    expect(
      calculateTotalMissingQuantity(
        item1,
        [item1, item2],
        baseRecommendedQuantity,
      ),
    ).toBe(0);
  });

  it('returns 0 when total quantity meets recommendation', () => {
    const item1 = createMockInventoryItem({
      ...baseItem,
      id: createItemId('1'),
      quantity: createQuantity(5),
    });
    const item2 = createMockInventoryItem({
      ...baseItem,
      id: createItemId('2'),
      quantity: createQuantity(5),
    });
    expect(
      calculateTotalMissingQuantity(
        item1,
        [item1, item2],
        baseRecommendedQuantity,
      ),
    ).toBe(0);
  });

  it('returns 0 when no quantity issue (expiration takes precedence)', () => {
    const soonDate = createDateOnly(daysFromNow(10));
    const item1 = createMockInventoryItem({
      ...baseItem,
      id: createItemId('1'),
      quantity: createQuantity(1),
      expirationDate: soonDate,
      neverExpires: false,
    });
    const item2 = createMockInventoryItem({
      ...baseItem,
      id: createItemId('2'),
      quantity: createQuantity(2),
      expirationDate: soonDate,
      neverExpires: false,
    });
    expect(
      calculateTotalMissingQuantity(
        item1,
        [item1, item2],
        baseRecommendedQuantity,
      ),
    ).toBe(0);
  });

  it('matches items by itemType', () => {
    const ropeTemplateId = createProductTemplateId('rope');
    const bucketTemplateId = createProductTemplateId('bucket');
    const item1 = createMockInventoryItem({
      ...baseItem,
      id: createItemId('1'),
      quantity: createQuantity(1),
      itemType: ropeTemplateId,
    });
    const item2 = createMockInventoryItem({
      ...baseItem,
      id: createItemId('2'),
      quantity: createQuantity(2),
      itemType: ropeTemplateId,
    });
    const item3 = createMockInventoryItem({
      ...baseItem,
      id: createItemId('3'),
      quantity: createQuantity(5),
      itemType: bucketTemplateId,
    });
    const allItems = [item1, item2, item3];
    expect(
      calculateTotalMissingQuantity(item1, allItems, baseRecommendedQuantity),
    ).toBe(7);
    expect(
      calculateTotalMissingQuantity(item2, allItems, baseRecommendedQuantity),
    ).toBe(7);
    expect(calculateTotalMissingQuantity(item3, allItems, 1)).toBe(0);
  });

  it('falls back to individual calculation when no matching items found', () => {
    const item1 = createMockInventoryItem({
      ...baseItem,
      id: createItemId('1'),
      quantity: createQuantity(1),
      itemType: createProductTemplateId('rope'),
    });
    const item2 = createMockInventoryItem({
      ...baseItem,
      id: createItemId('2'),
      quantity: createQuantity(2),
      itemType: createProductTemplateId('bucket'),
    });
    expect(
      calculateTotalMissingQuantity(
        item1,
        [item1, item2],
        baseRecommendedQuantity,
      ),
    ).toBe(9);
  });

  it('excludes custom items from matching', () => {
    const customItem = createMockInventoryItem({
      ...baseItem,
      id: createItemId('1'),
      quantity: createQuantity(1),
      itemType: createProductTemplateId('custom'),
    });
    const customItem2 = createMockInventoryItem({
      ...baseItem,
      id: createItemId('2'),
      quantity: createQuantity(2),
      itemType: createProductTemplateId('custom'),
    });
    expect(
      calculateTotalMissingQuantity(
        customItem,
        [customItem, customItem2],
        baseRecommendedQuantity,
      ),
    ).toBe(9);
  });

  it('returns 0 when recommendedQuantity is 0', () => {
    const item = createMockInventoryItem({
      ...baseItem,
      id: createItemId('1'),
      quantity: createQuantity(5),
    });
    expect(calculateTotalMissingQuantity(item, [item], 0)).toBe(0);
  });

  it('returns 0 when recommendedQuantity is negative', () => {
    const item = createMockInventoryItem({
      ...baseItem,
      id: createItemId('1'),
      quantity: createQuantity(5),
    });
    expect(calculateTotalMissingQuantity(item, [item], -1)).toBe(0);
  });

  it('returns 0 when total quantity equals recommended (boundary)', () => {
    const item1 = createMockInventoryItem({
      ...baseItem,
      id: createItemId('1'),
      quantity: createQuantity(6),
    });
    const item2 = createMockInventoryItem({
      ...baseItem,
      id: createItemId('2'),
      quantity: createQuantity(4),
    });
    expect(calculateTotalMissingQuantity(item1, [item1, item2], 10)).toBe(0);
  });

  it('returns shortage when total is just below recommended (boundary)', () => {
    const item1 = createMockInventoryItem({
      ...baseItem,
      id: createItemId('1'),
      quantity: createQuantity(5),
    });
    const item2 = createMockInventoryItem({
      ...baseItem,
      id: createItemId('2'),
      quantity: createQuantity(4),
    });
    expect(calculateTotalMissingQuantity(item1, [item1, item2], 10)).toBe(1);
  });

  it('returns 0 when some (not all) items have expiration issues', () => {
    const soonDate = createDateOnly(daysFromNow(10));
    const item1 = createMockInventoryItem({
      ...baseItem,
      id: createItemId('1'),
      quantity: createQuantity(1),
      neverExpires: true,
      expirationDate: undefined,
    });
    const item2 = createMockInventoryItem({
      ...baseItem,
      id: createItemId('2'),
      quantity: createQuantity(2),
      expirationDate: soonDate,
      neverExpires: false,
    });
    expect(calculateTotalMissingQuantity(item1, [item1, item2], 10)).toBe(0);
  });

  it('handles single item correctly', () => {
    const item = createMockInventoryItem({
      ...baseItem,
      id: createItemId('1'),
      quantity: createQuantity(1),
    });
    expect(
      calculateTotalMissingQuantity(item, [item], baseRecommendedQuantity),
    ).toBe(9);
  });

  describe('expiring-soon boundary (30 days inclusive)', () => {
    // Guards `daysUntil <= EXPIRING_SOON_DAYS_THRESHOLD`: at exactly 30 days
    // an item must be considered expiring-soon (return 0 missing); at 31 days
    // it must not (return shortage).
    it('item expiring in exactly 30 days suppresses missing quantity', () => {
      const item = createMockInventoryItem({
        ...baseItem,
        itemType: createProductTemplateId('water'),
        quantity: createQuantity(1),
        expirationDate: createDateOnly(daysFromNow(30)),
        neverExpires: false,
      });
      expect(calculateTotalMissingQuantity(item, [item], 10)).toBe(0);
    });

    it('item expiring in 31 days reports shortage', () => {
      const item = createMockInventoryItem({
        ...baseItem,
        itemType: createProductTemplateId('water'),
        quantity: createQuantity(1),
        expirationDate: createDateOnly(daysFromNow(31)),
        neverExpires: false,
      });
      expect(calculateTotalMissingQuantity(item, [item], 10)).toBe(9);
    });

    it('item expiring in 29 days suppresses missing quantity', () => {
      const item = createMockInventoryItem({
        ...baseItem,
        itemType: createProductTemplateId('water'),
        quantity: createQuantity(1),
        expirationDate: createDateOnly(daysFromNow(29)),
        neverExpires: false,
      });
      expect(calculateTotalMissingQuantity(item, [item], 10)).toBe(0);
    });
  });

  describe('itemType matching does not cross categories', () => {
    // Guards against mutations turning the type-equality filter into "always
    // match" — different itemTypes must not be summed.
    it('different itemTypes are not summed together', () => {
      const waterItem = createMockInventoryItem({
        ...baseItem,
        id: createItemId('w-1'),
        itemType: createProductTemplateId('water'),
        quantity: createQuantity(2),
      });
      const foodItem = createMockInventoryItem({
        ...baseItem,
        id: createItemId('f-1'),
        itemType: createProductTemplateId('food'),
        quantity: createQuantity(8),
      });
      expect(
        calculateTotalMissingQuantity(waterItem, [waterItem, foodItem], 10),
      ).toBe(8);
    });

    it('custom items mixed with non-custom do not cross-match', () => {
      const normalItem = createMockInventoryItem({
        ...baseItem,
        id: createItemId('n-1'),
        itemType: createProductTemplateId('water'),
        quantity: createQuantity(2),
      });
      const customItem = createMockInventoryItem({
        ...baseItem,
        id: createItemId('c-1'),
        itemType: createProductTemplateId('custom'),
        quantity: createQuantity(8),
      });
      expect(
        calculateTotalMissingQuantity(normalItem, [normalItem, customItem], 10),
      ).toBe(8);
    });
  });
});

// ===========================================================================
// Mutation-killing tests targeting specific surviving mutants (issue #277)
// ===========================================================================
describe('mutation-killers: status.ts', () => {
  const baseItem = {
    categoryId: createCategoryId('water-beverages'),
    itemType: createProductTemplateId('water'),
    unit: 'pieces' as const,
    quantity: createQuantity(0),
    neverExpires: true,
  };

  // L29: parseDateOnly month - 1 → month + 1
  describe('parseDateOnly month offset (L29 arithmetic)', () => {
    it('parses YYYY-03-15 as March 15, not April 15', () => {
      // If month were + 1 instead of - 1, a date in March compared against today
      // would be off by two months. Use a fixed date and verify expiration logic.
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      // Today's date → 0 days until expiration
      expect(
        getDaysUntilExpiration(
          createDateOnly(`${year}-${month}-${day}`),
          false,
        ),
      ).toBe(0);
    });

    it('isItemExpired uses correct month for boundary dates', () => {
      // Yesterday should be expired; tomorrow should not. With +1 month bug,
      // these would both be off by 2 months and likely fail.
      expect(isItemExpired(createDateOnly(daysFromNow(-1)), false)).toBe(true);
      expect(isItemExpired(createDateOnly(daysFromNow(1)), false)).toBe(false);
    });
  });

  // L79: !neverExpires && expirationDate (LogicalOperator + ConditionalExpression true)
  describe('getItemStatus expiration gate (L79)', () => {
    it('neverExpires=true with expirationDate in past returns ok (not critical)', () => {
      // Forces !neverExpires branch to be falsy — guards against AND→OR mutation
      expect(
        getItemStatus(10, 10, createDateOnly(daysFromNow(-30)), true),
      ).toBe('ok');
    });

    it('neverExpires=false with no expirationDate skips expiration check', () => {
      // Guards against the AND→OR mutation where missing date still triggers
      expect(getItemStatus(10, 10, undefined, false)).toBe('ok');
    });
  });

  // L202: item.quantity < recommendedQuantity → <= (EqualityOperator)
  describe('calculateMissingQuantity hasShortage boundary (L202)', () => {
    it('returns 0 when quantity equals recommendedQuantity', () => {
      const item = createMockInventoryItem({
        ...baseItem,
        id: createItemId('eq'),
        quantity: createQuantity(10),
      });
      // If < were <=, equal would be treated as shortage → returns >0
      expect(calculateMissingQuantity(item, 10)).toBe(0);
    });
  });

  // L204: hasShortage && !expired && ... LogicalOperator AND→OR
  describe('calculateMissingQuantity full AND gate (L204)', () => {
    it('returns 0 when no shortage even if not expired and rq > 0', () => {
      const item = createMockInventoryItem({
        ...baseItem,
        id: createItemId('full'),
        quantity: createQuantity(20),
      });
      expect(calculateMissingQuantity(item, 10)).toBe(0);
    });

    it('returns 0 when markedAsEnough even with shortage', () => {
      const item = createMockInventoryItem({
        ...baseItem,
        id: createItemId('me'),
        quantity: createQuantity(1),
        markedAsEnough: true,
      });
      expect(calculateMissingQuantity(item, 10)).toBe(0);
    });
  });

  // L208: recommendedQuantity > 0 → >= 0 (EqualityOperator)
  describe('calculateMissingQuantity rq > 0 boundary (L208)', () => {
    it('returns 0 when recommendedQuantity is exactly 0 even with shortage', () => {
      const item = createMockInventoryItem({
        ...baseItem,
        id: createItemId('rq0'),
        quantity: createQuantity(0),
      });
      expect(calculateMissingQuantity(item, 0)).toBe(0);
    });
  });

  // L248: item.itemType !== 'custom' && otherItem.itemType !== 'custom' (AND→OR + StringLiteral)
  describe('calculateTotalMissingQuantity custom exclusion (L248/L249)', () => {
    it('custom-to-custom items do not match each other', () => {
      const c1 = createMockInventoryItem({
        ...baseItem,
        id: createItemId('c1'),
        itemType: createProductTemplateId('custom'),
        quantity: createQuantity(2),
      });
      const c2 = createMockInventoryItem({
        ...baseItem,
        id: createItemId('c2'),
        itemType: createProductTemplateId('custom'),
        quantity: createQuantity(3),
      });
      // If AND→OR, customs would match each other and reduce missing.
      // Falls through to calculateMissingQuantity(c1, 10) = 8.
      expect(calculateTotalMissingQuantity(c1, [c1, c2], 10)).toBe(8);
    });
  });

  // L260: recommendedQuantity <= 0 → < 0 (EqualityOperator) + BlockStatement
  describe('calculateTotalMissingQuantity rq <= 0 boundary (L260)', () => {
    it('returns 0 when recommendedQuantity equals 0 across multiple items', () => {
      const a = createMockInventoryItem({
        ...baseItem,
        id: createItemId('a'),
        quantity: createQuantity(1),
      });
      const b = createMockInventoryItem({
        ...baseItem,
        id: createItemId('b'),
        quantity: createQuantity(2),
      });
      expect(calculateTotalMissingQuantity(a, [a, b], 0)).toBe(0);
    });
  });

  // L292: totalActual < recommendedQuantity → <= (EqualityOperator) + L295 BlockStatement
  describe('calculateTotalMissingQuantity total boundary (L292/L295)', () => {
    it('returns 0 when total exactly equals recommendedQuantity', () => {
      const a = createMockInventoryItem({
        ...baseItem,
        id: createItemId('a'),
        quantity: createQuantity(4),
      });
      const b = createMockInventoryItem({
        ...baseItem,
        id: createItemId('b'),
        quantity: createQuantity(6),
      });
      expect(calculateTotalMissingQuantity(a, [a, b], 10)).toBe(0);
    });
  });
});
