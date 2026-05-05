/**
 * Mutation-killing tests for itemMatching.ts
 *
 * Targets surviving mutants:
 * - L143 ConditionalExpression: true (in sumMatchingItemsCalories reduce)
 * - L166 ConditionalExpression: true (in sumMatchingItemsCaloriesByType reduce)
 */
import { describe, it, expect } from 'vitest';
import {
  sumMatchingItemsCalories,
  sumMatchingItemsCaloriesByType,
} from './itemMatching';
import {
  createMockInventoryItem,
  createMockRecommendedItem,
} from '@/shared/utils/test/factories';
import {
  createProductTemplateId,
  createQuantity,
  createCategoryId,
} from '@/shared/types';

describe('itemMatching mutation killers', () => {
  const categoryId = 'food-water';
  const itemTypeId = createProductTemplateId('test-food');

  describe('L143 ConditionalExpression true: sumMatchingItemsCalories calorie check', () => {
    it('uses defaultCaloriesPerUnit when item has no caloriesPerUnit', () => {
      // L143: `if (item.caloriesPerUnit != null && Number.isFinite(item.caloriesPerUnit))`
      // Mutant `true`: always enters the calculateItemTotalCalories branch
      // which returns 0 when caloriesPerUnit is null -> ignores defaultCaloriesPerUnit
      const item = createMockInventoryItem({
        itemType: itemTypeId,
        categoryId: createCategoryId(categoryId),
        quantity: createQuantity(5),
        caloriesPerUnit: undefined, // No calories set
      });

      const recItem = createMockRecommendedItem({
        id: itemTypeId,
        category: categoryId,
      });

      const defaultCal = 100;
      const result = sumMatchingItemsCalories([item], recItem, defaultCal);

      // Correct: no caloriesPerUnit -> fallback to quantity * defaultCaloriesPerUnit = 5 * 100 = 500
      // Mutant (true): calculateItemTotalCalories with null caloriesPerUnit = 0
      expect(result).toBe(500);
    });

    it('uses calculateItemTotalCalories when item has valid caloriesPerUnit', () => {
      const item = createMockInventoryItem({
        itemType: itemTypeId,
        categoryId: createCategoryId(categoryId),
        quantity: createQuantity(3),
        caloriesPerUnit: 200,
      });

      const recItem = createMockRecommendedItem({
        id: itemTypeId,
        category: categoryId,
      });

      const result = sumMatchingItemsCalories([item], recItem, 50);

      // With caloriesPerUnit=200 and quantity=3: 3 * 200 = 600
      // Should NOT use defaultCaloriesPerUnit (50)
      expect(result).toBe(600);
      expect(result).not.toBe(150); // not 3 * 50
    });

    it('returns 0 when no matching items and default is non-zero', () => {
      const recItem = createMockRecommendedItem({
        id: createProductTemplateId('nonexistent'),
        category: categoryId,
      });

      const result = sumMatchingItemsCalories([], recItem, 100);
      expect(result).toBe(0);
    });
  });

  describe('L166 ConditionalExpression true: sumMatchingItemsCaloriesByType calorie check', () => {
    it('uses defaultCaloriesPerUnit when item has no caloriesPerUnit', () => {
      const item = createMockInventoryItem({
        itemType: itemTypeId,
        categoryId: createCategoryId(categoryId),
        quantity: createQuantity(4),
        caloriesPerUnit: undefined,
      });

      const defaultCal = 150;
      const result = sumMatchingItemsCaloriesByType(
        [item],
        itemTypeId as unknown as string,
        defaultCal,
      );

      // Correct: 4 * 150 = 600
      // Mutant (true): calculateItemTotalCalories(null caloriesPerUnit) = 0
      expect(result).toBe(600);
    });

    it('uses calculateItemTotalCalories when item has valid caloriesPerUnit', () => {
      const item = createMockInventoryItem({
        itemType: itemTypeId,
        categoryId: createCategoryId(categoryId),
        quantity: createQuantity(2),
        caloriesPerUnit: 300,
      });

      const result = sumMatchingItemsCaloriesByType(
        [item],
        itemTypeId as unknown as string,
        50,
      );

      // 2 * 300 = 600, not 2 * 50 = 100
      expect(result).toBe(600);
    });
  });
});
