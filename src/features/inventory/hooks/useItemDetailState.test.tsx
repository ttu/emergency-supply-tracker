import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { NEW_ITEM_ID, useItemDetailState } from './useItemDetailState';
import { SettingsProvider } from '@/features/settings';
import { HouseholdProvider } from '@/features/household';
import { InventoryProvider } from '@/features/inventory';
import { RecommendedItemsProvider } from '@/features/templates';
import { InventorySetProvider } from '@/features/inventory-set';
import { NotificationProvider } from '@/shared/contexts/NotificationProvider';
import {
  createMockAppData,
  createMockInventoryItem,
  createMockSettings,
} from '@/shared/utils/test/factories';
import { saveAppData } from '@/shared/utils/storage/localStorage';
import {
  createCategoryId,
  createProductTemplateId,
  createQuantity,
} from '@/shared/types';

const soup = createMockInventoryItem({
  name: 'Canned soup',
  itemType: createProductTemplateId('canned-soup'),
  categoryId: createCategoryId('food'),
  quantity: createQuantity(12),
  unit: 'cans',
  neverExpires: true,
});

function Wrapper({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <InventorySetProvider>
      <SettingsProvider>
        <NotificationProvider>
          <HouseholdProvider>
            <RecommendedItemsProvider>
              <InventoryProvider>{children}</InventoryProvider>
            </RecommendedItemsProvider>
          </HouseholdProvider>
        </NotificationProvider>
      </SettingsProvider>
    </InventorySetProvider>
  );
}

const water = createMockInventoryItem({
  name: 'Bottled water',
  itemType: createProductTemplateId('bottled-water'),
  categoryId: createCategoryId('water'),
  quantity: createQuantity(6),
  unit: 'liters',
  neverExpires: true,
});

const setup = (itemId: string, onBack = vi.fn(), items = [soup]) => {
  saveAppData(
    createMockAppData({
      settings: createMockSettings({ theme: 'cockpit' }),
      items,
    }),
  );
  const view = renderHook(
    ({ id }: { id: string }) => useItemDetailState(id, onBack),
    { wrapper: Wrapper, initialProps: { id: itemId } },
  );
  return { ...view, onBack };
};

beforeEach(() => {
  localStorage.clear();
});

describe('useItemDetailState', () => {
  it('resolves an existing row with its status and percentage', async () => {
    const { result } = setup(String(soup.id));
    await waitFor(() => expect(result.current.item).toBeDefined());

    expect(result.current.isNew).toBe(false);
    expect(result.current.item?.name).toBe('Canned soup');
    expect(result.current.category).toBeDefined();
    expect(result.current.pct).toBeGreaterThanOrEqual(0);
  });

  it('reports the new-item case with no row to resolve', () => {
    const { result } = setup(NEW_ITEM_ID);
    expect(result.current.isNew).toBe(true);
    expect(result.current.item).toBeUndefined();
    expect(result.current.status).toBe('ok');
    expect(result.current.pct).toBe(0);
  });

  it('leaves an unknown id unresolved so the caller can show not-found', () => {
    const { result } = setup('does-not-exist');
    expect(result.current.isNew).toBe(false);
    expect(result.current.row).toBeUndefined();
  });

  it('adjust changes the stored quantity and clamps at zero', async () => {
    const { result } = setup(String(soup.id));
    await waitFor(() => expect(result.current.item).toBeDefined());

    act(() => result.current.adjust(1));
    await waitFor(() => expect(result.current.item?.quantity).toBe(13));

    act(() => result.current.adjust(-100));
    await waitFor(() => expect(result.current.item?.quantity).toBe(0));
  });

  it('delete asks first, and cancelling keeps the item', async () => {
    const { result } = setup(String(soup.id));
    await waitFor(() => expect(result.current.item).toBeDefined());

    act(() => result.current.handleDelete());
    expect(result.current.deleteConfirmOpen).toBe(true);

    act(() => result.current.cancelDelete());
    expect(result.current.deleteConfirmOpen).toBe(false);
    expect(result.current.item).toBeDefined();
  });

  it('confirming the delete removes the item and navigates back', async () => {
    const { result, onBack } = setup(String(soup.id));
    await waitFor(() => expect(result.current.item).toBeDefined());

    act(() => result.current.handleDelete());
    act(() => result.current.confirmDelete());

    await waitFor(() => expect(onBack).toHaveBeenCalled());
    expect(result.current.deleteConfirmOpen).toBe(false);
  });

  it('never deletes an item the confirmation was not opened for', async () => {
    const { result, rerender } = setup(String(soup.id), vi.fn(), [soup, water]);
    await waitFor(() => expect(result.current.item?.name).toBe('Canned soup'));

    act(() => result.current.handleDelete());
    expect(result.current.deleteConfirmOpen).toBe(true);

    // The detail view swaps to another item while the prompt is still open.
    rerender({ id: String(water.id) });
    await waitFor(() =>
      expect(result.current.item?.name).toBe('Bottled water'),
    );

    act(() => result.current.confirmDelete());

    // Neither item is gone: the captured target is no longer on screen, and
    // the item on screen was never the one confirmed.
    await waitFor(() => expect(result.current.deleteConfirmOpen).toBe(false));
    expect(result.current.item?.name).toBe('Bottled water');
    rerender({ id: String(soup.id) });
    await waitFor(() => expect(result.current.item?.name).toBe('Canned soup'));
  });

  it('submitting an edit updates the item and navigates back', async () => {
    const { result, onBack } = setup(String(soup.id));
    await waitFor(() => expect(result.current.item).toBeDefined());

    act(() =>
      result.current.handleSubmit({
        ...soup,
        name: 'Renamed soup',
      } as Parameters<typeof result.current.handleSubmit>[0]),
    );

    await waitFor(() => expect(onBack).toHaveBeenCalled());
    await waitFor(() => expect(result.current.item?.name).toBe('Renamed soup'));
  });
});
