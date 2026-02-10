import type {
  AppData,
  InventoryItem,
  ProductTemplateId,
  RootStorage,
  InventorySetData,
  InventorySetId,
} from '@/shared/types';
import type {
  ExportSection,
  PartialExportData,
  ExportMetadata,
  MultiInventoryExportData,
  MultiInventoryExportSelection,
  MultiInventoryImportSelection,
  InventorySetSection,
  ExportedInventorySet,
} from '@/shared/types/exportImport';
import {
  isMultiInventoryExport,
  convertLegacyToMultiInventory,
  getInventorySetSectionsWithData,
} from '@/shared/types/exportImport';
import {
  createItemId,
  createCategoryId,
  createProductTemplateId,
  createAlertId,
  createInventorySetId,
} from '@/shared/types';
import { CUSTOM_ITEM_TYPE } from '@/shared/utils/constants';
import { APP_VERSION } from '@/shared/utils/version';
import { UserSettingsFactory } from '@/features/settings/factories/UserSettingsFactory';
import { STANDARD_CATEGORIES } from '@/features/categories/data';
import { DEFAULT_KIT_ID } from '@/features/templates/kits';
import { DEFAULT_HOUSEHOLD } from '@/features/household';
import {
  CURRENT_SCHEMA_VERSION,
  migrateToCurrentVersion,
  needsMigration,
  isVersionSupported,
  MigrationError,
} from './migrations';
import {
  validateAppDataValues,
  type DataValidationResult,
} from '../validation/appDataValidation';

export const STORAGE_KEY = 'emergencySupplyTracker';

/** Default inventory set id when none exist (first load) */
export const DEFAULT_INVENTORY_SET_ID = 'default' as InventorySetId;

/**
 * Stores the last data validation result for error reporting.
 */
let lastDataValidationResult: DataValidationResult | null = null;

/**
 * Gets the last data validation result.
 * Returns null if no validation has been performed or if data was valid.
 */
export function getLastDataValidationResult(): DataValidationResult | null {
  return lastDataValidationResult;
}

/**
 * Clears the stored validation result.
 * Call this after handling validation errors (e.g., after user clears data).
 */
export function clearDataValidationResult(): void {
  lastDataValidationResult = null;
}

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

/** Build default inventory set data (for new inventory set or first load) */
function createDefaultInventorySetData(
  id: InventorySetId,
  name: string,
): InventorySetData {
  const now = new Date().toISOString();
  return {
    id,
    name,
    household: { ...DEFAULT_HOUSEHOLD },
    customCategories: [],
    items: [],
    customTemplates: [],
    dismissedAlertIds: [],
    disabledRecommendedItems: [],
    disabledCategories: [],
    selectedRecommendationKit: DEFAULT_KIT_ID,
    uploadedRecommendationKits: [],
    lastModified: now,
  };
}

/** Build root storage with one default inventory set (first load) */
export function createDefaultRootStorage(): RootStorage {
  const defaultId = DEFAULT_INVENTORY_SET_ID;
  return {
    version: CURRENT_SCHEMA_VERSION,
    settings: UserSettingsFactory.createDefault(),
    activeInventorySetId: defaultId,
    inventorySets: {
      [defaultId]: createDefaultInventorySetData(defaultId, 'Default'),
    },
  };
}

/** Read and parse root storage from localStorage. Returns undefined if empty. Throws on parse error (invalid JSON). */
function getRootStorage(): RootStorage | undefined {
  const json = localStorage.getItem(STORAGE_KEY);
  if (!json) return undefined;
  const raw = JSON.parse(json) as unknown;
  if (typeof raw !== 'object' || raw === null || !('inventorySets' in raw))
    return undefined;
  return raw as RootStorage;
}

/** Write root storage to localStorage. Throws on setItem failure (e.g. QuotaExceededError). */
function saveRootStorage(root: RootStorage): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(root));
}

/**
 * Safe getRootStorage: returns undefined on JSON parse error or storage errors.
 * Logs the full error for debugging.
 */
function safeGetRootStorage(): RootStorage | undefined {
  try {
    return getRootStorage();
  } catch (error) {
    console.error('getRootStorage failed:', error);
    return undefined;
  }
}

