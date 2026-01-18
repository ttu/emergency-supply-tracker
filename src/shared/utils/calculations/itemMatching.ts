/**
 * Item matching utilities for matching inventory items to recommended items.
 *
 * This module consolidates the item matching logic that was previously duplicated
 * across multiple calculation files (categoryStatus.ts, categoryPercentage.ts,
 * preparedness.ts).
 *
 * The matching logic handles:
 * - Direct itemType matching (items created from templates)
 * - Name-based matching for manually created items (normalized to kebab-case)
 * - Exclusion of custom items from name matching to prevent false positives
 */

import type { InventoryItem, RecommendedItemDefinition } from '@/shared/types';

/**
 * Find inventory items that match a recommended item definition.
 *
 * Matching rules:
 * 1. Direct match: item.itemType === recommendedItem.id
 * 2. Name match: item.name normalized to kebab-case matches recommendedItem.id
 *    - Only applies to non-custom items (itemType !== 'custom')
 *
 * @param items - Inventory items to search
 * @param recommendedItem - The recommended item definition to match against
 * @returns Array of matching inventory items
 */
export function findMatchingItems(
  items: InventoryItem[],
  recommendedItem: RecommendedItemDefinition,
): InventoryItem[] {
  const recItemId = recommendedItem.id;
  const recItemIdNormalized = recItemId.toLowerCase();

  return items.filter((item) => {
    // Direct match by itemType (items created from template)
    if (item.itemType === recItemId) return true;

    // Name-based match for manually created items
    // Exclude custom items to avoid false matches
    if (item.itemType !== 'custom') {
      const nameNormalized = item.name.toLowerCase().replace(/\s+/g, '-');
      if (nameNormalized === recItemIdNormalized) return true;
    }

    return false;
  });
}

/**
 * Find inventory items that match a recommended item by itemType only.
 * This is a stricter matching that doesn't consider name-based matching.
 *
 * Use this when you need exact template matching without fuzzy name matching.
 *
 * @param items - Inventory items to search
 * @param recommendedItemId - The recommended item ID to match against
 * @returns Array of matching inventory items
 */
export function findMatchingItemsByType(
  items: InventoryItem[],
  recommendedItemId: string,
): InventoryItem[] {
  return items.filter((item) => item.itemType === recommendedItemId);
}

/**
 * Check if an item matches a recommended item ID (by type only).
 *
 * @param item - The inventory item to check
 * @param recommendedItemId - The recommended item ID to match against
 * @returns True if the item matches
 */
export function itemMatchesRecommendedId(
  item: InventoryItem,
  recommendedItemId: string,
): boolean {
  return item.itemType === recommendedItemId;
}

/**
 * Sum the quantity of all matching items.
 *
 * @param items - Inventory items to search
 * @param recommendedItem - The recommended item definition to match against
 * @returns Total quantity of all matching items
 */
export function sumMatchingItemsQuantity(
  items: InventoryItem[],
  recommendedItem: RecommendedItemDefinition,
): number {
  const matchingItems = findMatchingItems(items, recommendedItem);
  return matchingItems.reduce((sum, item) => sum + item.quantity, 0);
}

/**
 * Sum the quantity of items matching by type only (stricter matching).
 *
 * @param items - Inventory items to search
 * @param recommendedItemId - The recommended item ID to match against
 * @returns Total quantity of all matching items
 */
export function sumMatchingItemsQuantityByType(
  items: InventoryItem[],
  recommendedItemId: string,
): number {
  const matchingItems = findMatchingItemsByType(items, recommendedItemId);
  return matchingItems.reduce((sum, item) => sum + item.quantity, 0);
}

/**
 * Check if any matching item is marked as "enough".
 *
 * @param items - Inventory items to search
 * @param recommendedItem - The recommended item definition to match against
 * @returns True if any matching item is marked as enough
 */
export function hasMarkedAsEnough(
  items: InventoryItem[],
  recommendedItem: RecommendedItemDefinition,
): boolean {
  const matchingItems = findMatchingItems(items, recommendedItem);
  return matchingItems.some((item) => item.markedAsEnough);
}

/**
 * Calculate total calories from matching items.
 *
 * @param items - Inventory items to search
 * @param recommendedItem - The recommended item definition to match against
 * @param defaultCaloriesPerUnit - Fallback calories per unit if item doesn't have it set
 * @returns Total calories from all matching items
 */
import { calculateItemTotalCalories } from './calories';

export function sumMatchingItemsCalories(
  items: InventoryItem[],
  recommendedItem: RecommendedItemDefinition,
  defaultCaloriesPerUnit: number = 0,
): number {
  const matchingItems = findMatchingItems(items, recommendedItem);
  return matchingItems.reduce((sum, item) => {
    if (item.caloriesPerUnit) {
      return sum + calculateItemTotalCalories(item);
    }
    // Fallback: use default calories per unit (assume quantity is already in units)
    return sum + item.quantity * defaultCaloriesPerUnit;
  }, 0);
}

/**
 * Calculate total calories from items matching by type only.
 *
 * @param items - Inventory items to search
 * @param recommendedItemId - The recommended item ID to match against
 * @param defaultCaloriesPerUnit - Fallback calories per unit if item doesn't have it set
 * @returns Total calories from all matching items
 */
export function sumMatchingItemsCaloriesByType(
  items: InventoryItem[],
  recommendedItemId: string,
  defaultCaloriesPerUnit: number = 0,
): number {
  const matchingItems = findMatchingItemsByType(items, recommendedItemId);
  return matchingItems.reduce((sum, item) => {
    if (item.caloriesPerUnit) {
      return sum + calculateItemTotalCalories(item);
    }
    // Fallback: use default calories per unit (assume quantity is already in units)
    return sum + item.quantity * defaultCaloriesPerUnit;
  }, 0);
}
