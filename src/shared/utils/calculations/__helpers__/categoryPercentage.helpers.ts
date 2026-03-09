import type { InventoryItem, RecommendedItemDefinition } from '@/shared/types';
import {
  createItemId,
  createCategoryId,
  createProductTemplateId,
  createDateOnly,
  createQuantity,
} from '@/shared/types';

// Helper to create mock inventory item
export function createMockInventoryItem(
  overrides: Partial<InventoryItem> = {},
): InventoryItem {
  return {
    id: createItemId('test-item'),
    name: 'Test Item',
    quantity: createQuantity(1),
    categoryId: createCategoryId('food'),
    itemType: createProductTemplateId('test'),
    unit: 'pieces',
    neverExpires: false,
    expirationDate: createDateOnly('2025-12-31'),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}
export const mockFoodRecommendedItems: RecommendedItemDefinition[] = [
  {
    id: createProductTemplateId('rice'),
    i18nKey: 'rice',
    category: 'food',
    baseQuantity: createQuantity(1),
    unit: 'kilograms',
    scaleWithPeople: true,
    scaleWithDays: true,
    caloriesPerUnit: 3600,
    caloriesPer100g: 360,
    weightGramsPerUnit: 1000,
  },
  {
    id: createProductTemplateId('canned-beans'),
    i18nKey: 'cannedBeans',
    category: 'food',
    baseQuantity: createQuantity(2),
    unit: 'cans',
    scaleWithPeople: true,
    scaleWithDays: false,
    caloriesPerUnit: 300,
    caloriesPer100g: 100,
    weightGramsPerUnit: 300,
  },
];

export const mockWaterRecommendedItems: RecommendedItemDefinition[] = [
  {
    id: createProductTemplateId('bottled-water'),
    i18nKey: 'bottledWater',
    category: 'water-beverages',
    baseQuantity: createQuantity(3),
    unit: 'liters',
    scaleWithPeople: true,
    scaleWithDays: true,
  },
];

export const mockToolsRecommendedItems: RecommendedItemDefinition[] = [
  {
    id: createProductTemplateId('flashlight'),
    i18nKey: 'flashlight',
    category: 'tools-supplies',
    baseQuantity: createQuantity(1),
    unit: 'pieces',
    scaleWithPeople: false,
    scaleWithDays: false,
  },
  {
    id: createProductTemplateId('batteries'),
    i18nKey: 'batteries',
    category: 'tools-supplies',
    baseQuantity: createQuantity(4),
    unit: 'pieces',
    scaleWithPeople: false,
    scaleWithDays: false,
  },
];

export const mockCookingHeatRecommendedItems: RecommendedItemDefinition[] = [
  {
    id: createProductTemplateId('camping-stove'),
    i18nKey: 'camping-stove',
    category: 'cooking-heat',
    baseQuantity: createQuantity(1),
    unit: 'pieces',
    scaleWithPeople: false,
    scaleWithDays: false,
  },
  {
    id: createProductTemplateId('stove-fuel'),
    i18nKey: 'stove-fuel',
    category: 'cooking-heat',
    baseQuantity: createQuantity(1),
    unit: 'canisters',
    scaleWithPeople: false,
    scaleWithDays: true,
  },
  {
    id: createProductTemplateId('matches'),
    i18nKey: 'matches',
    category: 'cooking-heat',
    baseQuantity: createQuantity(2),
    unit: 'boxes',
    scaleWithPeople: false,
    scaleWithDays: false,
  },
];

export const mockLightPowerRecommendedItems: RecommendedItemDefinition[] = [
  {
    id: createProductTemplateId('flashlight'),
    i18nKey: 'flashlight',
    category: 'light-power',
    baseQuantity: createQuantity(2),
    unit: 'pieces',
    scaleWithPeople: false,
    scaleWithDays: false,
  },
  {
    id: createProductTemplateId('headlamp'),
    i18nKey: 'headlamp',
    category: 'light-power',
    baseQuantity: createQuantity(1),
    unit: 'pieces',
    scaleWithPeople: true,
    scaleWithDays: false,
  },
  {
    id: createProductTemplateId('batteries-aa'),
    i18nKey: 'batteries-aa',
    category: 'light-power',
    baseQuantity: createQuantity(20),
    unit: 'pieces',
    scaleWithPeople: false,
    scaleWithDays: false,
  },
];

export const mockCommunicationRecommendedItems: RecommendedItemDefinition[] = [
  {
    id: createProductTemplateId('battery-radio'),
    i18nKey: 'battery-radio',
    category: 'communication-info',
    baseQuantity: createQuantity(1),
    unit: 'pieces',
    scaleWithPeople: false,
    scaleWithDays: false,
  },
  {
    id: createProductTemplateId('hand-crank-radio'),
    i18nKey: 'hand-crank-radio',
    category: 'communication-info',
    baseQuantity: createQuantity(1),
    unit: 'pieces',
    scaleWithPeople: false,
    scaleWithDays: false,
  },
];

export const mockMedicalHealthRecommendedItems: RecommendedItemDefinition[] = [
  {
    id: createProductTemplateId('first-aid-kit'),
    i18nKey: 'first-aid-kit',
    category: 'medical-health',
    baseQuantity: createQuantity(1),
    unit: 'pieces',
    scaleWithPeople: false,
    scaleWithDays: false,
  },
  {
    id: createProductTemplateId('prescription-meds'),
    i18nKey: 'prescription-meds',
    category: 'medical-health',
    baseQuantity: createQuantity(1),
    unit: 'days',
    scaleWithPeople: true,
    scaleWithDays: true,
  },
  {
    id: createProductTemplateId('bandages'),
    i18nKey: 'bandages',
    category: 'medical-health',
    baseQuantity: createQuantity(20),
    unit: 'pieces',
    scaleWithPeople: false,
    scaleWithDays: false,
  },
];

export const mockHygieneSanitationRecommendedItems: RecommendedItemDefinition[] =
  [
    {
      id: createProductTemplateId('toilet-paper'),
      i18nKey: 'toilet-paper',
      category: 'hygiene-sanitation',
      baseQuantity: createQuantity(1),
      unit: 'rolls',
      scaleWithPeople: true,
      scaleWithDays: true,
    },
    {
      id: createProductTemplateId('soap'),
      i18nKey: 'soap',
      category: 'hygiene-sanitation',
      baseQuantity: createQuantity(2),
      unit: 'pieces',
      scaleWithPeople: false,
      scaleWithDays: false,
    },
    {
      id: createProductTemplateId('toothbrush'),
      i18nKey: 'toothbrush',
      category: 'hygiene-sanitation',
      baseQuantity: createQuantity(1),
      unit: 'pieces',
      scaleWithPeople: true,
      scaleWithDays: false,
    },
  ];

export const mockCashDocumentsRecommendedItems: RecommendedItemDefinition[] = [
  {
    id: createProductTemplateId('cash'),
    i18nKey: 'cash',
    category: 'cash-documents',
    baseQuantity: createQuantity(300),
    unit: 'euros',
    scaleWithPeople: false,
    scaleWithDays: false,
  },
  {
    id: createProductTemplateId('document-copies'),
    i18nKey: 'document-copies',
    category: 'cash-documents',
    baseQuantity: createQuantity(1),
    unit: 'sets',
    scaleWithPeople: false,
    scaleWithDays: false,
  },
];
