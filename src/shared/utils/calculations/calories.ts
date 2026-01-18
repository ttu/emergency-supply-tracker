import type {
  InventoryItem,
  RecommendedItemDefinition,
  Unit,
} from '@/shared/types';
import { isFoodRecommendedItem } from '@/shared/types';
import {
  CALORIE_BASE_WEIGHT_GRAMS,
  GRAMS_TO_KG_THRESHOLD,
  CALORIE_DISPLAY_THRESHOLD,
} from '@/shared/utils/constants';

/**
 * Calculate calories per unit from weight and calories per 100g
 */
export function calculateCaloriesFromWeight(
  weightGrams: number,
  caloriesPer100g: number,
): number {
  return Math.round(
    (weightGrams / CALORIE_BASE_WEIGHT_GRAMS) * caloriesPer100g,
  );
}

/**
 * Calculate total weight in grams from quantity and weight per unit
 */
export function calculateTotalWeight(
  quantity: number,
  weightGramsPerUnit: number,
): number {
  return Math.round(quantity * weightGramsPerUnit);
}

/**
 * Calculate total calories from quantity and calories per unit
 * When unit is "kilograms", quantity is in kg and needs to be converted to units using weightGrams
 */
export function calculateTotalCalories(
  quantity: number,
  caloriesPerUnit: number,
  unit?: Unit,
  weightGrams?: number,
): number {
  // If unit is kilograms and weightGrams is provided, convert quantity (kg) to units
  if (unit === 'kilograms' && weightGrams && weightGrams > 0) {
    // Convert quantity (kg) to number of units: quantity * 1000 / weightGrams
    const numberOfUnits = (quantity * 1000) / weightGrams;
    return Math.round(numberOfUnits * caloriesPerUnit);
  }
  // Otherwise, quantity is already in units
  return Math.round(quantity * caloriesPerUnit);
}

/**
 * Calculate total calories for an inventory item
 * Handles unit conversion when unit is "kilograms"
 */
export function calculateItemTotalCalories(item: InventoryItem): number {
  if (!item.caloriesPerUnit) {
    return 0;
  }
  return calculateTotalCalories(
    item.quantity,
    item.caloriesPerUnit,
    item.unit,
    item.weightGrams,
  );
}

/**
 * Get default weight per unit from a template
 * Returns undefined if template has no weight data
 * Only food items have weight data
 */
export function getTemplateWeightPerUnit(
  template: RecommendedItemDefinition,
): number | undefined {
  return isFoodRecommendedItem(template)
    ? template.weightGramsPerUnit
    : undefined;
}

/**
 * Get default calories per unit from a template
 * If template has caloriesPer100g and weightGramsPerUnit, calculates from those
 * Otherwise returns the direct caloriesPerUnit value
 * Only food items have calorie data
 */
export function getTemplateCaloriesPerUnit(
  template: RecommendedItemDefinition,
): number | undefined {
  if (!isFoodRecommendedItem(template)) {
    return undefined;
  }

  // If both weight and caloriesPer100g are available, calculate
  if (template.weightGramsPerUnit && template.caloriesPer100g) {
    return calculateCaloriesFromWeight(
      template.weightGramsPerUnit,
      template.caloriesPer100g,
    );
  }
  // Otherwise return direct value
  return template.caloriesPerUnit;
}

/**
 * Calculate calories per unit based on user-provided or template values
 * Priority: user-provided caloriesPerUnit > calculated from weight > template default
 */
export function resolveCaloriesPerUnit(
  userCaloriesPerUnit: number | undefined,
  userWeightGrams: number | undefined,
  templateCaloriesPer100g: number | undefined,
  templateCaloriesPerUnit: number | undefined,
): number | undefined {
  // User explicitly set calories
  if (userCaloriesPerUnit !== undefined && userCaloriesPerUnit > 0) {
    return userCaloriesPerUnit;
  }

  // Calculate from user weight and template caloriesPer100g
  if (
    userWeightGrams !== undefined &&
    userWeightGrams > 0 &&
    templateCaloriesPer100g !== undefined
  ) {
    return calculateCaloriesFromWeight(
      userWeightGrams,
      templateCaloriesPer100g,
    );
  }

  // Fall back to template default
  return templateCaloriesPerUnit;
}

/**
 * Format weight for display (convert large grams to kg)
 */
export function formatWeight(grams: number): string {
  if (grams >= GRAMS_TO_KG_THRESHOLD) {
    const kg = grams / GRAMS_TO_KG_THRESHOLD;
    return `${kg.toFixed(1)} kg`;
  }
  return `${grams} g`;
}

/**
 * Format calories for display (add kcal suffix)
 */
export function formatCalories(calories: number): string {
  if (calories >= CALORIE_DISPLAY_THRESHOLD) {
    return `${(calories / CALORIE_DISPLAY_THRESHOLD).toFixed(1)} kcal`;
  }
  return `${calories} kcal`;
}
