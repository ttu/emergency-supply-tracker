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

    it('rejects 4-digit and 5-digit hex (not 3 or 6 chars)', () => {
      // These must fail to ensure the {3}|{6} alternation is not mutated to allow other lengths
      expect(isValidHexColor('#1234')).toBe(false);
      expect(isValidHexColor('#12345')).toBe(false);
    });

    it('rejects 7-digit hex (one too many)', () => {
      expect(isValidHexColor('#1234567')).toBe(false);
    });

    it('accepts exactly 3 hex chars (not 2, not 4)', () => {
      // Verify 3-char boundary is exact
      expect(isValidHexColor('#f0f')).toBe(true);
      expect(isValidHexColor('#f0')).toBe(false);
      expect(isValidHexColor('#f0f0')).toBe(false);
    });

    it('accepts exactly 6 hex chars (not 5, not 7)', () => {
      // Verify 6-char boundary is exact
      expect(isValidHexColor('#aabbcc')).toBe(true);
      expect(isValidHexColor('#aabbc')).toBe(false);
      expect(isValidHexColor('#aabbccd')).toBe(false);
    });

    it('rejects hex color without # prefix (only digits)', () => {
      // Ensures the leading # is required by regex, not optional
      expect(isValidHexColor('abc')).toBe(false);
      expect(isValidHexColor('abcdef')).toBe(false);
    });

    it('rejects g-z characters which are invalid hex', () => {
      // Explicitly test chars just outside valid hex range
      expect(isValidHexColor('#ggg')).toBe(false);
      expect(isValidHexColor('#GGG')).toBe(false);
      expect(isValidHexColor('#zzz')).toBe(false);
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

    it('rejects non-object with correct message and path', () => {
      const result = validateImportedCategory('not-an-object', 0);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'INVALID_CATEGORY',
          path: 'categories[0]',
          message: 'Category must be an object',
        }),
      );
    });

    it('rejects non-object and returns early (no further errors)', () => {
      const result = validateImportedCategory('not-an-object', 0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('INVALID_CATEGORY');
    });

    it('rejects null with correct message and path', () => {
      const result = validateImportedCategory(null, 2);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'INVALID_CATEGORY',
          path: 'categories[2]',
          message: 'Category must be an object',
        }),
      );
    });

    it('rejects null and returns early', () => {
      const result = validateImportedCategory(null, 0);
      expect(result.errors).toHaveLength(1);
    });

    it('uses the correct index in path for non-object', () => {
      const result = validateImportedCategory(null, 5);
      expect(result.errors[0].path).toBe('categories[5]');
    });

    it('rejects missing id with correct message and path', () => {
      const result = validateImportedCategory(
        { names: { en: 'Test' }, icon: '⛺' },
        0,
      );
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'INVALID_CATEGORY_ID',
          path: 'categories[0].id',
          message: 'Category ID must be kebab-case, 3-50 characters',
        }),
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

    it('uses the correct index in path for invalid id', () => {
      const result = validateImportedCategory(
        { names: { en: 'Test' }, icon: '⛺' },
        3,
      );
      expect(result.errors).toContainEqual(
        expect.objectContaining({ path: 'categories[3].id' }),
      );
    });

    it('rejects missing names with correct message and path', () => {
      const result = validateImportedCategory(
        { id: 'test-cat', icon: '⛺' },
        0,
      );
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'INVALID_CATEGORY_NAMES',
          path: 'categories[0].names',
          message: 'Category names must be an object',
        }),
      );
    });

    it('rejects null names (compound condition: !c.names)', () => {
      const result = validateImportedCategory(
        { id: 'test-cat', icon: '⛺', names: null },
        0,
      );
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'INVALID_CATEGORY_NAMES' }),
      );
    });

    it('rejects non-object names (typeof check)', () => {
      const result = validateImportedCategory(
        { id: 'test-cat', icon: '⛺', names: 'not-an-object' },
        0,
      );
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'INVALID_CATEGORY_NAMES',
          message: 'Category names must be an object',
        }),
      );
    });

    it('rejects array names (Array.isArray check)', () => {
      const result = validateImportedCategory(
        { id: 'test-cat', icon: '⛺', names: ['en', 'Test'] },
        0,
      );
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'INVALID_CATEGORY_NAMES',
          message: 'Category names must be an object',
        }),
      );
    });

    it('rejects missing names.en with correct message and path', () => {
      const result = validateImportedCategory(
        { ...validCategory, names: { fi: 'Test' } },
        0,
      );
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'MISSING_CATEGORY_NAME',
          path: 'categories[0].names.en',
          message: 'Category must have names.en (English name)',
        }),
      );
    });

    it('rejects empty names.en with correct message and path', () => {
      const result = validateImportedCategory(
        { ...validCategory, names: { en: '  ' } },
        0,
      );
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'MISSING_CATEGORY_NAME',
          path: 'categories[0].names.en',
          message: 'Category must have names.en (English name)',
        }),
      );
    });

    it('rejects missing icon with correct message and path', () => {
      const result = validateImportedCategory(
        { id: 'test-cat', names: { en: 'Test' } },
        0,
      );
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'INVALID_CATEGORY_ICON',
          path: 'categories[0].icon',
          message: 'Category icon must be a valid emoji',
        }),
      );
    });

    it('rejects non-emoji icon with correct message and path', () => {
      const result = validateImportedCategory(
        { ...validCategory, icon: 'not-emoji' },
        0,
      );
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'INVALID_CATEGORY_ICON',
          path: 'categories[0].icon',
          message: 'Category icon must be a valid emoji',
        }),
      );
    });

    it('accepts emojis from the U+1F300-U+1F9FF range (misc symbols and pictographs)', () => {
      // U+1F300 CYCLONE, U+1F9FF NAZAR AMULET - tests this alternation group
      const result1 = validateImportedCategory(
        { ...validCategory, icon: '\u{1F300}' },
        0,
      );
      expect(
        result1.errors.filter((e) => e.code === 'INVALID_CATEGORY_ICON'),
      ).toHaveLength(0);

      const result2 = validateImportedCategory(
        { ...validCategory, icon: '\u{1F9FF}' },
        0,
      );
      expect(
        result2.errors.filter((e) => e.code === 'INVALID_CATEGORY_ICON'),
      ).toHaveLength(0);
    });

    it('accepts emojis from the U+2600-U+26FF range (misc symbols)', () => {
      // U+2600 BLACK SUN - tests this alternation group
      const result = validateImportedCategory(
        { ...validCategory, icon: '\u{2600}' },
        0,
      );
      expect(
        result.errors.filter((e) => e.code === 'INVALID_CATEGORY_ICON'),
      ).toHaveLength(0);
    });

    it('accepts emojis from the U+2700-U+27BF range (dingbats)', () => {
      // U+2702 BLACK SCISSORS - tests this alternation group
      const result = validateImportedCategory(
        { ...validCategory, icon: '\u{2702}' },
        0,
      );
      expect(
        result.errors.filter((e) => e.code === 'INVALID_CATEGORY_ICON'),
      ).toHaveLength(0);
    });

    it('accepts emojis from the U+1F600-U+1F64F range (emoticons)', () => {
      // U+1F600 GRINNING FACE - tests this alternation group
      const result = validateImportedCategory(
        { ...validCategory, icon: '\u{1F600}' },
        0,
      );
      expect(
        result.errors.filter((e) => e.code === 'INVALID_CATEGORY_ICON'),
      ).toHaveLength(0);
    });

    it('accepts emojis from the U+1F680-U+1F6FF range (transport and map)', () => {
      // U+1F680 ROCKET - tests this alternation group
      const result = validateImportedCategory(
        { ...validCategory, icon: '\u{1F680}' },
        0,
      );
      expect(
        result.errors.filter((e) => e.code === 'INVALID_CATEGORY_ICON'),
      ).toHaveLength(0);
    });

    it('accepts emojis from the U+1F1E0-U+1F1FF range (regional indicator letters / flags)', () => {
      // U+1F1E6 REGIONAL INDICATOR SYMBOL LETTER A - tests this alternation group
      const result = validateImportedCategory(
        { ...validCategory, icon: '\u{1F1E6}' },
        0,
      );
      expect(
        result.errors.filter((e) => e.code === 'INVALID_CATEGORY_ICON'),
      ).toHaveLength(0);
    });

    it('accepts emojis from the U+1FA00-U+1FA6F range (chess and other symbols)', () => {
      // U+1FA00 CHESS KING - tests this alternation group
      const result = validateImportedCategory(
        { ...validCategory, icon: '\u{1FA00}' },
        0,
      );
      expect(
        result.errors.filter((e) => e.code === 'INVALID_CATEGORY_ICON'),
      ).toHaveLength(0);
    });

    it('accepts emojis from the U+1FA70-U+1FAFF range (symbols and pictographs extended)', () => {
      // U+1FA70 BALLET SHOES - tests this alternation group
      const result = validateImportedCategory(
        { ...validCategory, icon: '\u{1FA70}' },
        0,
      );
      expect(
        result.errors.filter((e) => e.code === 'INVALID_CATEGORY_ICON'),
      ).toHaveLength(0);
    });

    it('accepts U+2B50 STAR emoji (single codepoint literal in regex)', () => {
      // U+2B50 is a single literal in the regex - tests this specific alternation
      const result = validateImportedCategory(
        { ...validCategory, icon: '\u{2B50}' },
        0,
      );
      expect(
        result.errors.filter((e) => e.code === 'INVALID_CATEGORY_ICON'),
      ).toHaveLength(0);
    });

    it('rejects regular ASCII characters as icons', () => {
      // ASCII chars are not emoji
      const result = validateImportedCategory(
        { ...validCategory, icon: 'A' },
        0,
      );
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'INVALID_CATEGORY_ICON' }),
      );
    });

    it('rejects characters just below U+2600 range', () => {
      // U+25FF is just before U+2600, not a valid emoji
      const result = validateImportedCategory(
        { ...validCategory, icon: '\u25FF' },
        0,
      );
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'INVALID_CATEGORY_ICON' }),
      );
    });

    it('trims whitespace before emoji validation (icon with surrounding spaces fails)', () => {
      // Tests the .trim() call on L32: icon string with just spaces is invalid
      const result = validateImportedCategory(
        { ...validCategory, icon: '   ' },
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
        expect(
          result.errors.filter((e) => e.code === 'INVALID_CATEGORY_ICON'),
        ).toHaveLength(0);
      }
    });

    it('rejects invalid color format with correct message and path', () => {
      const result = validateImportedCategory(
        { ...validCategory, color: 'red' },
        0,
      );
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'INVALID_CATEGORY_COLOR',
          path: 'categories[0].color',
          message: 'Category color must be valid hex format (#RGB or #RRGGBB)',
        }),
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

    it('warns on invalid sortOrder with correct message and path', () => {
      const result = validateImportedCategory(
        { ...validCategory, sortOrder: -1 },
        0,
      );
      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          code: 'INVALID_SORT_ORDER',
          path: 'categories[0].sortOrder',
          message: 'sortOrder should be a non-negative integer',
        }),
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

    it('accepts sortOrder of exactly 0 (boundary: 0 is valid, not negative)', () => {
      // Tests EqualityOperator mutant: c.sortOrder < 0 vs c.sortOrder <= 0
      // sortOrder === 0 must NOT produce a warning
      const result = validateImportedCategory(
        { ...validCategory, sortOrder: 0 },
        0,
      );
      expect(
        result.warnings.filter((w) => w.code === 'INVALID_SORT_ORDER'),
      ).toHaveLength(0);
    });

    it('warns on sortOrder of -1 but not 0 (boundary test)', () => {
      const resultZero = validateImportedCategory(
        { ...validCategory, sortOrder: 0 },
        0,
      );
      expect(
        resultZero.warnings.filter((w) => w.code === 'INVALID_SORT_ORDER'),
      ).toHaveLength(0);

      const resultNeg = validateImportedCategory(
        { ...validCategory, sortOrder: -1 },
        0,
      );
      expect(resultNeg.warnings).toContainEqual(
        expect.objectContaining({ code: 'INVALID_SORT_ORDER' }),
      );
    });

    it('does not warn when sortOrder is undefined (optional field)', () => {
      // Tests c.sortOrder !== undefined conditional (L110)
      const result = validateImportedCategory(validCategory, 0);
      expect(
        result.warnings.filter((w) => w.code === 'INVALID_SORT_ORDER'),
      ).toHaveLength(0);
    });

    it('warns when sortOrder is a string (not a number, L112 check)', () => {
      const result = validateImportedCategory(
        { ...validCategory, sortOrder: 'five' as unknown as number },
        0,
      );
      expect(result.warnings).toContainEqual(
        expect.objectContaining({ code: 'INVALID_SORT_ORDER' }),
      );
    });

    it('does not produce color error when color is undefined (optional field)', () => {
      const result = validateImportedCategory(validCategory, 0);
      expect(
        result.errors.filter((e) => e.code === 'INVALID_CATEGORY_COLOR'),
      ).toHaveLength(0);
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

    it('detects duplicate category ids with correct message and path', () => {
      const categories = [
        { id: 'camping-gear', names: { en: 'Camping' }, icon: '⛺' },
        { id: 'camping-gear', names: { en: 'Camping 2' }, icon: '🏕️' },
      ];
      const result = validateImportedCategories(categories);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'DUPLICATE_CATEGORY_ID',
          path: 'categories[1].id',
          message: 'Duplicate category ID: camping-gear',
        }),
      );
    });

    it('detects conflict with standard categories with correct message and path', () => {
      const categories = [{ id: 'food', names: { en: 'My Food' }, icon: '🍕' }];
      const result = validateImportedCategories(categories);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'CATEGORY_CONFLICTS_STANDARD',
          path: 'categories[0].id',
          message: "Category ID 'food' conflicts with standard category",
        }),
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

    it('skips duplicate/conflict checks for non-object category (L144 compound condition)', () => {
      // When category is not an object, the L144 condition (category && typeof category === 'object')
      // must short-circuit and not attempt to access c.id
      const categories = [null, 'not-an-object', 42];
      const result = validateImportedCategories(
        categories as unknown as unknown[],
      );
      // Should get INVALID_CATEGORY errors but no DUPLICATE_CATEGORY_ID errors
      expect(
        result.errors.every((e) => e.code !== 'DUPLICATE_CATEGORY_ID'),
      ).toBe(true);
    });

    it('handles null category in array without crashing (L144 null check)', () => {
      const categories = [null];
      const result = validateImportedCategories(categories as unknown[]);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'INVALID_CATEGORY' }),
      );
      // Must NOT throw or produce unexpected errors
    });

    it('handles non-object category in array without duplicate-check crash', () => {
      // If L144 used || instead of &&, a non-object would still enter the duplicate block
      const categories = ['string-not-object'];
      const result = validateImportedCategories(categories as unknown[]);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'INVALID_CATEGORY' }),
      );
      expect(
        result.errors.every((e) => e.code !== 'DUPLICATE_CATEGORY_ID'),
      ).toBe(true);
    });

    it('includes index in duplicate error path for second duplicate occurrence', () => {
      const categories = [
        { id: 'my-cat', names: { en: 'First' }, icon: '⛺' },
        { id: 'my-cat', names: { en: 'Second' }, icon: '🚗' },
        { id: 'my-cat', names: { en: 'Third' }, icon: '⭐' },
      ];
      const result = validateImportedCategories(categories);
      const dupErrors = result.errors.filter(
        (e) => e.code === 'DUPLICATE_CATEGORY_ID',
      );
      // Second and third occurrences should be reported as duplicates
      expect(dupErrors).toHaveLength(2);
      expect(dupErrors[0].path).toBe('categories[1].id');
      expect(dupErrors[1].path).toBe('categories[2].id');
    });

    it('includes the conflicting id in the conflict error message', () => {
      const categories = [
        { id: 'water-beverages', names: { en: 'Water' }, icon: '💧' },
      ];
      const result = validateImportedCategories(categories);
      const conflictError = result.errors.find(
        (e) => e.code === 'CATEGORY_CONFLICTS_STANDARD',
      );
      expect(conflictError).toBeDefined();
      expect(conflictError!.message).toContain('water-beverages');
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
