import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategoryRecommendedPanel } from './CategoryRecommendedPanel';
import { renderWithProviders } from '@/test/render';
import {
  createMockAppData,
  createMockInventoryItem,
  createMockSettings,
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

/** One litre for two adults over three days is well under target. */
const shortWater = () =>
  createMockInventoryItem({
    name: 'Bottled water',
    itemType: createProductTemplateId('bottled-water'),
    categoryId: createCategoryId('water-beverages'),
    quantity: createQuantity(1),
    unit: 'liters',
    neverExpires: true,
  });

const setup = (
  categoryId: string,
  { items = [] as InventoryItem[], onAdd = vi.fn(), stacked = false } = {},
) => {
  renderWithProviders(
    <CategoryRecommendedPanel
      categoryId={categoryId}
      onAdd={onAdd}
      stacked={stacked}
    />,
    {
      initialAppData: createMockAppData({
        settings: createMockSettings({ theme: 'cockpit', language: 'en' }),
        household,
        items,
        customCategories: [],
      }),
    },
  );
  return { onAdd, user: userEvent.setup() };
};

const expand = async (user: ReturnType<typeof userEvent.setup>) =>
  user.click(await screen.findByTestId('v2-recommended-toggle'));

describe('CategoryRecommendedPanel (v2)', () => {
  it('stays out of the way when the category is short of nothing', () => {
    setup('made-up-category');
    expect(
      screen.queryByTestId('v2-recommended-toggle'),
    ).not.toBeInTheDocument();
  });

  // The strip above already says the category needs attention; a dozen open
  // rows between it and the table would push the items off the screen.
  it('reports the count without listing the shortages', async () => {
    setup('water-beverages', { items: [shortWater()] });
    const toggle = await screen.findByTestId('v2-recommended-toggle');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryAllByTestId('v2-recommended-row')).toHaveLength(0);
  });

  it('lists the shortages once expanded', async () => {
    const { user } = setup('water-beverages', { items: [shortWater()] });
    await expand(user);
    expect(await screen.findByTestId('v2-recommended-toggle')).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.getAllByTestId('v2-recommended-row').length).toBeGreaterThan(
      0,
    );
  });

  it('offers to stock a shortage from its product template', async () => {
    const { user, onAdd } = setup('water-beverages', { items: [shortWater()] });
    await expand(user);
    const [add] = screen.getAllByLabelText(
      'v2.inventory.addToInventory.cockpit',
    );
    await user.click(add);
    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(onAdd.mock.calls[0][0]).toEqual(expect.any(String));
  });

  it('stops recommending an item once it is dismissed', async () => {
    const { user } = setup('water-beverages', { items: [shortWater()] });
    await expand(user);
    const before = screen.getAllByTestId('v2-recommended-row').length;
    await user.click(
      screen.getAllByLabelText('v2.inventory.dontRecommend.cockpit')[0],
    );
    expect(screen.getAllByTestId('v2-recommended-row')).toHaveLength(
      before - 1,
    );
  });

  // Accepting what is on hand only makes sense for an item the household
  // actually holds some of — a shortage with nothing stocked has no quantity
  // to call sufficient.
  it('only offers to accept the quantity on hand where there is one', async () => {
    const { user } = setup('water-beverages', { items: [shortWater()] });
    await expand(user);
    const rows = screen.getAllByTestId('v2-recommended-row');
    const markable = screen.getAllByLabelText(
      'v2.inventory.markEnough.cockpit',
    );
    expect(markable.length).toBeGreaterThan(0);
    expect(markable.length).toBeLessThan(rows.length);
  });

  // WCAG 2.1 AA wants 44x44 on touch. The desktop row is denser than that by
  // design, so the phone layout has to size its own targets up.
  it('sizes its actions for touch on a phone', async () => {
    const { user } = setup('water-beverages', {
      items: [shortWater()],
      stacked: true,
    });
    await expand(user);
    const [add] = screen.getAllByLabelText(
      'v2.inventory.addToInventory.cockpit',
    );
    expect(add).toHaveStyle({ width: '44px', height: '44px' });
  });

  it('clears a shortage when the quantity on hand is accepted', async () => {
    const { user } = setup('water-beverages', { items: [shortWater()] });
    await expand(user);
    const before = screen.getAllByTestId('v2-recommended-row').length;
    await user.click(
      screen.getAllByLabelText('v2.inventory.markEnough.cockpit')[0],
    );
    expect(screen.getAllByTestId('v2-recommended-row')).toHaveLength(
      before - 1,
    );
  });
});
