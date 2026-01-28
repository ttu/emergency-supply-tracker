import {
  STANDARD_CATEGORIES,
  getCategoryById,
  getCategoryByIdFromAppData,
  getAllCategories,
  getCategoryDisplayName,
  canDeleteCategory,
  isStandardCategory,
} from './data';
import type { AppData, Category, InventoryItem } from '@/shared/types';
import { createCategoryId, createItemId } from '@/shared/types';

describe('standardCategories', () => {
  describe('STANDARD_CATEGORIES', () => {
    it('should contain 10 standard categories', () => {
      expect(STANDARD_CATEGORIES).toHaveLength(10);
    });

    it('should have water-beverages as first category', () => {
      expect(STANDARD_CATEGORIES[0].id).toBe('water-beverages');
      expect(STANDARD_CATEGORIES[0].icon).toBe('💧');
    });

    it('should have pets as last category', () => {
      expect(STANDARD_CATEGORIES[9].id).toBe('pets');
      expect(STANDARD_CATEGORIES[9].icon).toBe('🐕');
    });

    it('should have all categories marked as not custom', () => {
      STANDARD_CATEGORIES.forEach((category) => {
        expect(category.isCustom).toBe(false);
      });
    });
  });

  describe('getCategoryById', () => {
    it('should return category when id exists', () => {
      const category = getCategoryById('water-beverages');
      expect(category).toBeDefined();
      expect(category?.id).toBe('water-beverages');
      expect(category?.name).toBe('Water & Beverages');
    });

    it('should return food category', () => {
      const category = getCategoryById('food');
      expect(category).toBeDefined();
      expect(category?.id).toBe('food');
      expect(category?.icon).toBe('🍽️');
    });

    it('should return undefined for non-existent category', () => {
      // @ts-expect-error Testing invalid input
      const category = getCategoryById('non-existent');
      expect(category).toBeUndefined();
    });
  });

  describe('getCategoryByIdFromAppData', () => {
    it('should return standard category when no custom categories', () => {
      const appData = { customCategories: [] } as unknown as AppData;
      const category = getCategoryByIdFromAppData(
        createCategoryId('food'),
        appData,
      );
      expect(category).toBeDefined();
      expect(category?.id).toBe('food');
    });

    it('should return custom category', () => {
      const customCategory: Category = {
        id: createCategoryId('custom-cat'),
        name: 'Custom',
        icon: '⭐',
        isCustom: true,
      };
      const appData = {
        customCategories: [customCategory],
      } as unknown as AppData;
      const category = getCategoryByIdFromAppData(
        createCategoryId('custom-cat'),
        appData,
      );
      expect(category).toBeDefined();
      expect(category?.id).toBe('custom-cat');
    });

    it('should prioritize standard category over custom with same id', () => {
      const customCategory: Category = {
        id: createCategoryId('food'),
        name: 'Custom Food',
        icon: '🍕',
        isCustom: true,
      };
      const appData = {
        customCategories: [customCategory],
      } as unknown as AppData;
      const category = getCategoryByIdFromAppData(
        createCategoryId('food'),
        appData,
      );
      expect(category?.name).toBe('Food');
      expect(category?.isCustom).toBe(false);
    });
  });

  describe('getAllCategories', () => {
    it('returns standard categories when no custom categories', () => {
      const appData = {
        customCategories: [],
        disabledCategories: [],
      } as unknown as AppData;

      const result = getAllCategories(appData);
      expect(result).toHaveLength(STANDARD_CATEGORIES.length);
    });

    it('includes custom categories', () => {
      const customCategory: Category = {
        id: createCategoryId('custom-cat'),
        name: 'Custom',
        icon: '⭐',
        isCustom: true,
      };
      const appData = {
        customCategories: [customCategory],
        disabledCategories: [],
      } as unknown as AppData;

      const result = getAllCategories(appData);
      expect(result).toHaveLength(STANDARD_CATEGORIES.length + 1);
      expect(result.find((c) => c.id === 'custom-cat')).toBeDefined();
    });

    it('filters out disabled standard categories', () => {
      const appData = {
        customCategories: [],
        disabledCategories: ['pets'],
      } as unknown as AppData;

      const result = getAllCategories(appData);
      expect(result).toHaveLength(STANDARD_CATEGORIES.length - 1);
      expect(result.find((c) => c.id === 'pets')).toBeUndefined();
    });

    it('does not filter custom categories even if in disabled list', () => {
      const customCategory: Category = {
        id: createCategoryId('custom-cat'),
        name: 'Custom',
        icon: '⭐',
        isCustom: true,
      };
      const appData = {
        customCategories: [customCategory],
        disabledCategories: [],
      } as unknown as AppData;

      const result = getAllCategories(appData);
      expect(result.find((c) => c.id === 'custom-cat')).toBeDefined();
    });
  });

  describe('getCategoryDisplayName', () => {
    it('returns localized name for custom category', () => {
      const category: Category = {
        id: createCategoryId('custom'),
        name: 'Default Name',
        names: { en: 'English Name', fi: 'Suomeksi' },
        icon: '⭐',
        isCustom: true,
      };

      expect(getCategoryDisplayName(category, 'en')).toBe('English Name');
      expect(getCategoryDisplayName(category, 'fi')).toBe('Suomeksi');
    });

    it('falls back to English if language not found', () => {
      const category: Category = {
        id: createCategoryId('custom'),
        name: 'Default',
        names: { en: 'English Only' },
        icon: '⭐',
        isCustom: true,
      };

      expect(getCategoryDisplayName(category, 'fi')).toBe('English Only');
    });

    it('falls back to name field when names not defined', () => {
      const category: Category = {
        id: createCategoryId('food'),
        name: 'Food',
        icon: '🍽️',
        isCustom: false,
      };

      expect(getCategoryDisplayName(category, 'en')).toBe('Food');
      expect(getCategoryDisplayName(category, 'fi')).toBe('Food');
    });
  });

  describe('canDeleteCategory', () => {
    it('allows deletion when no items use category', () => {
      const result = canDeleteCategory(createCategoryId('custom'), []);
      expect(result.canDelete).toBe(true);
    });

    it('blocks deletion when items use category', () => {
      const items: InventoryItem[] = [
        {
          id: createItemId('item1'),
          name: 'Test Item',
          categoryId: createCategoryId('custom'),
          quantity: 1,
          unit: 'pieces',
          itemType: 'custom',
          createdAt: '',
          updatedAt: '',
        },
      ];

      const result = canDeleteCategory(createCategoryId('custom'), items);
      expect(result.canDelete).toBe(false);
      expect(result.blockingItems).toHaveLength(1);
    });

    it('allows deletion when items use different category', () => {
      const items: InventoryItem[] = [
        {
          id: createItemId('item1'),
          name: 'Test Item',
          categoryId: createCategoryId('food'),
          quantity: 1,
          unit: 'pieces',
          itemType: 'custom',
          createdAt: '',
          updatedAt: '',
        },
      ];

      const result = canDeleteCategory(createCategoryId('custom'), items);
      expect(result.canDelete).toBe(true);
    });
  });

  describe('isStandardCategory', () => {
    it('returns true for standard categories', () => {
      expect(isStandardCategory(createCategoryId('food'))).toBe(true);
      expect(isStandardCategory(createCategoryId('water-beverages'))).toBe(
        true,
      );
      expect(isStandardCategory(createCategoryId('pets'))).toBe(true);
    });

    it('returns false for custom categories', () => {
      expect(isStandardCategory(createCategoryId('custom-cat'))).toBe(false);
      expect(isStandardCategory(createCategoryId('camping-gear'))).toBe(false);
    });
  });
});
