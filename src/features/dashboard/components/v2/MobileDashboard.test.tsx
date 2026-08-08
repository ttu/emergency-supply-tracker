import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { MobileDashboard } from './MobileDashboard';
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
} from '@/shared/types';

const stocked = createMockInventoryItem({
  name: 'Bottled water',
  itemType: createProductTemplateId('bottled-water'),
  categoryId: createCategoryId('water-beverages'),
  quantity: createQuantity(20),
  unit: 'liters',
  neverExpires: true,
});
const missing = createMockInventoryItem({
  name: 'Canned soup',
  itemType: createProductTemplateId('canned-soup'),
  categoryId: createCategoryId('food'),
  quantity: createQuantity(0),
  unit: 'cans',
  neverExpires: true,
});

const setup = (
  items: ReturnType<typeof createMockInventoryItem>[] = [],
  props: {
    onCategorySelect?: () => void;
    onItemSelect?: () => void;
    onAddItem?: () => void;
    onViewInventory?: () => void;
    theme?: 'cockpit' | 'civil' | 'pantry';
  } = {},
) =>
  renderWithProviders(
    <MobileDashboard
      onCategorySelect={props.onCategorySelect ?? vi.fn()}
      onItemSelect={props.onItemSelect ?? vi.fn()}
      onAddItem={props.onAddItem ?? vi.fn()}
      onViewInventory={props.onViewInventory ?? vi.fn()}
    />,
    {
      initialAppData: createMockAppData({
        settings: createMockSettings({ theme: props.theme ?? 'cockpit' }),
        items,
        customCategories: [],
      }),
    },
  );

describe('MobileDashboard (v2)', () => {
  it('renders the readiness KPI under cockpit theme', () => {
    setup();
    expect(screen.getByText('v2.voice.readiness.cockpit')).toBeInTheDocument();
  });

  it('renders the expiring and critical tiles', () => {
    setup();
    expect(
      screen.getByText('v2.voice.expiringSoon.cockpit'),
    ).toBeInTheDocument();
    expect(screen.getByText('v2.voice.critical.cockpit')).toBeInTheDocument();
  });

  it('lists items needing attention in the priority panel', async () => {
    setup([stocked, missing]);
    expect(
      await screen.findByText('v2.dashboard.mobilePriority.cockpit'),
    ).toBeInTheDocument();
    expect(screen.getByText('Canned soup')).toBeInTheDocument();
  });

  it('renders the coverage grid and reports a tapped category', async () => {
    const onCategorySelect = vi.fn();
    setup([stocked, missing], { onCategorySelect });

    expect(
      await screen.findByText('v2.dashboard.mobileCoverage.cockpit'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByText('Water & Beverages'));
    expect(onCategorySelect).toHaveBeenCalledWith('water-beverages');
  });

  it('surfaces the alert banner above the KPIs', async () => {
    setup([missing]);
    expect(await screen.findByTestId('v2-alert-banner')).toBeInTheDocument();
  });

  it('speaks the civil headline under the civil theme', () => {
    setup([], { theme: 'civil' });
    expect(
      screen.getByText('v2.dashboard.mobileHeadlineCivil'),
    ).toBeInTheDocument();
  });

  it('an empty pantry is told it needs attention, not that it is ready', () => {
    setup([], { theme: 'pantry' });
    expect(
      screen.getByText('v2.dashboard.mobileHeadlinePantryAttention'),
    ).toBeInTheDocument();
  });

  describe('quick actions', () => {
    it('clicking + ADD calls onAddItem', () => {
      const onAddItem = vi.fn();
      setup([], { onAddItem });
      fireEvent.click(
        screen.getByRole('button', { name: 'v2.voice.addItem.cockpit' }),
      );
      expect(onAddItem).toHaveBeenCalled();
    });

    it('clicking VIEW INVENTORY calls onViewInventory', () => {
      const onViewInventory = vi.fn();
      setup([], { onViewInventory });
      fireEvent.click(
        screen.getByRole('button', {
          name: 'v2.dashboard.quickViewInventory.cockpit',
        }),
      );
      expect(onViewInventory).toHaveBeenCalled();
    });

    it('disables EXPORT SHOPPING LIST when nothing needs restocking', () => {
      setup([]);
      const button = screen.getByRole('button', {
        name: 'v2.dashboard.quickExportShoppingList.cockpit',
      });
      expect(button).toBeDisabled();
    });
  });
});
