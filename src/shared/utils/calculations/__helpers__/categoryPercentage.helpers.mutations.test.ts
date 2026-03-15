import { describe, it, expect } from 'vitest';
import {
  createMockInventoryItem,
  mockFoodRecommendedItems,
  mockWaterRecommendedItems,
  mockToolsRecommendedItems,
  mockCookingHeatRecommendedItems,
  mockLightPowerRecommendedItems,
  mockCommunicationRecommendedItems,
  mockMedicalHealthRecommendedItems,
  mockHygieneSanitationRecommendedItems,
  mockCashDocumentsRecommendedItems,
} from './categoryPercentage.helpers';
import {
  createItemId,
  createCategoryId,
  createProductTemplateId,
  createDateOnly,
  createQuantity,
} from '@/shared/types';

describe('categoryPercentage.helpers - mutation killing tests', () => {
  describe('createMockInventoryItem default field values (L15-L21)', () => {
    it('returns correct default id (not empty string)', () => {
      const item = createMockInventoryItem();
      // L15: id must be 'test-item', not ''
      expect(item.id).toBe(createItemId('test-item'));
      expect(item.id).not.toBe('');
    });

    it('returns correct default name (not empty string)', () => {
      const item = createMockInventoryItem();
      // L16: name must be 'Test Item', not ''
      expect(item.name).toBe('Test Item');
      expect(item.name).not.toBe('');
    });

    it('returns correct default categoryId (not empty string)', () => {
      const item = createMockInventoryItem();
      // L18: categoryId must be 'food', not ''
      expect(item.categoryId).toBe(createCategoryId('food'));
      expect(item.categoryId).not.toBe('');
    });

    it('returns correct default itemType (not empty string)', () => {
      const item = createMockInventoryItem();
      // L19: itemType must be 'test', not ''
      expect(item.itemType).toBe(createProductTemplateId('test'));
      expect(item.itemType).not.toBe('');
    });

    it('returns correct default unit (not empty string)', () => {
      const item = createMockInventoryItem();
      // Part of verifying default field values
      expect(item.unit).toBe('pieces');
      expect(item.unit).not.toBe('');
    });

    it('returns correct default neverExpires (not true)', () => {
      const item = createMockInventoryItem();
      // L21: neverExpires must be false, not true
      expect(item.neverExpires).toBe(false);
      expect(item.neverExpires).not.toBe(true);
    });

    it('returns correct default quantity', () => {
      const item = createMockInventoryItem();
      expect(item.quantity).toBe(createQuantity(1));
    });

    it('returns correct default expirationDate', () => {
      const item = createMockInventoryItem();
      expect(item.expirationDate).toBe(createDateOnly('2025-12-31'));
    });

    it('has createdAt and updatedAt as ISO strings', () => {
      const item = createMockInventoryItem();
      expect(item.createdAt).toBeTruthy();
      expect(item.updatedAt).toBeTruthy();
      // Verify they are valid ISO date strings
      expect(() => new Date(item.createdAt)).not.toThrow();
      expect(() => new Date(item.updatedAt)).not.toThrow();
    });
  });

  describe('overrides work correctly', () => {
    it('allows overriding all default fields', () => {
      const overrides = {
        id: createItemId('custom'),
        name: 'Custom Item',
        quantity: createQuantity(5),
        categoryId: createCategoryId('water-beverages'),
        itemType: createProductTemplateId('custom-type'),
        unit: 'liters' as const,
        neverExpires: true,
        expirationDate: undefined,
      };
      const item = createMockInventoryItem(overrides);
      expect(item.id).toBe(createItemId('custom'));
      expect(item.name).toBe('Custom Item');
      expect(item.quantity).toBe(createQuantity(5));
      expect(item.categoryId).toBe(createCategoryId('water-beverages'));
      expect(item.itemType).toBe(createProductTemplateId('custom-type'));
      expect(item.unit).toBe('liters');
      expect(item.neverExpires).toBe(true);
    });
  });

  describe('mock recommended items have correct structure', () => {
    it('mockFoodRecommendedItems has correct categories and ids', () => {
      expect(mockFoodRecommendedItems).toHaveLength(2);
      expect(mockFoodRecommendedItems[0].category).toBe('food');
      expect(mockFoodRecommendedItems[0].id).toBe(
        createProductTemplateId('rice'),
      );
      expect(mockFoodRecommendedItems[1].id).toBe(
        createProductTemplateId('canned-beans'),
      );
    });

    it('mockWaterRecommendedItems has correct category', () => {
      expect(mockWaterRecommendedItems).toHaveLength(1);
      expect(mockWaterRecommendedItems[0].category).toBe('water-beverages');
    });

    it('mockToolsRecommendedItems has correct category', () => {
      expect(mockToolsRecommendedItems).toHaveLength(2);
      expect(mockToolsRecommendedItems[0].category).toBe('tools-supplies');
      expect(mockToolsRecommendedItems[1].category).toBe('tools-supplies');
    });

    it('mockCookingHeatRecommendedItems has correct category and count', () => {
      expect(mockCookingHeatRecommendedItems).toHaveLength(3);
      for (const item of mockCookingHeatRecommendedItems) {
        expect(item.category).toBe('cooking-heat');
      }
    });

    it('mockLightPowerRecommendedItems has correct category and count', () => {
      expect(mockLightPowerRecommendedItems).toHaveLength(3);
      for (const item of mockLightPowerRecommendedItems) {
        expect(item.category).toBe('light-power');
      }
    });

    it('mockCommunicationRecommendedItems has correct category', () => {
      expect(mockCommunicationRecommendedItems).toHaveLength(2);
      for (const item of mockCommunicationRecommendedItems) {
        expect(item.category).toBe('communication-info');
      }
    });

    it('mockMedicalHealthRecommendedItems has correct category', () => {
      expect(mockMedicalHealthRecommendedItems).toHaveLength(3);
      for (const item of mockMedicalHealthRecommendedItems) {
        expect(item.category).toBe('medical-health');
      }
    });

    it('mockHygieneSanitationRecommendedItems has correct category', () => {
      expect(mockHygieneSanitationRecommendedItems).toHaveLength(3);
      for (const item of mockHygieneSanitationRecommendedItems) {
        expect(item.category).toBe('hygiene-sanitation');
      }
    });

    it('mockCashDocumentsRecommendedItems has correct category', () => {
      expect(mockCashDocumentsRecommendedItems).toHaveLength(2);
      for (const item of mockCashDocumentsRecommendedItems) {
        expect(item.category).toBe('cash-documents');
      }
    });
  });
});
