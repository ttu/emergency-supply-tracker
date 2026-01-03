/**
 * Water requirement calculations for emergency supply tracker.
 * Calculates water needed for food preparation and validates water availability.
 */

import type { InventoryItem, HouseholdConfig } from '@/shared/types';
import { RECOMMENDED_ITEMS } from '@/data/recommendedItems';
import {
  ADULT_REQUIREMENT_MULTIPLIER,
  CHILDREN_REQUIREMENT_MULTIPLIER,
} from '@/shared/utils/constants';

/**
 * Result of water requirement calculation
 */
export interface WaterRequirementResult {
  /** Total liters of water required to prepare all stored food items */
  totalWaterRequired: number;
  /** Total liters of water available in storage */
  totalWaterAvailable: number;
  /** Whether there is enough water for all preparations */
  hasEnoughWater: boolean;
  /** Shortfall in liters (0 if enough water) */
  waterShortfall: number;
  /** Items that require water for preparation */
  itemsRequiringWater: WaterRequirementItem[];
}

/**
 * Individual item water requirement
 */
export interface WaterRequirementItem {
  itemId: string;
  itemName: string;
  quantity: number;
  waterPerUnit: number;
  totalWaterRequired: number;
}

/**
 * Validates water requirement value.
 * Returns null if valid, error message if invalid.
 */
export function validateWaterRequirement(
  requiresWaterLiters: number | undefined | null,
): string | null {
  if (requiresWaterLiters === undefined || requiresWaterLiters === null) {
    return null; // No water requirement is valid
  }

  if (typeof requiresWaterLiters !== 'number') {
    return 'Water requirement must be a number';
  }

  if (requiresWaterLiters <= 0) {
    return 'Water requirement must be greater than zero';
  }

  if (!Number.isFinite(requiresWaterLiters)) {
    return 'Water requirement must be a finite number';
  }

  return null;
}

/**
 * Gets the water requirement per unit for an inventory item.
 * Uses the item's custom value if set, otherwise looks up the template value.
 */
export function getWaterRequirementPerUnit(item: InventoryItem): number {
  // First check if item has a custom water requirement
  if (
    item.requiresWaterLiters !== undefined &&
    item.requiresWaterLiters !== null &&
    item.requiresWaterLiters > 0
  ) {
    return item.requiresWaterLiters;
  }

  // Look up the template value
  if (item.productTemplateId) {
    const template = RECOMMENDED_ITEMS.find(
      (rec) => rec.id === item.productTemplateId,
    );
    if (
      template?.requiresWaterLiters !== undefined &&
      template.requiresWaterLiters > 0
    ) {
      return template.requiresWaterLiters;
    }
  }

  // Also try matching by item type (normalized to kebab-case)
  if (item.itemType) {
    const itemTypeNormalized = item.itemType.toLowerCase().replace(/\s+/g, '-');
    const template = RECOMMENDED_ITEMS.find(
      (rec) => rec.id === itemTypeNormalized,
    );
    if (
      template?.requiresWaterLiters !== undefined &&
      template.requiresWaterLiters > 0
    ) {
      return template.requiresWaterLiters;
    }
  }

  return 0; // No water requirement
}

/**
 * Calculates the total water required to prepare all inventory items that need water.
 */
export function calculateTotalWaterRequired(items: InventoryItem[]): number {
  return items.reduce((total, item) => {
    const waterPerUnit = getWaterRequirementPerUnit(item);
    return total + waterPerUnit * item.quantity;
  }, 0);
}

/**
 * Calculates total available drinking water from inventory.
 * Includes items from the water-beverages category that are water.
 */
export function calculateTotalWaterAvailable(items: InventoryItem[]): number {
  return items
    .filter((item) => {
      // Only count items in water-beverages category
      if (item.categoryId !== 'water-beverages') {
        return false;
      }

      // Only count items that are bottled water (by template ID, item type, or name)
      const isBottledWater =
        item.productTemplateId === 'bottled-water' ||
        item.itemType?.toLowerCase().includes('water') ||
        item.name.toLowerCase().includes('water');

      // Only count items measured in liters
      const isLiters = item.unit === 'liters';

      return isBottledWater && isLiters;
    })
    .reduce((total, item) => total + item.quantity, 0);
}

/**
 * Calculates the water requirement for food preparation based on inventory items.
 * This compares the total water needed to prepare stored food against available water.
 */
export function calculateWaterRequirements(
  items: InventoryItem[],
): WaterRequirementResult {
  const itemsRequiringWater: WaterRequirementItem[] = [];

  // Find all items that require water for preparation
  items.forEach((item) => {
    const waterPerUnit = getWaterRequirementPerUnit(item);
    if (waterPerUnit > 0 && item.quantity > 0) {
      itemsRequiringWater.push({
        itemId: item.id,
        itemName: item.name,
        quantity: item.quantity,
        waterPerUnit,
        totalWaterRequired: waterPerUnit * item.quantity,
      });
    }
  });

  const totalWaterRequired = itemsRequiringWater.reduce(
    (sum, item) => sum + item.totalWaterRequired,
    0,
  );
  const totalWaterAvailable = calculateTotalWaterAvailable(items);
  const waterShortfall = Math.max(0, totalWaterRequired - totalWaterAvailable);

  return {
    totalWaterRequired,
    totalWaterAvailable,
    hasEnoughWater: totalWaterAvailable >= totalWaterRequired,
    waterShortfall,
    itemsRequiringWater,
  };
}

/**
 * Calculates the recommended water storage based on household configuration.
 * This is the base water requirement for drinking (not including food preparation).
 * @param household - Household configuration
 * @param dailyWaterPerPerson - Liters of water per person per day
 * @param childrenMultiplier - Optional multiplier for children (default: 0.75)
 */
export function calculateRecommendedWaterStorage(
  household: HouseholdConfig,
  dailyWaterPerPerson: number,
  childrenMultiplier: number = CHILDREN_REQUIREMENT_MULTIPLIER,
): number {
  const peopleMultiplier =
    household.adults * ADULT_REQUIREMENT_MULTIPLIER +
    household.children * childrenMultiplier;

  return dailyWaterPerPerson * peopleMultiplier * household.supplyDurationDays;
}

/**
 * Calculates total water needs including both drinking water and preparation water.
 * @param items - Inventory items
 * @param household - Household configuration
 * @param dailyWaterPerPerson - Liters of water per person per day
 * @param childrenMultiplier - Optional multiplier for children (default: 0.75)
 */
export function calculateTotalWaterNeeds(
  items: InventoryItem[],
  household: HouseholdConfig,
  dailyWaterPerPerson: number,
  childrenMultiplier: number = CHILDREN_REQUIREMENT_MULTIPLIER,
): {
  drinkingWater: number;
  preparationWater: number;
  totalWater: number;
} {
  const drinkingWater = calculateRecommendedWaterStorage(
    household,
    dailyWaterPerPerson,
    childrenMultiplier,
  );
  const preparationWater = calculateTotalWaterRequired(items);

  return {
    drinkingWater,
    preparationWater,
    totalWater: drinkingWater + preparationWater,
  };
}
