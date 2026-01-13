import type {
  InventoryItem,
  HouseholdConfig,
  RecommendedItemDefinition,
} from '@/shared/types';
import { calculateRecommendedQuantity } from './recommendedQuantity';
import { CHILDREN_REQUIREMENT_MULTIPLIER } from '@/shared/utils/constants';

/**
 * Get the recommended quantity for an inventory item.
 * Looks up the recommended item definition and calculates the quantity based on household configuration.
 *
 * @param item - The inventory item
 * @param household - Household configuration
 * @param recommendedItems - List of recommended item definitions (from RecommendedItemsContext)
 * @param childrenMultiplier - Optional multiplier for children (default: 0.75)
 * @returns The recommended quantity, or 0 if no matching recommended item is found
 */
export function getRecommendedQuantityForItem(
  item: InventoryItem,
  household: HouseholdConfig,
  recommendedItems: RecommendedItemDefinition[],
  childrenMultiplier: number = CHILDREN_REQUIREMENT_MULTIPLIER,
): number {
  // Find recommended item by itemType
  let recommendedItem: RecommendedItemDefinition | undefined;

  if (item.itemType && item.itemType !== 'custom') {
    recommendedItem = recommendedItems.find((rec) => rec.id === item.itemType);
  }

  // If no recommended item found, return 0
  if (!recommendedItem) {
    return 0;
  }

  // Calculate recommended quantity based on household configuration
  return calculateRecommendedQuantity(
    recommendedItem,
    household,
    childrenMultiplier,
  );
}
