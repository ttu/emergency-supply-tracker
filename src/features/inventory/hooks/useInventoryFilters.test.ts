import { describe, it, expect, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import {
  useInventoryFilters,
  reloadInventoryFilters,
  DEFAULT_INVENTORY_FILTERS,
} from './useInventoryFilters';

const STORAGE_KEY = 'emergencySupplyTracker_inventoryFilters';

const stored = () =>
  JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Record<
    string,
    unknown
  >;

describe('useInventoryFilters', () => {
  beforeEach(() => {
    localStorage.clear();
    reloadInventoryFilters();
  });

  it('starts on the defaults', () => {
    const { result } = renderHook(() => useInventoryFilters());
    expect(result.current[0]).toEqual(DEFAULT_INVENTORY_FILTERS);
  });

  it('patches one field without disturbing the rest', () => {
    const { result } = renderHook(() => useInventoryFilters());
    act(() => result.current[1]({ search: 'water' }));
    act(() => result.current[1]({ status: 'crit' }));

    expect(result.current[0].search).toBe('water');
    expect(result.current[0].status).toBe('crit');
    expect(result.current[0].sortBy).toBe('name');
  });

  it('writes through to storage', () => {
    const { result } = renderHook(() => useInventoryFilters());
    act(() => result.current[1]({ categoryId: 'food', sortBy: 'quantity' }));
    expect(stored()).toMatchObject({
      categoryId: 'food',
      sortBy: 'quantity',
    });
  });

  it('survives a remount — the point of the exercise', () => {
    const first = renderHook(() => useInventoryFilters());
    act(() => first.result.current[1]({ categoryId: 'food', status: 'warn' }));
    first.unmount();

    const second = renderHook(() => useInventoryFilters());
    expect(second.result.current[0].categoryId).toBe('food');
    expect(second.result.current[0].status).toBe('warn');
  });

  it('keeps separate consumers on the same record', () => {
    // The dashboard's category tiles write filters the open inventory has to
    // see; with per-component state they were separate copies.
    const a = renderHook(() => useInventoryFilters());
    const b = renderHook(() => useInventoryFilters());

    act(() => a.result.current[1]({ categoryId: 'medical-health' }));

    expect(b.result.current[0].categoryId).toBe('medical-health');
  });

  it('clearing the category means all categories, not the string "undefined"', () => {
    const { result } = renderHook(() => useInventoryFilters());
    act(() => result.current[1]({ categoryId: 'food' }));
    act(() => result.current[1]({ categoryId: undefined }));

    expect(result.current[0].categoryId).toBeUndefined();
  });

  describe('reading what is on disk', () => {
    const load = (raw: string) => {
      localStorage.setItem(STORAGE_KEY, raw);
      act(() => reloadInventoryFilters());
      return renderHook(() => useInventoryFilters()).result;
    };

    it('falls back to defaults for unparseable JSON', () => {
      expect(load('{not json').current[0]).toEqual(DEFAULT_INVENTORY_FILTERS);
    });

    it('rejects a status that is not one of ours, keeping the rest', () => {
      // Stored values are user-editable and may predate a rename; one bad
      // field should not discard the others.
      const result = load(
        JSON.stringify({ status: 'nonsense', search: 'kept' }),
      );
      expect(result.current[0].status).toBe('all');
      expect(result.current[0].search).toBe('kept');
    });

    it('rejects a sort order that is not one of ours', () => {
      expect(load(JSON.stringify({ sortBy: 'colour' })).current[0].sortBy).toBe(
        'name',
      );
    });

    it('treats an empty category string as no filter', () => {
      expect(
        load(JSON.stringify({ categoryId: '' })).current[0].categoryId,
      ).toBeUndefined();
    });
  });
});
