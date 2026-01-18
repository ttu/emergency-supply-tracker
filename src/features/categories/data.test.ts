import { STANDARD_CATEGORIES, getCategoryById } from './data';

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
});
