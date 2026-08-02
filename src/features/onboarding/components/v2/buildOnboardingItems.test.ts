import { describe, it, expect } from 'vitest';
import { buildOnboardingItems } from './buildOnboardingItems';
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

const build = (
  categories: string[],
  overrides: Partial<HouseholdConfig> = {},
) =>
  buildOnboardingItems(
    RECOMMENDED_ITEMS,
    { ...household, ...overrides },
    new Set(categories),
    resolveName,
  );

describe('buildOnboardingItems', () => {
  it('seeds nothing when no category was picked', () => {
    expect(build([])).toHaveLength(0);
  });

  it('seeds the recommended items of a picked category', () => {
    const items = build(['water-beverages']);
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((i) => String(i.categoryId) === 'water-beverages')).toBe(
      true,
    );
  });

  it('ignores categories that were not picked', () => {
    const items = build(['water-beverages']);
    expect(items.some((i) => String(i.categoryId) === 'food')).toBe(false);
  });

  it('starts everything at zero — a list to acquire, not a claim of stock', () => {
    const items = build(['water-beverages', 'food']);
    expect(items.every((i) => i.quantity === 0)).toBe(true);
  });

  it('carries the template identity so coverage can match it later', () => {
    const items = build(['water-beverages']);
    expect(items.every((i) => !!i.itemType && i.itemType !== 'custom')).toBe(
      true,
    );
  });

  it('skips frozen items without a freezer, and includes them with one', () => {
    const withoutFreezer = build(['food'], { useFreezer: false });
    const withFreezer = build(['food'], { useFreezer: true });
    expect(withFreezer.length).toBeGreaterThan(withoutFreezer.length);
  });

  it('skips pet supplies when the household has no pets', () => {
    expect(build(['pets'], { pets: 0 })).toHaveLength(0);
    expect(build(['pets'], { pets: 2 }).length).toBeGreaterThan(0);
  });

  it('names items through the resolver rather than leaving raw keys', () => {
    const items = build(['water-beverages']);
    expect(items.every((i) => !i.name.startsWith('products.'))).toBe(true);
  });
});
