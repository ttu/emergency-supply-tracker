import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

vi.mock('@/features/inventory', () => ({ useInventory: vi.fn() }));
vi.mock('@/shared/hooks/useDesignTheme', () => ({
  useDesignTheme: () => ({ themeKey: 'cockpit' }),
}));

import { useInventory } from '@/features/inventory';
import { useRemoveEmptyItems } from './useRemoveEmptyItems';

const item = (id: string, quantity: number, categoryId = 'food') => ({
  id,
  quantity,
  categoryId,
});

const mockInventory = (
  items: ReturnType<typeof item>[],
  deleteItems = vi.fn(),
) =>
  vi.mocked(useInventory).mockReturnValue({
    items,
    deleteItems,
  } as unknown as ReturnType<typeof useInventory>);

beforeEach(() => vi.clearAllMocks());

describe('useRemoveEmptyItems', () => {
  it('counts only the 0-quantity items', () => {
    mockInventory([item('a', 0), item('b', 5), item('c', 0)]);
    const { result } = renderHook(() => useRemoveEmptyItems());
    expect(result.current.count).toBe(2);
  });

  it('scopes the count to categoryId when provided', () => {
    mockInventory([
      item('a', 0, 'food'),
      item('b', 0, 'water-beverages'),
      item('c', 0, 'food'),
    ]);
    const { result } = renderHook(() => useRemoveEmptyItems('food'));
    expect(result.current.count).toBe(2);
  });

  it('does not open the confirmation when there is nothing to remove', () => {
    mockInventory([item('a', 5)]);
    const { result } = renderHook(() => useRemoveEmptyItems());

    act(() => result.current.handleOpen());

    expect(result.current.confirmOpen).toBe(false);
  });

  it('opens the confirmation when there is something to remove', () => {
    mockInventory([item('a', 0)]);
    const { result } = renderHook(() => useRemoveEmptyItems());

    act(() => result.current.handleOpen());

    expect(result.current.confirmOpen).toBe(true);
  });

  it('handleCancel closes the confirmation without deleting', () => {
    const deleteItems = vi.fn();
    mockInventory([item('a', 0)], deleteItems);
    const { result } = renderHook(() => useRemoveEmptyItems());

    act(() => result.current.handleOpen());
    expect(result.current.confirmOpen).toBe(true);

    act(() => result.current.handleCancel());

    expect(result.current.confirmOpen).toBe(false);
    expect(deleteItems).not.toHaveBeenCalled();
  });

  it('handleConfirm deletes only the in-scope zero-quantity item ids and closes the dialog', () => {
    const deleteItems = vi.fn();
    mockInventory(
      [
        item('a', 0, 'food'),
        item('b', 5, 'food'),
        item('c', 0, 'water-beverages'),
      ],
      deleteItems,
    );
    const { result } = renderHook(() => useRemoveEmptyItems('food'));

    act(() => result.current.handleOpen());
    act(() => result.current.handleConfirm());

    expect(deleteItems).toHaveBeenCalledWith(['a']);
    expect(deleteItems).toHaveBeenCalledTimes(1);
    expect(result.current.confirmOpen).toBe(false);
  });
});
