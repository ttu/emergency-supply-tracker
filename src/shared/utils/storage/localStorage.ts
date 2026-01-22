import type {
  AppData,
  InventoryItem,
  ProductTemplateId,
  Category,
  ProductTemplate,
  KitId,
  UploadedKit,
} from '@/shared/types';
import type {
  ExportSection,
  PartialExportData,
  ExportMetadata,
} from '@/shared/types/exportImport';
import {
  createItemId,
  createCategoryId,
  createProductTemplateId,
  createAlertId,
} from '@/shared/types';
import { CUSTOM_ITEM_TYPE } from '@/shared/utils/constants';
import { APP_VERSION } from '@/shared/utils/version';
import { UserSettingsFactory } from '@/features/settings/factories/UserSettingsFactory';
import { STANDARD_CATEGORIES } from '@/features/categories/data';
import { DEFAULT_KIT_ID } from '@/features/templates/kits';
import {
  CURRENT_SCHEMA_VERSION,
  migrateToCurrentVersion,
  needsMigration,
  isVersionSupported,
  MigrationError,
} from './migrations';

export const STORAGE_KEY = 'emergencySupplyTracker';

/**
 * Checks if a value looks like a valid template ID (kebab-case).
 */
export function isTemplateId(value: string): boolean {
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
function normalizeItemType(
  itemType: string | undefined,
): ProductTemplateId | 'custom' {
  // If itemType is already a valid template ID, use it
  if (itemType && isTemplateId(itemType)) {
    return createProductTemplateId(itemType);
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
  }));
}

export function createDefaultAppData(): AppData {
  return {
    version: CURRENT_SCHEMA_VERSION,
    household: {
      adults: 2,
      children: 0,
      pets: 0,
      supplyDurationDays: 7,
      useFreezer: false,
    },
    settings: UserSettingsFactory.createDefault(),
    customCategories: [],
    items: [],
    customTemplates: [],
    dismissedAlertIds: [],
    disabledRecommendedItems: [],
    selectedRecommendationKit: DEFAULT_KIT_ID,
    uploadedRecommendationKits: [],
    lastModified: new Date().toISOString(),
  };
}

export function getAppData(): AppData | undefined {
  try {
    const json = localStorage.getItem(STORAGE_KEY);
    if (!json) return undefined;

    // Parse JSON - use unknown instead of any for type safety
    let rawData: unknown;
    try {
      rawData = JSON.parse(json);
    } catch (parseError) {
      console.error('Failed to parse JSON from localStorage:', parseError);
      return undefined;
    }

    // Check if version is supported before proceeding
    if (
      typeof rawData === 'object' &&
      rawData !== null &&
      'version' in rawData &&
      typeof rawData.version === 'string'
    ) {
      const dataVersion = rawData.version;
      if (!isVersionSupported(dataVersion)) {
        console.error(
          `Data schema version ${dataVersion} is not supported. Data may be corrupted or from an incompatible version.`,
        );
        return undefined;
      }
    }

    // Normalize items: ensure itemType values are valid template IDs and cast IDs
    const normalizedItems =
      normalizeItems(
        (rawData as { items?: unknown }).items as InventoryItem[] | undefined,
      ) ?? [];

    // Cast IDs to branded types
    let data: AppData = {
      ...(rawData as AppData),
      items: normalizedItems,
      customCategories: (
        (
          rawData as {
            customCategories?: Array<{ id: string; [key: string]: unknown }>;
          }
        ).customCategories || []
      ).map((cat) => ({
        ...(cat as unknown as Category),
        id: createCategoryId(cat.id),
      })),
      customTemplates: (
        (
          rawData as {
            customTemplates?: Array<{ id: string; [key: string]: unknown }>;
          }
        ).customTemplates || []
      ).map((template) => ({
        ...(template as unknown as ProductTemplate),
        id: createProductTemplateId(template.id),
      })),
      dismissedAlertIds: (
        (rawData as { dismissedAlertIds?: string[] }).dismissedAlertIds || []
      ).map(createAlertId),
      disabledRecommendedItems: (
        (rawData as { disabledRecommendedItems?: string[] })
          .disabledRecommendedItems || []
      ).map(createProductTemplateId),
      // Normalize kit fields - only set defaults if they're missing from rawData
      selectedRecommendationKit:
        (rawData as { selectedRecommendationKit?: KitId })
          .selectedRecommendationKit ?? DEFAULT_KIT_ID,
      uploadedRecommendationKits:
        (rawData as { uploadedRecommendationKits?: UploadedKit[] })
          .uploadedRecommendationKits ?? [],
    };

    // Apply migrations if needed
    if (needsMigration(data)) {
      try {
        data = migrateToCurrentVersion(data);
        // Save migrated data back to localStorage
        saveAppData(data);
        console.info(
          `Data migrated from version ${data.version} to ${CURRENT_SCHEMA_VERSION}`,
        );
      } catch (error) {
        if (error instanceof MigrationError) {
          console.error(
            `Migration failed from ${error.fromVersion} to ${error.toVersion}: ${error.message}`,
          );
        } else {
          console.error('Migration failed:', error);
        }
        // Return unmigrated data - app may still work with older schema
        return data;
      }
    }

    return data;
  } catch (error) {
    console.error('Failed to load data from localStorage:', error);
    return undefined;
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
        // Standard categories are always available
        STANDARD_CATEGORIES.length,
    },
  };
  return JSON.stringify(exportData, null, 2);
}

