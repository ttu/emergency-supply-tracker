import { describe, it, expect } from 'vitest';
import {
  validateRecommendedItemsFile,
  parseRecommendedItemsFile,
  convertToRecommendedItemDefinitions,
} from './recommendedItemsValidation';
import type {
  RecommendedItemsFile,
  ImportedRecommendedItem,
} from '../../types';

function createValidFile(
  overrides?: Partial<RecommendedItemsFile>,
): RecommendedItemsFile {
  return {
    meta: {
      name: 'Test Kit',
      version: '1.0.0',
      createdAt: '2025-01-01T00:00:00.000Z',
      ...overrides?.meta,
    },
    items: overrides?.items ?? [
      {
        id: 'test-item',
        names: { en: 'Test Item' },
        category: 'food',
        baseQuantity: 1,
        unit: 'pieces',
        scaleWithPeople: true,
        scaleWithDays: false,
      },
    ],
  };
}

function createValidItem(
  overrides?: Partial<ImportedRecommendedItem>,
): ImportedRecommendedItem {
  return {
    id: 'test-item',
    names: { en: 'Test Item' },
    category: 'food',
    baseQuantity: 1,
    unit: 'pieces',
    scaleWithPeople: true,
    scaleWithDays: false,
    ...overrides,
  };
}

