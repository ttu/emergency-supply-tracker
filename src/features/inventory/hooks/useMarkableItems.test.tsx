import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { useMarkableItems } from './useMarkableItems';
import { renderWithProviders } from '@/test/render';
import {
  createMockAppData,
  createMockInventoryItem,
} from '@/shared/utils/test/factories';
import {
  createCategoryId,
  createProductTemplateId,
  createQuantity,
} from '@/shared/types';
import type { InventoryItem } from '@/shared/types';

const household = {
  adults: 2,
  children: 0,
  pets: 0,
  supplyDurationDays: 3,
  useFreezer: false,
};

/** Two adults for three days need far more than one litre, so this is short. */
const shortWater = (overrides: Partial<InventoryItem> = {}) =>
  createMockInventoryItem({
    name: 'Bottled water',
    itemType: createProductTemplateId('bottled-water'),
    categoryId: createCategoryId('water-beverages'),
    quantity: createQuantity(1),
    unit: 'liters',
    neverExpires: true,
    ...overrides,
  });

/** Renders what the hook matches, since a hook has no output of its own. */
function Probe({
  shortageItemId,
  items,
}: Readonly<{ shortageItemId: string; items: InventoryItem[] }>) {
  const findMarkableItems = useMarkableItems();
  const matched = findMarkableItems(shortageItemId, items);
  return <div data-testid="matched">{matched.length}</div>;
}

/** Renders the probe and resolves the number of items the hook matched. */
const matchCount = async (
  shortageItemId: string,
  items: InventoryItem[],
): Promise<string> => {
  renderWithProviders(<Probe shortageItemId={shortageItemId} items={items} />, {
    initialAppData: createMockAppData({
      household,
      items,
      customCategories: [],
    }),
  });
  return (await screen.findByTestId('matched')).textContent ?? '';
};

describe('useMarkableItems', () => {
  it('matches an item by its product template id', async () => {
    expect(await matchCount('bottled-water', [shortWater()])).toBe('1');
  });

  it('matches an item by its hyphenated name', async () => {
    const items = [shortWater({ name: 'Bottled Water' })];
    expect(await matchCount('bottled-water', items)).toBe('1');
  });

  // Without a template id there is no definition to derive a target from, so
  // the item has no recommendation to fall short of — a name match alone is
  // not enough to offer the action.
  it('skips an item with no template id even when its name matches', async () => {
    const items = [shortWater({ name: 'Bottled Water', itemType: undefined })];
    expect(await matchCount('bottled-water', items)).toBe('0');
  });

  // A custom item called "bottled water" is the user's own thing, not the
  // recommendation — marking it would silence a recommendation it never met.
  it('never matches a custom item by name', async () => {
    const items = [
      shortWater({
        name: 'Bottled Water',
        itemType: createProductTemplateId('custom'),
      }),
    ];
    expect(await matchCount('bottled-water', items)).toBe('0');
  });

  it('skips an item that is already marked as enough', async () => {
    const items = [shortWater({ markedAsEnough: true })];
    expect(await matchCount('bottled-water', items)).toBe('0');
  });

  // Nothing on hand is a gap to fill, not a quantity to accept as sufficient.
  it('skips an item with no quantity', async () => {
    const items = [shortWater({ quantity: createQuantity(0) })];
    expect(await matchCount('bottled-water', items)).toBe('0');
  });

  it('skips an item that already meets its recommendation', async () => {
    const items = [shortWater({ quantity: createQuantity(500) })];
    expect(await matchCount('bottled-water', items)).toBe('0');
  });

  it('returns nothing when no item matches the shortage', async () => {
    expect(await matchCount('canned-soup', [shortWater()])).toBe('0');
  });
});
