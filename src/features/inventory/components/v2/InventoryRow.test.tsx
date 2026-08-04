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

const renderRow = (row: DesignItemRow, onSelect = vi.fn()) =>
  renderWithProviders(
    <InventoryRow
      row={row}
      cellStyles={{}}
      isLast={false}
      onSelect={onSelect}
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

  it('calls onSelect with item id when clicked', () => {
    const onSelect = vi.fn();
    const row = makeRow();
    renderRow(row, onSelect);
    fireEvent.click(screen.getByRole('button'));
    expect(onSelect).toHaveBeenCalledWith(String(row.item.id));
  });
});
