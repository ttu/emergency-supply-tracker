import type {
  InventoryItem,
  ItemStatus,
  Category,
  HouseholdConfig,
  Unit,
} from '../../types';
import {
  calculateItemStatus,
  getStatusFromPercentage,
} from '../calculations/status';
import { RECOMMENDED_ITEMS } from '../../data/recommendedItems';
import { calculateCategoryPreparedness } from './preparedness';

export interface CategoryShortage {
  itemId: string;
  itemName: string;
  actual: number;
  needed: number;
  unit: Unit;
  missing: number;
}

export interface CategoryStatusSummary {
  categoryId: string;
  itemCount: number;
  status: ItemStatus;
  completionPercentage: number;
  criticalCount: number;
  warningCount: number;
  okCount: number;
  shortages: CategoryShortage[];
  totalActual: number;
  totalNeeded: number;
  primaryUnit: Unit | null;
  // Calorie-based tracking for food category
  totalActualCalories?: number;
  totalNeededCalories?: number;
  missingCalories?: number;
}

// Daily calorie requirement per person for emergency situations
const DAILY_CALORIES_PER_PERSON = 2000;

/**
 * Calculate shortages for a category based on recommended items.
 * For the 'food' category, uses calorie-based calculations instead of quantity-based.
 */
export function calculateCategoryShortages(
  categoryId: string,
  items: InventoryItem[],
  household: HouseholdConfig,
): {
  shortages: CategoryShortage[];
  totalActual: number;
  totalNeeded: number;
  primaryUnit: Unit | null;
  totalActualCalories?: number;
  totalNeededCalories?: number;
  missingCalories?: number;
} {
  const categoryItems = items.filter((item) => item.categoryId === categoryId);
  const recommendedForCategory = RECOMMENDED_ITEMS.filter(
    (item) => item.category === categoryId,
  );

  if (recommendedForCategory.length === 0) {
    return { shortages: [], totalActual: 0, totalNeeded: 0, primaryUnit: null };
  }

  const totalPeople = household.adults + household.children;
  const shortages: CategoryShortage[] = [];
  let totalActual = 0;
  let totalNeeded = 0;

  // Track item types fulfilled for mixed-unit categories
  let itemTypesFulfilled = 0;
  let totalItemTypes = 0;

  // Calorie tracking for food category
  const isFoodCategory = categoryId === 'food';
  let totalActualCalories = 0;
  let totalNeededCalories = 0;

  // For food category, calculate needed calories based on people and days
  if (isFoodCategory) {
    totalNeededCalories =
      DAILY_CALORIES_PER_PERSON * totalPeople * household.supplyDurationDays;
  }

  // Track units to find the most common one and detect mixed units
  const unitCounts = new Map<Unit, number>();
  const uniqueUnits = new Set<Unit>();

  recommendedForCategory.forEach((recItem) => {
    let recommendedQty = recItem.baseQuantity;

    if (recItem.scaleWithPeople) {
      recommendedQty *= totalPeople;
    }

    if (recItem.scaleWithDays) {
      recommendedQty *= household.supplyDurationDays;
    }

    recommendedQty = Math.ceil(recommendedQty);

    // Match items by: productTemplateId, itemType (kebab-case comparison), or name
    const recItemIdNormalized = recItem.id.toLowerCase();
    const matchingItems = categoryItems.filter((item) => {
      // Direct template ID match
      if (item.productTemplateId === recItem.id) return true;
      // Match itemType by normalizing to kebab-case (e.g., "Bottled Water" -> "bottled-water")
      if (item.itemType) {
        const itemTypeNormalized = item.itemType
          .toLowerCase()
          .replace(/\s+/g, '-');
        if (itemTypeNormalized === recItemIdNormalized) return true;
      }
      // Match name by normalizing to kebab-case
      const nameNormalized = item.name.toLowerCase().replace(/\s+/g, '-');
      if (nameNormalized === recItemIdNormalized) return true;
      return false;
    });

    const actualQty = matchingItems.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );

    // Calculate calories for food items
    if (isFoodCategory && recItem.caloriesPerUnit) {
      // Get calories from inventory items (use template value as fallback)
      const itemCalories = matchingItems.reduce((sum, item) => {
        const calsPerUnit =
          item.caloriesPerUnit ?? recItem.caloriesPerUnit ?? 0;
        return sum + item.quantity * calsPerUnit;
      }, 0);
      totalActualCalories += itemCalories;
    }

    const missing = Math.max(0, recommendedQty - actualQty);

    // Track unique units and item types
    uniqueUnits.add(recItem.unit);
    totalItemTypes++;
    if (actualQty >= recommendedQty) {
      itemTypesFulfilled++;
    }

    // Track unit frequency
    unitCounts.set(
      recItem.unit,
      (unitCounts.get(recItem.unit) || 0) + recommendedQty,
    );

    // Add to totals
    totalActual += actualQty;
    totalNeeded += recommendedQty;

    if (missing > 0) {
      shortages.push({
        itemId: recItem.id,
        itemName: recItem.i18nKey,
        actual: actualQty,
        needed: recommendedQty,
        unit: recItem.unit,
        missing,
      });
    }
  });

  // Find the most common unit by quantity
  let primaryUnit: Unit | null = null;
  let maxCount = 0;
  unitCounts.forEach((count, unit) => {
    if (count > maxCount) {
      maxCount = count;
      primaryUnit = unit;
    }
  });

  // If multiple different units, use item type counts instead
  const hasMixedUnits = uniqueUnits.size > 1;
  if (hasMixedUnits) {
    totalActual = itemTypesFulfilled;
    totalNeeded = totalItemTypes;
    primaryUnit = null; // Signal to show "items" instead of a specific unit
  }

  // Sort shortages by missing amount (descending)
  shortages.sort((a, b) => b.missing - a.missing);

  // Return with calorie data for food category
  if (isFoodCategory) {
    const missingCalories = Math.max(
      0,
      totalNeededCalories - totalActualCalories,
    );
    return {
      shortages,
      totalActual,
      totalNeeded,
      primaryUnit,
      totalActualCalories,
      totalNeededCalories,
      missingCalories,
    };
  }

  return { shortages, totalActual, totalNeeded, primaryUnit };
}

