import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { CategorySummaryPanel } from './CategorySummaryPanel';
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

const household = {
  adults: 2,
  children: 0,
  pets: 0,
  supplyDurationDays: 3,
  useFreezer: false,
};

const setup = (
  categoryId: string,
  items: ReturnType<typeof createMockInventoryItem>[] = [],
) =>
  renderWithProviders(<CategorySummaryPanel categoryId={categoryId} />, {
    initialAppData: createMockAppData({
      settings: createMockSettings({ theme: 'cockpit', language: 'en' }),
      household,
      items,
      customCategories: [],
    }),
  });

const someWater = () =>
  createMockInventoryItem({
    name: 'Bottled water',
    itemType: createProductTemplateId('bottled-water'),
    categoryId: createCategoryId('water-beverages'),
    quantity: createQuantity(4),
    unit: 'liters',
    neverExpires: true,
  });

describe('CategorySummaryPanel (v2)', () => {
  // The category name and status pill live in CategoryStatusStrip, directly
  // above this panel — repeating them here would state the same two facts
  // twice in a row.
  it('leaves naming the category to the strip above it', async () => {
    setup('water-beverages', [someWater()]);
    await screen.findByText('v2.inventory.totalRequired.cockpit');
    expect(screen.queryByText('Water & Beverages')).not.toBeInTheDocument();
  });

  it('shows how much is required in total', async () => {
    setup('water-beverages', [someWater()]);
    expect(
      await screen.findByText('v2.inventory.totalRequired.cockpit'),
    ).toBeInTheDocument();
  });

  it('breaks water down into what it is needed for', async () => {
    setup('water-beverages', [someWater()]);
    expect(
      await screen.findByText('v2.inventory.waterDrinking.cockpit'),
    ).toBeInTheDocument();
    // Preparation water is only tracked under the advanced water setting, so
    // its row stays out of the way when it is zero.
    expect(
      screen.queryByText('v2.inventory.waterPreparation.cockpit'),
    ).not.toBeInTheDocument();
  });

  it('does not split non-water categories', async () => {
    setup('food');
    await screen.findByText('v2.inventory.totalRequired.cockpit');
    expect(
      screen.queryByText('v2.inventory.waterDrinking.cockpit'),
    ).not.toBeInTheDocument();
  });

  // Per-item shortfalls belong to CategoryRecommendedPanel below, where each
  // comes with the actions that clear it. Listing them here as well would
  // state the same gap twice, once actionable and once not.
  it('leaves the per-item shortfalls to the recommended panel', async () => {
    setup('food');
    await screen.findByText('v2.inventory.totalRequired.cockpit');
    expect(
      screen.queryByText('v2.inventory.shortBy.cockpit'),
    ).not.toBeInTheDocument();
  });

  it('renders nothing for a category with no recommendations', () => {
    setup('made-up-category');
    // The providers wrap the tree, so assert the panel's own content is
    // absent rather than that the container is empty.
    expect(
      screen.queryByText('v2.inventory.totalRequired.cockpit'),
    ).not.toBeInTheDocument();
  });
});
