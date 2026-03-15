import { describe, it, expect } from 'vitest';
import { calculateTotalCalories, getTemplateCaloriesPerUnit } from './calories';
import type { RecommendedItemDefinition } from '@/shared/types';
import { createProductTemplateId, createQuantity } from '@/shared/types';

describe('calories - mutation killing tests', () => {
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