describe('validateRecommendedItemsFile', () => {
  describe('valid files', () => {
    it('accepts a valid file with minimal data', () => {
      const file = createValidFile();
      const result = validateRecommendedItemsFile(file);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('accepts a file with all optional meta fields', () => {
      const file = createValidFile({
        meta: {
          name: 'Full Kit',
          version: '2.0.0',
          description: 'A complete kit',
          source: 'https://example.com',
          createdAt: '2025-01-01T00:00:00.000Z',
          language: 'fi',
        },
      });
      const result = validateRecommendedItemsFile(file);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('accepts a file with i18nKey instead of name', () => {
      const file = createValidFile({
        items: [
          {
            id: 'bottled-water',
            i18nKey: 'products.bottled-water',
            category: 'water-beverages',
            baseQuantity: 3,
            unit: 'liters',
            scaleWithPeople: true,
            scaleWithDays: true,
          },
        ],
      });
      const result = validateRecommendedItemsFile(file);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('accepts all valid categories', () => {
      const categories = [
        'water-beverages',
        'food',
        'cooking-heat',
        'light-power',
        'communication-info',
        'medical-health',
        'hygiene-sanitation',
        'tools-supplies',
        'cash-documents',
      ] as const;

      categories.forEach((category) => {
        const file = createValidFile({
          items: [createValidItem({ id: `item-${category}`, category })],
        });
        const result = validateRecommendedItemsFile(file);
        expect(result.valid).toBe(true);
      });
    });

    it('accepts all valid units', () => {
      const units = [
        'pieces',
        'liters',
        'kilograms',
        'grams',
        'cans',
        'bottles',
        'packages',
        'jars',
        'canisters',
        'boxes',
        'days',
        'rolls',
        'tubes',
        'meters',
        'pairs',
        'euros',
        'sets',
      ] as const;

      units.forEach((unit) => {
        const file = createValidFile({
          items: [createValidItem({ id: `item-${unit}`, unit })],
        });
        const result = validateRecommendedItemsFile(file);
        expect(result.valid).toBe(true);
      });
    });

    it('accepts items with all optional fields', () => {
      const file = createValidFile({
        items: [
          {
            id: 'complete-item',
            names: {
              en: 'Complete Item',
              fi: 'Täydellinen tuote',
              sv: 'Komplett objekt',
            },
            category: 'food',
            baseQuantity: 2.5,
            unit: 'kilograms',
            scaleWithPeople: true,
            scaleWithDays: true,
            requiresFreezer: true,
            defaultExpirationMonths: 12,
            weightGramsPerUnit: 500,
            caloriesPer100g: 200,
            caloriesPerUnit: 1000,
            requiresWaterLiters: 0.5,
          },
        ],
      });
      const result = validateRecommendedItemsFile(file);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('accepts items with names in multiple languages', () => {
      const file = createValidFile({
        items: [
          {
            id: 'multi-lang-item',
            names: {
              en: 'Water',
              fi: 'Vesi',
              sv: 'Vatten',
              de: 'Wasser',
              fr: 'Eau',
            },
            category: 'water-beverages',
            baseQuantity: 3,
            unit: 'liters',
            scaleWithPeople: true,
            scaleWithDays: true,
          },
        ],
      });
      const result = validateRecommendedItemsFile(file);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('invalid structure', () => {
    it('rejects null', () => {
      const result = validateRecommendedItemsFile(null);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'INVALID_STRUCTURE' }),
      );
    });

    it('rejects undefined', () => {
      const result = validateRecommendedItemsFile(undefined);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'INVALID_STRUCTURE' }),
      );
    });

    it('rejects non-object', () => {
      const result = validateRecommendedItemsFile('string');

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'INVALID_STRUCTURE' }),
      );
    });
  });

  describe('meta validation', () => {
    it('rejects missing meta', () => {
      const result = validateRecommendedItemsFile({ items: [] });

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'MISSING_META' }),
      );
    });

    it('rejects missing meta.name', () => {
      const file = createValidFile();
      delete (file.meta as Record<string, unknown>).name;
      const result = validateRecommendedItemsFile(file);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'MISSING_META_NAME' }),
      );
    });

    it('rejects empty meta.name', () => {
      const file = createValidFile();
      file.meta.name = '   ';
      const result = validateRecommendedItemsFile(file);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'MISSING_META_NAME' }),
      );
    });

    it('rejects missing meta.version', () => {
      const file = createValidFile();
      delete (file.meta as Record<string, unknown>).version;
      const result = validateRecommendedItemsFile(file);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'MISSING_META_VERSION' }),
      );
    });

    it('rejects missing meta.createdAt', () => {
      const file = createValidFile();
      delete (file.meta as Record<string, unknown>).createdAt;
      const result = validateRecommendedItemsFile(file);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'MISSING_META_CREATED_AT' }),
      );
    });

    it('rejects invalid meta.language', () => {
      const file = createValidFile();
      (file.meta as Record<string, unknown>).language = 'de';
      const result = validateRecommendedItemsFile(file);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'INVALID_META_LANGUAGE' }),
      );
    });
  });

  describe('items validation', () => {
    it('rejects non-array items', () => {
      const file = createValidFile();
      (file as Record<string, unknown>).items = 'not-array';
      const result = validateRecommendedItemsFile(file);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'INVALID_ITEMS' }),
      );
    });

    it('rejects empty items array', () => {
      const file = createValidFile({ items: [] });
      const result = validateRecommendedItemsFile(file);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'EMPTY_ITEMS' }),
      );
    });

    it('rejects item without id', () => {
      const item = createValidItem();
      delete (item as Record<string, unknown>).id;
      const file = createValidFile({ items: [item] });
      const result = validateRecommendedItemsFile(file);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'MISSING_ID' }),
      );
    });

    it('rejects item without names.en or i18nKey', () => {
      const item = createValidItem();
      delete (item as Record<string, unknown>).names;
      const file = createValidFile({ items: [item] });
      const result = validateRecommendedItemsFile(file);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'MISSING_NAME' }),
      );
    });

    it('rejects item with names object but missing en key', () => {
      const file = createValidFile({
        items: [
          {
            id: 'no-english',
            names: { fi: 'Suomeksi' }, // missing 'en'
            category: 'food',
            baseQuantity: 1,
            unit: 'pieces',
            scaleWithPeople: true,
            scaleWithDays: false,
          },
        ],
      });
      const result = validateRecommendedItemsFile(file);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'MISSING_NAME' }),
      );
    });

    it('rejects item with names as non-object', () => {
      const file = createValidFile({
        items: [
          {
            id: 'invalid-names',
            names: 'not an object' as unknown as Record<string, string>,
            category: 'food',
            baseQuantity: 1,
            unit: 'pieces',
            scaleWithPeople: true,
            scaleWithDays: false,
          },
        ],
      });
      const result = validateRecommendedItemsFile(file);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'INVALID_NAMES' }),
      );
    });

    it('rejects invalid category', () => {
      const file = createValidFile({
        items: [createValidItem({ category: 'invalid-category' as never })],
      });
      const result = validateRecommendedItemsFile(file);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'INVALID_CATEGORY' }),
      );
    });

    it('rejects invalid unit', () => {
      const file = createValidFile({
        items: [createValidItem({ unit: 'invalid-unit' as never })],
      });
      const result = validateRecommendedItemsFile(file);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'INVALID_UNIT' }),
      );
    });

    it('rejects negative baseQuantity', () => {
      const file = createValidFile({
        items: [createValidItem({ baseQuantity: -1 })],
      });
      const result = validateRecommendedItemsFile(file);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'INVALID_QUANTITY' }),
      );
    });

    it('rejects non-boolean scaleWithPeople', () => {
      const item = createValidItem();
      (item as Record<string, unknown>).scaleWithPeople = 'yes';
      const file = createValidFile({ items: [item] });
      const result = validateRecommendedItemsFile(file);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'INVALID_BOOLEAN' }),
      );
    });

    it('rejects non-boolean scaleWithDays', () => {
      const item = createValidItem();
      (item as Record<string, unknown>).scaleWithDays = 1;
      const file = createValidFile({ items: [item] });
      const result = validateRecommendedItemsFile(file);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'INVALID_BOOLEAN' }),
      );
    });

    it('detects duplicate item IDs', () => {
      const file = createValidFile({
        items: [
          createValidItem({ id: 'duplicate-id' }),
          createValidItem({ id: 'duplicate-id' }),
        ],
      });
      const result = validateRecommendedItemsFile(file);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'DUPLICATE_ID' }),
      );
    });

    it('rejects non-object item in array', () => {
      const file = createValidFile();
      (file as Record<string, unknown>).items = [
        'not-an-object',
        createValidItem(),
      ];
      const result = validateRecommendedItemsFile(file);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'INVALID_ITEM' }),
      );
    });

    it('rejects empty i18nKey', () => {
      const file = createValidFile({
        items: [
          {
            id: 'empty-i18n',
            i18nKey: '   ', // empty after trim
            category: 'food',
            baseQuantity: 1,
            unit: 'pieces',
            scaleWithPeople: true,
            scaleWithDays: false,
          },
        ],
      });
      const result = validateRecommendedItemsFile(file);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'INVALID_I18N_KEY' }),
      );
    });

    it('rejects zero baseQuantity', () => {
      const file = createValidFile({
        items: [createValidItem({ baseQuantity: 0 })],
      });
      const result = validateRecommendedItemsFile(file);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'INVALID_QUANTITY' }),
      );
    });

    it('rejects non-finite baseQuantity (Infinity)', () => {
      const file = createValidFile({
        items: [createValidItem({ baseQuantity: Infinity })],
      });
      const result = validateRecommendedItemsFile(file);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'INVALID_QUANTITY' }),
      );
    });

    it('rejects non-finite baseQuantity (NaN)', () => {
      const file = createValidFile({
        items: [createValidItem({ baseQuantity: NaN })],
      });
      const result = validateRecommendedItemsFile(file);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'INVALID_QUANTITY' }),
      );
    });
  });

  describe('warnings', () => {
    it('warns about invalid requiresWaterLiters', () => {
      const file = createValidFile({
        items: [createValidItem({ requiresWaterLiters: -1 })],
      });
      const result = validateRecommendedItemsFile(file);

      expect(result.valid).toBe(true);
      expect(result.warnings).toContainEqual(
        expect.objectContaining({ code: 'INVALID_OPTIONAL' }),
      );
    });

    it('warns about invalid defaultExpirationMonths', () => {
      const file = createValidFile({
        items: [createValidItem({ defaultExpirationMonths: 0 })],
      });
      const result = validateRecommendedItemsFile(file);

      expect(result.valid).toBe(true);
      expect(result.warnings).toContainEqual(
        expect.objectContaining({ code: 'INVALID_OPTIONAL' }),
      );
    });

    it('warns about invalid requiresFreezer (non-boolean)', () => {
      const item = createValidItem();
      (item as Record<string, unknown>).requiresFreezer = 'yes';
      const file = createValidFile({ items: [item] });
      const result = validateRecommendedItemsFile(file);

      expect(result.valid).toBe(true);
      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          code: 'INVALID_OPTIONAL',
          path: 'items[0].requiresFreezer',
        }),
      );
    });

    it('warns about invalid caloriesPerUnit (negative)', () => {
      const file = createValidFile({
        items: [createValidItem({ caloriesPerUnit: -100 })],
      });
      const result = validateRecommendedItemsFile(file);

      expect(result.valid).toBe(true);
      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          code: 'INVALID_OPTIONAL',
          path: 'items[0].caloriesPerUnit',
        }),
      );
    });

    it('warns about invalid caloriesPer100g (negative)', () => {
      const file = createValidFile({
        items: [createValidItem({ caloriesPer100g: -200 })],
      });
      const result = validateRecommendedItemsFile(file);

      expect(result.valid).toBe(true);
      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          code: 'INVALID_OPTIONAL',
          path: 'items[0].caloriesPer100g',
        }),
      );
    });

    it('warns about invalid weightGramsPerUnit (negative)', () => {
      const file = createValidFile({
        items: [createValidItem({ weightGramsPerUnit: -500 })],
      });
      const result = validateRecommendedItemsFile(file);

      expect(result.valid).toBe(true);
      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          code: 'INVALID_OPTIONAL',
          path: 'items[0].weightGramsPerUnit',
        }),
      );
    });

    it('warns about invalid weightGramsPerUnit (zero)', () => {
      const file = createValidFile({
        items: [createValidItem({ weightGramsPerUnit: 0 })],
      });
      const result = validateRecommendedItemsFile(file);

      expect(result.valid).toBe(true);
      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          code: 'INVALID_OPTIONAL',
          path: 'items[0].weightGramsPerUnit',
        }),
      );
    });

    it('warns about empty name values in names object', () => {
      const file = createValidFile({
        items: [
          {
            id: 'empty-name',
            names: { en: 'Valid', fi: '   ' }, // empty Finnish name
            category: 'food',
            baseQuantity: 1,
            unit: 'pieces',
            scaleWithPeople: true,
            scaleWithDays: false,
          },
        ],
      });
      const result = validateRecommendedItemsFile(file);

      expect(result.valid).toBe(true);
      expect(result.warnings).toContainEqual(
        expect.objectContaining({ code: 'INVALID_NAME_VALUE' }),
      );
    });

    it('warns about invalid capacityMah (negative)', () => {
      const file = createValidFile({
        items: [createValidItem({ capacityMah: -1000 })],
      });
      const result = validateRecommendedItemsFile(file);

      expect(result.valid).toBe(true);
      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          code: 'INVALID_OPTIONAL',
          path: 'items[0].capacityMah',
        }),
      );
    });

    it('warns about invalid capacityMah (zero)', () => {
      const file = createValidFile({
        items: [createValidItem({ capacityMah: 0 })],
      });
      const result = validateRecommendedItemsFile(file);

      expect(result.valid).toBe(true);
      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          code: 'INVALID_OPTIONAL',
          path: 'items[0].capacityMah',
        }),
      );
    });

    it('warns about invalid capacityWh (negative)', () => {
      const file = createValidFile({
        items: [createValidItem({ capacityWh: -50 })],
      });
      const result = validateRecommendedItemsFile(file);

      expect(result.valid).toBe(true);
      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          code: 'INVALID_OPTIONAL',
          path: 'items[0].capacityWh',
        }),
      );
    });

    it('warns about invalid capacityWh (zero)', () => {
      const file = createValidFile({
        items: [createValidItem({ capacityWh: 0 })],
      });
      const result = validateRecommendedItemsFile(file);

      expect(result.valid).toBe(true);
      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          code: 'INVALID_OPTIONAL',
          path: 'items[0].capacityWh',
        }),
      );
    });

    it('accepts valid capacityMah and capacityWh values', () => {
      const file = createValidFile({
        items: [createValidItem({ capacityMah: 10000, capacityWh: 37 })],
      });
      const result = validateRecommendedItemsFile(file);

      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });
  });
});

