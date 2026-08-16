import { LOCATION_FILTER_NONE } from '@/features/inventory';

/**
 * Whether an item's location satisfies the v2 inventory location filter.
 *
 * `filter === undefined` means every location (the v2 filter strip's default,
 * matching `InventoryFilters.location`). `LOCATION_FILTER_NONE` — reused from
 * v1's `FilterBar` rather than redeclared — isolates items with no location
 * set, mirroring v1's "No Location" option. Any other value matches that
 * location exactly.
 */
export function matchesLocationFilter(
  itemLocation: string | undefined,
  filter: string | undefined,
): boolean {
  if (filter === undefined) return true;
  if (filter === LOCATION_FILTER_NONE) return !itemLocation?.trim();
  return itemLocation === filter;
}
