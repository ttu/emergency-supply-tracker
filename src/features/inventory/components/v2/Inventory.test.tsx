import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';

// Only the two title keys resolve; every other key falls through to itself,
// so the rest of the assertions below keep matching raw keys.
vi.mock('react-i18next', async () => {
  const { createI18nMock } = await import('@/test/i18n');
  return createI18nMock({
    translations: {
      'v2.inventory.title.cockpit': 'INVENTORY · ALL ITEMS',
      'v2.inventory.titleCategory.cockpit': 'INVENTORY · {{category}}',
    },
    namespaces: { categories: { 'water-beverages': 'Water & Beverages' } },
  });
});

import { Inventory } from './Inventory';
import { renderWithProviders } from '@/test/render';
import {
  createMockAppData,
  createMockInventoryItem,
  createMockSettings,
} from '@/shared/utils/test/factories';
import { createCategoryId, createQuantity } from '@/shared/types';

const WATER_ID = createCategoryId('water-beverages');
const FOOD_ID = createCategoryId('food');

const setup = (props: { onAddItem?: (id?: string) => void } = {}) => {
  // `neverExpires` is pinned because expiry outranks quantity in
  // getItemStatus: the factory hands out a future expiry half the time, and
  // when it lands inside the expiring-soon window the empty item reads warn
  // rather than crit, so the CRIT chip below stops matching it.
  const items = [
    createMockInventoryItem({
      name: 'Bottled water',
      categoryId: WATER_ID,
      quantity: createQuantity(0),
      neverExpires: true,
      expirationDate: undefined,
    }),
    createMockInventoryItem({
      name: 'Canned beans',
      categoryId: FOOD_ID,
      quantity: createQuantity(20),
      neverExpires: true,
      expirationDate: undefined,
    }),
  ];
  return renderWithProviders(
    <Inventory onItemSelect={vi.fn()} onAddItem={props.onAddItem ?? vi.fn()} />,
    {
      initialAppData: createMockAppData({
        settings: createMockSettings({ theme: 'cockpit', language: 'en' }),
        items,
        // Random custom categories add rows and counts of their own, which
        // the assertions below would then be measuring against.
        customCategories: [],
      }),
    },
  );
};

