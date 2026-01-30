import type {
  Category,
  CategoryId,
  StandardCategoryId,
  AppData,
  InventoryItem,
} from '@/shared/types';
import { createCategoryId, VALID_CATEGORIES } from '@/shared/types';

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

/**
 * Gets a category by ID from any source (standard or custom).
 */
export function getCategoryByIdFromAppData(
  id: CategoryId,
  appData: Pick<AppData, 'customCategories'>,
): Category | undefined {
  // Check standard categories first
  const standard = STANDARD_CATEGORIES.find((c) => c.id === id);
  if (standard) return standard;

  // Check custom categories
  return appData.customCategories.find((c) => c.id === id);
}

/**
 * Gets all active categories (standard + custom, minus disabled).
 */
export function getAllCategories(
  appData: Pick<AppData, 'customCategories' | 'disabledCategories'>,
): Category[] {
  const disabledSet = new Set(appData.disabledCategories);

  // Filter standard categories
  const activeStandard = STANDARD_CATEGORIES.filter(
    (c) => !disabledSet.has(c.id as StandardCategoryId),
  );

  // Combine with custom categories (custom categories cannot be disabled, only deleted)
  return [...activeStandard, ...appData.customCategories];
}

/**
 * Gets the localized display name for a category.
 * For custom categories, uses the names object.
 * For standard categories, returns the name field (translation handled by caller).
 */
export function getCategoryDisplayName(
  category: Category,
  language: 'en' | 'fi',
): string {
  if (category.names) {
    return category.names[language] || category.names.en || category.name;
  }
  return category.name;
}

/**
 * Checks if a category can be deleted.
 * Returns blocking items if any exist.
 */
export function canDeleteCategory(
  id: CategoryId,
  items: InventoryItem[],
): { canDelete: boolean; blockingItems?: InventoryItem[] } {
  const blockingItems = items.filter((item) => item.categoryId === id);

  if (blockingItems.length > 0) {
    return { canDelete: false, blockingItems };
  }

  return { canDelete: true };
}

/**
 * Checks if a category ID is a standard category.
 */
export function isStandardCategory(id: CategoryId): boolean {
  return (VALID_CATEGORIES as readonly string[]).includes(id);
}