/**
 * Parses and normalizes imported JSON data into AppData format.
 * Ensures required fields exist and sets onboardingCompleted to true
 * since imported data represents an already-configured setup.
 * Applies schema migrations if the imported data is from an older version.
 *
 * @param json - JSON string containing app data to import
 * @returns Parsed and normalized AppData object at current schema version
 * @throws Error if JSON parsing fails (invalid JSON format)
 * @throws MigrationError if schema migration fails
 */
export function importFromJSON(json: string): AppData {
  // Parse JSON - use unknown instead of any for type safety
  let data: Partial<AppData>;
  try {
    data = JSON.parse(json) as Partial<AppData>;
  } catch (error) {
    console.error('Failed to parse import JSON:', error);
    throw error;
  }

  // Check if imported data version is supported
  const importedVersion = data.version || '1.0.0';
  if (!isVersionSupported(importedVersion)) {
    throw new MigrationError(
      `Imported data schema version ${importedVersion} is not supported.`,
      importedVersion,
      CURRENT_SCHEMA_VERSION,
    );
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
  if (data.dismissedAlertIds) {
    data.dismissedAlertIds = (data.dismissedAlertIds as string[]).map(
      createAlertId,
    );
  } else {
    data.dismissedAlertIds = [];
  }

  // Ensure disabledRecommendedItems exists and cast to branded types
  if (data.disabledRecommendedItems) {
    data.disabledRecommendedItems = (
      data.disabledRecommendedItems as string[]
    ).map(createProductTemplateId);
  } else {
    data.disabledRecommendedItems = [];
  }

  // Ensure kit fields are initialized with defaults if absent
  if (!data.selectedRecommendationKit) {
    data.selectedRecommendationKit = DEFAULT_KIT_ID;
  }
  data.uploadedRecommendationKits ??= [];

  // customRecommendedItems is optional - preserve if present, otherwise leave undefined

  // Normalize items: ensure itemType values are valid and set neverExpires flag
  if (data.items) {
    // First normalize itemType values to ensure they're valid template IDs
    data.items = normalizeItems(data.items as InventoryItem[]);

    // Then handle neverExpires normalization and migrate null to undefined
    data.items = data.items?.map((item) => ({
      ...item,
      // Migrate legacy null to undefined
      expirationDate:
        item.expirationDate === null ? undefined : item.expirationDate,
      // If expirationDate was null (legacy), set neverExpires to true
      neverExpires: item.expirationDate === null ? true : item.neverExpires,
    }));
  }

  // When importing data, always skip onboarding since user has configured data
  if (data.settings) {
    data.settings.onboardingCompleted = true;
  }

  // Apply migrations if imported data is from an older schema version
  let appData = data as AppData;
  if (needsMigration(appData)) {
    appData = migrateToCurrentVersion(appData);
  }

  // Ensure version is set to current
  appData.version = CURRENT_SCHEMA_VERSION;

  return appData;
}

/**
 * Exports selected sections of app data to JSON format with export metadata.
 * Only includes the specified sections in the export.
 *
 * @param data - AppData to export
 * @param sections - Array of section names to include in export
 * @returns JSON string with selected app data and export metadata
 */
export function exportToJSONSelective(
  data: AppData,
  sections: ExportSection[],
): string {
  const exportMetadata: ExportMetadata = {
    exportedAt: new Date().toISOString(),
    appVersion: APP_VERSION,
    itemCount: sections.includes('items') ? (data.items?.length ?? 0) : 0,
    categoryCount: sections.includes('customCategories')
      ? (data.customCategories?.length ?? 0) + STANDARD_CATEGORIES.length
      : STANDARD_CATEGORIES.length,
    includedSections: sections,
  };

  const exportData: PartialExportData = {
    version: data.version,
    exportMetadata,
    lastModified: data.lastModified,
  };

  // Only include selected sections
  if (sections.includes('household')) {
    exportData.household = data.household;
  }
  if (sections.includes('settings')) {
    exportData.settings = data.settings;
  }
  if (sections.includes('items')) {
    exportData.items = data.items;
  }
  if (sections.includes('customCategories')) {
    exportData.customCategories = data.customCategories;
  }
  if (sections.includes('customTemplates')) {
    exportData.customTemplates = data.customTemplates;
  }
  if (sections.includes('dismissedAlertIds')) {
    exportData.dismissedAlertIds = data.dismissedAlertIds;
  }
  if (sections.includes('disabledRecommendedItems')) {
    exportData.disabledRecommendedItems = data.disabledRecommendedItems;
  }
  if (sections.includes('customRecommendedItems')) {
    exportData.customRecommendedItems = data.customRecommendedItems;
  }

  return JSON.stringify(exportData, null, 2);
}

/**
 * Parses imported JSON and returns partial data for section selection.
 * Does not apply to existing data - just parses and validates.
 *
 * @param json - JSON string containing exported app data
 * @returns Parsed partial export data
 * @throws Error if JSON parsing fails
 */
export function parseImportJSON(json: string): PartialExportData {
  let data: PartialExportData;
  try {
    data = JSON.parse(json) as PartialExportData;
  } catch (error) {
    console.error('Failed to parse import JSON:', error);
    throw error;
  }

  // Check if imported data version is supported
  const importedVersion = data.version || '1.0.0';
  if (!isVersionSupported(importedVersion)) {
    throw new MigrationError(
      `Imported data schema version ${importedVersion} is not supported.`,
      importedVersion,
      CURRENT_SCHEMA_VERSION,
    );
  }

  return data;
}

/**
 * Merges items section from imported data.
 */
function mergeItemsSection(imported: PartialExportData): InventoryItem[] {
  const normalizedItems = normalizeItems(imported.items ?? []);
  return (
    normalizedItems?.map((item) => ({
      ...item,
      expirationDate:
        item.expirationDate === null ? undefined : item.expirationDate,
      neverExpires: item.expirationDate === null ? true : item.neverExpires,
    })) ?? []
  );
}

/**
 * Merges simple array sections from imported data.
 */
function mergeSimpleSections(
  merged: AppData,
  imported: PartialExportData,
  sections: ExportSection[],
): void {
  if (sections.includes('customCategories') && imported.customCategories) {
    merged.customCategories = imported.customCategories.map((cat) => ({
      ...cat,
      id: createCategoryId(cat.id as string),
    }));
  }

  if (sections.includes('customTemplates') && imported.customTemplates) {
    merged.customTemplates = imported.customTemplates.map((template) => ({
      ...template,
      id: createProductTemplateId(template.id as string),
    }));
  }

  if (sections.includes('dismissedAlertIds') && imported.dismissedAlertIds) {
    merged.dismissedAlertIds = (imported.dismissedAlertIds as string[]).map(
      createAlertId,
    );
  }

  if (
    sections.includes('disabledRecommendedItems') &&
    imported.disabledRecommendedItems
  ) {
    merged.disabledRecommendedItems = (
      imported.disabledRecommendedItems as string[]
    ).map(createProductTemplateId);
  }

  if (
    sections.includes('customRecommendedItems') &&
    imported.customRecommendedItems !== undefined
  ) {
    merged.customRecommendedItems = imported.customRecommendedItems;
  }
}

/**
 * Merges selected sections from imported data into existing app data.
 * Only the specified sections are merged; other sections remain unchanged.
 *
 * @param existing - Current app data
 * @param imported - Imported partial data
 * @param sections - Sections to merge from imported data
 * @returns Merged app data
 */
export function mergeImportData(
  existing: AppData,
  imported: PartialExportData,
  sections: ExportSection[],
): AppData {
  const merged: AppData = { ...existing };

  if (sections.includes('household') && imported.household) {
    merged.household = imported.household;
  }

  if (sections.includes('settings') && imported.settings) {
    merged.settings = {
      ...imported.settings,
      onboardingCompleted: true,
    };
  }

  if (sections.includes('items') && imported.items) {
    merged.items = mergeItemsSection(imported);
  }

  mergeSimpleSections(merged, imported, sections);

  merged.lastModified = new Date().toISOString();

  if (needsMigration(merged)) {
    return migrateToCurrentVersion(merged);
  }

  return merged;
}