describe('parseRecommendedItemsFile', () => {
  it('parses valid JSON', () => {
    const file = createValidFile();
    const json = JSON.stringify(file);
    const result = parseRecommendedItemsFile(json);

    expect(result).toEqual(file);
  });

  it('throws on invalid JSON syntax', () => {
    expect(() => parseRecommendedItemsFile('{ invalid json }')).toThrow();
  });

  it('throws on invalid file structure', () => {
    expect(() => parseRecommendedItemsFile('{}')).toThrow(
      /Invalid recommended items file/,
    );
  });
});

describe('convertToRecommendedItemDefinitions', () => {
  it('converts items with i18nKey', () => {
    const items: ImportedRecommendedItem[] = [
      {
        id: 'bottled-water',
        i18nKey: 'products.bottled-water',
        category: 'water-beverages',
        baseQuantity: 3,
        unit: 'liters',
        scaleWithPeople: true,
        scaleWithDays: true,
      },
    ];
    const result = convertToRecommendedItemDefinitions(items);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('bottled-water');
    expect(result[0].i18nKey).toBe('products.bottled-water');
  });

  it('creates synthetic i18nKey for items with names only', () => {
    const items: ImportedRecommendedItem[] = [
      {
        id: 'custom-item',
        names: { en: 'Custom Item', fi: 'Mukautettu' },
        category: 'food',
        baseQuantity: 1,
        unit: 'pieces',
        scaleWithPeople: true,
        scaleWithDays: false,
      },
    ];
    const result = convertToRecommendedItemDefinitions(items);

    expect(result).toHaveLength(1);
    expect(result[0].i18nKey).toBe('custom.custom-item');
  });

  it('preserves all optional fields', () => {
    const items: ImportedRecommendedItem[] = [
      {
        id: 'complete-item',
        names: { en: 'Complete Item' },
        category: 'food',
        baseQuantity: 2,
        unit: 'kilograms',
        scaleWithPeople: true,
        scaleWithDays: true,
        requiresFreezer: true,
        defaultExpirationMonths: 12,
        weightGramsPerUnit: 500,
        caloriesPer100g: 200,
        caloriesPerUnit: 1000,
        requiresWaterLiters: 0.5,
        capacityMah: 10000,
        capacityWh: 37,
      },
    ];
    const result = convertToRecommendedItemDefinitions(items);

    expect(result[0].requiresFreezer).toBe(true);
    expect(result[0].defaultExpirationMonths).toBe(12);
    expect(result[0].weightGramsPerUnit).toBe(500);
    expect(result[0].caloriesPer100g).toBe(200);
    expect(result[0].caloriesPerUnit).toBe(1000);
    expect(result[0].requiresWaterLiters).toBe(0.5);
    expect(result[0].capacityMah).toBe(10000);
    expect(result[0].capacityWh).toBe(37);
  });
});