/**
 * Safe saveRootStorage: no-op on failure (e.g. QuotaExceededError).
 * Logs the full error for debugging.
 */
function safeSaveRootStorage(root: RootStorage): void {
  try {
    saveRootStorage(root);
  } catch (error) {
    console.error('saveRootStorage failed:', error);
  }
}

/** Extract inventory set slice from AppData (for persisting to root) */
function extractInventorySetFromAppData(
  data: AppData,
  inventorySetId: InventorySetId,
  inventorySetName: string,
): InventorySetData {
  return {
    id: inventorySetId,
    name: inventorySetName,
    household: data.household,
    items: data.items,
    customCategories: data.customCategories,
    customTemplates: data.customTemplates,
    dismissedAlertIds: data.dismissedAlertIds,
    disabledRecommendedItems: data.disabledRecommendedItems,
    disabledCategories: data.disabledCategories,
    selectedRecommendationKit: data.selectedRecommendationKit,
    uploadedRecommendationKits: data.uploadedRecommendationKits,
    customRecommendedItems: data.customRecommendedItems,
    lastModified: data.lastModified,
    lastBackupDate: data.lastBackupDate,
    backupReminderDismissedUntil: data.backupReminderDismissedUntil,
  };
}

/** Merge root storage into AppData shape (settings + active inventory set) */
function mergeRootToAppData(
  root: RootStorage,
  inventorySet: InventorySetData,
): AppData {
  return {
    version: root.version,
    settings: root.settings,
    household: inventorySet.household,
    items: inventorySet.items,
    customCategories: inventorySet.customCategories,
    customTemplates: inventorySet.customTemplates,
    dismissedAlertIds: inventorySet.dismissedAlertIds,
    disabledRecommendedItems: inventorySet.disabledRecommendedItems,
    disabledCategories: inventorySet.disabledCategories,
    selectedRecommendationKit: inventorySet.selectedRecommendationKit,
    uploadedRecommendationKits: inventorySet.uploadedRecommendationKits,
    customRecommendedItems: inventorySet.customRecommendedItems,
    lastModified: inventorySet.lastModified,
    lastBackupDate: inventorySet.lastBackupDate,
    backupReminderDismissedUntil: inventorySet.backupReminderDismissedUntil,
  };
}

export function createDefaultAppData(): AppData {
  const root = createDefaultRootStorage();
  const ws = root.inventorySets[root.activeInventorySetId];
  return mergeRootToAppData(root, ws);
}

/** Normalize merged AppData (branded types, kit defaults) */
function normalizeMergedAppData(data: AppData): AppData {
  const normalizedItems = normalizeItems(data.items) ?? [];
  return {
    ...data,
    items: normalizedItems,
    customCategories: (data.customCategories || []).map((cat) => ({
      ...cat,
      id: createCategoryId(cat.id as string),
    })),
    customTemplates: (data.customTemplates || []).map((template) => ({
      ...template,
      id: createProductTemplateId(template.id as string),
    })),
    dismissedAlertIds: (data.dismissedAlertIds || []).map((id) =>
      createAlertId(id as string),
    ),
    disabledRecommendedItems: (data.disabledRecommendedItems || []).map((id) =>
      createProductTemplateId(id as string),
    ),
    selectedRecommendationKit: data.selectedRecommendationKit ?? DEFAULT_KIT_ID,
    uploadedRecommendationKits: data.uploadedRecommendationKits ?? [],
  };
}

