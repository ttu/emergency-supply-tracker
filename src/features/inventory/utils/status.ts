import type { InventoryItem } from '@/shared/types';
import { EXPIRING_SOON_DAYS_THRESHOLD } from '@/shared/utils/constants';
import {
  isItemExpired,
  getDaysUntilExpiration,
} from '@/shared/utils/calculations/itemStatus';

/**
 * Whether an item is expired or expiring soon.
 * Expiration takes precedence over quantity shortages in the missing-quantity
 * calculations below.
 */
function hasExpirationIssue(item: InventoryItem): boolean {
  const expired = isItemExpired(item.expirationDate, item.neverExpires);
  const daysUntil = getDaysUntilExpiration(
    item.expirationDate,
    item.neverExpires,
  );
  const isExpiringSoon =
    daysUntil !== undefined && daysUntil <= EXPIRING_SOON_DAYS_THRESHOLD;
  return expired || isExpiringSoon;
}

/**
 * Calculate missing quantity for an inventory item.
 * Returns the amount missing when quantity is less than recommended (not expiration).
 *
 * Only returns a non-zero value when:
 * - Quantity is less than recommended quantity (actual shortage)
 * - Not expired or expiring soon (so it's a quantity issue, not expiration)
 * - Not marked as enough (markedAsEnough overrides quantity checks)
 * - recommendedQuantity > 0 (must have a valid recommendation)
 */
export function calculateMissingQuantity(
  item: InventoryItem,
  recommendedQuantity: number,
): number {
  // Only show missing quantity if:
  // 1. Quantity is less than recommended (actual shortage)
  // 2. Not expired or expiring soon (so it's a quantity issue, not expiration)
  // 3. Not marked as enough (markedAsEnough overrides quantity checks)
  // 4. recommendedQuantity > 0 (must have a valid recommendation)
  const hasShortage = item.quantity < recommendedQuantity;
  const isQuantityIssue =
    hasShortage &&
    !hasExpirationIssue(item) &&
    !item.markedAsEnough &&
    recommendedQuantity > 0;

  if (!isQuantityIssue) {
    return 0;
  }

  return Math.max(0, recommendedQuantity - item.quantity);
}

/**
 * Calculate total missing quantity for all items of the same type.
 * Matches the calculation used in the recommendations list, showing the total
 * missing across all instances of an item type.
 *
 * Items are matched by itemType. If an item is marked as enough, it's
 * excluded from the calculation.
 */
export function calculateTotalMissingQuantity(
  item: InventoryItem,
  allItems: InventoryItem[],
  recommendedQuantity: number,
): number {
  const matchingItems = allItems.filter(
    (otherItem) =>
      item.itemType !== 'custom' &&
      otherItem.itemType !== 'custom' &&
      item.itemType === otherItem.itemType,
  );

  if (matchingItems.length === 0) {
    return calculateMissingQuantity(item, recommendedQuantity);
  }
  if (recommendedQuantity <= 0) {
    return 0;
  }
  if (matchingItems.some((i) => i.markedAsEnough)) {
    return 0;
  }

  const totalActual = matchingItems.reduce((sum, i) => sum + i.quantity, 0);

  // Check if the total has a quantity shortage (not expiration)
  // A shortage exists if:
  // 1. Total quantity < recommendedQuantity (actual shortage)
  // 2. None of the matching items are expired or expiring soon (expiration takes precedence)
  const anyExpirationIssue = matchingItems.some(hasExpirationIssue);

  // If there's an expiration issue, don't show quantity missing
  if (anyExpirationIssue) {
    return 0;
  }

  if (totalActual >= recommendedQuantity) {
    return 0;
  }

  return Math.max(0, recommendedQuantity - totalActual);
}
