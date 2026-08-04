import { describe, it, expect } from 'vitest';
import {
  toDesignStatus,
  statusOf,
  categoryStats,
  readinessPercent,
  ALERT_TYPE_TO_DESIGN_STATUS,
  type CategoryStats,
} from './designStatus';
import {
  createMockCategory,
  createMockInventoryItem,
} from '@/shared/utils/test/factories';
import { createCategoryId, createQuantity } from '@/shared/types';

const FOOD = createCategoryId('food');
const WATER = createCategoryId('water');

/** Quantity decides the status once expiry is taken out of the picture. */
const stocked = (id: string, categoryId = FOOD, quantity = 10) =>
  createMockInventoryItem({
    name: id,
    categoryId,
    quantity: createQuantity(quantity),
    neverExpires: true,
    expirationDate: undefined,
    // The factory randomises this, and it short-circuits to ok.
    markedAsEnough: false,
  });

describe('toDesignStatus', () => {
  it('shortens each canonical status to its v2 name', () => {
    expect(toDesignStatus('critical')).toBe('crit');
    expect(toDesignStatus('warning')).toBe('warn');
    expect(toDesignStatus('ok')).toBe('ok');
  });
});

describe('ALERT_TYPE_TO_DESIGN_STATUS', () => {
  it('carries alert severity across to the status colours', () => {
    expect(ALERT_TYPE_TO_DESIGN_STATUS.critical).toBe('crit');
    expect(ALERT_TYPE_TO_DESIGN_STATUS.warning).toBe('warn');
  });

  it('renders info alerts in the calm colour rather than as a warning', () => {
    expect(ALERT_TYPE_TO_DESIGN_STATUS.info).toBe('ok');
  });
});

describe('statusOf', () => {
  it('reads a fully stocked item as ok', () => {
    expect(statusOf(stocked('beans', FOOD, 10), 10)).toBe('ok');
  });

  it('reads an item the household owns none of as critical', () => {
    expect(statusOf(stocked('beans', FOOD, 0), 10)).toBe('crit');
  });

  it('treats an unknown recommendation as no requirement to fall short of', () => {
    // No recommendation means nothing to be short against, so any quantity
    // reads ok rather than critical.
    expect(statusOf(stocked('beans', FOOD, 1), undefined)).toBe('ok');
  });
});

describe('categoryStats', () => {
  it('counts only the items belonging to the category', () => {
    const category = createMockCategory({ id: FOOD });
    const items = [stocked('beans', FOOD), stocked('bottles', WATER)];

    const stats = categoryStats(category, items, new Map());

    expect(stats.category).toBe(category);
    expect(stats.total).toBe(1);
  });

  it('splits the category across ok, warn and crit', () => {
    const category = createMockCategory({ id: FOOD });
    const full = stocked('full', FOOD, 10);
    // Below half the recommendation, which is where warn starts.
    const half = stocked('half', FOOD, 4);
    const empty = stocked('empty', FOOD, 0);
    const recommended = new Map([
      [String(full.id), 10],
      [String(half.id), 10],
      [String(empty.id), 10],
    ]);

    const stats = categoryStats(category, [full, half, empty], recommended);

    expect(stats.total).toBe(3);
    expect(stats.ok).toBe(1);
    expect(stats.warn).toBe(1);
    expect(stats.crit).toBe(1);
  });

  it('reports an empty category as all zeroes', () => {
    const stats = categoryStats(
      createMockCategory({ id: FOOD }),
      [],
      new Map(),
    );
    expect(stats).toMatchObject({ total: 0, ok: 0, warn: 0, crit: 0 });
  });
});

describe('readinessPercent', () => {
  const stats = (total: number, ok: number): CategoryStats =>
    ({ total, ok }) as CategoryStats;

  it('is the share of ok items across every category, rounded', () => {
    expect(readinessPercent([stats(4, 1), stats(2, 2)])).toBe(50);
    expect(readinessPercent([stats(3, 1)])).toBe(33);
  });

  it('is 100 when everything is stocked', () => {
    expect(readinessPercent([stats(2, 2), stats(3, 3)])).toBe(100);
  });

  it('is 0 rather than NaN with nothing in the inventory', () => {
    expect(readinessPercent([])).toBe(0);
    expect(readinessPercent([stats(0, 0)])).toBe(0);
  });
});
