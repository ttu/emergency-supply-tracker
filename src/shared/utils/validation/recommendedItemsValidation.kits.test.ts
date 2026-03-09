import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  validateRecommendedItemsFile,
  parseRecommendedItemsFile,
} from './recommendedItemsValidation';
import { createQuantity } from '../../types';

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
      expect.objectContaining({
        code: 'INVALID_CATEGORIES',
        path: 'categories',
        message: 'Categories must be an array',
      }),
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

describe('validateRecommendedItemsFile with disabledCategories', () => {
  const validMeta = {
    name: 'Test Kit',
    version: '1.0.0',
    createdAt: '2026-01-28T00:00:00Z',
  };

  it('accepts valid disabledCategories array with standard categories', () => {
    const data = {
      meta: validMeta,
      disabledCategories: ['food', 'water-beverages', 'pets'],
      items: [
        {
          id: 'item1',
          names: { en: 'Item' },
          category: 'tools-supplies',
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

  it('accepts kit without disabledCategories field (optional)', () => {
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

  it('accepts empty disabledCategories array', () => {
    const data = {
      meta: validMeta,
      disabledCategories: [],
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

  it('accepts all standard categories in disabledCategories', () => {
    const data = {
      meta: validMeta,
      categories: [{ id: 'custom-cat', names: { en: 'Custom' }, icon: '🎯' }],
      disabledCategories: [
        'water-beverages',
        'food',
        'cooking-heat',
        'light-power',
        'communication-info',
        'medical-health',
        'hygiene-sanitation',
        'tools-supplies',
        'cash-documents',
        'pets',
      ],
      items: [
        {
          id: 'item1',
          names: { en: 'Item' },
          category: 'custom-cat',
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

  it('rejects invalid category in disabledCategories', () => {
    const data = {
      meta: validMeta,
      disabledCategories: ['food', 'invalid-category'],
      items: [
        {
          id: 'item1',
          names: { en: 'Item' },
          category: 'tools-supplies',
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
      expect.objectContaining({
        code: 'INVALID_DISABLED_CATEGORY',
        path: 'disabledCategories[1]',
        message: expect.stringContaining('Invalid standard category ID'),
      }),
    );
  });

  it('rejects non-string in disabledCategories', () => {
    const data = {
      meta: validMeta,
      disabledCategories: [123],
      items: [
        {
          id: 'item1',
          names: { en: 'Item' },
          category: 'tools-supplies',
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
      expect.objectContaining({
        code: 'INVALID_DISABLED_CATEGORY',
        path: 'disabledCategories[0]',
      }),
    );
  });

  it('rejects non-array disabledCategories', () => {
    const data = {
      meta: validMeta,
      disabledCategories: 'food',
      items: [
        {
          id: 'item1',
          names: { en: 'Item' },
          category: 'tools-supplies',
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
      expect.objectContaining({
        code: 'INVALID_DISABLED_CATEGORIES',
        path: 'disabledCategories',
        message: 'disabledCategories must be an array',
      }),
    );
  });

  it('rejects custom category IDs in disabledCategories (only standard allowed)', () => {
    const data = {
      meta: validMeta,
      categories: [{ id: 'custom-cat', names: { en: 'Custom' }, icon: '🎯' }],
      disabledCategories: ['food', 'custom-cat'],
      items: [
        {
          id: 'item1',
          names: { en: 'Item' },
          category: 'custom-cat',
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
      expect.objectContaining({ code: 'INVALID_DISABLED_CATEGORY' }),
    );
  });

  it('warns about duplicate categories in disabledCategories', () => {
    const data = {
      meta: validMeta,
      disabledCategories: ['food', 'food', 'pets'],
      items: [
        {
          id: 'item1',
          names: { en: 'Item' },
          category: 'tools-supplies',
          baseQuantity: createQuantity(1),
          unit: 'pieces',
          scaleWithPeople: false,
          scaleWithDays: false,
        },
      ],
    };
    const result = validateRecommendedItemsFile(data);
    expect(result.valid).toBe(true); // duplicates are warnings, not errors
    expect(result.warnings).toContainEqual(
      expect.objectContaining({
        code: 'DUPLICATE_DISABLED_CATEGORY',
        path: 'disabledCategories[1]',
        message: expect.stringContaining('Duplicate disabled category'),
      }),
    );
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
    'recommendation-kit-cycling.json',
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

  it('cycling kit has custom categories and disables all standard categories', () => {
    const json = fs.readFileSync(
      path.join(examplesDir, 'recommendation-kit-cycling.json'),
      'utf-8',
    );
    const file = parseRecommendedItemsFile(json);

    // Has custom categories
    expect(file.categories).toBeDefined();
    expect(Array.isArray(file.categories)).toBe(true);
    expect(file.categories!.length).toBe(5);

    const categoryIds = file.categories!.map((c) => c.id);
    expect(categoryIds).toContain('cycling-tools');
    expect(categoryIds).toContain('cycling-parts');
    expect(categoryIds).toContain('cycling-clothing');
    expect(categoryIds).toContain('cycling-accessories');
    expect(categoryIds).toContain('cycling-safety');

    // Has disabledCategories with all standard categories
    expect(file.disabledCategories).toBeDefined();
    expect(Array.isArray(file.disabledCategories)).toBe(true);
    expect(file.disabledCategories).toContain('water-beverages');
    expect(file.disabledCategories).toContain('food');
    expect(file.disabledCategories).toContain('cooking-heat');
    expect(file.disabledCategories).toContain('light-power');
    expect(file.disabledCategories).toContain('communication-info');
    expect(file.disabledCategories).toContain('medical-health');
    expect(file.disabledCategories).toContain('hygiene-sanitation');
    expect(file.disabledCategories).toContain('tools-supplies');
    expect(file.disabledCategories).toContain('cash-documents');
    expect(file.disabledCategories).toContain('pets');

    // All items use custom categories
    const allItemsUseCustomCategories = file.items.every((item) =>
      categoryIds.includes(item.category),
    );
    expect(allItemsUseCustomCategories).toBe(true);
  });
});
