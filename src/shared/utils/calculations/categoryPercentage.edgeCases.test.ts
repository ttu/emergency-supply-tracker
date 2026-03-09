import { describe, it, expect } from 'vitest';
import { calculateCategoryPercentage } from './categoryPercentage';
import { createItemId, createCategoryId, createQuantity } from '@/shared/types';
import { createMockHousehold } from '@/shared/utils/test/factories';
import { createMockInventoryItem } from './__helpers__/categoryPercentage.helpers';

describe('calculateCategoryPercentage', () => {
  describe('edge cases', () => {
    it('returns 0% with hasEnough=true for category with items but no recommended items', () => {
      // When there are no recommendations, there are no requirements to meet
      // percentage is 0 (nothing to measure against), hasEnough is true (no requirements)
      const household = createMockHousehold({
        adults: 1,
        children: 0,
        pets: 0,
        supplyDurationDays: 3,
        useFreezer: true,
      });

      const items = [
        createMockInventoryItem({
          id: createItemId('1'),
          categoryId: createCategoryId('custom-category'),
          quantity: createQuantity(5),
        }),
      ];

      const result = calculateCategoryPercentage(
        'custom-category',
        items,
        household,
        [],
        [], // No recommended items
      );

      expect(result.percentage).toBe(0);
      expect(result.hasEnough).toBe(true);
      expect(result.hasRecommendations).toBe(false);
      expect(result.totalActual).toBe(1); // Item count
    });

    it('returns 0% with hasEnough=true for empty category with no recommended items', () => {
      // When there are no recommendations, there are no requirements to meet
      const household = createMockHousehold({
        adults: 1,
        children: 0,
        pets: 0,
        supplyDurationDays: 3,
        useFreezer: true,
      });

      const result = calculateCategoryPercentage(
        'empty-category',
        [], // No items
        household,
        [],
        [], // No recommended items
      );

      expect(result.percentage).toBe(0);
      expect(result.hasEnough).toBe(true);
      expect(result.hasRecommendations).toBe(false);
      expect(result.totalActual).toBe(0); // No items
    });
  });
});
