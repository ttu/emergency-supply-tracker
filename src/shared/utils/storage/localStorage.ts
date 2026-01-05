import type { AppData, InventoryItem } from '@/shared/types';
import {
  createItemId,
  createCategoryId,
  createProductTemplateId,
  createAlertId,
} from '@/shared/types';
import {
  CUSTOM_ITEM_TYPE,
  DAILY_CALORIES_PER_PERSON,
  DAILY_WATER_PER_PERSON,
  CHILDREN_REQUIREMENT_MULTIPLIER,
} from '@/shared/utils/constants';
import { APP_VERSION } from '@/shared/utils/version';

const STORAGE_KEY = 'emergencySupplyTracker';

/**
 * Checks if a value looks like a valid template ID (kebab-case).
 */
function isTemplateId(value: string): boolean {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(value);
}

/**
 * Normalizes an itemType value to a canonical template ID.
 * If the itemType is already a valid template ID, returns it.
 * Otherwise, returns CUSTOM_ITEM_TYPE.
 *
 * @param itemType - The current itemType value
 * @returns The template ID if valid, or CUSTOM_ITEM_TYPE if not
 */
function normalizeItemType(itemType: string | undefined): string {
  // If itemType is already a valid template ID, use it
  if (itemType && isTemplateId(itemType)) {
    return itemType;
  }

  // Invalid or missing - use custom item type
  return CUSTOM_ITEM_TYPE;
}

/**
 * Normalizes inventory items by ensuring itemType values are valid template IDs
 * and casting IDs to branded types.
 */
function normalizeItems(
  items: InventoryItem[] | undefined,
): InventoryItem[] | undefined {
  if (!items) return items;

  return items.map((item) => ({
    ...item,
    id: createItemId(item.id as string),
    categoryId: createCategoryId(item.categoryId as string),
    itemType: normalizeItemType(item.itemType),
    productTemplateId: item.productTemplateId
      ? createProductTemplateId(item.productTemplateId as string)
      : undefined,
  }));
}

export function createDefaultAppData(): AppData {
  return {
    version: '1.0.0',
    household: {
      adults: 2,
      children: 0,
      supplyDurationDays: 7,
      useFreezer: false,
    },
    settings: {
      language: 'en',
      theme: 'ocean',
      highContrast: false,
      advancedFeatures: {
        calorieTracking: false,
        powerManagement: false,
        waterTracking: false,
      },
      dailyCaloriesPerPerson: DAILY_CALORIES_PER_PERSON,
      dailyWaterPerPerson: DAILY_WATER_PER_PERSON,
      childrenRequirementPercentage: CHILDREN_REQUIREMENT_MULTIPLIER * 100,
    },
    customCategories: [],
    items: [],
    customTemplates: [],
    dismissedAlertIds: [],
    disabledRecommendedItems: [],
    lastModified: new Date().toISOString(),
  };
}

export function getAppData(): AppData | null {
  try {
    const json = localStorage.getItem(STORAGE_KEY);
    if (!json) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawData = JSON.parse(json) as any;

    // Normalize items: ensure itemType values are valid template IDs and cast IDs
    const normalizedItems = normalizeItems(rawData.items) ?? [];

    // Cast IDs to branded types
    const data: AppData = {
      ...rawData,
      items: normalizedItems,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      customCategories: (rawData.customCategories || []).map((cat: any) => ({
        ...cat,
        id: createCategoryId(cat.id as string),
      })),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      customTemplates: (rawData.customTemplates || []).map((template: any) => ({
        ...template,
        id: createProductTemplateId(template.id as string),
      })),
      dismissedAlertIds: (rawData.dismissedAlertIds || []).map(createAlertId),
      disabledRecommendedItems: (rawData.disabledRecommendedItems || []).map(
        createProductTemplateId,
      ),
    };

    return data;
  } catch (error) {
    console.error('Failed to load data from localStorage:', error);
    return null;
  }
}

export function saveAppData(data: AppData): void {
  try {
    const json = JSON.stringify(data);
    localStorage.setItem(STORAGE_KEY, json);
  } catch (error) {
    console.error('Failed to save data to localStorage:', error);
  }
}

export function clearAppData(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Export data structure that extends AppData with export metadata.
 */
export interface ExportData extends AppData {
  exportMetadata: {
    exportedAt: string; // ISO 8601 timestamp
    appVersion: string; // App version that created export
    itemCount: number;
    categoryCount: number;
  };
}

/**
 * Exports app data to JSON format with export metadata.
 * Includes version information and export timestamp for tracking.
 *
 * @param data - AppData to export
 * @returns JSON string with app data and export metadata
 */
export function exportToJSON(data: AppData): string {
  const exportData: ExportData = {
    ...data,
    exportMetadata: {
      exportedAt: new Date().toISOString(),
      appVersion: APP_VERSION,
      itemCount: data.items?.length ?? 0,
      categoryCount:
        (data.customCategories?.length ?? 0) +
        // Standard categories are always available (9 standard categories)
        9,
    },
  };
  return JSON.stringify(exportData, null, 2);
}

/**
 * Parses and normalizes imported JSON data into AppData format.
 * Ensures required fields exist and sets onboardingCompleted to true
 * since imported data represents an already-configured setup.
 *
 * @param json - JSON string containing app data to import
 * @returns Parsed and normalized AppData object
 * @throws Error if JSON parsing fails (invalid JSON format)
 */
export function importFromJSON(json: string): AppData {
  let data: Partial<AppData>;

  try {
    data = JSON.parse(json) as Partial<AppData>;
  } catch (error) {
    console.error('Failed to parse import JSON:', error);
    throw error;
  }

  // Ensure customCategories exists (only user's custom categories)
  if (!data.customCategories) {
    data.customCategories = [];
  }

  // Ensure customTemplates exists
  if (!data.customTemplates) {
    data.customTemplates = [];
  }

  // Ensure dismissedAlertIds exists and cast to branded types
  if (!data.dismissedAlertIds) {
    data.dismissedAlertIds = [];
  } else {
    data.dismissedAlertIds = (data.dismissedAlertIds as string[]).map(
      createAlertId,
    );
  }

  // Ensure disabledRecommendedItems exists and cast to branded types
  if (!data.disabledRecommendedItems) {
    data.disabledRecommendedItems = [];
  } else {
    data.disabledRecommendedItems = (
      data.disabledRecommendedItems as string[]
    ).map(createProductTemplateId);
  }

  // customRecommendedItems is optional - preserve if present, otherwise leave undefined

  // Normalize items: ensure itemType values are valid and set neverExpires flag
  if (data.items) {
    // First normalize itemType values to ensure they're valid template IDs
    data.items = normalizeItems(data.items as InventoryItem[]);

    // Then handle neverExpires normalization
    data.items = data.items?.map((item) => ({
      ...item,
      neverExpires: item.expirationDate === null ? true : item.neverExpires,
    }));
  }

  // When importing data, always skip onboarding since user has configured data
  if (data.settings) {
    data.settings.onboardingCompleted = true;
  }

  return data as AppData;
}