export function getAppData(): AppData | undefined {
  try {
    let root = getRootStorage();
    if (!root) {
      root = createDefaultRootStorage();
      saveRootStorage(root);
    }

    if (!isVersionSupported(root.version)) {
      console.error(`Data schema version ${root.version} is not supported.`);
      return undefined;
    }

    const activeId = root.activeInventorySetId;
    const inventorySet = root.inventorySets[activeId as string];
    if (!inventorySet) {
      return undefined;
    }

    let data = normalizeMergedAppData(mergeRootToAppData(root, inventorySet));

    if (needsMigration(data)) {
      try {
        data = migrateToCurrentVersion(data);
        const updatedInventorySet = extractInventorySetFromAppData(
          data,
          activeId,
          inventorySet.name,
        );
        root.inventorySets[activeId as string] = updatedInventorySet;
        root.version = data.version;
        saveRootStorage(root);
        console.info(`Data migrated to ${CURRENT_SCHEMA_VERSION}`);
      } catch (error) {
        if (error instanceof MigrationError) {
          console.error(
            `Migration failed: ${error.fromVersion} to ${error.toVersion}: ${error.message}`,
          );
        } else {
          console.error('Migration failed:', error);
        }
        return data;
      }
    }

    const validationResult = validateAppDataValues(data);
    if (!validationResult.isValid) {
      console.error('Data validation failed:', validationResult.errors);
      lastDataValidationResult = validationResult;
      return undefined;
    }

    lastDataValidationResult = null;
    return data;
  } catch (error) {
    console.error('Failed to load data from localStorage:', error);
    return undefined;
  }
}

export function saveAppData(data: AppData): void {
  try {
    let root = getRootStorage();
    root ??= createDefaultRootStorage();
    root.settings = data.settings;
    const activeId = root.activeInventorySetId;
    const currentInventorySet = root.inventorySets[activeId as string];
    if (currentInventorySet) {
      root.inventorySets[activeId as string] = extractInventorySetFromAppData(
        data,
        activeId,
        currentInventorySet.name,
      );
    }
    saveRootStorage(root);
  } catch (error) {
    console.error('Failed to save data to localStorage:', error);
  }
}

