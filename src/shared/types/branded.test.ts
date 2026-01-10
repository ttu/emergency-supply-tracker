import { describe, it, expect } from 'vitest';
import {
  createItemId,
  createCategoryId,
  createProductTemplateId,
  createAlertId,
  createDateOnly,
  isItemId,
  isCategoryId,
  isDateOnly,
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
});
