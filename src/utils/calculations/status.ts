import type { ItemStatus } from '../../types';

export function getItemStatus(
  currentQuantity: number,
  recommendedQuantity: number,
  expirationDate?: string,
  neverExpires?: boolean,
): ItemStatus {
  // Check expiration first
  if (!neverExpires && expirationDate) {
    const today = new Date();
    const expiration = new Date(expirationDate);
    const daysUntilExpiration = Math.floor(
      (expiration.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysUntilExpiration < 0) return 'critical'; // Expired
    if (daysUntilExpiration <= 30) return 'warning'; // Expiring soon
  }

  // Check quantity
  if (currentQuantity === 0) return 'critical';
  if (currentQuantity < recommendedQuantity * 0.5) return 'warning';

  return 'ok';
}
