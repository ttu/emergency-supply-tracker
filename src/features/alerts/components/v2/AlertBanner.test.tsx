import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { AlertBanner } from './AlertBanner';
import { renderWithProviders } from '@/test/render';
import {
  createMockAppData,
  createMockInventoryItem,
  createMockSettings,
} from '@/shared/utils/test/factories';
import {
  createCategoryId,
  createDateOnly,
  createQuantity,
} from '@/shared/types';

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

/**
 * Expiry outranks quantity in getItemStatus, and the factory hands out a
 * future expiry half the time. When one lands inside the expiring-soon window
 * an empty item raises a warning instead of a critical alert, changing which
 * alerts appear at all.
 */
const NO_EXPIRY = { neverExpires: true, expirationDate: undefined } as const;

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
      ...NO_EXPIRY,
    }),
  );

const missingWater = () =>
  createMockInventoryItem({
    name: 'Bottled water',
    categoryId: createCategoryId('water-beverages'),
    quantity: createQuantity(0),
    ...NO_EXPIRY,
  });

// Expiration alerts are the only kind that carry an itemId — the row is
// keyed off it, and the Resolve pill always targets it directly.
const expiredMeds = () =>
  createMockInventoryItem({
    name: 'Expired meds',
    categoryId: createCategoryId('medical-health'),
    quantity: createQuantity(2),
    neverExpires: false,
    expirationDate: createDateOnly('2020-01-01'),
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

      const toggle = screen.getByTestId('v2-alert-toggle');
      expect(toggle).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(toggle);
      const expanded = screen.getAllByTestId('v2-alert-row').length;
      expect(expanded).toBeGreaterThan(3);
      expect(toggle).toHaveAttribute('aria-expanded', 'true');

      fireEvent.click(toggle);
      expect(screen.getAllByTestId('v2-alert-row')).toHaveLength(3);
      expect(toggle).toHaveAttribute('aria-expanded', 'false');
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

  it('resolving an item-level alert invokes onItemSelect with its itemId', async () => {
    const item = expiredMeds();
    const onItemSelect = vi.fn();
    setup([item], onItemSelect);
    expect(await screen.findByTestId('v2-alert-banner')).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: 'v2.voice.resolveAction.cockpit' }),
    );

    expect(onItemSelect).toHaveBeenCalledWith(String(item.id));
  });

  it('the message action on an item-level alert routes to its category, not the item', async () => {
    // The row's message click and the Resolve pill are deliberately
    // different actions: the message opens the broader category context,
    // the pill jumps straight to the item that needs fixing.
    const item = expiredMeds();
    const onItemSelect = vi.fn();
    const onCategorySelect = vi.fn();
    setup([item], onItemSelect, onCategorySelect);
    expect(await screen.findByTestId('v2-alert-banner')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Expired meds/ }));

    expect(onCategorySelect).toHaveBeenCalledWith('medical-health');
    expect(onItemSelect).not.toHaveBeenCalled();
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
