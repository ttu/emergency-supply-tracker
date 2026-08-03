import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { AlertBanner } from './AlertBanner';
import { renderWithProviders } from '@/test/render';
import {
  createMockAppData,
  createMockInventoryItem,
  createMockSettings,
} from '@/shared/utils/test/factories';
import { createCategoryId, createQuantity } from '@/shared/types';

const setup = (
  items: ReturnType<typeof createMockInventoryItem>[],
  onItemSelect = vi.fn(),
  onCategorySelect = vi.fn(),
) =>
  renderWithProviders(
    <AlertBanner
      onItemSelect={onItemSelect}
      onCategorySelect={onCategorySelect}
    />,
    {
      initialAppData: createMockAppData({
        settings: createMockSettings({ theme: 'cockpit' }),
        items,
        // Random custom categories raise alerts of their own. Past the
        // collapsed row limit, dismissing one only promotes the next, and the
        // visible count stops describing what was dismissed.
        customCategories: [],
      }),
    },
  );

const manyAlertItems = () =>
  [
    'water-beverages',
    'food',
    'light-power',
    'medical-health',
    'hygiene-sanitation',
  ].map((category, i) =>
    createMockInventoryItem({
      name: `Empty item ${i}`,
      categoryId: createCategoryId(category),
      quantity: createQuantity(0),
    }),
  );

const missingWater = () =>
  createMockInventoryItem({
    name: 'Bottled water',
    categoryId: createCategoryId('water-beverages'),
    quantity: createQuantity(0),
  });

describe('AlertBanner (v2)', () => {
  // The banner sits above the dashboard KPIs, so it must not grow without
  // bound — a stocked household easily produces a dozen alerts.
  describe('collapsing', () => {
    // Each under-stocked category raises its own "critically low" alert, so a
    // handful of empty categories pushes us past the visible limit.
    const manyAlerts = () => manyAlertItems();
    it('caps visible rows and offers to show the rest', async () => {
      setup(manyAlerts());
      expect(await screen.findByTestId('v2-alert-banner')).toBeInTheDocument();

      expect(screen.getAllByTestId('v2-alert-row')).toHaveLength(3);
      expect(screen.getByTestId('v2-alert-toggle')).toBeInTheDocument();
    });

    it('reveals every alert when expanded, and re-collapses', async () => {
      setup(manyAlerts());
      expect(await screen.findByTestId('v2-alert-banner')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('v2-alert-toggle'));
      const expanded = screen.getAllByTestId('v2-alert-row').length;
      expect(expanded).toBeGreaterThan(3);

      fireEvent.click(screen.getByTestId('v2-alert-toggle'));
      expect(screen.getAllByTestId('v2-alert-row')).toHaveLength(3);
    });

    it('shows no toggle when everything already fits', async () => {
      setup([]);
      expect(await screen.findByTestId('v2-alert-banner')).toBeInTheDocument();

      // Dismiss down to under the limit.
      while (screen.getAllByTestId('v2-alert-row').length > 2) {
        fireEvent.click(
          screen.getAllByRole('button', {
            name: 'v2.alerts.dismiss.cockpit',
          })[0],
        );
      }

      expect(screen.queryByTestId('v2-alert-toggle')).not.toBeInTheDocument();
    });
  });

  it('renders nothing once every active alert has been dismissed', async () => {
    setup([]);
    expect(await screen.findByTestId('v2-alert-banner')).toBeInTheDocument();

    for (const button of screen.getAllByRole('button', {
      name: 'v2.alerts.dismiss.cockpit',
    })) {
      fireEvent.click(button);
    }

    await waitFor(() => {
      expect(screen.queryByTestId('v2-alert-banner')).not.toBeInTheDocument();
    });
  });

  it('renders a row per active alert', async () => {
    setup([missingWater()]);
    expect(await screen.findByTestId('v2-alert-banner')).toBeInTheDocument();
    expect(screen.getAllByTestId('v2-alert-row').length).toBeGreaterThan(0);
  });

  it('dismisses an alert when its dismiss control is clicked', async () => {
    setup([missingWater()]);
    expect(await screen.findByTestId('v2-alert-banner')).toBeInTheDocument();
    const rowsBefore = screen.getAllByTestId('v2-alert-row').length;

    fireEvent.click(
      screen.getAllByRole('button', { name: 'v2.alerts.dismiss.cockpit' })[0],
    );

    await waitFor(() => {
      expect(screen.queryAllByTestId('v2-alert-row')).toHaveLength(
        rowsBefore - 1,
      );
    });
  });

  it('invokes onCategorySelect when a category alert row is activated', async () => {
    const onCategorySelect = vi.fn();
    setup([missingWater()], vi.fn(), onCategorySelect);
    expect(await screen.findByTestId('v2-alert-banner')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /water-beverages/ }));

    expect(onCategorySelect).toHaveBeenCalledWith('water-beverages');
  });

  it('dismisses every alert at once', async () => {
    setup(manyAlertItems());
    expect(await screen.findByTestId('v2-alert-banner')).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: 'v2.alerts.dismissAll.cockpit' }),
    );

    await waitFor(() => {
      expect(screen.queryByTestId('v2-alert-banner')).not.toBeInTheDocument();
    });
  });
});
