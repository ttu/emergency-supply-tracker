import { describe, it, expect } from 'vitest';
import {
  createCategoryId,
  createItemId,
  createProductTemplateId,
  createQuantity,
} from '@/shared/types';
import type { RecommendedItemDefinition } from '@/shared/types';
import { createMockInventoryItem } from '@/shared/utils/test/factories';
import {
  calculateTotalCalories,
  calculateItemTotalCalories,
  getTemplateCaloriesPerUnit,
} from './calories';

describe('calories behaviors', () => {
  describe('calculateTotalCalories kg conversion (L46)', () => {
    it('does not convert when weightGrams is exactly 0 (L46: weightGrams > 0, not >= 0)', () => {
      // unit is 'kilograms', weightGrams is 0 — should NOT enter the kg branch
      // Falls back to direct: quantity * caloriesPerUnit
      const result = calculateTotalCalories(2, 400, 'kilograms', 0);
      expect(result).toBe(800); // 2 * 400 = 800 (direct multiplication)
    });

    it('converts when weightGrams is positive', () => {
      // unit is 'kilograms', weightGrams is 100 — enters the kg branch
      const result = calculateTotalCalories(1, 400, 'kilograms', 100);
      expect(result).toBe(4000); // (1 * 1000 / 100) * 400 = 4000
    });

    it('does not convert when unit is not kilograms even with valid weightGrams', () => {
      const result = calculateTotalCalories(5, 200, 'pieces', 100);
      expect(result).toBe(1000); // 5 * 200 = 1000 (direct)
    });

    it('does not convert when weightGrams is negative', () => {
      const result = calculateTotalCalories(2, 400, 'kilograms', -100);
      expect(result).toBe(800); // Falls back to direct: 2 * 400
    });
  });

  describe('getTemplateCaloriesPerUnit non-food check (L93)', () => {
    it('returns undefined for non-food items (L93: false mutant — cannot skip the check)', () => {
      const nonFoodTemplate: RecommendedItemDefinition = {
        id: createProductTemplateId('flashlight'),
        i18nKey: 'flashlight',
        category: 'tools-supplies',
        baseQuantity: createQuantity(1),
        unit: 'pieces',
        scaleWithPeople: false,
        scaleWithDays: false,
      };
      expect(getTemplateCaloriesPerUnit(nonFoodTemplate)).toBeUndefined();
    });

    it('returns calories for food items (L93: block must not be empty)', () => {
      const foodTemplate: RecommendedItemDefinition = {
        id: createProductTemplateId('tuna'),
        i18nKey: 'tuna',
        category: 'food',
        baseQuantity: createQuantity(1),
        unit: 'cans',
        scaleWithPeople: true,
        scaleWithDays: true,
        weightGramsPerUnit: 150,
        caloriesPer100g: 130,
      };
      const result = getTemplateCaloriesPerUnit(foodTemplate);
      expect(result).toBeDefined();
      expect(result).toBe(195); // 150 * 130 / 100
    });

    it('returns caloriesPerUnit for food items without weight data', () => {
      const foodTemplate: RecommendedItemDefinition = {
        id: createProductTemplateId('energy-bar'),
        i18nKey: 'energy-bar',
        category: 'food',
        baseQuantity: createQuantity(1),
        unit: 'pieces',
        scaleWithPeople: true,
        scaleWithDays: false,
        caloriesPerUnit: 250,
      };
      expect(getTemplateCaloriesPerUnit(foodTemplate)).toBe(250);
    });
  });
});

// ============================================================================
// Merged from calories.behaviors2.test.ts
// ============================================================================

// ============================================================================
// L46: EqualityOperator - weightGrams > 0
// Mutant: >= 0 (would include items with 0 weightGrams)
// ============================================================================
describe('weightGrams > 0 boundary in calculateTotalCalories', () => {
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
describe('getTemplateCaloriesPerUnit for non-food items', () => {
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
