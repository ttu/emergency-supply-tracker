import type { Category, StandardCategoryId } from '@/shared/types';
import { createCategoryId } from '@/shared/types';

export const STANDARD_CATEGORIES: Category[] = [
  {
    id: createCategoryId('water-beverages'),
    name: 'Water & Beverages',
    icon: '💧',
    isCustom: false,
  },
  {
    id: createCategoryId('food'),
    name: 'Food',
    icon: '🍽️',
    isCustom: false,
  },
  {
    id: createCategoryId('cooking-heat'),
    name: 'Cooking & Heat',
    icon: '🔥',
    isCustom: false,
  },
  {
    id: createCategoryId('light-power'),
    name: 'Light & Power',
    icon: '💡',
    isCustom: false,
  },
  {
    id: createCategoryId('communication-info'),
    name: 'Communication & Info',
    icon: '📻',
    isCustom: false,
  },
  {
    id: createCategoryId('medical-health'),
    name: 'Medical & Health',
    icon: '🏥',
    isCustom: false,
  },
  {
    id: createCategoryId('hygiene-sanitation'),
    name: 'Hygiene & Sanitation',
    icon: '🧼',
    isCustom: false,
  },
  {
    id: createCategoryId('tools-supplies'),
    name: 'Tools & Supplies',
    icon: '🔧',
    isCustom: false,
  },
  {
    id: createCategoryId('cash-documents'),
    name: 'Cash & Documents',
    icon: '💰',
    isCustom: false,
  },
  {
    id: createCategoryId('pets'),
    name: 'Pets',
    icon: '🐕',
    isCustom: false,
  },
];

export function getCategoryById(id: StandardCategoryId): Category | undefined {
  return STANDARD_CATEGORIES.find((c) => c.id === id);
}
