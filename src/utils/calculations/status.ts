import type { ItemStatus, InventoryItem } from '../../types';

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
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
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
): ItemStatus {
  // Check expiration first
  if (!neverExpires && expirationDate) {
    const daysUntilExpiration = getDaysUntilExpiration(
      expirationDate,
      neverExpires,
    );

    if (daysUntilExpiration !== null) {
      if (daysUntilExpiration < 0) return 'critical'; // Expired
      if (daysUntilExpiration <= 30) return 'warning'; // Expiring soon
    }
  }

  // Check quantity
  if (currentQuantity === 0) return 'critical';
  if (currentQuantity < recommendedQuantity * 0.5) return 'warning';

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
  );
}

/**
 * Determine status based on completion percentage
 * Used for category-level status determination
 */
export function getStatusFromPercentage(percentage: number): ItemStatus {
  if (percentage < 30) return 'critical';
  if (percentage < 70) return 'warning';
  return 'ok';
}

/**
 * Determine status based on preparedness score
 * Used for dashboard/overview status
 */
export function getStatusFromScore(score: number): ItemStatus {
  if (score >= 80) return 'ok';
  if (score >= 50) return 'warning';
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
