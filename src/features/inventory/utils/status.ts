import type { ItemStatus, InventoryItem, DateOnly } from '@/shared/types';
import { createDateOnly } from '@/shared/types';
import {
  MS_PER_DAY,
  EXPIRING_SOON_DAYS_THRESHOLD,
  LOW_QUANTITY_WARNING_RATIO,
  CRITICAL_PERCENTAGE_THRESHOLD,
  WARNING_PERCENTAGE_THRESHOLD,
  OK_SCORE_THRESHOLD,
  WARNING_SCORE_THRESHOLD,
} from '@/shared/utils/constants';

/**
 * Get today's date as a DateOnly in local timezone.
 * This ensures consistent date comparisons without timezone issues.
 */
function getTodayDateOnly(): DateOnly {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return createDateOnly(`${year}-${month}-${day}`);
}

/**
 * Parse a DateOnly and return it as a Date object at local midnight.
 * This ensures consistent date comparisons without timezone issues.
 */
function parseDateOnly(dateOnly: DateOnly): Date {
  // Parse YYYY-MM-DD as local date (not UTC)
  const [year, month, day] = dateOnly.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Calculate days until expiration for an item
 * Returns undefined if item never expires or has no expiration date
 *
 * Uses date-only comparison to avoid timezone issues.
 */
export function getDaysUntilExpiration(
  expirationDate?: DateOnly,
  neverExpires?: boolean,
): number | undefined {
  if (neverExpires || !expirationDate) return undefined;

  const today = getTodayDateOnly();
  const expiration = parseDateOnly(expirationDate);
  const todayDate = parseDateOnly(today);
  const diffTime = expiration.getTime() - todayDate.getTime();
  return Math.ceil(diffTime / MS_PER_DAY);
}

/**
 * Check if an item is expired
 *
 * Uses date-only comparison to avoid timezone issues.
 */
export function isItemExpired(
  expirationDate?: DateOnly,
  neverExpires?: boolean,
): boolean {
  if (neverExpires || !expirationDate) return false;

  const today = getTodayDateOnly();
  const expiration = parseDateOnly(expirationDate);
  const todayDate = parseDateOnly(today);
  return expiration < todayDate;
}

/**
 * Get status for an individual item based on quantity and expiration
 */
export function getItemStatus(
  currentQuantity: number,
  recommendedQuantity: number,
  expirationDate?: DateOnly,
  neverExpires?: boolean,
  markedAsEnough?: boolean,
): ItemStatus {
  // Check expiration first (expiration always takes precedence)
  if (!neverExpires && expirationDate) {
    const daysUntilExpiration = getDaysUntilExpiration(
      expirationDate,
      neverExpires,
    );

    if (daysUntilExpiration !== undefined) {
      if (daysUntilExpiration < 0) return 'critical'; // Expired
      if (daysUntilExpiration <= EXPIRING_SOON_DAYS_THRESHOLD) return 'warning'; // Expiring soon
    }
  }

  // If marked as enough, treat as ok (unless expired)
  if (markedAsEnough) return 'ok';

  // Check quantity
  if (currentQuantity === 0) return 'critical';
  if (currentQuantity < recommendedQuantity * LOW_QUANTITY_WARNING_RATIO)
    return 'warning';

  return 'ok';
}

/**
 * Calculate status for an inventory item.
 * Requires recommended quantity to be calculated separately.
 *
 * @param item - The inventory item
 * @param recommendedQuantity - The recommended quantity for this item (calculated from recommended items)
 * @returns The item status
 */
export function calculateItemStatus(
  item: InventoryItem,
  recommendedQuantity: number,
): ItemStatus {
  return getItemStatus(
    item.quantity,
    recommendedQuantity,
    item.expirationDate,
    item.neverExpires,
    item.markedAsEnough,
  );
}

/**
 * Determine status based on completion percentage
 * Used for category-level status determination
 */
export function getStatusFromPercentage(percentage: number): ItemStatus {
  if (percentage < CRITICAL_PERCENTAGE_THRESHOLD) return 'critical';
  if (percentage < WARNING_PERCENTAGE_THRESHOLD) return 'warning';
  return 'ok';
}

/**
 * Determine status based on preparedness score
 * Used for dashboard/overview status
 */
export function getStatusFromScore(score: number): ItemStatus {
  if (score >= OK_SCORE_THRESHOLD) return 'ok';
  if (score >= WARNING_SCORE_THRESHOLD) return 'warning';
  return 'critical';
}

/**
 * Map ItemStatus to UI variant for Badge component
 */
export function getStatusVariant(
  status: ItemStatus,
): 'success' | 'warning' | 'danger' {
  switch (status) {
    case 'ok':
      return 'success';
    case 'warning':
      return 'warning';
    case 'critical':
      return 'danger';
  }
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
