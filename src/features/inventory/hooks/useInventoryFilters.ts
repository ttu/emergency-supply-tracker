import { useCallback, useSyncExternalStore } from 'react';
import type { SortBy } from '@/features/inventory';

export type InventoryStatusFilter =
  | 'all'
  | 'crit'
  | 'warn'
  | 'ok'
  | 'exp'
  | 'missing';

export interface InventoryFilters {
  /** `undefined` means every category. */
  categoryId?: string;
  status: InventoryStatusFilter;
  search: string;
  /** `'all'` means every location. */
  location: string;
  sortBy: SortBy;
}

export const DEFAULT_INVENTORY_FILTERS: InventoryFilters = {
  categoryId: undefined,
  status: 'all',
  search: '',
  location: 'all',
  sortBy: 'name',
};

/**
 * These are view preferences, not inventory data, so they live beside the app
 * data rather than inside it — nothing here should end up in a backup export
 * or travel between devices on import.
 */
const STORAGE_KEY = 'emergencySupplyTracker_inventoryFilters';

const STATUSES: InventoryStatusFilter[] = [
  'all',
  'crit',
  'warn',
  'ok',
  'exp',
  'missing',
];
const SORTS: SortBy[] = ['name', 'quantity', 'expiration'];

/**
 * Anything on disk is user-editable and may predate a rename, so every field
 * is checked before use; one bad value falls back to its default rather than
 * discarding the rest.
 */
function parse(raw: string | null): InventoryFilters {
  if (!raw) return DEFAULT_INVENTORY_FILTERS;
  try {
    const stored = JSON.parse(raw) as Partial<InventoryFilters>;
    return {
      categoryId:
        typeof stored.categoryId === 'string' && stored.categoryId
          ? stored.categoryId
          : undefined,
      status: STATUSES.includes(stored.status as InventoryStatusFilter)
        ? (stored.status as InventoryStatusFilter)
        : 'all',
      search: typeof stored.search === 'string' ? stored.search : '',
      location: typeof stored.location === 'string' ? stored.location : 'all',
      sortBy: SORTS.includes(stored.sortBy as SortBy)
        ? (stored.sortBy as SortBy)
        : 'name',
    };
  } catch {
    return DEFAULT_INVENTORY_FILTERS;
  }
}

function readStored(): InventoryFilters {
  try {
    return parse(globalThis.localStorage?.getItem(STORAGE_KEY) ?? null);
  } catch {
    // Private browsing can throw on read, not only on write.
    return DEFAULT_INVENTORY_FILTERS;
  }
}

/**
 * One store for the whole app rather than per-component state.
 *
 * The desktop list, the mobile list and the dashboard's category tiles all
 * read and write these filters. With `useState` in each, a tile could write a
 * category the open list never saw — they were separate copies over the same
 * key. A shared store keeps every consumer on the same record.
 */
let current: InventoryFilters = readStored();
const listeners = new Set<() => void>();

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const getSnapshot = () => current;

function persist(next: InventoryFilters) {
  current = next;
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // A full or unavailable store must not take the inventory down with it;
    // the filters simply stop being remembered.
  }
  for (const listener of listeners) listener();
}

/**
 * Re-read the filters from storage and notify every consumer.
 *
 * Called after something outside React replaces what is on disk — a data
 * reset, an import, or a test clearing storage between cases (where it yields
 * the defaults, storage now being empty).
 */
export function reloadInventoryFilters(): void {
  current = readStored();
  for (const listener of listeners) listener();
}

/**
 * The inventory's filter state, remembered across navigation and reloads.
 *
 * Leaving the inventory and coming back used to drop everything — the
 * category, the status tab, the search — which made the list unusable as a
 * place to work from: every trip into an item's detail view meant setting the
 * filters up again.
 *
 * Desktop and mobile share the one record, so switching layouts (or rotating a
 * tablet) keeps the same view.
 */
export function useInventoryFilters(): [
  InventoryFilters,
  (patch: Partial<InventoryFilters>) => void,
] {
  const filters = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const update = useCallback((patch: Partial<InventoryFilters>) => {
    persist({ ...current, ...patch });
  }, []);

  return [filters, update];
}
