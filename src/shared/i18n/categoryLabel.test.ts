import { describe, it, expect } from 'vitest';
import type { TFunction } from 'i18next';
import { resolveCategoryLabel } from './categoryLabel';
import { createMockCategory } from '@/shared/utils/test/factories';
import { createCategoryId } from '@/shared/types';

/** Stands in for i18next: known keys translate, unknown ones come back as-is. */
const translations: Record<string, string> = {
  food: 'Food',
  'water-beverages': 'Water & Beverages',
};
const t = ((key: string) => translations[key] ?? key) as unknown as TFunction;

describe('resolveCategoryLabel', () => {
  it('translates a standard category', () => {
    const category = createMockCategory({ id: createCategoryId('food') });
    expect(resolveCategoryLabel(category, 'food', 'en', t)).toBe('Food');
  });

  it("prefers the category's own name in the active language", () => {
    const category = createMockCategory({
      id: createCategoryId('garden'),
      name: 'Garden',
      names: { en: 'Garden', fi: 'Puutarha' },
    });
    expect(resolveCategoryLabel(category, 'garden', 'fi', t)).toBe('Puutarha');
  });

  it('falls back to English when the active language has no name', () => {
    const category = createMockCategory({
      id: createCategoryId('garden'),
      name: 'Garden',
      names: { en: 'Garden' },
    });
    expect(resolveCategoryLabel(category, 'garden', 'fi', t)).toBe('Garden');
  });

  it('uses the stored name when nothing translates the id', () => {
    // `isCustom` says where a category came from, not whether it has a
    // translation — a category can be stored without the flag and still have
    // no entry in the namespace.
    const category = createMockCategory({
      id: createCategoryId('garden'),
      name: 'Garden',
      names: undefined,
      isCustom: false,
    });
    expect(resolveCategoryLabel(category, 'garden', 'en', t)).toBe('Garden');
  });

  it('never renders a raw id when a name is available', () => {
    const category = createMockCategory({
      id: createCategoryId('garden'),
      name: 'Garden',
      names: undefined,
    });
    expect(resolveCategoryLabel(category, 'garden', 'en', t)).not.toBe(
      'garden',
    );
  });

  it('falls back to the id when the category is gone entirely', () => {
    expect(resolveCategoryLabel(undefined, 'ghost', 'en', t)).toBe('ghost');
  });
});
