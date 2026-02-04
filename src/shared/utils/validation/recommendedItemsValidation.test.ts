import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  validateRecommendedItemsFile,
  parseRecommendedItemsFile,
  convertToRecommendedItemDefinitions,
} from './recommendedItemsValidation';
import type {
  RecommendedItemsFile,
  ImportedRecommendedItem,
  Quantity,
} from '../../types';
import { createProductTemplateId, createQuantity } from '../../types';
import { CURRENT_SCHEMA_VERSION } from '@/shared/utils/storage/migrations';

function createValidFile(
  overrides?: Partial<RecommendedItemsFile>,
): RecommendedItemsFile {
  return {
    meta: {
      name: 'Test Kit',
      version: CURRENT_SCHEMA_VERSION,
      createdAt: '2025-01-01T00:00:00.000Z',
      ...overrides?.meta,
    },
    items: overrides?.items ?? [
      {
        id: createProductTemplateId('test-item'),
        names: { en: 'Test Item' },
        category: 'food',
        baseQuantity: createQuantity(1),
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
    id: createProductTemplateId('test-item'),
    names: { en: 'Test Item' },
    category: 'food',
    baseQuantity: createQuantity(1),
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

    it('accepts meta.name and meta.description as localized objects (en required)', () => {
      const file = createValidFile({
        meta: {
          name: { en: '72 Hours Standard Kit', fi: '72 tunnin varmuusvarasto' },
          version: '1.0.0',
          description: {
            en: 'Default 72-hour kit',
            fi: '72 tunnin vakiopaketti',
          },
          createdAt: '2025-01-01T00:00:00.000Z',
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
            id: createProductTemplateId('bottled-water'),
            i18nKey: 'products.bottled-water',
            category: 'water-beverages',
            baseQuantity: createQuantity(3),
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
          items: [
            createValidItem({
              id: createProductTemplateId(`item-${category}`),
              category,
            }),
          ],
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
          items: [
            createValidItem({
              id: createProductTemplateId(`item-${unit}`),
              unit,
            }),
          ],
        });
        const result = validateRecommendedItemsFile(file);
        expect(result.valid).toBe(true);
      });
    });

    it('accepts items with all optional fields', () => {
      const file = createValidFile({
        items: [
          {
            id: createProductTemplateId('complete-item'),
            names: {
              en: 'Complete Item',
              fi: 'Täydellinen tuote',
              sv: 'Komplett objekt',
            },
            category: 'food',
            baseQuantity: createQuantity(2.5),
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
            id: createProductTemplateId('multi-lang-item'),
            names: {
              en: 'Water',
              fi: 'Vesi',
              sv: 'Vatten',
              de: 'Wasser',
              fr: 'Eau',
            },
            category: 'water-beverages',
            baseQuantity: createQuantity(3),
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
      delete (file.meta as unknown as Record<string, unknown>).name;
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

    it('rejects meta.name as object without en', () => {
      const file = createValidFile({
        meta: {
          name: { fi: 'Vain suomeksi' },
          version: '1.0.0',
          createdAt: '2025-01-01T00:00:00.000Z',
        },
      });
      const result = validateRecommendedItemsFile(file);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'MISSING_META_NAME' }),
      );
    });

    it('rejects missing meta.version', () => {
      const file = createValidFile();
      delete (file.meta as unknown as Record<string, unknown>).version;
      const result = validateRecommendedItemsFile(file);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'MISSING_META_VERSION' }),
      );
    });

    it('rejects missing meta.createdAt', () => {
      const file = createValidFile();
      delete (file.meta as unknown as Record<string, unknown>).createdAt;
      const result = validateRecommendedItemsFile(file);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'MISSING_META_CREATED_AT' }),
      );
    });

    it('rejects invalid meta.language', () => {
      const file = createValidFile();
      (file.meta as unknown as Record<string, unknown>).language = 'de';
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
      (file as unknown as Record<string, unknown>).items = 'not-array';
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
      delete (item as unknown as Record<string, unknown>).id;
      const file = createValidFile({ items: [item] });
      const result = validateRecommendedItemsFile(file);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'MISSING_ID' }),
      );
    });

    it('rejects item without names.en or i18nKey', () => {
      const item = createValidItem();
      delete (item as unknown as Record<string, unknown>).names;
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
            id: createProductTemplateId('no-english'),
            names: { fi: 'Suomeksi' }, // missing 'en'
            category: 'food',
            baseQuantity: createQuantity(1),
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
            id: createProductTemplateId('invalid-names'),
            names: 'not an object' as unknown as Record<string, string>,
            category: 'food',
            baseQuantity: createQuantity(1),
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
        // Use type assertion to test invalid value (deliberately testing validation)
        items: [createValidItem({ baseQuantity: -1 as unknown as Quantity })],
      });
      const result = validateRecommendedItemsFile(file);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'INVALID_QUANTITY' }),
      );
    });

    it('rejects non-boolean scaleWithPeople', () => {
      const item = createValidItem();
      (item as unknown as Record<string, unknown>).scaleWithPeople = 'yes';
      const file = createValidFile({ items: [item] });
      const result = validateRecommendedItemsFile(file);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'INVALID_BOOLEAN' }),
      );
    });

    it('rejects non-boolean scaleWithDays', () => {
      const item = createValidItem();
      (item as unknown as Record<string, unknown>).scaleWithDays = 1;
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
          createValidItem({ id: createProductTemplateId('duplicate-id') }),
          createValidItem({ id: createProductTemplateId('duplicate-id') }),
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
      (file as unknown as Record<string, unknown>).items = [
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
            id: createProductTemplateId('empty-i18n'),
            i18nKey: '   ', // empty after trim
            category: 'food',
            baseQuantity: createQuantity(1),
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
        items: [createValidItem({ baseQuantity: createQuantity(0) })],
      });
      const result = validateRecommendedItemsFile(file);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'INVALID_QUANTITY' }),
      );
    });

    it('rejects non-finite baseQuantity (Infinity)', () => {
      const file = createValidFile({
        // Use type assertion to test invalid value (deliberately testing validation)
        items: [
          createValidItem({ baseQuantity: Infinity as unknown as Quantity }),
        ],
      });
      const result = validateRecommendedItemsFile(file);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'INVALID_QUANTITY' }),
      );
    });

    it('rejects non-finite baseQuantity (NaN)', () => {
      const file = createValidFile({
        // Use type assertion to test invalid value (deliberately testing validation)
        items: [
          createValidItem({ baseQuantity: Number.NaN as unknown as Quantity }),
        ],
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
      (item as unknown as Record<string, unknown>).requiresFreezer = 'yes';
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
            id: createProductTemplateId('empty-name'),
            names: { en: 'Valid', fi: '   ' }, // empty Finnish name
            category: 'food',
            baseQuantity: createQuantity(1),
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
        id: createProductTemplateId('bottled-water'),
        i18nKey: 'products.bottled-water',
        category: 'water-beverages',
        baseQuantity: createQuantity(3),
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
        id: createProductTemplateId('custom-item'),
        names: { en: 'Custom Item', fi: 'Mukautettu' },
        category: 'food',
        baseQuantity: createQuantity(1),
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
        id: createProductTemplateId('complete-item'),
        names: { en: 'Complete Item' },
        category: 'food',
        baseQuantity: createQuantity(2),
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

  it('preserves scaleWithPets for pet items', () => {
    const items: ImportedRecommendedItem[] = [
      {
        id: createProductTemplateId('pet-food'),
        i18nKey: 'products.pet-food',
        category: 'pets',
        baseQuantity: createQuantity(1),
        unit: 'kilograms',
        scaleWithPeople: false,
        scaleWithDays: true,
        scaleWithPets: true,
      },
    ];
    const result = convertToRecommendedItemDefinitions(items);

    expect(result[0].scaleWithPets).toBe(true);
    expect(result[0].scaleWithPeople).toBe(false);
    expect(result[0].scaleWithDays).toBe(true);
  });
});

describe('validateRecommendedItemsFile with custom categories', () => {
  const validMeta = {
    name: 'Test Kit',
    version: '1.0.0',
    createdAt: '2026-01-28T00:00:00Z',
  };

  it('accepts items using custom categories defined in file', () => {
    const data = {
      meta: validMeta,
      categories: [
        { id: 'camping-gear', names: { en: 'Camping' }, icon: '⛺' },
      ],
      items: [
        {
          id: 'tent',
          names: { en: 'Tent' },
          category: 'camping-gear',
          baseQuantity: createQuantity(1),
          unit: 'pieces',
          scaleWithPeople: false,
          scaleWithDays: false,
        },
      ],
    };
    const result = validateRecommendedItemsFile(data);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('accepts items using standard categories alongside custom categories', () => {
    const data = {
      meta: validMeta,
      categories: [
        { id: 'camping-gear', names: { en: 'Camping' }, icon: '⛺' },
      ],
      items: [
        {
          id: 'tent',
          names: { en: 'Tent' },
          category: 'camping-gear',
          baseQuantity: createQuantity(1),
          unit: 'pieces',
          scaleWithPeople: false,
          scaleWithDays: false,
        },
        {
          id: 'water',
          names: { en: 'Water' },
          category: 'water-beverages',
          baseQuantity: createQuantity(3),
          unit: 'liters',
          scaleWithPeople: true,
          scaleWithDays: true,
        },
      ],
    };
    const result = validateRecommendedItemsFile(data);
    expect(result.valid).toBe(true);
  });

  it('rejects items using undefined custom category', () => {
    const data = {
      meta: validMeta,
      items: [
        {
          id: 'tent',
          names: { en: 'Tent' },
          category: 'undefined-category',
          baseQuantity: createQuantity(1),
          unit: 'pieces',
          scaleWithPeople: false,
          scaleWithDays: false,
        },
      ],
    };
    const result = validateRecommendedItemsFile(data);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({ code: 'INVALID_CATEGORY' }),
    );
  });

  it('validates category definitions and reports errors', () => {
    const data = {
      meta: validMeta,
      categories: [{ id: 'invalid id', names: { en: 'Test' }, icon: '⛺' }],
      items: [
        {
          id: 'item1',
          names: { en: 'Item' },
          category: 'food',
          baseQuantity: createQuantity(1),
          unit: 'pieces',
          scaleWithPeople: false,
          scaleWithDays: false,
        },
      ],
    };
    const result = validateRecommendedItemsFile(data);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({ code: 'INVALID_CATEGORY_ID' }),
    );
  });

  it('rejects categories that conflict with standard categories', () => {
    const data = {
      meta: validMeta,
      categories: [{ id: 'food', names: { en: 'My Food' }, icon: '🍕' }],
      items: [
        {
          id: 'item1',
          names: { en: 'Item' },
          category: 'food',
          baseQuantity: createQuantity(1),
          unit: 'pieces',
          scaleWithPeople: false,
          scaleWithDays: false,
        },
      ],
    };
    const result = validateRecommendedItemsFile(data);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({ code: 'CATEGORY_CONFLICTS_STANDARD' }),
    );
  });

  it('rejects duplicate category IDs', () => {
    const data = {
      meta: validMeta,
      categories: [
        { id: 'camping-gear', names: { en: 'Camping' }, icon: '⛺' },
        { id: 'camping-gear', names: { en: 'Camping 2' }, icon: '🏕️' },
      ],
      items: [
        {
          id: 'item1',
          names: { en: 'Item' },
          category: 'camping-gear',
          baseQuantity: createQuantity(1),
          unit: 'pieces',
          scaleWithPeople: false,
          scaleWithDays: false,
        },
      ],
    };
    const result = validateRecommendedItemsFile(data);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({ code: 'DUPLICATE_CATEGORY_ID' }),
    );
  });

  it('rejects non-array categories field', () => {
    const data = {
      meta: validMeta,
      categories: 'not-an-array',
      items: [
        {
          id: 'item1',
          names: { en: 'Item' },
          category: 'food',
          baseQuantity: createQuantity(1),
          unit: 'pieces',
          scaleWithPeople: false,
          scaleWithDays: false,
        },
      ],
    };
    const result = validateRecommendedItemsFile(data);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({ code: 'INVALID_CATEGORIES' }),
    );
  });

  it('accepts empty categories array', () => {
    const data = {
      meta: validMeta,
      categories: [],
      items: [
        {
          id: 'item1',
          names: { en: 'Item' },
          category: 'food',
          baseQuantity: createQuantity(1),
          unit: 'pieces',
          scaleWithPeople: false,
          scaleWithDays: false,
        },
      ],
    };
    const result = validateRecommendedItemsFile(data);
    expect(result.valid).toBe(true);
  });

  it('accepts kit without categories field (optional)', () => {
    const data = {
      meta: validMeta,
      items: [
        {
          id: 'item1',
          names: { en: 'Item' },
          category: 'food',
          baseQuantity: createQuantity(1),
          unit: 'pieces',
          scaleWithPeople: false,
          scaleWithDays: false,
        },
      ],
    };
    const result = validateRecommendedItemsFile(data);
    expect(result.valid).toBe(true);
  });
});

