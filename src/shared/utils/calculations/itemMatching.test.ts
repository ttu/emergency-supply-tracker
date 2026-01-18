import { describe, it, expect } from 'vitest';
import {
  createMockInventoryItem,
  createMockRecommendedItem,
} from '@/shared/utils/test/factories';
import { createProductTemplateId } from '@/shared/types';
import {
  findMatchingItems,
  findMatchingItemsByType,
  itemMatchesRecommendedId,
  sumMatchingItemsQuantity,
  sumMatchingItemsQuantityByType,
  hasMarkedAsEnough,
  sumMatchingItemsCalories,
  sumMatchingItemsCaloriesByType,
} from './itemMatching';

describe('itemMatching', () => {
  describe('findMatchingItems', () => {
    it('matches items by itemType directly', () => {
      const bottledWaterId = createProductTemplateId('bottled-water');
      const cannedFoodId = createProductTemplateId('canned-food');

      const items = [
        createMockInventoryItem({ itemType: bottledWaterId, name: 'Water' }),
        createMockInventoryItem({ itemType: cannedFoodId, name: 'Beans' }),
      ];
      const recommendedItem = createMockRecommendedItem({ id: bottledWaterId });

      const result = findMatchingItems(items, recommendedItem);

      expect(result).toHaveLength(1);
      expect(result[0].itemType).toBe(bottledWaterId);
    });

    it('matches items by normalized name for non-custom items', () => {
      const bottledWaterId = createProductTemplateId('bottled-water');
      const otherTypeId = createProductTemplateId('other-type');

      const items = [
        createMockInventoryItem({
          itemType: otherTypeId,
          name: 'Bottled Water',
        }),
      ];
      const recommendedItem = createMockRecommendedItem({ id: bottledWaterId });

      const result = findMatchingItems(items, recommendedItem);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Bottled Water');
    });

    it('does not match custom items by name', () => {
      const bottledWaterId = createProductTemplateId('bottled-water');

      const items = [
        createMockInventoryItem({
          itemType: 'custom',
          name: 'Bottled Water',
        }),
      ];
      const recommendedItem = createMockRecommendedItem({ id: bottledWaterId });

      const result = findMatchingItems(items, recommendedItem);

      expect(result).toHaveLength(0);
    });

    it('returns multiple matching items', () => {
      const bottledWaterId = createProductTemplateId('bottled-water');
      const cannedFoodId = createProductTemplateId('canned-food');

      const items = [
        createMockInventoryItem({
          itemType: bottledWaterId,
          name: 'Water 1',
        }),
        createMockInventoryItem({
          itemType: bottledWaterId,
          name: 'Water 2',
        }),
        createMockInventoryItem({ itemType: cannedFoodId, name: 'Beans' }),
      ];
      const recommendedItem = createMockRecommendedItem({ id: bottledWaterId });

      const result = findMatchingItems(items, recommendedItem);

      expect(result).toHaveLength(2);
    });

    it('returns empty array when no matches', () => {
      const bottledWaterId = createProductTemplateId('bottled-water');
      const cannedFoodId = createProductTemplateId('canned-food');

      const items = [
        createMockInventoryItem({ itemType: cannedFoodId, name: 'Beans' }),
      ];
      const recommendedItem = createMockRecommendedItem({ id: bottledWaterId });

      const result = findMatchingItems(items, recommendedItem);

      expect(result).toHaveLength(0);
    });
  });

  describe('findMatchingItemsByType', () => {
    it('matches only by itemType, not name', () => {
      const bottledWaterId = createProductTemplateId('bottled-water');
      const otherTypeId = createProductTemplateId('other-type');

      const items = [
        createMockInventoryItem({ itemType: bottledWaterId, name: 'Water' }),
        createMockInventoryItem({
          itemType: otherTypeId,
          name: 'Bottled Water',
        }),
      ];

      const result = findMatchingItemsByType(items, 'bottled-water');

      expect(result).toHaveLength(1);
      expect(result[0].itemType).toBe(bottledWaterId);
    });
  });

  describe('itemMatchesRecommendedId', () => {
    it('returns true for matching itemType', () => {
      const bottledWaterId = createProductTemplateId('bottled-water');
      const item = createMockInventoryItem({ itemType: bottledWaterId });

      expect(itemMatchesRecommendedId(item, 'bottled-water')).toBe(true);
    });

    it('returns false for non-matching itemType', () => {
      const cannedFoodId = createProductTemplateId('canned-food');
      const item = createMockInventoryItem({ itemType: cannedFoodId });

      expect(itemMatchesRecommendedId(item, 'bottled-water')).toBe(false);
    });
  });

  describe('sumMatchingItemsQuantity', () => {
    it('sums quantities of matching items', () => {
      const bottledWaterId = createProductTemplateId('bottled-water');
      const cannedFoodId = createProductTemplateId('canned-food');

      const items = [
        createMockInventoryItem({
          itemType: bottledWaterId,
          quantity: 5,
        }),
        createMockInventoryItem({
          itemType: bottledWaterId,
          quantity: 3,
        }),
        createMockInventoryItem({ itemType: cannedFoodId, quantity: 10 }),
      ];
      const recommendedItem = createMockRecommendedItem({ id: bottledWaterId });

      const result = sumMatchingItemsQuantity(items, recommendedItem);

      expect(result).toBe(8);
    });

    it('returns 0 when no matches', () => {
      const bottledWaterId = createProductTemplateId('bottled-water');
      const cannedFoodId = createProductTemplateId('canned-food');

      const items = [
        createMockInventoryItem({ itemType: cannedFoodId, quantity: 10 }),
      ];
      const recommendedItem = createMockRecommendedItem({ id: bottledWaterId });

      const result = sumMatchingItemsQuantity(items, recommendedItem);

      expect(result).toBe(0);
    });
  });

  describe('sumMatchingItemsQuantityByType', () => {
    it('sums quantities using strict type matching only', () => {
      const bottledWaterId = createProductTemplateId('bottled-water');
      const otherTypeId = createProductTemplateId('other-type');

      const items = [
        createMockInventoryItem({
          itemType: bottledWaterId,
          quantity: 5,
        }),
        createMockInventoryItem({
          itemType: otherTypeId,
          name: 'Bottled Water',
          quantity: 3,
        }),
      ];

      const result = sumMatchingItemsQuantityByType(items, 'bottled-water');

      // Only item 1 should match (by type), not item 2 (by name)
      expect(result).toBe(5);
    });
  });

  describe('hasMarkedAsEnough', () => {
    it('returns true when any matching item is marked as enough', () => {
      const bottledWaterId = createProductTemplateId('bottled-water');

      const items = [
        createMockInventoryItem({
          itemType: bottledWaterId,
          markedAsEnough: false,
        }),
        createMockInventoryItem({
          itemType: bottledWaterId,
          markedAsEnough: true,
        }),
      ];
      const recommendedItem = createMockRecommendedItem({ id: bottledWaterId });

      const result = hasMarkedAsEnough(items, recommendedItem);

      expect(result).toBe(true);
    });

    it('returns false when no matching items are marked as enough', () => {
      const bottledWaterId = createProductTemplateId('bottled-water');

      const items = [
        createMockInventoryItem({
          itemType: bottledWaterId,
          markedAsEnough: false,
        }),
      ];
      const recommendedItem = createMockRecommendedItem({ id: bottledWaterId });

      const result = hasMarkedAsEnough(items, recommendedItem);

      expect(result).toBe(false);
    });

    it('returns false when no matching items exist', () => {
      const bottledWaterId = createProductTemplateId('bottled-water');
      const cannedFoodId = createProductTemplateId('canned-food');

      const items = [
        createMockInventoryItem({
          itemType: cannedFoodId,
          markedAsEnough: true,
        }),
      ];
      const recommendedItem = createMockRecommendedItem({ id: bottledWaterId });

      const result = hasMarkedAsEnough(items, recommendedItem);

      expect(result).toBe(false);
    });
  });

  describe('sumMatchingItemsCalories', () => {
    it('sums calories from matching items', () => {
      const cannedFoodId = createProductTemplateId('canned-food');

      const items = [
        createMockInventoryItem({
          itemType: cannedFoodId,
          quantity: 2,
          caloriesPerUnit: 500,
        }),
        createMockInventoryItem({
          itemType: cannedFoodId,
          quantity: 3,
          caloriesPerUnit: 300,
        }),
      ];
      const recommendedItem = createMockRecommendedItem({
        id: cannedFoodId,
        category: 'food',
      });

      const result = sumMatchingItemsCalories(items, recommendedItem);

      expect(result).toBe(2 * 500 + 3 * 300); // 1900
    });

    it('uses default calories when item has none', () => {
      const cannedFoodId = createProductTemplateId('canned-food');

      const items = [
        createMockInventoryItem({
          itemType: cannedFoodId,
          quantity: 2,
          caloriesPerUnit: undefined,
        }),
      ];
      const recommendedItem = createMockRecommendedItem({ id: cannedFoodId });

      const result = sumMatchingItemsCalories(items, recommendedItem, 400);

      expect(result).toBe(2 * 400); // 800
    });

    it('handles zero calories per unit correctly', () => {
      const cannedFoodId = createProductTemplateId('canned-food');

      const items = [
        createMockInventoryItem({
          itemType: cannedFoodId,
          quantity: 5,
          caloriesPerUnit: 0, // Zero calories (e.g., water)
        }),
      ];
      const recommendedItem = createMockRecommendedItem({
        id: cannedFoodId,
        category: 'food',
      });

      const result = sumMatchingItemsCalories(items, recommendedItem, 400);

      // Should use 0 calories, not the default 400
      expect(result).toBe(0);
    });

    it('returns 0 when no matches', () => {
      const bottledWaterId = createProductTemplateId('bottled-water');
      const cannedFoodId = createProductTemplateId('canned-food');

      const items = [
        createMockInventoryItem({
          itemType: bottledWaterId,
          quantity: 5,
          caloriesPerUnit: 0,
        }),
      ];
      const recommendedItem = createMockRecommendedItem({ id: cannedFoodId });

      const result = sumMatchingItemsCalories(items, recommendedItem);

      expect(result).toBe(0);
    });
  });

  describe('sumMatchingItemsCaloriesByType', () => {
    it('sums calories using strict type matching', () => {
      const cannedFoodId = createProductTemplateId('canned-food');
      const otherTypeId = createProductTemplateId('other-type');

      const items = [
        createMockInventoryItem({
          itemType: cannedFoodId,
          quantity: 2,
          caloriesPerUnit: 500,
        }),
        createMockInventoryItem({
          itemType: otherTypeId,
          name: 'Canned Food',
          quantity: 3,
          caloriesPerUnit: 300,
        }),
      ];

      const result = sumMatchingItemsCaloriesByType(items, 'canned-food');

      // Only item 1 should match
      expect(result).toBe(2 * 500); // 1000
    });

    it('uses default calories when item has none', () => {
      const cannedFoodId = createProductTemplateId('canned-food');

      const items = [
        createMockInventoryItem({
          itemType: cannedFoodId,
          quantity: 3,
          caloriesPerUnit: undefined,
        }),
      ];

      const result = sumMatchingItemsCaloriesByType(items, 'canned-food', 250);

      expect(result).toBe(3 * 250); // 750
    });

    it('handles zero calories per unit correctly', () => {
      const cannedFoodId = createProductTemplateId('canned-food');

      const items = [
        createMockInventoryItem({
          itemType: cannedFoodId,
          quantity: 5,
          caloriesPerUnit: 0, // Zero calories (e.g., water)
        }),
      ];

      const result = sumMatchingItemsCaloriesByType(items, 'canned-food', 400);

      // Should use 0 calories, not the default 400
      expect(result).toBe(0);
    });
  });
});
