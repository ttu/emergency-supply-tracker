import type { InventoryItem } from '@/shared/types';
import { EXPIRING_SOON_DAYS_THRESHOLD } from '@/shared/utils/constants';
import {
  isItemExpired,
  getDaysUntilExpiration,
} from '@/shared/utils/calculations/itemStatus';

/**
 * Calculate missing quantity for an inventory item.
 * Returns the amount missing when quantity is less than recommended (not expiration).
 *
 * Only returns a non-zero value when:
 * - Quantity is less than recommended quantity (actual shortage)
 * - Not expired or expiring soon (so it's a quantity issue, not expiration)
 * - Not marked as enough (markedAsEnough overrides quantity checks)
 * - recommendedQuantity > 0 (must have a valid recommendation)
 *
 * @param item - The inventory item to calculate missing quantity for
 * @param recommendedQuantity - The recommended quantity for this item (calculated from recommended items)
 * @returns The missing quantity (0 if not applicable or not a quantity issue)
 *
 * @example
 * ```typescript
 * const item = {
 *   quantity: 1,
 *   neverExpires: true,
 *   // ... other fields
 * };
 * const recommendedQuantity = 10;
 * const missing = calculateMissingQuantity(item, recommendedQuantity);
 * // Returns 9 (10 - 1 = 9)
 * ```
 */
export function calculateMissingQuantity(
  item: InventoryItem,
  recommendedQuantity: number,
): number {
  const expired = isItemExpired(item.expirationDate, item.neverExpires);
  const daysUntil = getDaysUntilExpiration(
    item.expirationDate,
    item.neverExpires,
  );
  const isExpiringSoon =
    daysUntil !== undefined && daysUntil <= EXPIRING_SOON_DAYS_THRESHOLD;

  // Only show missing quantity if:
  // 1. Quantity is less than recommended (actual shortage)
  // 2. Not expired or expiring soon (so it's a quantity issue, not expiration)
  // 3. Not marked as enough (markedAsEnough overrides quantity checks)
  // 4. recommendedQuantity > 0 (must have a valid recommendation)
  const hasShortage = item.quantity < recommendedQuantity;
  const isQuantityIssue =
    hasShortage &&
    !expired &&
    !isExpiringSoon &&
    !item.markedAsEnough &&
    recommendedQuantity > 0;

  if (!isQuantityIssue) {
    return 0;
  }

  return Math.max(0, recommendedQuantity - item.quantity);
}

/**
 * Calculate total missing quantity for all items of the same type.
 * This matches the calculation used in the recommendations list, showing
 * the total missing across all instances of an item type.
 *
 * Items are matched by itemType. If an item is marked as enough,
 * it's excluded from the calculation.
 *
 * @param item - The inventory item to calculate missing quantity for
 * @param allItems - All inventory items to search for matching items
 * @param recommendedQuantity - The recommended quantity for this item type (calculated from recommended items)
 * @returns The total missing quantity across all matching items (0 if not applicable)
 *
 * @example
 * ```typescript
 * const item1 = { id: '1', quantity: 2, itemType: 'rope', ... };
 * const item2 = { id: '2', quantity: 1, itemType: 'rope', ... };
 * const recommendedQuantity = 10;
 * const missing = calculateTotalMissingQuantity(item1, [item1, item2], recommendedQuantity);
 * // Returns 7 (10 - (2 + 1) = 7)
 * ```
 */
export function calculateTotalMissingQuantity(
  item: InventoryItem,
  allItems: InventoryItem[],
  recommendedQuantity: number,
): number {
  // Find all items of the same type
  const matchingItems = allItems.filter((otherItem) => {
    // Match by itemType if both are not 'custom' and itemTypes match
    return (
      item.itemType !== 'custom' &&
      otherItem.itemType !== 'custom' &&
      item.itemType === otherItem.itemType
    );
  });

  // If no matching items (shouldn't happen, but handle gracefully)
  if (matchingItems.length === 0) {
    return calculateMissingQuantity(item, recommendedQuantity);
  }

  // If recommendedQuantity is 0 or negative, return 0
  if (recommendedQuantity <= 0) {
    return 0;
  }

  // If any matching item is marked as enough, treat as no shortage
  const hasMarkedAsEnough = matchingItems.some((i) => i.markedAsEnough);
  if (hasMarkedAsEnough) {
    return 0;
  }

  // Calculate total actual quantity
  const totalActual = matchingItems.reduce((sum, i) => sum + i.quantity, 0);

  // Check if the total has a quantity shortage (not expiration)
  // A shortage exists if:
  // 1. Total quantity < recommendedQuantity (actual shortage)
  // 2. None of the matching items are expired or expiring soon (expiration takes precedence)
  const hasExpirationIssue = matchingItems.some((i) => {
    const expired = isItemExpired(i.expirationDate, i.neverExpires);
    const daysUntil = getDaysUntilExpiration(i.expirationDate, i.neverExpires);
    const isExpiringSoon =
      daysUntil !== undefined && daysUntil <= EXPIRING_SOON_DAYS_THRESHOLD;
    return expired || isExpiringSoon;
  });

  // If there's an expiration issue, don't show quantity missing
  if (hasExpirationIssue) {
    return 0;
  }

  // Check if total quantity indicates a shortage (total < recommended)
  // Show missing quantity whenever there's an actual shortage, not just when below warning threshold
  const hasShortage = totalActual < recommendedQuantity;

  // Only return missing quantity if there's a shortage
  if (!hasShortage) {
    return 0;
  }

  return Math.max(0, recommendedQuantity - totalActual);
}
