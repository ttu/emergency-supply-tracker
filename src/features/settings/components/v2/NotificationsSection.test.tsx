import { describe, it, expect } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { NotificationsSection } from './NotificationsSection';
import { renderWithProviders } from '@/test/render';
import {
  createMockAppData,
  createMockInventoryItem,
  createMockSettings,
} from '@/shared/utils/test/factories';
import {
  createAlertId,
  createCategoryId,
  createQuantity,
} from '@/shared/types';

describe('NotificationsSection (v2)', () => {
  it('renders the §6 NOTIFICATIONS header', () => {
    renderWithProviders(<NotificationsSection />, {
      initialAppData: createMockAppData({
        settings: createMockSettings({ theme: 'cockpit' }),
      }),
    });
    expect(screen.getByText('§6')).toBeInTheDocument();
    expect(
      screen.getByText('v2.settings.notifications.title.cockpit'),
    ).toBeInTheDocument();
  });

  describe('hidden alerts', () => {
    // An empty water-beverages item deterministically raises
    // "category-out-of-stock-water-beverages" (alerts.ts: all-zero-quantity
    // items in a non-food category are out of stock, not just low).
    const outOfStockWater = () =>
      createMockInventoryItem({
        name: 'Bottled water',
        categoryId: createCategoryId('water-beverages'),
        quantity: createQuantity(0),
        neverExpires: true,
      });
    const waterAlertId = createAlertId('category-out-of-stock-water-beverages');

    it('reports zero hidden alerts when nothing has been dismissed', () => {
      renderWithProviders(<NotificationsSection />, {
        initialAppData: createMockAppData({
          settings: createMockSettings({ theme: 'cockpit' }),
          items: [outOfStockWater()],
          dismissedAlertIds: [],
        }),
      });

      expect(
        screen.getByText('v2.settings.notifications.hiddenNone.cockpit'),
      ).toBeInTheDocument();
      expect(
        screen.queryByText('v2.settings.notifications.restoreSingle.cockpit'),
      ).not.toBeInTheDocument();
    });

    it('reactivateAlert restores the one dismissed alert', () => {
      renderWithProviders(<NotificationsSection />, {
        initialAppData: createMockAppData({
          settings: createMockSettings({ theme: 'cockpit' }),
          items: [outOfStockWater()],
          dismissedAlertIds: [waterAlertId],
        }),
      });

      expect(
        screen.getByText('v2.settings.notifications.hiddenCount.cockpit'),
      ).toBeInTheDocument();

      fireEvent.click(
        screen.getByRole('button', {
          name: 'v2.settings.notifications.restoreSingle.cockpit',
        }),
      );

      expect(
        screen.getByText('v2.settings.notifications.hiddenNone.cockpit'),
      ).toBeInTheDocument();
      expect(
        screen.queryByText('v2.settings.notifications.restoreSingle.cockpit'),
      ).not.toBeInTheDocument();
    });

    it('reactivateAllAlerts restores every dismissed alert', () => {
      const medsAlertId = createAlertId('category-out-of-stock-medical-health');
      renderWithProviders(<NotificationsSection />, {
        initialAppData: createMockAppData({
          settings: createMockSettings({ theme: 'cockpit' }),
          items: [
            outOfStockWater(),
            createMockInventoryItem({
              name: 'Bandages',
              categoryId: createCategoryId('medical-health'),
              quantity: createQuantity(0),
              neverExpires: true,
            }),
          ],
          dismissedAlertIds: [waterAlertId, medsAlertId],
        }),
      });

      expect(
        screen.getAllByRole('button', {
          name: 'v2.settings.notifications.restoreSingle.cockpit',
        }),
      ).toHaveLength(2);

      fireEvent.click(
        screen.getByRole('button', {
          name: 'v2.settings.notifications.restoreAll.cockpit',
        }),
      );

      expect(
        screen.getByText('v2.settings.notifications.hiddenNone.cockpit'),
      ).toBeInTheDocument();
      expect(
        screen.queryByText('v2.settings.notifications.restoreSingle.cockpit'),
      ).not.toBeInTheDocument();
    });
  });
});
