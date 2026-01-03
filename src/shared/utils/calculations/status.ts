import type { ItemStatus, InventoryItem } from '@/shared/types';
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
 * Calculate days until expiration for an item
 * Returns null if item never expires or has no expiration date
 */
export function getDaysUntilExpiration(
  expirationDate?: string,
  neverExpires?: boolean,
): number | null {
  if (neverExpires || !expirationDate) return null;

  const today = new Date();
  const expiration = new Date(expirationDate);
  const diffTime = expiration.getTime() - today.getTime();
  return Math.ceil(diffTime / MS_PER_DAY);
}

/**
 * Check if an item is expired
 */
export function isItemExpired(
  expirationDate?: string,
  neverExpires?: boolean,
): boolean {
  if (neverExpires || !expirationDate) return false;
  return new Date(expirationDate) < new Date();
}

/**
 * Get status for an individual item based on quantity and expiration
 */
export function getItemStatus(
  currentQuantity: number,
  recommendedQuantity: number,
  expirationDate?: string,
  neverExpires?: boolean,
  markedAsEnough?: boolean,
): ItemStatus {
  // Check expiration first (expiration always takes precedence)
  if (!neverExpires && expirationDate) {
    const daysUntilExpiration = getDaysUntilExpiration(
      expirationDate,
      neverExpires,
    );

    if (daysUntilExpiration !== null) {
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
