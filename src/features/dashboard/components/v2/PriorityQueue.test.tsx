import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { PriorityQueue } from './PriorityQueue';
import { renderWithProviders } from '@/test/render';
import {
  createMockAppData,
  createMockInventoryItem,
  createMockSettings,
} from '@/shared/utils/test/factories';
import { createCategoryId, createQuantity } from '@/shared/types';

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
  it('renders the priority queue caption in cockpit voice', async () => {
    setup([]);
    await waitFor(() => {
      expect(screen.getByText(/PRIORITY QUEUE/)).toBeInTheDocument();
    });
  });

  it('clicking VIEW ALL → invokes onViewAll', async () => {
    const onViewAll = vi.fn();
    setup([], onViewAll);
    await waitFor(() => screen.getByRole('button', { name: /VIEW ALL/ }));
    fireEvent.click(screen.getByRole('button', { name: /VIEW ALL/ }));
    expect(onViewAll).toHaveBeenCalled();
  });

  it('renders the empty-state copy when nothing is non-OK', async () => {
    setup([]);
    await waitFor(() => {
      expect(screen.getByText(/NOMINAL · NO ACTION ITEMS/)).toBeInTheDocument();
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
});
