import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { PriorityQueue } from './PriorityQueue';
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

const setup = (
  items: ReturnType<typeof createMockInventoryItem>[],
  onViewAll = vi.fn(),
) =>
  renderWithProviders(<PriorityQueue onViewAll={onViewAll} />, {
    initialAppData: createMockAppData({
      settings: createMockSettings({ theme: 'cockpit' }),
      items,
    }),
  });

describe('PriorityQueue (v2)', () => {
  it('renders the priority queue caption in cockpit theme', async () => {
    setup([]);
    await waitFor(() => {
      expect(
        screen.getByText('v2.dashboard.priorityTitle.cockpit'),
      ).toBeInTheDocument();
    });
  });

  it('clicking view-all invokes onViewAll', async () => {
    const onViewAll = vi.fn();
    setup([], onViewAll);
    await screen.findByRole('button', { name: 'v2.dashboard.priorityViewAll' });
    fireEvent.click(
      screen.getByRole('button', { name: 'v2.dashboard.priorityViewAll' }),
    );
    expect(onViewAll).toHaveBeenCalled();
  });

  it('renders the empty-state copy when nothing is non-OK', async () => {
    setup([]);
    await waitFor(() => {
      expect(
        screen.getByText('v2.dashboard.priorityEmpty.cockpit'),
      ).toBeInTheDocument();
    });
  });

  it('lists non-OK items by name', async () => {
    setup([
      createMockInventoryItem({
        name: 'Bottled water',
        categoryId: createCategoryId('water-beverages'),
        quantity: createQuantity(0),
      }),
    ]);
    await waitFor(() => {
      expect(screen.getByText('Bottled water')).toBeInTheDocument();
    });
  });

  it('puts critical items above the merely low ones', async () => {
    setup([
      createMockInventoryItem({
        name: 'Low soup',
        itemType: createProductTemplateId('canned-soup'),
        categoryId: createCategoryId('food'),
        quantity: createQuantity(1),
        unit: 'cans',
        neverExpires: true,
      }),
      createMockInventoryItem({
        name: 'No water',
        itemType: createProductTemplateId('bottled-water'),
        categoryId: createCategoryId('water-beverages'),
        quantity: createQuantity(0),
        unit: 'liters',
        neverExpires: true,
      }),
    ]);

    // Listed after the low item, but it is the empty one that needs doing
    // first, so the queue must reorder them.
    const rows = await screen.findAllByText(/^(Low soup|No water)$/);
    expect(rows.map((n) => n.textContent)).toEqual(['No water', 'Low soup']);
  });
});
