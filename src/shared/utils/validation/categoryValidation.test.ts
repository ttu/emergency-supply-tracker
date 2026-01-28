import { describe, it, expect } from 'vitest';
import {
  validateImportedCategory,
  validateImportedCategories,
  isValidCategoryId,
  isValidHexColor,
  getValidCategoryIds,
} from './categoryValidation';

describe('categoryValidation', () => {
  describe('isValidCategoryId', () => {
    it('accepts kebab-case ids', () => {
      expect(isValidCategoryId('camping-gear')).toBe(true);
      expect(isValidCategoryId('vehicle-kit')).toBe(true);
      expect(isValidCategoryId('my-custom-category')).toBe(true);
    });

    it('accepts simple lowercase ids', () => {
      expect(isValidCategoryId('camping')).toBe(true);
      expect(isValidCategoryId('abc')).toBe(true);
    });

    it('accepts ids with numbers', () => {
      expect(isValidCategoryId('category1')).toBe(true);
      expect(isValidCategoryId('kit-2024')).toBe(true);
    });

    it('rejects empty ids', () => {
      expect(isValidCategoryId('')).toBe(false);
    });

    it('rejects ids with spaces', () => {
      expect(isValidCategoryId('has spaces')).toBe(false);
    });

    it('rejects uppercase ids', () => {
      expect(isValidCategoryId('UPPERCASE')).toBe(false);
      expect(isValidCategoryId('CamelCase')).toBe(false);
    });

    it('rejects ids with underscores', () => {
      expect(isValidCategoryId('has_underscore')).toBe(false);
    });

    it('rejects ids that are too short', () => {
      expect(isValidCategoryId('ab')).toBe(false);
    });

    it('rejects ids that are too long', () => {
      expect(isValidCategoryId('a'.repeat(51))).toBe(false);
    });

    it('accepts ids at boundary lengths', () => {
      expect(isValidCategoryId('abc')).toBe(true); // 3 chars - minimum
      expect(isValidCategoryId('a'.repeat(50))).toBe(true); // 50 chars - maximum
    });
  });

  describe('isValidHexColor', () => {
    it('accepts 3-digit hex colors', () => {
      expect(isValidHexColor('#fff')).toBe(true);
      expect(isValidHexColor('#000')).toBe(true);
      expect(isValidHexColor('#abc')).toBe(true);
      expect(isValidHexColor('#ABC')).toBe(true);
    });

    it('accepts 6-digit hex colors', () => {
      expect(isValidHexColor('#ffffff')).toBe(true);
      expect(isValidHexColor('#000000')).toBe(true);
      expect(isValidHexColor('#3498db')).toBe(true);
      expect(isValidHexColor('#AABBCC')).toBe(true);
    });

    it('rejects colors without hash', () => {
      expect(isValidHexColor('fff')).toBe(false);
      expect(isValidHexColor('ffffff')).toBe(false);
    });

    it('rejects named colors', () => {
      expect(isValidHexColor('red')).toBe(false);
      expect(isValidHexColor('blue')).toBe(false);
    });

    it('rejects invalid hex characters', () => {
      expect(isValidHexColor('#gggggg')).toBe(false);
      expect(isValidHexColor('#xyz')).toBe(false);
    });

    it('rejects wrong length', () => {
      expect(isValidHexColor('#ff')).toBe(false);
      expect(isValidHexColor('#ffff')).toBe(false);
      expect(isValidHexColor('#fffff')).toBe(false);
    });
  });

  describe('validateImportedCategory', () => {
    const validCategory = {
      id: 'camping-gear',
      names: { en: 'Camping Gear' },
      icon: '⛺',
    };

    it('accepts valid category', () => {
      const result = validateImportedCategory(validCategory, 0);
      expect(result.errors).toHaveLength(0);
    });

    it('accepts valid category with all optional fields', () => {
      const fullCategory = {
        ...validCategory,
        names: { en: 'Camping Gear', fi: 'Retkeilyvarusteet' },
        description: { en: 'Equipment for camping', fi: 'Retkeilyvälineet' },
        sortOrder: 15,
        color: '#3498db',
      };
      const result = validateImportedCategory(fullCategory, 0);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects non-object', () => {
      const result = validateImportedCategory('not-an-object', 0);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'INVALID_CATEGORY' }),
      );
    });

    it('rejects null', () => {
      const result = validateImportedCategory(null, 0);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'INVALID_CATEGORY' }),
      );
    });

    it('rejects missing id', () => {
      const result = validateImportedCategory(
        { names: { en: 'Test' }, icon: '⛺' },
        0,
      );
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'INVALID_CATEGORY_ID' }),
      );
    });

    it('rejects empty id', () => {
      const result = validateImportedCategory({ ...validCategory, id: '' }, 0);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'INVALID_CATEGORY_ID' }),
      );
    });

    it('rejects invalid id format', () => {
      const result = validateImportedCategory(
        { ...validCategory, id: 'Invalid ID' },
        0,
      );
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'INVALID_CATEGORY_ID' }),
      );
    });

    it('rejects missing names', () => {
      const result = validateImportedCategory({ id: 'test-cat', icon: '⛺' }, 0);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'INVALID_CATEGORY_NAMES' }),
      );
    });

    it('rejects missing names.en', () => {
      const result = validateImportedCategory(
        { ...validCategory, names: { fi: 'Test' } },
        0,
      );
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'MISSING_CATEGORY_NAME' }),
      );
    });

    it('rejects empty names.en', () => {
      const result = validateImportedCategory(
        { ...validCategory, names: { en: '  ' } },
        0,
      );
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'MISSING_CATEGORY_NAME' }),
      );
    });

    it('rejects missing icon', () => {
      const result = validateImportedCategory(
        { id: 'test-cat', names: { en: 'Test' } },
        0,
      );
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'INVALID_CATEGORY_ICON' }),
      );
    });

    it('rejects non-emoji icon', () => {
      const result = validateImportedCategory(
        { ...validCategory, icon: 'not-emoji' },
        0,
      );
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'INVALID_CATEGORY_ICON' }),
      );
    });

    it('accepts various emoji icons', () => {
      const emojis = ['🏕️', '🚗', '⭐', '🔧', '🏠', '🎯'];
      for (const emoji of emojis) {
        const result = validateImportedCategory(
          { ...validCategory, icon: emoji },
          0,
        );
        expect(result.errors.filter((e) => e.code === 'INVALID_CATEGORY_ICON'))
          .toHaveLength(0);
      }
    });

    it('rejects invalid color format', () => {
      const result = validateImportedCategory(
        { ...validCategory, color: 'red' },
        0,
      );
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'INVALID_CATEGORY_COLOR' }),
      );
    });

    it('accepts valid hex colors', () => {
      expect(
        validateImportedCategory({ ...validCategory, color: '#fff' }, 0).errors,
      ).toHaveLength(0);
      expect(
        validateImportedCategory({ ...validCategory, color: '#ffffff' }, 0)
          .errors,
      ).toHaveLength(0);
    });

    it('warns on invalid sortOrder', () => {
      const result = validateImportedCategory(
        { ...validCategory, sortOrder: -1 },
        0,
      );
      expect(result.warnings).toContainEqual(
        expect.objectContaining({ code: 'INVALID_SORT_ORDER' }),
      );
    });

    it('warns on non-integer sortOrder', () => {
      const result = validateImportedCategory(
        { ...validCategory, sortOrder: 1.5 },
        0,
      );
      expect(result.warnings).toContainEqual(
        expect.objectContaining({ code: 'INVALID_SORT_ORDER' }),
      );
    });
  });

  describe('validateImportedCategories', () => {
    it('validates multiple categories', () => {
      const categories = [
        { id: 'camping-gear', names: { en: 'Camping' }, icon: '⛺' },
        { id: 'vehicle-kit', names: { en: 'Vehicle' }, icon: '🚗' },
      ];
      const result = validateImportedCategories(categories);
      expect(result.errors).toHaveLength(0);
    });

    it('detects duplicate category ids', () => {
      const categories = [
        { id: 'camping-gear', names: { en: 'Camping' }, icon: '⛺' },
        { id: 'camping-gear', names: { en: 'Camping 2' }, icon: '🏕️' },
      ];
      const result = validateImportedCategories(categories);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'DUPLICATE_CATEGORY_ID' }),
      );
    });

    it('detects conflict with standard categories', () => {
      const categories = [
        { id: 'food', names: { en: 'My Food' }, icon: '🍕' },
      ];
      const result = validateImportedCategories(categories);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'CATEGORY_CONFLICTS_STANDARD' }),
      );
    });

    it('detects conflicts with all standard categories', () => {
      const standardIds = [
        'water-beverages',
        'cooking-heat',
        'light-power',
        'pets',
      ];
      for (const id of standardIds) {
        const categories = [{ id, names: { en: 'Test' }, icon: '⭐' }];
        const result = validateImportedCategories(categories);
        expect(result.errors).toContainEqual(
          expect.objectContaining({ code: 'CATEGORY_CONFLICTS_STANDARD' }),
        );
      }
    });
  });

  describe('getValidCategoryIds', () => {
    it('returns standard categories when no custom categories', () => {
      const validIds = getValidCategoryIds(undefined);
      expect(validIds.has('food')).toBe(true);
      expect(validIds.has('water-beverages')).toBe(true);
      expect(validIds.has('pets')).toBe(true);
    });

    it('includes custom categories', () => {
      const customCategories = [
        { id: 'camping-gear', names: { en: 'Camping' }, icon: '⛺' },
        { id: 'vehicle-kit', names: { en: 'Vehicle' }, icon: '🚗' },
      ];
      const validIds = getValidCategoryIds(customCategories);
      expect(validIds.has('camping-gear')).toBe(true);
      expect(validIds.has('vehicle-kit')).toBe(true);
      // Standard categories still included
      expect(validIds.has('food')).toBe(true);
    });

    it('handles empty custom categories array', () => {
      const validIds = getValidCategoryIds([]);
      expect(validIds.has('food')).toBe(true);
      expect(validIds.size).toBeGreaterThan(0);
    });
  });
});
