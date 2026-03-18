/**
 * Additional mutation-killing tests for calories.ts
 * Targets surviving mutants from issue #271 mutation testing report.
 */
import { describe, it, expect } from 'vitest';
import {
  calculateTotalCalories,
  calculateItemTotalCalories,
  getTemplateCaloriesPerUnit,
} from './calories';
import type { RecommendedItemDefinition } from '@/shared/types';
import {
  createItemId,
  createCategoryId,
  createProductTemplateId,
  createQuantity,
} from '@/shared/types';
import { createMockInventoryItem } from '@/shared/utils/test/factories';

// ============================================================================
// L46: EqualityOperator - weightGrams > 0
// Mutant: >= 0 (would include items with 0 weightGrams)
// ============================================================================
describe('L46: weightGrams > 0 boundary in calculateTotalCalories', () => {
  it('weightGrams=0 uses direct quantity*caloriesPerUnit (not kg conversion)', () => {
    // unit=kilograms, weightGrams=0: should NOT use kg conversion
    // Original: 0 > 0 is false -> uses direct: quantity * caloriesPerUnit
    // Mutant (>=0): 0 >= 0 is true -> uses kg: (quantity * 1000) / 0 = Infinity * cals = Infinity
    const result = calculateTotalCalories(2, 500, 'kilograms', 0);
    // Direct calculation: round(2 * 500) = 1000
    expect(result).toBe(1000);
    expect(Number.isFinite(result)).toBe(true);
  });

  it('positive weightGrams with kilograms unit uses kg conversion', () => {
    // unit=kilograms, weightGrams=1000
    // kg conversion: (2 * 1000) / 1000 * 500 = 1000
    const result = calculateTotalCalories(2, 500, 'kilograms', 1000);
    expect(result).toBe(1000);
  });

  it('non-kilograms unit ignores weightGrams', () => {
    const result = calculateTotalCalories(3, 200, 'pieces', 500);
    // Direct: round(3 * 200) = 600
    expect(result).toBe(600);
  });
});

// ============================================================================
// L93: ConditionalExpression/BlockStatement - !isFoodRecommendedItem check
// Mutant: condition → false (never return undefined), block → {} (empty)
// ============================================================================
describe('L93: getTemplateCaloriesPerUnit for non-food items', () => {
  it('returns undefined for non-food recommended items', () => {
    const nonFoodItem: RecommendedItemDefinition = {
      id: createProductTemplateId('flashlight'),
      i18nKey: 'flashlight',
      category: 'tools-supplies',
      baseQuantity: createQuantity(1),
      unit: 'pieces',
      scaleWithPeople: false,
      scaleWithDays: false,
    };

    const result = getTemplateCaloriesPerUnit(nonFoodItem);
    // Non-food items should return undefined
    expect(result).toBeUndefined();
  });

  it('returns calories for food recommended items with caloriesPerUnit', () => {
    const foodItem: RecommendedItemDefinition = {
      id: createProductTemplateId('rice'),
      i18nKey: 'rice',
      category: 'food',
      baseQuantity: createQuantity(1),
      unit: 'kilograms',
      scaleWithPeople: true,
      scaleWithDays: true,
      caloriesPerUnit: 3600,
      caloriesPer100g: 360,
      weightGramsPerUnit: 1000,
    };

    const result = getTemplateCaloriesPerUnit(foodItem);
    expect(result).toBeDefined();
    expect(result).toBeGreaterThan(0);
  });
});

// ============================================================================
// calculateItemTotalCalories - items with null/undefined/NaN caloriesPerUnit
// ============================================================================
describe('calculateItemTotalCalories edge cases', () => {
  it('returns 0 for item with null caloriesPerUnit', () => {
    const item = createMockInventoryItem({
      id: createItemId('null-cal'),
      categoryId: createCategoryId('food'),
      quantity: createQuantity(5),
      unit: 'pieces',
      caloriesPerUnit: undefined,
    });

    const result = calculateItemTotalCalories(item);
    expect(result).toBe(0);
  });

  it('returns 0 for item with NaN caloriesPerUnit', () => {
    const item = createMockInventoryItem({
      id: createItemId('nan-cal'),
      categoryId: createCategoryId('food'),
      quantity: createQuantity(5),
      unit: 'pieces',
      caloriesPerUnit: Number.NaN,
    });

    const result = calculateItemTotalCalories(item);
    expect(result).toBe(0);
  });

  it('returns correct calories for item with valid caloriesPerUnit', () => {
    const item = createMockInventoryItem({
      id: createItemId('valid-cal'),
      categoryId: createCategoryId('food'),
      quantity: createQuantity(3),
      unit: 'pieces',
      caloriesPerUnit: 200,
    });

    const result = calculateItemTotalCalories(item);
    expect(result).toBe(600); // 3 * 200
  });
});
