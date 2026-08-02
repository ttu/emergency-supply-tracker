import { describe, it, expect } from 'vitest';
import { buildOnboardingItems, offeredItems } from './buildOnboardingItems';
import { RECOMMENDED_ITEMS } from '@/features/templates';
import type { HouseholdConfig } from '@/shared/types';

const household: HouseholdConfig = {
  adults: 2,
  children: 0,
  pets: 0,
  supplyDurationDays: 3,
  useFreezer: false,
};

const resolveName = (key: string) => key.replace('products.', '');

const idsIn = (categoryId: string) =>
  RECOMMENDED_ITEMS.filter((i) => String(i.category) === categoryId).map((i) =>
    String(i.id),
  );

const build = (
  selected: string[],
  owned: string[] = [],
  overrides: Partial<HouseholdConfig> = {},
) =>
  buildOnboardingItems(
    RECOMMENDED_ITEMS,
    { ...household, ...overrides },
    { selectedIds: new Set(selected), ownedIds: new Set(owned) },
    resolveName,
  );

describe('buildOnboardingItems', () => {
  it('seeds nothing when nothing was selected', () => {
    expect(build([])).toHaveLength(0);
  });

  it('seeds exactly what was selected', () => {
    const ids = idsIn('water-beverages');
    const items = build(ids);
    expect(items.map((i) => String(i.itemType)).sort()).toEqual(
      [...ids].sort(),
    );
  });

  it('starts selections at zero — a list to acquire, not a claim of stock', () => {
    const items = build(idsIn('water-beverages'));
    expect(items.every((i) => i.quantity === 0)).toBe(true);
  });

  it('seeds items marked owned at their recommended quantity', () => {
    const ids = idsIn('water-beverages');
    const items = build(ids, ids);
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((i) => i.quantity > 0)).toBe(true);
  });

  it('scales an owned quantity to the household', () => {
    const [id] = idsIn('water-beverages');
    const forOne = build([id], [id], { adults: 1, supplyDurationDays: 3 });
    const forFour = build([id], [id], { adults: 4, supplyDurationDays: 3 });
    expect(forFour[0].quantity).toBeGreaterThan(forOne[0].quantity);
  });

  it('carries the template identity so coverage can match it later', () => {
    const items = build(idsIn('water-beverages'));
    expect(items.every((i) => !!i.itemType && i.itemType !== 'custom')).toBe(
      true,
    );
  });

  it('names items through the resolver rather than leaving raw keys', () => {
    const items = build(idsIn('water-beverages'));
    expect(items.every((i) => !i.name.startsWith('products.'))).toBe(true);
  });
});

describe('offeredItems', () => {
  it('withholds frozen goods from a household without a freezer', () => {
    const without = offeredItems(RECOMMENDED_ITEMS, {
      ...household,
      useFreezer: false,
    });
    const with_ = offeredItems(RECOMMENDED_ITEMS, {
      ...household,
      useFreezer: true,
    });
    expect(with_.length).toBeGreaterThan(without.length);
    expect(without.some((i) => i.requiresFreezer)).toBe(false);
  });

  it('withholds pet supplies from a household without pets', () => {
    const none = offeredItems(RECOMMENDED_ITEMS, { ...household, pets: 0 });
    expect(none.some((i) => i.scaleWithPets)).toBe(false);
    expect(
      offeredItems(RECOMMENDED_ITEMS, { ...household, pets: 2 }).some(
        (i) => i.scaleWithPets,
      ),
    ).toBe(true);
  });
});
