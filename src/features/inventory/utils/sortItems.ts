import type { InventoryItem } from '@/shared/types';
import type { SortBy } from '@/features/inventory';

/**
 * Order two inventory items by the chosen key.
 *
 * Shared by the v1 inventory page and the v2 inventory table so both designs
 * agree on what "sorted by expiration" means.
 *
 * - `name` — alphabetical, locale-aware.
 * - `quantity` — largest first.
 * - `expiration` — soonest first, with never-expiring items last. Date-only
 *   strings (`YYYY-MM-DD`) compare lexicographically, which sidesteps the
 *   timezone bugs that parsing them into `Date` invites.
 */
export function compareItemsBy(
  a: InventoryItem,
  b: InventoryItem,
  sortBy: SortBy,
): number {
  switch (sortBy) {
    case 'name':
      return a.name.localeCompare(b.name);
    case 'quantity':
      return b.quantity - a.quantity;
    case 'expiration':
      if (a.neverExpires && b.neverExpires) return 0;
      if (a.neverExpires) return 1;
      if (b.neverExpires) return -1;
      return (a.expirationDate || '').localeCompare(b.expirationDate || '');
    default:
      return 0;
  }
}
