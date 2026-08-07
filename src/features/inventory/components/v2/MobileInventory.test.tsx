import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, within } from '@testing-library/react';
import { MobileInventory } from './MobileInventory';
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
  type DateOnly,
} from '@/shared/types';

const renderInv = (onAddItem = vi.fn()) =>
  renderWithProviders(
    <MobileInventory onItemSelect={vi.fn()} onAddItem={onAddItem} />,
    {
      initialAppData: createMockAppData({
        settings: createMockSettings({ theme: 'cockpit' }),
      }),
    },
  );

const water = createMockInventoryItem({
  name: 'Bottled water',
  itemType: createProductTemplateId('bottled-water'),
  categoryId: createCategoryId('water-beverages'),
  quantity: createQuantity(20),
  unit: 'liters',
  neverExpires: true,
});
const emptySoup = createMockInventoryItem({
  name: 'Canned soup',
  itemType: createProductTemplateId('canned-soup'),
  categoryId: createCategoryId('food'),
  quantity: createQuantity(0),
  unit: 'cans',
  neverExpires: true,
});

const renderWithItems = (
  props: Partial<Parameters<typeof MobileInventory>[0]> = {},
) =>
  renderWithProviders(
    <MobileInventory onItemSelect={vi.fn()} onAddItem={vi.fn()} {...props} />,
    {
      initialAppData: createMockAppData({
        settings: createMockSettings({ theme: 'cockpit' }),
        items: [water, emptySoup],
        customCategories: [],
      }),
    },
  );

