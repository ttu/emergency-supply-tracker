import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { ItemTotalsPanel } from './ItemTotalsPanel';
import { renderWithProviders } from '@/test/render';
import {
  createMockInventoryItem,
  createMockSettings,
} from '@/shared/utils/test/factories';
import { createQuantity } from '@/shared/types';

const renderPanel = (
  item: Parameters<typeof createMockInventoryItem>[0] = {},
) =>
  renderWithProviders(
    <ItemTotalsPanel item={createMockInventoryItem(item)} />,
    { initialAppData: { settings: createMockSettings({ theme: 'cockpit' }) } },
  );

describe('ItemTotalsPanel (v2)', () => {
  it('renders nothing when item has no per-unit nutrition/energy data', () => {
    renderPanel({
      quantity: createQuantity(3),
      caloriesPerUnit: undefined,
      weightGrams: undefined,
      requiresWaterLiters: undefined,
      capacityWh: undefined,
    });
    expect(
      screen.queryByText('v2.itemDetail.totalsCaption.cockpit'),
    ).not.toBeInTheDocument();
  });

  it('shows total kcal multiplied by quantity', () => {
    renderPanel({ quantity: createQuantity(4), caloriesPerUnit: 250 });
    expect(
      screen.getByText('v2.itemDetail.totalsCaption.cockpit'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('v2.itemDetail.totalsKcal.cockpit'),
    ).toBeInTheDocument();
    // Locale separator can be comma, period, NBSP, narrow-NBSP, or none.
    expect(screen.getByText(/1\D?000/)).toBeInTheDocument();
  });

  it('renders weight total in grams when below 1kg', () => {
    renderPanel({ quantity: createQuantity(3), weightGrams: 200 });
    // 200 × 3 = 600 g
    expect(screen.getByText('600')).toBeInTheDocument();
    expect(
      screen.getByText('v2.itemDetail.totalsWeight.cockpit'),
    ).toBeInTheDocument();
  });

  it('renders weight total in kilograms when at or above 1kg', () => {
    renderPanel({ quantity: createQuantity(3), weightGrams: 500 });
    // 500 × 3 = 1500 g → 1.5 kg
    expect(screen.getByText('1.5')).toBeInTheDocument();
  });

  it('renders capacity total in Wh', () => {
    renderPanel({ quantity: createQuantity(2), capacityWh: 10000 });
    expect(
      screen.getByText('v2.itemDetail.totalsCapacity.cockpit'),
    ).toBeInTheDocument();
    expect(screen.getByText(/20\D?000/)).toBeInTheDocument();
  });
});