describe('Inventory (v2)', () => {
  it('renders inventory title with cockpit voice and ADD button', async () => {
    setup();
    await waitFor(() => {
      expect(screen.getByText('INVENTORY · ALL ITEMS')).toBeInTheDocument();
    });
    expect(
      screen.getByRole('button', { name: 'v2.voice.addItem.cockpit' }),
    ).toBeInTheDocument();
  });

  it('names the selected category in the title instead of "all items"', async () => {
    setup();
    await screen.findByText('INVENTORY · ALL ITEMS');

    fireEvent.click(screen.getByTestId(`v2-category-row-${WATER_ID}`));

    await waitFor(() => {
      expect(
        screen.getByText('INVENTORY · Water & Beverages'),
      ).toBeInTheDocument();
    });
    expect(screen.queryByText('INVENTORY · ALL ITEMS')).not.toBeInTheDocument();
  });

  it('keeps the status strip mounted whether or not a category is picked', async () => {
    setup();
    const strip = await screen.findByTestId('v2-category-status-strip');
    expect(
      within(strip).getByText('v2.inventory.allCategories.cockpit'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByTestId(`v2-category-row-${WATER_ID}`));

    await waitFor(() => {
      expect(
        within(screen.getByTestId('v2-category-status-strip')).getByText(
          'Water & Beverages',
        ),
      ).toBeInTheDocument();
    });
  });

  it('renders every item in the inventory by default', async () => {
    setup();
    await waitFor(() => {
      expect(screen.getByText('Bottled water')).toBeInTheDocument();
    });
    expect(screen.getByText('Canned beans')).toBeInTheDocument();
  });

  it('filters down to a single status when a chip is clicked', async () => {
    setup();
    await waitFor(() => {
      expect(screen.getByText('Bottled water')).toBeInTheDocument();
    });
    // Match the chip ("CRIT <count>"), not StatusPills inside rows.
    fireEvent.click(
      screen.getByRole('button', {
        name: /^v2\.voice\.statusCrit\.cockpit\s+\d+$/,
      }),
    );
    await waitFor(() => {
      expect(screen.queryByText('Canned beans')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Bottled water')).toBeInTheDocument();
  });

  it('search input narrows the visible rows', async () => {
    setup();
    await waitFor(() => {
      expect(screen.getByText('Bottled water')).toBeInTheDocument();
    });
    fireEvent.change(screen.getByLabelText('v2.inventory.searchAria'), {
      target: { value: 'water' },
    });
    await waitFor(() => {
      expect(screen.queryByText('Canned beans')).not.toBeInTheDocument();
    });
  });

  it('clicking ADD button calls onAddItem', async () => {
    const onAddItem = vi.fn();
    renderWithProviders(
      <Inventory onItemSelect={vi.fn()} onAddItem={onAddItem} />,
      {
        initialAppData: createMockAppData({
          settings: createMockSettings({ theme: 'cockpit' }),
        }),
      },
    );
    await screen.findByRole('button', { name: 'v2.voice.addItem.cockpit' });
    fireEvent.click(
      screen.getByRole('button', { name: 'v2.voice.addItem.cockpit' }),
    );
    expect(onAddItem).toHaveBeenCalled();
  });

  describe('missing recommended items', () => {
    it('offers a filter for products the household has none of', async () => {
      setup();
      const chip = await screen.findByRole('button', {
        name: /v2\.inventory\.filterMissing\.cockpit/,
      });
      expect(chip).toBeInTheDocument();
    });

    it('lists missing products with their target quantity', async () => {
      setup();
      fireEvent.click(
        await screen.findByRole('button', {
          name: /v2\.inventory\.filterMissing\.cockpit/,
        }),
      );

      const rows = await screen.findAllByTestId('v2-missing-row');
      expect(rows.length).toBeGreaterThan(0);
    });

    it('adding a missing product reports its template id', async () => {
      const onAddItem = vi.fn();
      setup({ onAddItem });
      fireEvent.click(
        await screen.findByRole('button', {
          name: /v2\.inventory\.filterMissing\.cockpit/,
        }),
      );

      const rows = await screen.findAllByTestId('v2-missing-row');
      fireEvent.click(
        within(rows[0]).getByRole('button', {
          name: 'v2.inventory.missingAdd.cockpit',
        }),
      );

      expect(onAddItem).toHaveBeenCalledTimes(1);
      expect(typeof onAddItem.mock.calls[0][0]).toBe('string');
    });
  });

  describe('sorting and location', () => {
    it('sorts by name by default and can switch to quantity', async () => {
      setup();
      await screen.findByText('Bottled water');

      const names = () =>
        screen
          .getAllByText(/Bottled water|Canned beans/)
          .map((el) => el.textContent);
      expect(names()).toEqual(['Bottled water', 'Canned beans']);

      fireEvent.change(screen.getByLabelText('v2.inventory.sortAria.cockpit'), {
        target: { value: 'quantity' },
      });
      // Canned beans has 20, bottled water 0.
      expect(names()).toEqual(['Canned beans', 'Bottled water']);
    });

    it('offers no location select when nothing has a location', async () => {
      setup();
      await screen.findByText('Bottled water');
      expect(
        screen.queryByLabelText('v2.inventory.locationAria.cockpit'),
      ).not.toBeInTheDocument();
    });

    it('filters by location', async () => {
      renderWithProviders(
        <Inventory onItemSelect={vi.fn()} onAddItem={vi.fn()} />,
        {
          initialAppData: createMockAppData({
            settings: createMockSettings({ theme: 'cockpit', language: 'en' }),
            items: [
              createMockInventoryItem({
                name: 'Pantry water',
                categoryId: WATER_ID,
                quantity: createQuantity(5),
                location: 'Pantry',
              }),
              createMockInventoryItem({
                name: 'Garage beans',
                categoryId: FOOD_ID,
                quantity: createQuantity(5),
                location: 'Garage',
              }),
            ],
          }),
        },
      );

      await screen.findByText('Pantry water');
      fireEvent.change(
        screen.getByLabelText('v2.inventory.locationAria.cockpit'),
        { target: { value: 'Garage' } },
      );

      expect(screen.getByText('Garage beans')).toBeInTheDocument();
      expect(screen.queryByText('Pantry water')).not.toBeInTheDocument();
    });
  });
});
