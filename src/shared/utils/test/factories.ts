import type {
  AppData,
  HouseholdConfig,
  UserSettings,
  InventoryItem,
  Category,
  ProductTemplate,
  RecommendedItemDefinition,
} from '@/shared/types';
import {
  createItemId,
  createCategoryId,
  createProductTemplateId,
  createAlertId,
} from '@/shared/types';
import type { Alert } from '@/features/alerts/types';

/**
 * Test data factories for creating mock data in tests
 */

export function createMockHousehold(
  overrides?: Partial<HouseholdConfig>,
): HouseholdConfig {
  return {
    adults: 2,
    children: 1,
    supplyDurationDays: 7,
    useFreezer: true,
    ...overrides,
  };
}

export function createMockSettings(
  overrides?: Partial<UserSettings>,
): UserSettings {
  return {
    language: 'en',
    theme: 'ocean',
    highContrast: false,
    advancedFeatures: {
      calorieTracking: false,
      powerManagement: false,
      waterTracking: false,
      ...overrides?.advancedFeatures,
    },
    ...overrides,
  };
}

export function createMockCategory(overrides?: Partial<Category>): Category {
  return {
    id: createCategoryId('test-category'),
    name: 'Test Category',
    icon: '🧪',
    isCustom: true,
    ...overrides,
  };
}

export function createMockInventoryItem(
  overrides?: Partial<InventoryItem>,
): InventoryItem {
  const now = new Date().toISOString();
  return {
    id: createItemId('test-item-1'),
    name: 'Test Item',
    itemType: 'test-item', // Template ID (kebab-case)
    categoryId: createCategoryId('food'),
    quantity: 10,
    unit: 'pieces',
    recommendedQuantity: 20,
    expirationDate: undefined,
    notes: '',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function createMockProductTemplate(
  overrides?: Partial<ProductTemplate>,
): ProductTemplate {
  return {
    id: createProductTemplateId('test-template'),
    name: 'Test Template',
    category: 'food',
    defaultUnit: 'pieces' as const,
    isBuiltIn: false,
    isCustom: true,
    ...overrides,
  };
}

export function createMockAppData(overrides?: Partial<AppData>): AppData {
  return {
    version: '1.0.0',
    household: createMockHousehold(overrides?.household),
    settings: createMockSettings(overrides?.settings),
    customCategories: [],
    items: [],
    customTemplates: [],
    dismissedAlertIds: [] as AppData['dismissedAlertIds'],
    disabledRecommendedItems: [] as AppData['disabledRecommendedItems'],
    lastModified: new Date().toISOString(),
    ...overrides,
  };
}

export function createMockAlert(overrides?: Partial<Alert>): Alert {
  return {
    id: createAlertId('test-alert-1'),
    type: 'warning',
    message: 'Test alert message',
    ...overrides,
  };
}

export function createMockRecommendedItem(
  overrides?: Partial<RecommendedItemDefinition>,
): RecommendedItemDefinition {
  return {
    id: createProductTemplateId('test-recommended'),
    i18nKey: 'products.test-item',
    category: 'food',
    baseQuantity: 1,
    unit: 'pieces',
    scaleWithPeople: true,
    scaleWithDays: true,
    ...overrides,
  };
}
