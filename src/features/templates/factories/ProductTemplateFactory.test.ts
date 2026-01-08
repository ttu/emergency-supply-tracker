import { describe, it, expect, vi } from 'vitest';
import {
  ProductTemplateFactory,
  ProductTemplateValidationError,
  type CreateProductTemplateInput,
} from './ProductTemplateFactory';
import {
  createProductTemplateId,
  VALID_CATEGORIES,
  VALID_UNITS,
} from '@/shared/types';
import { faker } from '@faker-js/faker';

// Mock crypto.randomUUID
const mockUUID = 'test-uuid-123';
vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue(
  mockUUID as `${string}-${string}-${string}-${string}-${string}`,
);

describe('ProductTemplateFactory', () => {
  describe('createCustom', () => {
    it('creates a valid custom template', () => {
      const name = faker.commerce.productName();
      const category = faker.helpers.arrayElement(VALID_CATEGORIES);
      const defaultUnit = faker.helpers.arrayElement(VALID_UNITS);
      const input: CreateProductTemplateInput = {
        name,
        category,
        defaultUnit,
        isCustom: true,
        isBuiltIn: false,
      };

      const template = ProductTemplateFactory.createCustom(input);

      expect(template.id).toBeDefined();
      expect(template.name).toBe(name);
      expect(template.category).toBe(category);
      expect(template.defaultUnit).toBe(defaultUnit);
      expect(template.isCustom).toBe(true);
      expect(template.isBuiltIn).toBe(false);
      expect(template.createdAt).toBeDefined();
      expect(template.updatedAt).toBeDefined();
      expect(template.i18nKey).toBeUndefined();
    });

    it('trims name whitespace', () => {
      const input: CreateProductTemplateInput = {
        name: '  Test Template  ',
        category: 'food',
        defaultUnit: 'pieces',
        isCustom: true,
        isBuiltIn: false,
      };

      const template = ProductTemplateFactory.createCustom(input);

      expect(template.name).toBe('Test Template');
    });

    it('throws error when neither name nor i18nKey is provided', () => {
      expect(() => {
        ProductTemplateFactory.createCustom({
          category: 'food',
          defaultUnit: 'pieces',
          isCustom: true,
          isBuiltIn: false,
        });
      }).toThrow(ProductTemplateValidationError);
    });

    it('throws error when both name and i18nKey are provided', () => {
      expect(() => {
        ProductTemplateFactory.createCustom({
          name: 'Test',
          i18nKey: 'products.test',
          category: 'food',
          defaultUnit: 'pieces',
          isCustom: true,
          isBuiltIn: false,
        });
      }).toThrow(ProductTemplateValidationError);
    });

    it('throws error when category is invalid', () => {
      expect(() => {
        ProductTemplateFactory.createCustom({
          name: 'Test',
          category: '',
          defaultUnit: 'pieces',
          isCustom: true,
          isBuiltIn: false,
        });
      }).toThrow(ProductTemplateValidationError);
    });

    it('throws error when defaultUnit is invalid', () => {
      expect(() => {
        // @ts-expect-error - Testing invalid input
        ProductTemplateFactory.createCustom({
          name: 'Test',
          category: 'food',
          defaultUnit: 'invalid-unit',
          isCustom: true,
          isBuiltIn: false,
        });
      }).toThrow(ProductTemplateValidationError);
    });

    it('throws error when kind is invalid', () => {
      expect(() => {
        // @ts-expect-error - Testing invalid input
        ProductTemplateFactory.createCustom({
          name: 'Test',
          category: 'food',
          defaultUnit: 'pieces',
          kind: 'invalid-kind',
          isCustom: true,
          isBuiltIn: false,
        });
      }).toThrow(ProductTemplateValidationError);
    });

    it('overrides isBuiltIn to false for custom templates', () => {
      // createCustom always sets isBuiltIn to false, so this should work
      const template = ProductTemplateFactory.createCustom({
        name: 'Test',
        category: 'food',
        defaultUnit: 'pieces',
        isCustom: true,
        isBuiltIn: true, // Will be overridden to false
      });

      expect(template.isBuiltIn).toBe(false);
      expect(template.isCustom).toBe(true);
    });

    it('throws error when custom template has i18nKey but no name', () => {
      expect(() => {
        ProductTemplateFactory.createCustom({
          i18nKey: 'products.test',
          category: 'food',
          defaultUnit: 'pieces',
          isCustom: true,
          isBuiltIn: false,
        });
      }).toThrow(ProductTemplateValidationError);
    });

    it('throws error when built-in template has name but no i18nKey', () => {
      expect(() => {
        ProductTemplateFactory.createBuiltIn(
          {
            name: 'Test',
            category: 'food',
            defaultUnit: 'pieces',
            isBuiltIn: true,
            isCustom: false,
          },
          'test-template',
        );
      }).toThrow(ProductTemplateValidationError);
    });

    it('allows custom category strings', () => {
      const template = ProductTemplateFactory.createCustom({
        name: 'Test',
        category: 'custom-category-id',
        defaultUnit: 'pieces',
        isCustom: true,
        isBuiltIn: false,
      });

      expect(template.category).toBe('custom-category-id');
    });

    it('allows all valid unit types', () => {
      const units = [
        'pieces',
        'liters',
        'kilograms',
        'grams',
        'cans',
        'bottles',
      ] as const;

      units.forEach((unit) => {
        const template = ProductTemplateFactory.createCustom({
          name: 'Test',
          category: 'food',
          defaultUnit: unit,
          isCustom: true,
          isBuiltIn: false,
        });
        expect(template.defaultUnit).toBe(unit);
      });
    });

    it('allows all valid product kinds', () => {
      const kinds = [
        'food',
        'water',
        'medicine',
        'energy',
        'hygiene',
        'device',
        'other',
      ] as const;

      kinds.forEach((kind) => {
        const template = ProductTemplateFactory.createCustom({
          name: 'Test',
          category: 'food',
          defaultUnit: 'pieces',
          kind,
          isCustom: true,
          isBuiltIn: false,
        });
        expect(template.kind).toBe(kind);
      });
    });
  });

  describe('createBuiltIn', () => {
    it('creates a built-in template', () => {
      const input: CreateProductTemplateInput = {
        i18nKey: 'products.bottled-water',
        category: 'water-beverages',
        defaultUnit: 'liters',
        isCustom: false,
        isBuiltIn: true,
      };

      const template = ProductTemplateFactory.createBuiltIn(
        input,
        'bottled-water',
      );

      expect(template.id).toBe(createProductTemplateId('bottled-water'));
      expect(template.i18nKey).toBe('products.bottled-water');
      expect(template.name).toBeUndefined();
      expect(template.isBuiltIn).toBe(true);
      expect(template.isCustom).toBe(false);
      expect(template.createdAt).toBeUndefined();
      expect(template.updatedAt).toBeUndefined();
    });

    it('throws error when name is provided for built-in', () => {
      expect(() => {
        ProductTemplateFactory.createBuiltIn(
          {
            name: 'Test',
            category: 'food',
            defaultUnit: 'pieces',
            isCustom: false,
            isBuiltIn: true,
          },
          'test-id',
        );
      }).toThrow(ProductTemplateValidationError);
    });
  });
});
