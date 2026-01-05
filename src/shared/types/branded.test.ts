import { describe, it, expect } from '@jest/globals';
import {
  createItemId,
  createCategoryId,
  createProductTemplateId,
  createAlertId,
  isItemId,
  isCategoryId,
} from './branded';

describe('branded types', () => {
  describe('createItemId', () => {
    it('creates an ItemId from a string', () => {
      const id = createItemId('test-item-123');
      expect(id).toBe('test-item-123');
      // Type check: should be assignable to ItemId
      const itemId: string & { readonly __brand: 'ItemId' } = id;
      expect(itemId).toBe('test-item-123');
    });
  });

  describe('createCategoryId', () => {
    it('creates a CategoryId from a string', () => {
      const id = createCategoryId('water-beverages');
      expect(id).toBe('water-beverages');
      // Type check: should be assignable to CategoryId
      const categoryId: string & { readonly __brand: 'CategoryId' } = id;
      expect(categoryId).toBe('water-beverages');
    });
  });

  describe('createProductTemplateId', () => {
    it('creates a ProductTemplateId from a string', () => {
      const id = createProductTemplateId('bottled-water');
      expect(id).toBe('bottled-water');
      // Type check: should be assignable to ProductTemplateId
      const templateId: string & {
        readonly __brand: 'ProductTemplateId';
      } = id;
      expect(templateId).toBe('bottled-water');
    });

    it('handles custom template IDs', () => {
      const id = createProductTemplateId('custom-template-123');
      expect(id).toBe('custom-template-123');
    });
  });

  describe('createAlertId', () => {
    it('creates an AlertId from a string', () => {
      const id = createAlertId('backup-reminder');
      expect(id).toBe('backup-reminder');
      // Type check: should be assignable to AlertId
      const alertId: string & { readonly __brand: 'AlertId' } = id;
      expect(alertId).toBe('backup-reminder');
    });

    it('handles various alert IDs', () => {
      const id1 = createAlertId('expiring-item-123');
      const id2 = createAlertId('category-out-of-stock');
      expect(id1).toBe('expiring-item-123');
      expect(id2).toBe('category-out-of-stock');
    });
  });

  describe('isItemId', () => {
    it('returns true for valid ItemId', () => {
      const id = createItemId('test-item');
      expect(isItemId(id)).toBe(true);
    });

    it('returns false for non-string values', () => {
      expect(isItemId(null)).toBe(false);
      expect(isItemId(undefined)).toBe(false);
      expect(isItemId(123)).toBe(false);
      expect(isItemId({})).toBe(false);
    });

    it('returns false for empty strings', () => {
      expect(isItemId('')).toBe(false);
    });
  });

  describe('isCategoryId', () => {
    it('returns true for valid CategoryId', () => {
      const id = createCategoryId('water-beverages');
      expect(isCategoryId(id)).toBe(true);
    });

    it('returns false for non-string values', () => {
      expect(isCategoryId(null)).toBe(false);
      expect(isCategoryId(undefined)).toBe(false);
      expect(isCategoryId(123)).toBe(false);
      expect(isCategoryId({})).toBe(false);
    });

    it('returns false for empty strings', () => {
      expect(isCategoryId('')).toBe(false);
    });
  });
});
