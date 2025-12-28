import type {
  AppData,
  HouseholdConfig,
  UserSettings,
  InventoryItem,
  Category,
  ProductTemplate,
} from '../../types';

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
    theme: 'light',
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
    id: 'test-category',
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
    id: 'test-item-1',
    name: 'Test Item',
    itemType: 'Test Item',
    categoryId: 'food',
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
    id: 'test-template',
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
    lastModified: new Date().toISOString(),
    ...overrides,
  };
}
