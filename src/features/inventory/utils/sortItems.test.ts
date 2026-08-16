import { describe, it, expect } from 'vitest';
import { compareItemsBy } from './sortItems';
import { createMockInventoryItem } from '@/shared/utils/test/factories';
import { createDateOnly, createQuantity } from '@/shared/types';

const item = (
  name: string,
  quantity: number,
  expirationDate?: string,
  neverExpires = false,
) =>
  createMockInventoryItem({
    name,
    quantity: createQuantity(quantity),
    neverExpires,
    expirationDate: expirationDate ? createDateOnly(expirationDate) : undefined,
  });

const sorted = (
  items: ReturnType<typeof item>[],
  key: Parameters<typeof compareItemsBy>[2],
) => [...items].sort((a, b) => compareItemsBy(a, b, key)).map((i) => i.name);

describe('compareItemsBy', () => {
  it('sorts by name alphabetically', () => {
    const items = [item('Rice', 1), item('Bandages', 1), item('Water', 1)];
    expect(sorted(items, 'name')).toEqual(['Bandages', 'Rice', 'Water']);
  });

  it('sorts by quantity, largest first', () => {
    const items = [item('Few', 2), item('Many', 40), item('Some', 9)];
    expect(sorted(items, 'quantity')).toEqual(['Many', 'Some', 'Few']);
  });

  it('sorts by expiration, soonest first', () => {
    const items = [
      item('Later', 1, '2027-01-01'),
      item('Sooner', 1, '2026-03-01'),
      item('Middle', 1, '2026-09-01'),
    ];
    expect(sorted(items, 'expiration')).toEqual(['Sooner', 'Middle', 'Later']);
  });

  it('puts never-expiring items last', () => {
    const items = [
      item('Forever', 1, undefined, true),
      item('Expires', 1, '2027-01-01'),
    ];
    expect(sorted(items, 'expiration')).toEqual(['Expires', 'Forever']);
  });

  it('treats two never-expiring items as equal', () => {
    const a = item('A', 1, undefined, true);
    const b = item('B', 1, undefined, true);
    expect(compareItemsBy(a, b, 'expiration')).toBe(0);
  });

  it('compares dates as strings so timezones cannot shift the order', () => {
    // 31 Dec vs 1 Jan across a year boundary — parsing to Date in a negative
    // UTC offset would flip these.
    const a = item('NewYearsEve', 1, '2026-12-31');
    const b = item('NewYearsDay', 1, '2027-01-01');
    expect(compareItemsBy(a, b, 'expiration')).toBeLessThan(0);
  });
});
