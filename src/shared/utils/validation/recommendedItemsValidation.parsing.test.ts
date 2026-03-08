import { describe, it, expect } from 'vitest';
import {
  parseRecommendedItemsFile,
  convertToRecommendedItemDefinitions,
} from './recommendedItemsValidation';
import type { ImportedRecommendedItem } from '../../types';
import { createProductTemplateId, createQuantity } from '../../types';
import { createValidFile } from './__helpers__/recommendedItemsValidation.helpers';

describe('parseRecommendedItemsFile', () => {
  it('parses valid JSON', () => {
    const file = createValidFile();
    const json = JSON.stringify(file);
    const result = parseRecommendedItemsFile(json);

    expect(result).toEqual(file);
  });

  it('throws on invalid JSON syntax', () => {
    expect(() => parseRecommendedItemsFile('{ invalid json }')).toThrow(
      /Failed to parse recommended items JSON/,
    );
  });

  it('throws on invalid file structure', () => {
    expect(() => parseRecommendedItemsFile('{}')).toThrow(
      /Invalid recommended items file/,
    );
  });

  it('includes error details in thrown message', () => {
    expect(() => parseRecommendedItemsFile('{}')).toThrow(/MISSING_META|meta/);
  });

  it('includes path and message in error output', () => {
    try {
      parseRecommendedItemsFile('{}');
      expect.fail('Should have thrown');
    } catch (err) {
      const msg = (err as Error).message;
      expect(msg).toContain('Invalid recommended items file:');
      expect(msg).toContain('meta: Missing meta object');
    }
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
