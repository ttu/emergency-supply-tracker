import type {
  AppData,
  HouseholdConfig,
  UserSettings,
  InventoryItem,
  Category,
  ProductTemplate,
  RecommendedItemDefinition,
  RootStorage,
  InventorySetData,
} from '@/shared/types';
import {
  VALID_THEMES,
  VALID_UNITS,
  VALID_CATEGORIES,
  createItemId,
  createCategoryId,
  createProductTemplateId,
  createAlertId,
  createDateOnly,
  createQuantity,
  createInventorySetId,
} from '@/shared/types';
import type { Alert } from '@/features/alerts/types';
import { faker } from '@faker-js/faker';
import { CURRENT_SCHEMA_VERSION } from '@/shared/utils/storage/migrations';

/**
 * Test data factories for creating mock data in tests
 * Uses Faker.js to generate random, realistic test data
 */

// Shared constants for test data generation
// Note: VALID_UNITS, VALID_CATEGORIES, and VALID_THEMES are imported from @/shared/types

export function createMockHousehold(
  overrides?: Partial<HouseholdConfig>,
): HouseholdConfig {
  return {
    adults: faker.number.int({ min: 1, max: 5 }),
    children: faker.number.int({ min: 0, max: 4 }),
    pets: faker.number.int({ min: 0, max: 3 }),
    supplyDurationDays: faker.number.int({ min: 3, max: 14 }),
    useFreezer: faker.datatype.boolean(),
    ...overrides,
  };
}

export function createMockSettings(
  overrides?: Partial<UserSettings>,
): UserSettings {
  return {
    language: faker.helpers.arrayElement(['en', 'fi']),
    theme: faker.helpers.arrayElement(VALID_THEMES),
    highContrast: faker.datatype.boolean(),
    advancedFeatures: {
      calorieTracking: faker.datatype.boolean(),
      powerManagement: faker.datatype.boolean(),
      waterTracking: faker.datatype.boolean(),
      ...overrides?.advancedFeatures,
    },
    ...overrides,
  };
}

export function createMockCategory(overrides?: Partial<Category>): Category {
  return {
    id: createCategoryId(faker.string.alphanumeric(10)),
    name: faker.commerce.department(),
    icon: faker.helpers.arrayElement([
      '🧪',
      '🍔',
      '💧',
      '🔦',
      '📱',
      '🏥',
      '🧴',
      '🔧',
      '💰',
    ]),
    isCustom: faker.datatype.boolean(),
    ...overrides,
  };
}

export function createMockInventoryItem(
  overrides?: Partial<InventoryItem>,
): InventoryItem {
  const now = new Date().toISOString();

  return {
    id: createItemId(faker.string.uuid()),
    name: faker.commerce.productName(),
    itemType: createProductTemplateId(
      faker.helpers.slugify(faker.commerce.productName()).toLowerCase(),
    ), // Template ID (kebab-case)
    categoryId: createCategoryId(faker.helpers.arrayElement(VALID_CATEGORIES)),
    quantity: createQuantity(
      faker.number.float({ min: 0, max: 100, fractionDigits: 2 }),
    ),
    unit: faker.helpers.arrayElement(VALID_UNITS),
    expirationDate: faker.helpers.maybe(
      () => createDateOnly(faker.date.future().toISOString().split('T')[0]),
      { probability: 0.5 },
    ),
    purchaseDate: faker.helpers.maybe(
      () => createDateOnly(faker.date.past().toISOString().split('T')[0]),
      { probability: 0.3 },
    ),
    notes:
      faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.3 }) ||
      '',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function createMockProductTemplate(
  overrides?: Partial<ProductTemplate>,
): ProductTemplate {
  return {
    id: createProductTemplateId(faker.string.alphanumeric(10)),
    name: faker.commerce.productName(),
    category: faker.helpers.arrayElement(VALID_CATEGORIES),
    defaultUnit: faker.helpers.arrayElement(VALID_UNITS),
    isBuiltIn: faker.datatype.boolean(),
    isCustom: faker.datatype.boolean(),
    ...overrides,
  };
}

