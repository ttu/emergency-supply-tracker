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
 * Calculate status for an inventory item
 */
export function calculateItemStatus(item: InventoryItem): ItemStatus {
  return getItemStatus(
    item.quantity,
    item.recommendedQuantity,
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
