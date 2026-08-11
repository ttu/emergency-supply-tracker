import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { InventoryFilterStrip } from './InventoryFilterStrip';
import { renderWithProviders } from '@/test/render';
import { createMockSettings } from '@/shared/utils/test/factories';

const baseCounts = { all: 12, crit: 2, warn: 3, ok: 7, exp: 1, missing: 4 };

const renderStrip = (
  overrides: Partial<Parameters<typeof InventoryFilterStrip>[0]> = {},
) =>
  renderWithProviders(
    <InventoryFilterStrip
      filter="all"
      onFilterChange={vi.fn()}
      counts={baseCounts}
      search=""
      onSearchChange={vi.fn()}
      locationFilter="all"
      onLocationFilterChange={vi.fn()}
      locations={['Pantry', 'Garage']}
      sortBy="name"
      onSortByChange={vi.fn()}
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

  it('forwards search input changes', () => {
    const onSearchChange = vi.fn();
    renderStrip({ onSearchChange });
    fireEvent.change(screen.getByLabelText('v2.inventory.searchAria'), {
      target: { value: 'water' },
    });
    expect(onSearchChange).toHaveBeenCalledWith('water');
  });

  it('keeps the location select visible so a stale filter can still be cleared', () => {
    // No suggestions left (e.g. the last item at that location was deleted),
    // but a location filter is still active — it must stay clearable.
    renderStrip({ locations: [], locationFilter: 'Pantry' });
    expect(
      screen.getByLabelText('v2.inventory.locationAria.cockpit'),
    ).toBeInTheDocument();
  });

  it('hides the location select when there are no locations and no active filter', () => {
    renderStrip({ locations: [], locationFilter: undefined });
    expect(
      screen.queryByLabelText('v2.inventory.locationAria.cockpit'),
    ).not.toBeInTheDocument();
  });
});
