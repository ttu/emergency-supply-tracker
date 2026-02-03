import type { InventoryItem } from '@/shared/types';

/**
 * Get the effective quantity for an inventory item.
 *
 * For regular items: returns quantity
 * For rotation items: returns estimatedQuantity (or 0 if excluded)
 *
 * @param item - The inventory item
 * @returns The quantity to use for calculations
 */
export function getEffectiveQuantity(item: InventoryItem): number {
  if (item.isNormalRotation) {
    if (item.excludeFromCalculations) {
      return 0;
    }
    return item.estimatedQuantity ?? 0;
  }
  return item.quantity;
}
