import type { Category, StandardCategoryId } from '../types';

export const STANDARD_CATEGORIES: Category[] = [
  {
    id: 'water-beverages',
    standardCategoryId: 'water-beverages',
    name: 'Water & Beverages',
    icon: '💧',
    isCustom: false,
  },
  {
    id: 'food',
    standardCategoryId: 'food',
    name: 'Food',
    icon: '🍽️',
    isCustom: false,
  },
  {
    id: 'cooking-heat',
    standardCategoryId: 'cooking-heat',
    name: 'Cooking & Heat',
    icon: '🔥',
    isCustom: false,
  },
  {
    id: 'light-power',
    standardCategoryId: 'light-power',
    name: 'Light & Power',
    icon: '💡',
    isCustom: false,
  },
  {
    id: 'communication-info',
    standardCategoryId: 'communication-info',
    name: 'Communication & Info',
    icon: '📻',
    isCustom: false,
  },
  {
    id: 'medical-health',
    standardCategoryId: 'medical-health',
    name: 'Medical & Health',
    icon: '🏥',
    isCustom: false,
  },
  {
    id: 'hygiene-sanitation',
    standardCategoryId: 'hygiene-sanitation',
    name: 'Hygiene & Sanitation',
    icon: '🧼',
    isCustom: false,
  },
  {
    id: 'tools-supplies',
    standardCategoryId: 'tools-supplies',
    name: 'Tools & Supplies',
    icon: '🔧',
    isCustom: false,
  },
  {
    id: 'cash-documents',
    standardCategoryId: 'cash-documents',
    name: 'Cash & Documents',
    icon: '💰',
    isCustom: false,
  },
];

export function getCategoryById(id: StandardCategoryId): Category | undefined {
  return STANDARD_CATEGORIES.find((c) => c.id === id);
}
