import { describe, it, expect, vi } from 'vitest';
import {
  CategoryFactory,
  CategoryValidationError,
  type CreateCategoryInput,
} from './CategoryFactory';
import type { Category } from '@/shared/types';
import { STANDARD_CATEGORIES } from '../data';

// Mock crypto.randomUUID
const mockUUID = 'test-uuid-123';
vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue(
  mockUUID as `${string}-${string}-${string}-${string}-${string}`,
);

describe('CategoryFactory', () => {
  describe('createCustom', () => {
    it('creates a valid custom category', () => {
      const input: CreateCategoryInput = {
        name: 'Test Category',
        icon: '🧪',
        isCustom: true,
      };

      const category = CategoryFactory.createCustom(input);

      expect(category.id).toBeDefined();
      expect(category.name).toBe('Test Category');
      expect(category.icon).toBe('🧪');
      expect(category.isCustom).toBe(true);
      expect(category.standardCategoryId).toBeUndefined();
    });

    it('trims name whitespace', () => {
      const input: CreateCategoryInput = {
        name: '  Test Category  ',
        isCustom: true,
      };

      const category = CategoryFactory.createCustom(input);

      expect(category.name).toBe('Test Category');
    });

    it('throws error when name is empty', () => {
      expect(() => {
        CategoryFactory.createCustom({
          name: '',
          isCustom: true,
        });
      }).toThrow(CategoryValidationError);
    });

    it('throws error when name is only whitespace', () => {
      expect(() => {
        CategoryFactory.createCustom({
          name: '   ',
          isCustom: true,
        });
      }).toThrow(CategoryValidationError);
    });

    it('throws error when isCustom is false', () => {
      expect(() => {
        CategoryFactory.createCustom({
          name: 'Test',
          isCustom: false,
        } as CreateCategoryInput);
      }).toThrow(CategoryValidationError);
    });

    it('throws error when standardCategoryId is provided', () => {
      expect(() => {
        CategoryFactory.createCustom({
          name: 'Test',
          standardCategoryId: 'food',
          isCustom: true,
        } as CreateCategoryInput);
      }).toThrow(CategoryValidationError);
    });

    it('throws error when icon is invalid', () => {
      expect(() => {
        CategoryFactory.createCustom({
          name: 'Test',
          icon: 'invalid',
          isCustom: true,
        });
      }).toThrow(CategoryValidationError);
    });

    it('allows valid emoji icons', () => {
      const validEmojis = [
        '🧪',
        '💧',
        '🍽️',
        '🔥',
        '💡',
        '📻',
        '🏥',
        '🧼',
        '🔧',
        '💰',
      ];

      validEmojis.forEach((emoji) => {
        const category = CategoryFactory.createCustom({
          name: 'Test',
          icon: emoji,
          isCustom: true,
        });
        expect(category.icon).toBe(emoji);
      });
    });

    it('throws error when duplicate name exists', () => {
      const existingCategories: Category[] = [
        {
          id: STANDARD_CATEGORIES[0].id,
          name: 'Existing Category',
          isCustom: true,
        },
      ];

      expect(() => {
        CategoryFactory.createCustom(
          {
            name: 'Existing Category',
            isCustom: true,
          },
          existingCategories,
        );
      }).toThrow(CategoryValidationError);
    });

    it('allows duplicate names with different case if not checking', () => {
      // Without existing categories check, should work
      const category = CategoryFactory.createCustom({
        name: 'Test Category',
        isCustom: true,
      });
      expect(category.name).toBe('Test Category');
    });

    it('assigns IDs to each category', () => {
      const category1 = CategoryFactory.createCustom({
        name: 'Category 1',
        isCustom: true,
      });
      const category2 = CategoryFactory.createCustom({
        name: 'Category 2',
        isCustom: true,
      });

      expect(category1.id).toBeDefined();
      expect(category2.id).toBeDefined();
    });
  });

  describe('createStandard', () => {
    it('creates a standard category', () => {
      const category = CategoryFactory.createStandard({
        standardCategoryId: 'food',
        name: 'Food',
        icon: '🍽️',
      });

      expect(category.id).toBeDefined();
      expect(category.standardCategoryId).toBe('food');
      expect(category.name).toBe('Food');
      expect(category.icon).toBe('🍽️');
      expect(category.isCustom).toBe(false);
    });

    it('throws error when standardCategoryId is invalid', () => {
      expect(() => {
        // @ts-expect-error - Testing invalid input
        CategoryFactory.createStandard({
          standardCategoryId: 'invalid-category',
          name: 'Invalid',
        });
      }).toThrow(CategoryValidationError);
    });
  });
});