describe('MobileInventory (v2)', () => {
  it('renders the cockpit filter chip labels', () => {
    renderInv();
    expect(
      screen.getByRole('button', { name: 'v2.inventory.filterAll.cockpit' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'v2.inventory.filterCrit.cockpit' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'v2.inventory.filterWarn.cockpit' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'v2.inventory.filterOk.cockpit' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: 'v2.inventory.filterExpShort.cockpit',
      }),
    ).toBeInTheDocument();
  });

  it('clicking the add-item button calls onAddItem', () => {
    const onAddItem = vi.fn();
    renderInv(onAddItem);
    fireEvent.click(
      screen.getByRole('button', { name: 'v2.voice.addItem.cockpit' }),
    );
    expect(onAddItem).toHaveBeenCalled();
  });

  it('lists the stocked items', async () => {
    renderWithItems();
    expect(await screen.findByText('Bottled water')).toBeInTheDocument();
    expect(screen.getByText('Canned soup')).toBeInTheDocument();
  });

  it('search narrows the list to matching names', async () => {
    renderWithItems();
    await screen.findByText('Bottled water');

    fireEvent.change(
      screen.getByPlaceholderText('v2.inventory.searchPlaceholder.cockpit'),
      { target: { value: 'soup' } },
    );

    expect(screen.queryByText('Bottled water')).not.toBeInTheDocument();
    expect(screen.getByText('Canned soup')).toBeInTheDocument();
  });

  it('the CRIT filter keeps only the out-of-stock item', async () => {
    renderWithItems();
    await screen.findByText('Bottled water');

    fireEvent.click(
      screen.getByRole('button', { name: 'v2.inventory.filterCrit.cockpit' }),
    );

    expect(screen.getByText('Canned soup')).toBeInTheDocument();
    expect(screen.queryByText('Bottled water')).not.toBeInTheDocument();
  });

  it('selecting a row reports the item id', async () => {
    const onItemSelect = vi.fn();
    renderWithItems({ onItemSelect });
    fireEvent.click(await screen.findByText('Canned soup'));
    expect(onItemSelect).toHaveBeenCalledWith(String(emptySoup.id));
  });

  it('narrows to a category picked from the dropdown', async () => {
    renderWithItems();
    await screen.findByText('Bottled water');

    fireEvent.change(screen.getByTestId('v2-category-select'), {
      target: { value: 'food' },
    });

    expect(await screen.findByText('Canned soup')).toBeInTheDocument();
    expect(screen.queryByText('Bottled water')).not.toBeInTheDocument();
  });

  it('shows the category summary only once a category is picked', async () => {
    renderWithItems();
    await screen.findByText('Bottled water');

    // Across every category there is no single requirement to report.
    expect(
      screen.queryByText('v2.inventory.totalRequired.cockpit'),
    ).not.toBeInTheDocument();

    fireEvent.change(screen.getByTestId('v2-category-select'), {
      target: { value: 'water-beverages' },
    });

    expect(
      await screen.findByText('v2.inventory.totalRequired.cockpit'),
    ).toBeInTheDocument();
  });

  it('shows the category status strip alongside the summary', async () => {
    renderWithItems();
    await screen.findByText('Bottled water');

    expect(
      screen.queryByTestId('v2-category-status-strip'),
    ).not.toBeInTheDocument();

    fireEvent.change(screen.getByTestId('v2-category-select'), {
      target: { value: 'water-beverages' },
    });

    const strip = await screen.findByTestId('v2-category-status-strip');
    expect(
      within(strip).getByTestId('v2-category-strip-coverage'),
    ).toBeInTheDocument();
  });

  it('the location select keeps only what is stored there', async () => {
    renderWithProviders(
      <MobileInventory onItemSelect={vi.fn()} onAddItem={vi.fn()} />,
      {
        initialAppData: createMockAppData({
          settings: createMockSettings({ theme: 'cockpit' }),
          items: [
            { ...water, location: 'Garage' },
            { ...emptySoup, location: 'Pantry' },
          ],
          customCategories: [],
        }),
      },
    );
    await screen.findByText('Bottled water');

    fireEvent.change(
      screen.getByLabelText('v2.inventory.locationAria.cockpit'),
      { target: { value: 'Garage' } },
    );

    expect(screen.getByText('Bottled water')).toBeInTheDocument();
    expect(screen.queryByText('Canned soup')).not.toBeInTheDocument();
  });

  it('the EXP filter keeps only what expires soon', async () => {
    const soon = new Date();
    soon.setDate(soon.getDate() + 5);
    renderWithProviders(
      <MobileInventory onItemSelect={vi.fn()} onAddItem={vi.fn()} />,
      {
        initialAppData: createMockAppData({
          settings: createMockSettings({ theme: 'cockpit' }),
          items: [
            water,
            {
              ...emptySoup,
              neverExpires: false,
              expirationDate: soon.toISOString().slice(0, 10) as DateOnly,
            },
          ],
          customCategories: [],
        }),
      },
    );
    await screen.findByText('Bottled water');

    fireEvent.click(
      screen.getByRole('button', {
        name: 'v2.inventory.filterExpShort.cockpit',
      }),
    );

    expect(screen.getByText('Canned soup')).toBeInTheDocument();
    // Never-expiring stock has no date to be near, so it drops out entirely.
    expect(screen.queryByText('Bottled water')).not.toBeInTheDocument();
  });

  it('shows the empty state when a search matches nothing', async () => {
    renderWithItems();
    await screen.findByText('Bottled water');

    fireEvent.change(
      screen.getByPlaceholderText('v2.inventory.searchPlaceholder.cockpit'),
      { target: { value: 'zzzz' } },
    );

    expect(screen.queryByText('Canned soup')).not.toBeInTheDocument();
    expect(screen.queryByText('Bottled water')).not.toBeInTheDocument();
  });

  describe('remove empty items', () => {
    it('hides the button when nothing has 0 quantity', async () => {
      renderWithProviders(
        <MobileInventory onItemSelect={vi.fn()} onAddItem={vi.fn()} />,
        {
          initialAppData: createMockAppData({
            settings: createMockSettings({ theme: 'cockpit' }),
            items: [water],
            customCategories: [],
          }),
        },
      );
      await screen.findByText('Bottled water');
      expect(
        screen.queryByRole('button', {
          name: 'v2.inventory.removeEmptyItems.cockpit',
        }),
      ).not.toBeInTheDocument();
    });

    it('shows a confirmation dialog and removes 0-quantity items when confirmed', async () => {
      renderWithItems();
      await screen.findByText('Canned soup');

      fireEvent.click(
        screen.getByRole('button', {
          name: 'v2.inventory.removeEmptyItems.cockpit',
        }),
      );
      expect(
        screen.getByText('v2.inventory.confirmRemoveEmpty.cockpit'),
      ).toBeInTheDocument();

      fireEvent.click(
        screen.getByRole('button', { name: 'v2.voice.delete.cockpit' }),
      );

      expect(screen.queryByText('Canned soup')).not.toBeInTheDocument();
      expect(screen.getByText('Bottled water')).toBeInTheDocument();
      expect(
        screen.queryByRole('button', {
          name: 'v2.inventory.removeEmptyItems.cockpit',
        }),
      ).not.toBeInTheDocument();
    });

    it('keeps 0-quantity items when the dialog is cancelled', async () => {
      renderWithItems();
      await screen.findByText('Canned soup');

      fireEvent.click(
        screen.getByRole('button', {
          name: 'v2.inventory.removeEmptyItems.cockpit',
        }),
      );
      fireEvent.click(
        screen.getByRole('button', { name: 'v2.voice.cancel.cockpit' }),
      );

      expect(screen.getByText('Canned soup')).toBeInTheDocument();
    });

    it('only removes 0-quantity items in the selected category', async () => {
      const emptyWater = createMockInventoryItem({
        name: 'Empty water',
        itemType: createProductTemplateId('bottled-water'),
        categoryId: createCategoryId('water-beverages'),
        quantity: createQuantity(0),
        unit: 'liters',
        neverExpires: true,
      });
      renderWithProviders(
        <MobileInventory onItemSelect={vi.fn()} onAddItem={vi.fn()} />,
        {
          initialAppData: createMockAppData({
            settings: createMockSettings({ theme: 'cockpit' }),
            items: [emptyWater, emptySoup],
            customCategories: [],
          }),
        },
      );
      await screen.findByText('Empty water');

      fireEvent.change(screen.getByTestId('v2-category-select'), {
        target: { value: 'food' },
      });
      fireEvent.click(
        await screen.findByRole('button', {
          name: 'v2.inventory.removeEmptyItems.cockpit',
        }),
      );
      fireEvent.click(
        screen.getByRole('button', { name: 'v2.voice.delete.cockpit' }),
      );

      expect(screen.queryByText('Canned soup')).not.toBeInTheDocument();

      fireEvent.change(screen.getByTestId('v2-category-select'), {
        target: { value: '' },
      });
      expect(await screen.findByText('Empty water')).toBeInTheDocument();
    });
  });
});