export function clearAppData(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Build RootStorage from AppData (e.g. for E2E/test fixtures).
 * Uses default inventory set id and name "Default".
 */
export function buildRootStorageFromAppData(data: AppData): RootStorage {
  const root = createDefaultRootStorage();
  root.settings = data.settings;
  root.inventorySets[DEFAULT_INVENTORY_SET_ID as string] =
    extractInventorySetFromAppData(data, DEFAULT_INVENTORY_SET_ID, 'Default');
  return root;
}

/** Inventory set list item for UI */
export interface InventorySetListItem {
  id: InventorySetId;
  name: string;
}

export function getInventorySetList(): InventorySetListItem[] {
  const root = safeGetRootStorage();
  if (!root) return [];
  return Object.values(root.inventorySets).map((w) => ({
    id: w.id,
    name: w.name,
  }));
}

export function getActiveInventorySetId(): InventorySetId | undefined {
  const root = safeGetRootStorage();
  if (!root) return undefined;
  return root.activeInventorySetId;
}

export function setActiveInventorySetId(id: InventorySetId): void {
  const root = safeGetRootStorage();
  if (!root) return;
  if (!root.inventorySets[id as string]) return;
  root.activeInventorySetId = id;
  safeSaveRootStorage(root);
}

function generateInventorySetId(): InventorySetId {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return createInventorySetId(crypto.randomUUID());
  }
  return createInventorySetId(
    `ws-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
  );
}

export function createInventorySet(name: string): InventorySetId {
  let root = safeGetRootStorage();
  root ??= createDefaultRootStorage();
  const id = generateInventorySetId();
  root.inventorySets[id as string] = createDefaultInventorySetData(
    id,
    name.trim() || 'Inventory Set',
  );
  safeSaveRootStorage(root);
  return id;
}

export function deleteInventorySet(id: InventorySetId): void {
  const root = safeGetRootStorage();
  if (!root) return;
  const ids = Object.keys(root.inventorySets);
  if (ids.length <= 1) return;
  delete root.inventorySets[id as string];
  if (root.activeInventorySetId === id) {
    root.activeInventorySetId = createInventorySetId(
      ids.find((k) => k !== id)!,
    );
  }
  safeSaveRootStorage(root);
}

export function renameInventorySet(id: InventorySetId, name: string): void {
  const root = safeGetRootStorage();
  if (!root) return;
  const w = root.inventorySets[id as string];
  if (!w) return;
  w.name = name.trim() || w.name;
  safeSaveRootStorage(root);
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
  data.customCategories ??= [];

  // Ensure customTemplates exists
  data.customTemplates ??= [];

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
  data.selectedRecommendationKit ??= DEFAULT_KIT_ID;
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

/**
 * Get RootStorage for multi-inventory export.
 * Returns undefined if storage is empty or invalid.
 */
export function getRootStorageForExport(): RootStorage | undefined {
  return safeGetRootStorage();
}

/**
 * Export selected inventory sets to multi-inventory JSON format.
 */
export function exportMultiInventory(
  root: RootStorage,
  selection: MultiInventoryExportSelection,
): string {
  const exportData: MultiInventoryExportData = {
    version: root.version,
    exportedAt: new Date().toISOString(),
    appVersion: APP_VERSION,
    inventorySets: [],
  };

  if (selection.includeSettings) {
    exportData.settings = root.settings;
  }

  for (const setSelection of selection.inventorySets) {
    const inventorySet = root.inventorySets[setSelection.id as string];
    if (!inventorySet) continue;

    const exportedSet: ExportedInventorySet = {
      name: inventorySet.name,
      includedSections: setSelection.sections,
      data: {
        id: inventorySet.id,
        name: inventorySet.name,
        lastModified: inventorySet.lastModified,
        disabledCategories: inventorySet.disabledCategories,
      },
    };

    // Only include selected sections
    for (const section of setSelection.sections) {
      switch (section) {
        case 'items':
          exportedSet.data.items = inventorySet.items;
          break;
        case 'household':
          exportedSet.data.household = inventorySet.household;
          break;
        case 'customCategories':
          exportedSet.data.customCategories = inventorySet.customCategories;
          break;
        case 'customTemplates':
          exportedSet.data.customTemplates = inventorySet.customTemplates;
          break;
        case 'dismissedAlertIds':
          exportedSet.data.dismissedAlertIds = inventorySet.dismissedAlertIds;
          break;
        case 'disabledRecommendedItems':
          exportedSet.data.disabledRecommendedItems =
            inventorySet.disabledRecommendedItems;
          break;
        case 'customRecommendedItems':
          exportedSet.data.customRecommendedItems =
            inventorySet.customRecommendedItems;
          break;
      }
    }

    exportData.inventorySets.push(exportedSet);
  }

  return JSON.stringify(exportData, null, 2);
}

/**
 * Parse multi-inventory import JSON and return unified format.
 * Handles both new multi-inventory format and legacy single-set format.
 */
export function parseMultiInventoryImport(
  json: string,
): MultiInventoryExportData {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch (error) {
    console.error('Failed to parse import JSON:', error);
    throw error;
  }

  if (isMultiInventoryExport(data)) {
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

  // Legacy format - convert to multi-inventory
  const legacy = data as PartialExportData;

  // Check version support
  const importedVersion = legacy.version || '1.0.0';
  if (!isVersionSupported(importedVersion)) {
    throw new MigrationError(
      `Imported data schema version ${importedVersion} is not supported.`,
      importedVersion,
      CURRENT_SCHEMA_VERSION,
    );
  }

  return convertLegacyToMultiInventory(legacy);
}

/**
 * Generate a unique inventory set name that doesn't conflict with existing names.
 */
export function generateUniqueInventorySetName(
  baseName: string,
  existingNames: string[],
): string {
  if (!existingNames.includes(baseName)) {
    return baseName;
  }

  const importedName = `${baseName} (imported)`;
  if (!existingNames.includes(importedName)) {
    return importedName;
  }

  let counter = 2;
  while (existingNames.includes(`${baseName} (imported ${counter})`)) {
    counter++;
  }
  return `${baseName} (imported ${counter})`;
}

/**
 * Build inventory set data from imported partial data with defaults.
 */
function buildInventorySetFromImport(
  imported: Partial<InventorySetData>,
  id: InventorySetId,
  name: string,
  sections: InventorySetSection[],
): InventorySetData {
  const now = new Date().toISOString();

  const inventorySet: InventorySetData = {
    id,
    name,
    household:
      sections.includes('household') && imported.household
        ? imported.household
        : { ...DEFAULT_HOUSEHOLD },
    items:
      sections.includes('items') && imported.items
        ? (normalizeItems(imported.items) ?? []).map((item) => ({
            ...item,
            // Migrate legacy null to undefined
            expirationDate:
              item.expirationDate === null ? undefined : item.expirationDate,
            // If expirationDate was null (legacy), set neverExpires to true
            neverExpires:
              item.expirationDate === null ? true : item.neverExpires,
          }))
        : [],
    customCategories:
      sections.includes('customCategories') && imported.customCategories
        ? imported.customCategories.map((cat) => ({
            ...cat,
            id: createCategoryId(cat.id as string),
          }))
        : [],
    customTemplates:
      sections.includes('customTemplates') && imported.customTemplates
        ? imported.customTemplates.map((template) => ({
            ...template,
            id: createProductTemplateId(template.id as string),
          }))
        : [],
    dismissedAlertIds:
      sections.includes('dismissedAlertIds') && imported.dismissedAlertIds
        ? (imported.dismissedAlertIds as string[]).map(createAlertId)
        : [],
    disabledRecommendedItems:
      sections.includes('disabledRecommendedItems') &&
      imported.disabledRecommendedItems
        ? (imported.disabledRecommendedItems as string[]).map(
            createProductTemplateId,
          )
        : [],
    disabledCategories: imported.disabledCategories ?? [],
    selectedRecommendationKit:
      imported.selectedRecommendationKit ?? DEFAULT_KIT_ID,
    uploadedRecommendationKits: imported.uploadedRecommendationKits ?? [],
    customRecommendedItems: sections.includes('customRecommendedItems')
      ? imported.customRecommendedItems
      : undefined,
    lastModified: now,
  };

  return inventorySet;
}

/**
 * Import selected inventory sets from multi-inventory export data.
 * Creates new inventory sets for each selected import.
 * Returns the updated RootStorage.
 */
export function importMultiInventory(
  importData: MultiInventoryExportData,
  selection: MultiInventoryImportSelection,
  existingRoot?: RootStorage,
): RootStorage {
  const root = existingRoot ?? createDefaultRootStorage();

  // Import settings if selected
  if (selection.includeSettings && importData.settings) {
    root.settings = {
      ...importData.settings,
      onboardingCompleted: true,
    };
  }

  // Get existing inventory set names for conflict resolution
  const existingNames = Object.values(root.inventorySets).map((s) => s.name);

  // Import selected inventory sets (match by index to support duplicate names)
  for (const setSelection of selection.inventorySets) {
    const exportedSet = importData.inventorySets[setSelection.index];
    if (
      !exportedSet ||
      setSelection.index < 0 ||
      setSelection.index >= importData.inventorySets.length
    )
      continue;

    // Generate unique name if there's a conflict
    const uniqueName = generateUniqueInventorySetName(
      exportedSet.name,
      existingNames,
    );
    existingNames.push(uniqueName); // Track for subsequent imports

    // Generate new ID for the imported set
    const newId = generateInventorySetId();

    // Build the inventory set from imported data
    const inventorySet = buildInventorySetFromImport(
      exportedSet.data,
      newId,
      uniqueName,
      setSelection.sections,
    );

    root.inventorySets[newId as string] = inventorySet;
  }

  return root;
}

/**
 * Save RootStorage after multi-inventory import.
 */
export function saveRootStorageAfterImport(root: RootStorage): void {
  safeSaveRootStorage(root);
}

/**
 * Get inventory set data for export UI display.
 */
export interface InventorySetExportInfo {
  id: InventorySetId;
  name: string;
  isActive: boolean;
  sectionsWithData: InventorySetSection[];
  data: InventorySetData;
}

/**
 * Get all inventory sets with their exportable data for UI.
 */
export function getInventorySetsForExport(): InventorySetExportInfo[] {
  const root = safeGetRootStorage();
  if (!root) return [];

  return Object.values(root.inventorySets).map((inventorySet) => ({
    id: inventorySet.id,
    name: inventorySet.name,
    isActive: inventorySet.id === root.activeInventorySetId,
    sectionsWithData: getInventorySetSectionsWithData(inventorySet),
    data: inventorySet,
  }));
}

/**
 * Check if settings have data worth exporting.
 */
export function hasSettingsData(): boolean {
  const root = safeGetRootStorage();
  return root?.settings !== undefined;
}