export function createMockAppData(overrides?: Partial<AppData>): AppData {
  return {
    version: CURRENT_SCHEMA_VERSION,
    household: createMockHousehold(overrides?.household),
    settings: createMockSettings(overrides?.settings),
    customCategories:
      faker.helpers.maybe(
        () =>
          Array.from({ length: faker.number.int({ min: 0, max: 5 }) }, () =>
            createMockCategory(),
          ),
        { probability: 0.5 },
      ) || [],
    items:
      faker.helpers.maybe(
        () =>
          Array.from({ length: faker.number.int({ min: 0, max: 10 }) }, () =>
            createMockInventoryItem(),
          ),
        { probability: 0.5 },
      ) || [],
    customTemplates:
      faker.helpers.maybe(
        () =>
          Array.from({ length: faker.number.int({ min: 0, max: 5 }) }, () =>
            createMockProductTemplate(),
          ),
        { probability: 0.5 },
      ) || [],
    dismissedAlertIds: [] as AppData['dismissedAlertIds'],
    disabledRecommendedItems: [] as AppData['disabledRecommendedItems'],
    disabledCategories: [] as AppData['disabledCategories'],
    lastModified: faker.date.recent().toISOString(),
    ...overrides,
  };
}

/**
 * Alias for createMockAppData for consistency with other test utilities.
 */
export const createAppData = createMockAppData;

export function createMockAlert(overrides?: Partial<Alert>): Alert {
  return {
    id: createAlertId(faker.string.uuid()),
    type: faker.helpers.arrayElement(['critical', 'warning', 'info']),
    message: faker.lorem.sentence(),
    ...overrides,
  };
}

export function createMockRecommendedItem(
  overrides?: Partial<RecommendedItemDefinition>,
): RecommendedItemDefinition {
  return {
    id: createProductTemplateId(faker.string.alphanumeric(10)),
    i18nKey: `products.${faker.string.alphanumeric(10).toLowerCase()}`,
    category: faker.helpers.arrayElement(VALID_CATEGORIES),
    baseQuantity: createQuantity(
      faker.number.float({ min: 0.1, max: 10, fractionDigits: 2 }),
    ),
    unit: faker.helpers.arrayElement(VALID_UNITS),
    scaleWithPeople: faker.datatype.boolean(),
    scaleWithDays: faker.datatype.boolean(),
    scaleWithPets: faker.datatype.boolean(),
    ...overrides,
  };
}

export function createMockInventorySetData(
  overrides?: Partial<InventorySetData>,
): InventorySetData {
  const id = overrides?.id ?? createInventorySetId(faker.string.uuid());
  return {
    id,
    name: faker.lorem.words(2),
    household: createMockHousehold(overrides?.household),
    items: overrides?.items ?? [],
    customCategories: overrides?.customCategories ?? [],
    customTemplates: overrides?.customTemplates ?? [],
    dismissedAlertIds: overrides?.dismissedAlertIds ?? [],
    disabledRecommendedItems: overrides?.disabledRecommendedItems ?? [],
    disabledCategories: overrides?.disabledCategories ?? [],
    lastModified: faker.date.recent().toISOString(),
    ...overrides,
  };
}

export function createMockRootStorage(
  overrides?: Partial<RootStorage>,
): RootStorage {
  const defaultSetId = createInventorySetId('default');
  const defaultSet = createMockInventorySetData({
    id: defaultSetId,
    name: 'Default',
  });

  return {
    version: CURRENT_SCHEMA_VERSION,
    settings: createMockSettings(overrides?.settings),
    activeInventorySetId: defaultSetId,
    inventorySets: {
      [defaultSetId as string]: defaultSet,
      ...overrides?.inventorySets,
    },
    ...overrides,
  };
}
