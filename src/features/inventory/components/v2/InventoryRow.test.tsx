import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { InventoryRow } from './InventoryRow';
import { renderWithProviders } from '@/test/render';
import type { DesignItemRow } from '@/shared/hooks/useDesignData';
import {
  createMockInventoryItem,
  createMockCategory,
  createMockSettings,
} from '@/shared/utils/test/factories';
import { createDateOnly, createItemId, createQuantity } from '@/shared/types';

const renderRow = (
  row: DesignItemRow,
  onSelect = vi.fn(),
  onQuantityChange = vi.fn(),
) =>
  renderWithProviders(
    <InventoryRow
      row={row}
      cellStyles={{}}
      isLast={false}
      onSelect={onSelect}
      onQuantityChange={onQuantityChange}
    />,
    {
      providers: {
        settings: true,
        household: false,
        recommendedItems: false,
        inventory: false,
      },
      initialAppData: { settings: createMockSettings({ theme: 'cockpit' }) },
    },
  );

const makeRow = (overrides?: Partial<DesignItemRow>): DesignItemRow => {
  const item = createMockInventoryItem({
    name: 'Bottled water',
    quantity: createQuantity(3),
    location: 'Pantry',
    expirationDate: createDateOnly('2027-01-01'),
    // The row prints a short id, and the factory's random uuid can contain the
    // recommended quantity as a substring — which made the assertion below
    // match two elements on unlucky faker seeds.
    id: createItemId('itm-fixed'),
  });
  return {
    item,
    recommended: 10,
    category: createMockCategory({ name: 'Water' }),
    categoryCode: 'H2O',
    status: 'warn',
    ...overrides,
  };
};

describe('InventoryRow (v2)', () => {
  it('renders item name, quantity/recommended, category code, expiration and location', () => {
    renderRow(makeRow());
    expect(screen.getByText('Bottled water')).toBeInTheDocument();
    expect(screen.getByText('H2O')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('/ 10')).toBeInTheDocument();
    expect(screen.getByText('2027-01-01')).toBeInTheDocument();
    expect(screen.getByText('Pantry')).toBeInTheDocument();
  });

  it('shows em-dash when no recommended quantity', () => {
    renderRow(makeRow({ recommended: 0 }));
    // " / —" is rendered as a single text node alongside the quantity.
    expect(screen.getByText(/\/\s*—/)).toBeInTheDocument();
  });

  it('shows em-dashes for missing expiration and location', () => {
    const row = makeRow({
      item: createMockInventoryItem({
        name: 'Salt',
        location: undefined,
        expirationDate: undefined,
        neverExpires: true,
      }),
    });
    renderRow(row);
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(2);
  });

  it('calls onSelect with item id when the row is clicked', () => {
    const onSelect = vi.fn();
    const row = makeRow();
    renderRow(row, onSelect);
    fireEvent.click(screen.getByText(row.item.name));
    expect(onSelect).toHaveBeenCalledWith(String(row.item.id));
  });

  it('activates onSelect on Enter/Space when the row itself is focused', () => {
    const onSelect = vi.fn();
    const row = makeRow();
    renderRow(row, onSelect);
    const rowEl = screen.getByTestId(`v2-inventory-row-${row.item.id}`);
    fireEvent.keyDown(rowEl, { key: 'Enter' });
    expect(onSelect).toHaveBeenCalledWith(String(row.item.id));
  });

  describe('inline quantity stepper', () => {
    it('renders decrease/increase controls for the row quantity', () => {
      renderRow(makeRow());
      expect(
        screen.getByRole('button', { name: 'v2.itemDetail.opsDecreaseAria' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'v2.itemDetail.opsIncreaseAria' }),
      ).toBeInTheDocument();
    });

    it('clicking increase calls onQuantityChange with quantity + 1, not onSelect', () => {
      const onSelect = vi.fn();
      const onQuantityChange = vi.fn();
      const row = makeRow();
      renderRow(row, onSelect, onQuantityChange);

      fireEvent.click(
        screen.getByRole('button', { name: 'v2.itemDetail.opsIncreaseAria' }),
      );

      expect(onQuantityChange).toHaveBeenCalledWith(String(row.item.id), 4);
      expect(onSelect).not.toHaveBeenCalled();
    });

    it('clicking decrease calls onQuantityChange with quantity - 1, not onSelect', () => {
      const onSelect = vi.fn();
      const onQuantityChange = vi.fn();
      const row = makeRow();
      renderRow(row, onSelect, onQuantityChange);

      fireEvent.click(
        screen.getByRole('button', { name: 'v2.itemDetail.opsDecreaseAria' }),
      );

      expect(onQuantityChange).toHaveBeenCalledWith(String(row.item.id), 2);
      expect(onSelect).not.toHaveBeenCalled();
    });

    it('disables decrease at zero quantity and never goes negative', () => {
      const row = makeRow({
        item: createMockInventoryItem({
          name: 'Empty item',
          quantity: createQuantity(0),
        }),
      });
      renderRow(row);
      expect(
        screen.getByRole('button', { name: 'v2.itemDetail.opsDecreaseAria' }),
      ).toBeDisabled();
    });
  });
});