/**
 * Calculate status summary for a category
 */
export function calculateCategoryStatus(
  category: Category,
  items: InventoryItem[],
  completionPercentage: number,
  household?: HouseholdConfig,
): CategoryStatusSummary {
  const categoryItems = items.filter((item) => item.categoryId === category.id);

  // Count items by status
  let criticalCount = 0;
  let warningCount = 0;
  let okCount = 0;

  categoryItems.forEach((item) => {
    const status = calculateItemStatus(item);
    if (status === 'critical') criticalCount++;
    else if (status === 'warning') warningCount++;
    else okCount++;
  });

  // Determine overall category status
  let categoryStatus: ItemStatus;
  if (criticalCount > 0 || completionPercentage < 30) {
    categoryStatus = 'critical';
  } else if (warningCount > 0 || completionPercentage < 70) {
    categoryStatus = 'warning';
  } else {
    categoryStatus = 'ok';
  }

  // Calculate shortages if household config is provided
  const shortageInfo = household
    ? calculateCategoryShortages(category.id, items, household)
    : { shortages: [], totalActual: 0, totalNeeded: 0, primaryUnit: null };

  return {
    categoryId: category.id,
    itemCount: categoryItems.length,
    status: categoryStatus,
    completionPercentage,
    criticalCount,
    warningCount,
    okCount,
    shortages: shortageInfo.shortages,
    totalActual: shortageInfo.totalActual,
    totalNeeded: shortageInfo.totalNeeded,
    primaryUnit: shortageInfo.primaryUnit,
    // Calorie data for food category
    totalActualCalories: shortageInfo.totalActualCalories,
    totalNeededCalories: shortageInfo.totalNeededCalories,
    missingCalories: shortageInfo.missingCalories,
  };
}

/**
 * Calculate status summaries for all categories
 */
export function calculateAllCategoryStatuses(
  categories: Category[],
  items: InventoryItem[],
  categoryPreparedness: Map<string, number>,
  household?: HouseholdConfig,
): CategoryStatusSummary[] {
  return categories.map((category) => {
    const completionPercentage = categoryPreparedness.get(category.id) || 0;
    return calculateCategoryStatus(
      category,
      items,
      completionPercentage,
      household,
    );
  });
}

/**
 * Simplified interface for category status display in UI components
 */
export interface CategoryDisplayStatus {
  status: ItemStatus;
  completionPercentage: number;
  totalActual: number;
  totalNeeded: number;
  primaryUnit: Unit | null;
  shortages: CategoryShortage[];
  // Calorie data for food category
  totalActualCalories?: number;
  totalNeededCalories?: number;
  missingCalories?: number;
}

/**
 * Calculate everything needed to display category status in UI.
 * This is the main function UI components should use.
 */
export function getCategoryDisplayStatus(
  categoryId: string,
  items: InventoryItem[],
  household: HouseholdConfig,
): CategoryDisplayStatus {
  const completionPercentage = calculateCategoryPreparedness(
    categoryId,
    items,
    household,
  );

  const shortageInfo = calculateCategoryShortages(categoryId, items, household);

  const status = getStatusFromPercentage(completionPercentage);

  return {
    status,
    completionPercentage,
    totalActual: shortageInfo.totalActual,
    totalNeeded: shortageInfo.totalNeeded,
    primaryUnit: shortageInfo.primaryUnit,
    shortages: shortageInfo.shortages,
    totalActualCalories: shortageInfo.totalActualCalories,
    totalNeededCalories: shortageInfo.totalNeededCalories,
    missingCalories: shortageInfo.missingCalories,
  };
}
