import { describe, it, expect } from 'vitest';
import {
  createItemId,
  createCategoryId,
  createProductTemplateId,
  createAlertId,
  createDateOnly,
  createQuantity,
  createPercentage,
  isItemId,
  isCategoryId,
  isDateOnly,
  isQuantity,
  isPercentage,
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

  describe('createDateOnly', () => {
    it('creates a DateOnly from a valid date string', () => {
      const date = createDateOnly('2025-03-20');
      expect(date).toBe('2025-03-20');
      // Type check: should be assignable to DateOnly
      const dateOnly: string & { readonly __brand: 'DateOnly' } = date;
      expect(dateOnly).toBe('2025-03-20');
    });

    it('creates a DateOnly for leap year dates', () => {
      const date = createDateOnly('2024-02-29');
      expect(date).toBe('2024-02-29');
    });

    it('creates a DateOnly for first day of year', () => {
      const date = createDateOnly('2025-01-01');
      expect(date).toBe('2025-01-01');
    });

    it('creates a DateOnly for last day of year', () => {
      const date = createDateOnly('2025-12-31');
      expect(date).toBe('2025-12-31');
    });

    it('throws error for invalid format (missing dashes)', () => {
      expect(() => createDateOnly('20250320')).toThrow(
        'Invalid date format: "20250320". Expected YYYY-MM-DD format.',
      );
    });

    it('throws error for invalid format (wrong separator)', () => {
      expect(() => createDateOnly('2025/03/20')).toThrow(
        'Invalid date format: "2025/03/20". Expected YYYY-MM-DD format.',
      );
    });

    it('throws error for invalid format (too short)', () => {
      expect(() => createDateOnly('2025-03')).toThrow(
        'Invalid date format: "2025-03". Expected YYYY-MM-DD format.',
      );
    });

    it('throws error for invalid format (too long)', () => {
      expect(() => createDateOnly('2025-03-20-12')).toThrow(
        'Invalid date format: "2025-03-20-12". Expected YYYY-MM-DD format.',
      );
    });

    it('throws error for invalid format (non-numeric)', () => {
      expect(() => createDateOnly('2025-AB-20')).toThrow(
        'Invalid date format: "2025-AB-20". Expected YYYY-MM-DD format.',
      );
    });

    it('throws error for invalid date (invalid month)', () => {
      expect(() => createDateOnly('2025-13-20')).toThrow(
        'Invalid date: "2025-13-20". Date does not exist.',
      );
    });

    it('throws error for invalid date (invalid day)', () => {
      expect(() => createDateOnly('2025-02-30')).toThrow(
        'Invalid date: "2025-02-30". Date does not exist.',
      );
    });

    it('throws error for invalid date (non-leap year Feb 29)', () => {
      expect(() => createDateOnly('2025-02-29')).toThrow(
        'Invalid date: "2025-02-29". Date does not exist.',
      );
    });

    it('throws error for invalid date (day 0)', () => {
      expect(() => createDateOnly('2025-03-00')).toThrow(
        'Invalid date: "2025-03-00". Date does not exist.',
      );
    });

    it('throws error for invalid date (month 0)', () => {
      expect(() => createDateOnly('2025-00-20')).toThrow(
        'Invalid date: "2025-00-20". Date does not exist.',
      );
    });
  });

  describe('isDateOnly', () => {
    it('returns true for valid DateOnly', () => {
      const date = createDateOnly('2025-03-20');
      expect(isDateOnly(date)).toBe(true);
    });

    it('returns true for valid date string in correct format', () => {
      expect(isDateOnly('2025-12-31')).toBe(true);
      expect(isDateOnly('2024-02-29')).toBe(true); // Leap year
      expect(isDateOnly('2025-01-01')).toBe(true);
    });

    it('returns false for non-string values', () => {
      expect(isDateOnly(null)).toBe(false);
      expect(isDateOnly(undefined)).toBe(false);
      expect(isDateOnly(123)).toBe(false);
      expect(isDateOnly({})).toBe(false);
      expect(isDateOnly([])).toBe(false);
    });

    it('returns false for invalid format (missing dashes)', () => {
      expect(isDateOnly('20250320')).toBe(false);
    });

    it('returns false for invalid format (wrong separator)', () => {
      expect(isDateOnly('2025/03/20')).toBe(false);
    });

    it('returns false for invalid format (too short)', () => {
      expect(isDateOnly('2025-03')).toBe(false);
    });

    it('returns false for invalid format (too long)', () => {
      expect(isDateOnly('2025-03-20-12')).toBe(false);
    });

    it('returns false for invalid format (non-numeric)', () => {
      expect(isDateOnly('2025-AB-20')).toBe(false);
    });

    it('returns false for invalid date (invalid month)', () => {
      expect(isDateOnly('2025-13-20')).toBe(false);
    });

    it('returns false for invalid date (invalid day)', () => {
      expect(isDateOnly('2025-02-30')).toBe(false);
    });

    it('returns false for invalid date (non-leap year Feb 29)', () => {
      expect(isDateOnly('2025-02-29')).toBe(false);
    });

    it('returns false for invalid date (day 0)', () => {
      expect(isDateOnly('2025-03-00')).toBe(false);
    });

    it('returns false for invalid date (month 0)', () => {
      expect(isDateOnly('2025-00-20')).toBe(false);
    });

    it('returns false for empty string', () => {
      expect(isDateOnly('')).toBe(false);
    });
  });

  describe('createQuantity', () => {
    it('creates a Quantity from a valid non-negative number', () => {
      const qty = createQuantity(5);
      expect(qty).toBe(5);
      // Type check: should be assignable to Quantity
      const quantity: number & { readonly __brand: 'Quantity' } = qty;
      expect(quantity).toBe(5);
    });

    it('creates a Quantity for zero', () => {
      const qty = createQuantity(0);
      expect(qty).toBe(0);
    });

    it('creates a Quantity for decimal values', () => {
      const qty = createQuantity(3.5);
      expect(qty).toBe(3.5);
    });

    it('creates a Quantity for large numbers', () => {
      const qty = createQuantity(1000000);
      expect(qty).toBe(1000000);
    });

    it('throws error for negative values', () => {
      expect(() => createQuantity(-1)).toThrow(
        'Invalid quantity: -1. Quantity must be non-negative.',
      );
    });

    it('throws error for negative decimal values', () => {
      expect(() => createQuantity(-0.5)).toThrow(
        'Invalid quantity: -0.5. Quantity must be non-negative.',
      );
    });

    it('throws error for negative infinity', () => {
      expect(() => createQuantity(-Infinity)).toThrow(
        'Invalid quantity: -Infinity. Quantity must be a finite number.',
      );
    });

    it('throws error for NaN', () => {
      expect(() => createQuantity(Number.NaN)).toThrow(
        'Invalid quantity: NaN. Quantity must be a valid number.',
      );
    });

    it('throws error for positive infinity', () => {
      expect(() => createQuantity(Infinity)).toThrow(
        'Invalid quantity: Infinity. Quantity must be a finite number.',
      );
    });
  });

  describe('isQuantity', () => {
    it('returns true for valid Quantity', () => {
      const qty = createQuantity(5);
      expect(isQuantity(qty)).toBe(true);
    });

    it('returns true for zero', () => {
      expect(isQuantity(0)).toBe(true);
    });

    it('returns true for positive numbers', () => {
      expect(isQuantity(10)).toBe(true);
      expect(isQuantity(3.5)).toBe(true);
      expect(isQuantity(1000000)).toBe(true);
    });

    it('returns false for negative numbers', () => {
      expect(isQuantity(-1)).toBe(false);
      expect(isQuantity(-0.5)).toBe(false);
      expect(isQuantity(-Infinity)).toBe(false);
    });

    it('returns false for NaN', () => {
      expect(isQuantity(Number.NaN)).toBe(false);
    });

    it('returns false for non-number values', () => {
      expect(isQuantity(null)).toBe(false);
      expect(isQuantity(undefined)).toBe(false);
      expect(isQuantity('5')).toBe(false);
      expect(isQuantity({})).toBe(false);
      expect(isQuantity([])).toBe(false);
    });

    it('returns false for infinity', () => {
      expect(isQuantity(Infinity)).toBe(false);
      expect(isQuantity(-Infinity)).toBe(false);
    });
  });

  describe('createPercentage', () => {
    it('creates a Percentage from a valid value (0-100)', () => {
      const pct = createPercentage(75);
      expect(pct).toBe(75);
      // Type check: should be assignable to Percentage
      const percentage: number & { readonly __brand: 'Percentage' } = pct;
      expect(percentage).toBe(75);
    });

    it('creates a Percentage for 0', () => {
      const pct = createPercentage(0);
      expect(pct).toBe(0);
    });

    it('creates a Percentage for 100', () => {
      const pct = createPercentage(100);
      expect(pct).toBe(100);
    });

    it('creates a Percentage for decimal values', () => {
      const pct = createPercentage(33.33);
      expect(pct).toBe(33.33);
    });

    it('throws error for values below 0', () => {
      expect(() => createPercentage(-1)).toThrow(
        'Invalid percentage: -1. Percentage must be between 0 and 100.',
      );
    });

    it('throws error for values above 100', () => {
      expect(() => createPercentage(101)).toThrow(
        'Invalid percentage: 101. Percentage must be between 0 and 100.',
      );
    });

    it('throws error for negative decimal values', () => {
      expect(() => createPercentage(-0.5)).toThrow(
        'Invalid percentage: -0.5. Percentage must be between 0 and 100.',
      );
    });

    it('throws error for values slightly above 100', () => {
      expect(() => createPercentage(100.01)).toThrow(
        'Invalid percentage: 100.01. Percentage must be between 0 and 100.',
      );
    });

    it('throws error for NaN', () => {
      expect(() => createPercentage(Number.NaN)).toThrow(
        'Invalid percentage: NaN. Percentage must be a valid number.',
      );
    });

    it('throws error for infinity', () => {
      expect(() => createPercentage(Infinity)).toThrow(
        'Invalid percentage: Infinity. Percentage must be between 0 and 100.',
      );
    });

    it('throws error for negative infinity', () => {
      expect(() => createPercentage(-Infinity)).toThrow(
        'Invalid percentage: -Infinity. Percentage must be between 0 and 100.',
      );
    });
  });

  describe('isPercentage', () => {
    it('returns true for valid Percentage', () => {
      const pct = createPercentage(75);
      expect(isPercentage(pct)).toBe(true);
    });

    it('returns true for 0', () => {
      expect(isPercentage(0)).toBe(true);
    });

    it('returns true for 100', () => {
      expect(isPercentage(100)).toBe(true);
    });

    it('returns true for valid decimal values', () => {
      expect(isPercentage(33.33)).toBe(true);
      expect(isPercentage(99.99)).toBe(true);
    });

    it('returns false for values below 0', () => {
      expect(isPercentage(-1)).toBe(false);
      expect(isPercentage(-0.5)).toBe(false);
    });

    it('returns false for values above 100', () => {
      expect(isPercentage(101)).toBe(false);
      expect(isPercentage(100.01)).toBe(false);
    });

    it('returns false for NaN', () => {
      expect(isPercentage(Number.NaN)).toBe(false);
    });

    it('returns false for infinity', () => {
      expect(isPercentage(Infinity)).toBe(false);
      expect(isPercentage(-Infinity)).toBe(false);
    });

    it('returns false for non-number values', () => {
      expect(isPercentage(null)).toBe(false);
      expect(isPercentage(undefined)).toBe(false);
      expect(isPercentage('75')).toBe(false);
      expect(isPercentage({})).toBe(false);
      expect(isPercentage([])).toBe(false);
    });
  });
});
