import { describe, it, expect } from 'vitest';
import {
  toDesignStatus,
  ALERT_TYPE_TO_DESIGN_STATUS,
  statusOf,
  categoryStats,
  coverageCounts,
  type CategoryStats,
} from './designStatus';
import {
  createMockCategory,
  createMockInventoryItem,
} from '@/shared/utils/test/factories';
import { createCategoryId, createItemId, createQuantity } from '@/shared/types';

describe('toDesignStatus', () => {
  it('maps critical to crit', () => {
    expect(toDesignStatus('critical')).toBe('crit');
  });

  it('maps warning to warn', () => {
    expect(toDesignStatus('warning')).toBe('warn');
  });

  it('maps ok to ok', () => {
    expect(toDesignStatus('ok')).toBe('ok');
  });
});

describe('ALERT_TYPE_TO_DESIGN_STATUS', () => {
  it('maps critical and warning alerts to their matching status', () => {
    expect(ALERT_TYPE_TO_DESIGN_STATUS.critical).toBe('crit');
    expect(ALERT_TYPE_TO_DESIGN_STATUS.warning).toBe('warn');
  });

  it('maps info alerts to ok, not a warning colour', () => {
    expect(ALERT_TYPE_TO_DESIGN_STATUS.info).toBe('ok');
  });
});

describe('statusOf', () => {
  it('is crit at zero quantity', () => {
    // neverExpires pinned everywhere in this describe: the factory hands out
    // a random expiration date otherwise, and expiration is checked before
    // quantity, so an unlucky date could return 'warn' instead.
    const item = createMockInventoryItem({
      quantity: createQuantity(0),
      neverExpires: true,
    });
    expect(statusOf(item, 10)).toBe('crit');
  });

  it('is warn below half the recommended quantity', () => {
    const item = createMockInventoryItem({
      quantity: createQuantity(3),
      neverExpires: true,
    });
    expect(statusOf(item, 10)).toBe('warn');
  });

  it('is ok at or above the recommended quantity', () => {
    const item = createMockInventoryItem({
      quantity: createQuantity(10),
      neverExpires: true,
    });
    expect(statusOf(item, 10)).toBe('ok');
  });

  it('treats an undefined recommendation as zero', () => {
    const item = createMockInventoryItem({
      quantity: createQuantity(0),
      neverExpires: true,
    });
    expect(statusOf(item, undefined)).toBe('crit');
  });
});

describe('categoryStats', () => {
  const category = createMockCategory({
    id: createCategoryId('food'),
    name: 'Food',
    icon: '🍚',
  });

  it('tallies items into ok/warn/crit buckets, scoped to the category', () => {
    const items = [
      createMockInventoryItem({
        id: createItemId('ok-1'),
        categoryId: category.id,
        quantity: createQuantity(10),
        neverExpires: true,
      }),
      createMockInventoryItem({
        id: createItemId('warn-1'),
        categoryId: category.id,
        quantity: createQuantity(3),
        neverExpires: true,
      }),
      createMockInventoryItem({
        id: createItemId('crit-1'),
        categoryId: category.id,
        quantity: createQuantity(0),
        neverExpires: true,
      }),
      createMockInventoryItem({
        id: createItemId('other-cat'),
        categoryId: createCategoryId('water-beverages'),
        quantity: createQuantity(0),
      }),
    ];
    const recommendedByItem = new Map([
      ['ok-1', 10],
      ['warn-1', 10],
      ['crit-1', 10],
    ]);

    const stats = categoryStats(category, items, recommendedByItem, 'ok');

    expect(stats.total).toBe(3);
    expect(stats.ok).toBe(1);
    expect(stats.warn).toBe(1);
    expect(stats.crit).toBe(1);
  });

  it('carries through the coverage and applicable flags it was given', () => {
    const stats = categoryStats(category, [], new Map(), 'warn', false);
    expect(stats.coverage).toBe('warn');
    expect(stats.applicable).toBe(false);
  });

  it('defaults applicable to true', () => {
    const stats = categoryStats(category, [], new Map(), 'ok');
    expect(stats.applicable).toBe(true);
  });
});

describe('coverageCounts', () => {
  const stat = (
    coverage: CategoryStats['coverage'],
    applicable = true,
  ): CategoryStats => ({
    category: createMockCategory({ id: createCategoryId('food') }),
    total: 0,
    ok: 0,
    warn: 0,
    crit: 0,
    coverage,
    applicable,
  });

  it('totals only the applicable categories', () => {
    const counts = coverageCounts([
      stat('ok'),
      stat('warn'),
      stat('crit'),
      stat('ok', false),
    ]);
    expect(counts).toEqual({ total: 3, ok: 1, warn: 1, crit: 1 });
  });

  it('excludes non-applicable categories from every bucket, not just the total', () => {
    const counts = coverageCounts([stat('crit', false)]);
    expect(counts).toEqual({ total: 0, ok: 0, warn: 0, crit: 0 });
  });

  it('reads all-zero for an empty list', () => {
    expect(coverageCounts([])).toEqual({ total: 0, ok: 0, warn: 0, crit: 0 });
  });
});
