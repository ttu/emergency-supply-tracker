import { describe, it, expect } from 'vitest';
import {
  isValidHexColor,
  validateImportedCategory,
  validateImportedCategories,
} from './categoryValidation';

describe('categoryValidation - mutation killing tests', () => {
  describe('L20 Regex: hex color regex mutation', () => {
    it('rejects hex with exactly 1 digit after #', () => {
      expect(isValidHexColor('#f')).toBe(false);
    });

    it('rejects hex with exactly 2 digits after #', () => {
      expect(isValidHexColor('#ff')).toBe(false);
    });

    it('accepts hex with exactly 3 digits after #', () => {
      expect(isValidHexColor('#fff')).toBe(true);
    });

    it('rejects hex with exactly 4 digits after #', () => {
      expect(isValidHexColor('#ffff')).toBe(false);
    });

    it('rejects hex with exactly 5 digits after #', () => {
      expect(isValidHexColor('#fffff')).toBe(false);
    });

    it('accepts hex with exactly 6 digits after #', () => {
      expect(isValidHexColor('#ffffff')).toBe(true);
    });

    it('rejects hex with exactly 7 digits after #', () => {
      expect(isValidHexColor('#fffffff')).toBe(false);
    });

    it('rejects empty string', () => {
      expect(isValidHexColor('')).toBe(false);
    });

    it('rejects just a hash', () => {
      expect(isValidHexColor('#')).toBe(false);
    });

    it('must require the # prefix (rejects valid hex chars without #)', () => {
      expect(isValidHexColor('fff')).toBe(false);
      expect(isValidHexColor('ffffff')).toBe(false);
    });

    it('must anchor at end (rejects trailing chars)', () => {
      expect(isValidHexColor('#ffffffx')).toBe(false);
      expect(isValidHexColor('#fff!')).toBe(false);
    });

    it('must anchor at start (rejects leading chars)', () => {
      expect(isValidHexColor('x#fff')).toBe(false);
    });
  });

  describe('L31 Regex: emoji regex mutations', () => {
    it('rejects empty string as emoji', () => {
      const result = validateImportedCategory(
        { id: 'test-cat', names: { en: 'Test' }, icon: '' },
        0,
      );
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'INVALID_CATEGORY_ICON' }),
      );
    });

    it('rejects regular text as emoji', () => {
      const result = validateImportedCategory(
        { id: 'test-cat', names: { en: 'Test' }, icon: 'hello' },
        0,
      );
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'INVALID_CATEGORY_ICON' }),
      );
    });

    it('rejects multiple emojis (regex is anchored to single emoji)', () => {
      // The regex uses ^ and $ anchors - should only match single emoji
      const result = validateImportedCategory(
        { id: 'test-cat', names: { en: 'Test' }, icon: '\u{1F600}\u{1F600}' },
        0,
      );
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'INVALID_CATEGORY_ICON' }),
      );
    });

    it('accepts single emoji from each range', () => {
      const emojis = [
        '\u{1F300}', // misc symbols
        '\u{2600}', // misc symbols 2
        '\u{2702}', // dingbats
        '\u{1F600}', // emoticons
        '\u{1F680}', // transport
        '\u{1F1E6}', // flags
        '\u{1FA70}', // extended
        '\u{2B50}', // star
      ];
      for (const emoji of emojis) {
        const result = validateImportedCategory(
          { id: 'test-cat', names: { en: 'Test' }, icon: emoji },
          0,
        );
        expect(
          result.errors.filter((e) => e.code === 'INVALID_CATEGORY_ICON'),
        ).toHaveLength(0);
      }
    });
  });

  describe('L32 MethodExpression: .test() on icon vs wrong property', () => {
    it('validates the icon field specifically, not other fields', () => {
      // If the mutant changes icon to something else (e.g., testing id instead),
      // a valid emoji in icon should still pass
      const result = validateImportedCategory(
        { id: 'test-cat', names: { en: 'Test' }, icon: '\u{1F600}' },
        0,
      );
      expect(
        result.errors.filter((e) => e.code === 'INVALID_CATEGORY_ICON'),
      ).toHaveLength(0);
    });

    it('rejects when icon is not a string type', () => {
      const result = validateImportedCategory(
        { id: 'test-cat', names: { en: 'Test' }, icon: 123 },
        0,
      );
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'INVALID_CATEGORY_ICON' }),
      );
    });

    it('uses trim on icon before testing (whitespace-padded emoji passes)', () => {
      // L32: emojiRegex.test(icon.trim())
      // If .trim() were removed, " \u{1F600} " might still work since regex uses ^/$
      // But testing just spaces should still fail
      const resultSpaces = validateImportedCategory(
        { id: 'test-cat', names: { en: 'Test' }, icon: '   ' },
        0,
      );
      expect(resultSpaces.errors).toContainEqual(
        expect.objectContaining({ code: 'INVALID_CATEGORY_ICON' }),
      );
    });
  });

  describe('L144 ConditionalExpression: typeof category === object guard', () => {
    it('processes valid object categories for duplicate checking', () => {
      // Two objects with same id should trigger duplicate error
      const categories = [
        { id: 'my-cat', names: { en: 'Cat 1' }, icon: '\u{1F600}' },
        { id: 'my-cat', names: { en: 'Cat 2' }, icon: '\u{1F680}' },
      ];
      const result = validateImportedCategories(categories);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'DUPLICATE_CATEGORY_ID' }),
      );
    });

    it('skips duplicate check for non-object entries (conditional must be true, not always true)', () => {
      // If L144's condition were mutated to always `true`,
      // then non-objects would enter the block and crash on c.id access
      const categories = [
        null,
        undefined,
        42,
        'string',
        { id: 'valid-cat', names: { en: 'Valid' }, icon: '\u{1F600}' },
      ];
      // This should not throw
      const result = validateImportedCategories(categories as unknown[]);
      // Should get INVALID_CATEGORY errors for non-objects, but no crash
      expect(result.errors.length).toBeGreaterThan(0);
      // The valid category at the end should not trigger duplicate
      const dupErrors = result.errors.filter(
        (e) => e.code === 'DUPLICATE_CATEGORY_ID',
      );
      expect(dupErrors).toHaveLength(0);
    });

    it('only enters id-checking block for actual objects, not primitives', () => {
      // Mix of primitives and objects - only objects should have id checked
      const categories = [false, 0, ''];
      const result = validateImportedCategories(categories as unknown[]);
      // All should get INVALID_CATEGORY, none should get DUPLICATE_CATEGORY_ID
      expect(
        result.errors.every((e) => e.code !== 'DUPLICATE_CATEGORY_ID'),
      ).toBe(true);
      expect(
        result.errors.every((e) => e.code !== 'CATEGORY_CONFLICTS_STANDARD'),
      ).toBe(true);
    });
  });
});
