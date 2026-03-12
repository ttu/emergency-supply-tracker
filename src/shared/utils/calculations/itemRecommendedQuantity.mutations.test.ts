import { describe, it, expect } from 'vitest';
import { getRecommendedQuantityForItem } from './itemRecommendedQuantity';
import type {
  InventoryItem,
  HouseholdConfig,
  RecommendedItemDefinition,
} from '@/shared/types';
import {
  createItemId,
  createCategoryId,
  createProductTemplateId,
  createQuantity,
} from '@/shared/types';

describe('itemRecommendedQuantity - mutation killing tests', () => {
  const household: HouseholdConfig = {
    adults: 2,
    children: 0,
    pets: 0,
    supplyDurationDays: 3,
    useFreezer: false,
  };

  const recommendedItems: RecommendedItemDefinition[] = [
    {
      id: createProductTemplateId('water'),
      i18nKey: 'water',
      category: 'water-beverages',
      baseQuantity: createQuantity(3),
      unit: 'liters',
      scaleWithPeople: true,
      scaleWithDays: true,
    },
  ];

  describe('L28: item.itemType && item.itemType !== "custom"', () => {
    it('returns 0 for items with no itemType (undefined)', () => {
      const item: InventoryItem = {
        id: createItemId('1'),
        name: 'Custom Water',
        itemType: undefined as unknown as InventoryItem['itemType'],
        categoryId: createCategoryId('water-beverages'),
        quantity: createQuantity(5),
        unit: 'liters',
        neverExpires: true,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };
      // If ConditionalExpression is true, it would try to find and match
      expect(
        getRecommendedQuantityForItem(item, household, recommendedItems),
      ).toBe(0);
    });

    it('returns 0 for items with itemType "custom"', () => {
      const item: InventoryItem = {
        id: createItemId('2'),
        name: 'Custom Item',
        itemType: 'custom',
        categoryId: createCategoryId('water-beverages'),
        quantity: createQuantity(5),
        unit: 'liters',
        neverExpires: true,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };
      // If !== 'custom' is replaced with || or "", it would match
      expect(
        getRecommendedQuantityForItem(item, household, recommendedItems),
      ).toBe(0);
    });

    it('returns 0 for items with empty string itemType', () => {
      const item: InventoryItem = {
        id: createItemId('3'),
        name: 'Empty Type',
        itemType: '' as unknown as InventoryItem['itemType'],
        categoryId: createCategoryId('water-beverages'),
        quantity: createQuantity(5),
        unit: 'liters',
        neverExpires: true,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };
      // If StringLiteral mutant replaces 'custom' with '', this would break
      expect(
        getRecommendedQuantityForItem(item, household, recommendedItems),
      ).toBe(0);
    });

    it('returns calculated quantity for items with valid itemType matching a recommendation', () => {
      const item: InventoryItem = {
        id: createItemId('4'),
        name: 'Water',
        itemType: createProductTemplateId('water'),
        categoryId: createCategoryId('water-beverages'),
        quantity: createQuantity(5),
        unit: 'liters',
        neverExpires: true,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };
      const result = getRecommendedQuantityForItem(
        item,
        household,
        recommendedItems,
      );
      // 3 (base) * 2 (adults) * 3 (days) = 18
      expect(result).toBe(18);
      expect(result).toBeGreaterThan(0);
    });

    it('returns 0 for items with valid non-custom itemType but no matching recommendation', () => {
      const item: InventoryItem = {
        id: createItemId('5'),
        name: 'Rice',
        itemType: createProductTemplateId('rice'),
        categoryId: createCategoryId('food'),
        quantity: createQuantity(2),
        unit: 'kilograms',
        neverExpires: true,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };
      expect(
        getRecommendedQuantityForItem(item, household, recommendedItems),
      ).toBe(0);
    });
  });
});
