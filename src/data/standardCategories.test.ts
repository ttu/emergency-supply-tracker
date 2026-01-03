/**
 * @deprecated Tests moved to '@/features/categories/data.test.ts'
 * This file is kept for backward compatibility
 */
import { STANDARD_CATEGORIES, getCategoryById } from '@/features/categories';

describe('standardCategories (backward compatibility)', () => {
  it('should re-export STANDARD_CATEGORIES from features/categories', () => {
    expect(STANDARD_CATEGORIES).toHaveLength(9);
    expect(STANDARD_CATEGORIES[0].id).toBe('water-beverages');
  });

  it('should re-export getCategoryById from features/categories', () => {
    const category = getCategoryById('water-beverages');
    expect(category).toBeDefined();
    expect(category?.id).toBe('water-beverages');
  });
});