describe('example recommendation kits', () => {
  const examplesDir = path.resolve(process.cwd(), 'examples');
  const kitFiles = [
    'recommendation-kit-72tuntia-standard.json',
    'recommendation-kit-minimal-essentials.json',
    'recommendation-kit-nordic-winter.json',
    'recommendation-kit-vehicle-emergency.json',
    'recommendation-kit-outdoor-cottage.json',
  ] as const;

  it.each(kitFiles)('parses and validates %s', (filename) => {
    const filePath = path.join(examplesDir, filename);
    const json = fs.readFileSync(filePath, 'utf-8');
    const file = parseRecommendedItemsFile(json);

    expect(file.meta).toBeDefined();
    expect(file.meta.name).toBeDefined();
    expect(file.meta.version).toBeDefined();
    expect(file.meta.createdAt).toBeDefined();
    expect(Array.isArray(file.items)).toBe(true);
    expect(file.items.length).toBeGreaterThan(0);
  });

  it('72tuntia-standard kit has localized meta and many items', () => {
    const json = fs.readFileSync(
      path.join(examplesDir, 'recommendation-kit-72tuntia-standard.json'),
      'utf-8',
    );
    const file = parseRecommendedItemsFile(json);

    expect(typeof file.meta.name).toBe('object');
    expect(file.meta.name).toHaveProperty('en');
    expect(file.meta.name).toHaveProperty('fi');
    expect(file.meta.description).toBeDefined();
    if (typeof file.meta.description === 'object') {
      expect(file.meta.description).toHaveProperty('en');
      expect(file.meta.description).toHaveProperty('fi');
    }
    expect(file.items.length).toBeGreaterThan(50);
  });

  it('outdoor-cottage kit includes custom categories', () => {
    const json = fs.readFileSync(
      path.join(examplesDir, 'recommendation-kit-outdoor-cottage.json'),
      'utf-8',
    );
    const file = parseRecommendedItemsFile(json);

    expect(file.categories).toBeDefined();
    expect(Array.isArray(file.categories)).toBe(true);
    expect(file.categories!.length).toBe(2);

    const categoryIds = file.categories!.map((c) => c.id);
    expect(categoryIds).toContain('garden-supplies');
    expect(categoryIds).toContain('winter-gear');

    const itemsInCustomCategories = file.items.filter(
      (item) =>
        item.category === 'garden-supplies' || item.category === 'winter-gear',
    );
    expect(itemsInCustomCategories.length).toBeGreaterThan(0);
  });
});
