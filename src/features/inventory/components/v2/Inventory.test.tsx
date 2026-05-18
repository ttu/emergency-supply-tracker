import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { Inventory } from './Inventory';
import { renderWithProviders } from '@/test/render';
import {
  createMockAppData,
  createMockInventoryItem,
  createMockSettings,
} from '@/shared/utils/test/factories';
import { createCategoryId, createQuantity } from '@/shared/types';

const WATER_ID = createCategoryId('water-beverages');
const FOOD_ID = createCategoryId('food');

const setup = () => {
  const items = [
    createMockInventoryItem({
      name: 'Bottled water',
      categoryId: WATER_ID,
      quantity: createQuantity(0),
    }),
    createMockInventoryItem({
      name: 'Canned beans',
      categoryId: FOOD_ID,
      quantity: createQuantity(20),
    }),
  ];
  return renderWithProviders(
    <Inventory
      onCategoryChange={vi.fn()}
      onItemSelect={vi.fn()}
      onAddItem={vi.fn()}
    />,
    {
      initialAppData: createMockAppData({
        settings: createMockSettings({ theme: 'cockpit', language: 'en' }),
        items,
      }),
    },
  );
};

describe('Inventory (v2)', () => {
  it('renders inventory title with cockpit voice and ADD button', async () => {
    setup();
    await waitFor(() => {
      expect(
        screen.getByText('v2.inventory.title.cockpit'),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByRole('button', { name: 'v2.voice.addItem.cockpit' }),
    ).toBeInTheDocument();
  });

  it('renders every item in the inventory by default', async () => {
    setup();
    await waitFor(() => {
      expect(screen.getByText('Bottled water')).toBeInTheDocument();
    });
    expect(screen.getByText('Canned beans')).toBeInTheDocument();
  });

  it('filters down to a single status when a chip is clicked', async () => {
    setup();
    await waitFor(() => {
      expect(screen.getByText('Bottled water')).toBeInTheDocument();
    });
    // Match the chip ("CRIT <count>"), not StatusPills inside rows.
    fireEvent.click(
      screen.getByRole('button', {
        name: /^v2\.voice\.statusCrit\.cockpit\s+\d+$/,
      }),
    );
    await waitFor(() => {
      expect(screen.queryByText('Canned beans')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Bottled water')).toBeInTheDocument();
  });

  it('search input narrows the visible rows', async () => {
    setup();
    await waitFor(() => {
      expect(screen.getByText('Bottled water')).toBeInTheDocument();
    });
    fireEvent.change(screen.getByLabelText('v2.inventory.searchAria'), {
      target: { value: 'water' },
    });
    await waitFor(() => {
      expect(screen.queryByText('Canned beans')).not.toBeInTheDocument();
    });
  });

  it('clicking ADD button calls onAddItem', async () => {
    const onAddItem = vi.fn();
    renderWithProviders(
      <Inventory
        onCategoryChange={vi.fn()}
        onItemSelect={vi.fn()}
        onAddItem={onAddItem}
      />,
      {
        initialAppData: createMockAppData({
          settings: createMockSettings({ theme: 'cockpit' }),
        }),
      },
    );
    await waitFor(() =>
      screen.getByRole('button', { name: 'v2.voice.addItem.cockpit' }),
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'v2.voice.addItem.cockpit' }),
    );
    expect(onAddItem).toHaveBeenCalled();
  });
});
