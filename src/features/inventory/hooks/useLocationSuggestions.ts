import { useMemo } from 'react';
import type { InventoryItem } from '@/shared/types';

/**
 * Extracts unique location strings from inventory items.
 * Returns a sorted array of locations for use in autocomplete suggestions.
 */
export function useLocationSuggestions(items: InventoryItem[]): string[] {
  return useMemo(() => {
    const locations = items
      .map((item) => item.location)
      .filter((loc): loc is string => !!loc && loc.trim() !== '');

    return [...new Set(locations)].sort((a, b) =>
      a.toLowerCase().localeCompare(b.toLowerCase()),
    );
  }, [items]);
}
