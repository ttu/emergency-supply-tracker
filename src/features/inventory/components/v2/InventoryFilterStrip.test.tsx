import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { InventoryFilterStrip } from './InventoryFilterStrip';
import { renderWithProviders } from '@/test/render';
import {
  createMockCategory,
  createMockSettings,
} from '@/shared/utils/test/factories';

const baseCounts = { all: 12, crit: 2, warn: 3, ok: 7, exp: 1, missing: 4 };
const cats = [
  createMockCategory({ name: 'Water' }),
  createMockCategory({ name: 'Food' }),
];

const renderStrip = (
  overrides: Partial<Parameters<typeof InventoryFilterStrip>[0]> = {},
) =>
  renderWithProviders(
    <InventoryFilterStrip
      filter="all"
      onFilterChange={vi.fn()}
      counts={baseCounts}
      onCategoryChange={vi.fn()}
      categories={cats}
      search=""
      onSearchChange={vi.fn()}
      {...overrides}
    />,
    { initialAppData: { settings: createMockSettings({ theme: 'cockpit' }) } },
  );

describe('InventoryFilterStrip (v2)', () => {
  it('renders status chip labels with counts (cockpit theme)', () => {
    renderStrip();
    expect(
      screen.getByRole('button', {
        name: /^v2\.inventory\.filterAll\.cockpit\s+12$/,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: /^v2\.voice\.statusCrit\.cockpit\s+2$/,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: /^v2\.voice\.statusWarn\.cockpit\s+3$/,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: /^v2\.voice\.statusOk\.cockpit\s+7$/,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: /^v2\.inventory\.filterExp\.cockpit\s+1$/,
      }),
    ).toBeInTheDocument();
  });

  it('invokes onFilterChange when a status chip is clicked', () => {
    const onFilterChange = vi.fn();
    renderStrip({ onFilterChange });
    fireEvent.click(
      screen.getByRole('button', {
        name: /^v2\.voice\.statusCrit\.cockpit\s+2$/,
      }),
    );
    expect(onFilterChange).toHaveBeenCalledWith('crit');
  });

  it('renders categories in the dropdown and forwards changes', () => {
    const onCategoryChange = vi.fn();
    renderStrip({ onCategoryChange });
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(
      screen.getByRole('option', {
        name: 'v2.inventory.allCategories.cockpit',
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Water' })).toBeInTheDocument();
    fireEvent.change(select, { target: { value: String(cats[0].id) } });
    expect(onCategoryChange).toHaveBeenCalledWith(String(cats[0].id));
  });

  it('clearing the category sends undefined', () => {
    const onCategoryChange = vi.fn();
    renderStrip({ selectedCategoryId: String(cats[0].id), onCategoryChange });
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: '' } });
    expect(onCategoryChange).toHaveBeenCalledWith(undefined);
  });

  it('forwards search input changes', () => {
    const onSearchChange = vi.fn();
    renderStrip({ onSearchChange });
    fireEvent.change(screen.getByLabelText('v2.inventory.searchAria'), {
      target: { value: 'water' },
    });
    expect(onSearchChange).toHaveBeenCalledWith('water');
  });
});
