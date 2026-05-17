import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { ItemDetail, NEW_ITEM_ID } from './ItemDetail';
import { renderWithProviders } from '@/test/render';
import {
  createMockAppData,
  createMockInventoryItem,
  createMockSettings,
} from '@/shared/utils/test/factories';
import { createCategoryId, createItemId, createQuantity } from '@/shared/types';

const ITEM_ID = createItemId('item-1');

const renderDetail = (
  itemId: string = String(ITEM_ID),
  overrides: { defaultCategoryId?: string } = {},
) => {
  const item = createMockInventoryItem({
    id: ITEM_ID,
    name: 'Bottled water',
    categoryId: createCategoryId('water-beverages'),
    quantity: createQuantity(2),
  });
  return renderWithProviders(
    <ItemDetail itemId={itemId} onBack={vi.fn()} {...overrides} />,
    {
      initialAppData: createMockAppData({
        settings: createMockSettings({ theme: 'cockpit' }),
        items: [item],
      }),
    },
  );
};

describe('ItemDetail (v2)', () => {
  let confirmSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    confirmSpy = vi.spyOn(globalThis, 'confirm').mockReturnValue(true);
  });

  afterEach(() => {
    confirmSpy.mockRestore();
  });

  it('renders breadcrumb, header and side panels for an existing item', async () => {
    renderDetail();
    await waitFor(() => {
      expect(screen.getByText('Bottled water')).toBeInTheDocument();
    });
    expect(
      screen.getByRole('button', { name: /←\s*INVENTORY/ }),
    ).toBeInTheDocument();
    expect(screen.getByText('ITEM RECORD')).toBeInTheDocument();
    expect(screen.getByText('CURRENT STATUS')).toBeInTheDocument();
    expect(screen.getByText('OPS')).toBeInTheDocument();
  });

  it('renders NEW ITEM header and hides side panels in new-item mode', async () => {
    renderDetail(NEW_ITEM_ID, { defaultCategoryId: 'food' });
    await waitFor(() => {
      expect(screen.getByText('ADD ITEM')).toBeInTheDocument();
    });
    expect(screen.queryByText('CURRENT STATUS')).not.toBeInTheDocument();
    expect(screen.queryByText('OPS')).not.toBeInTheDocument();
  });

  it('shows "Item not found" fallback when itemId does not match', () => {
    renderWithProviders(<ItemDetail itemId="missing-id" onBack={vi.fn()} />, {
      initialAppData: createMockAppData({
        settings: createMockSettings({ theme: 'cockpit' }),
        items: [],
      }),
    });
    expect(screen.getByText(/Item not found/)).toBeInTheDocument();
  });

  it('clicking back from the not-found fallback calls onBack', () => {
    const onBack = vi.fn();
    renderWithProviders(<ItemDetail itemId="missing-id" onBack={onBack} />, {
      initialAppData: createMockAppData({
        settings: createMockSettings({ theme: 'cockpit' }),
        items: [],
      }),
    });
    fireEvent.click(screen.getByRole('button', { name: /←\s*Back/ }));
    expect(onBack).toHaveBeenCalled();
  });

  it('DELETE prompts the user and only deletes when confirmed', async () => {
    confirmSpy.mockReturnValue(false);
    const onBack = vi.fn();
    renderWithProviders(
      <ItemDetail itemId={String(ITEM_ID)} onBack={onBack} />,
      {
        initialAppData: createMockAppData({
          settings: createMockSettings({ theme: 'cockpit' }),
          items: [
            createMockInventoryItem({
              id: ITEM_ID,
              name: 'X',
              categoryId: createCategoryId('food'),
            }),
          ],
        }),
      },
    );
    await waitFor(() => screen.getByRole('button', { name: 'DELETE' }));
    fireEvent.click(screen.getByRole('button', { name: 'DELETE' }));
    expect(confirmSpy).toHaveBeenCalled();
    expect(onBack).not.toHaveBeenCalled();
  });
});
