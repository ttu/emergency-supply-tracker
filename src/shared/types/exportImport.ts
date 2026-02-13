import type {
  AppData,
  HouseholdConfig,
  UserSettings,
  InventoryItem,
  Category,
  ProductTemplate,
  AlertId,
  ProductTemplateId,
  RecommendedItemsFile,
  InventorySetData,
  InventorySetId,
} from './index';

/**
 * Sections available per inventory set (excludes global settings)
 */
export type InventorySetSection =
  | 'items'
  | 'household'
  | 'customCategories'
  | 'customTemplates'
  | 'dismissedAlertIds'
  | 'disabledRecommendedItems'
  | 'disabledCategories'
  | 'customRecommendedItems';

/**
 * Available sections for selective export/import (legacy single-set format)
 */
export type ExportSection = InventorySetSection | 'settings';

/**
 * All available inventory set sections in display order
 */
export const ALL_INVENTORY_SET_SECTIONS: InventorySetSection[] = [
  'items',
  'household',
  'customCategories',
  'customTemplates',
  'dismissedAlertIds',
  'disabledRecommendedItems',
  'disabledCategories',
  'customRecommendedItems',
];

/**
 * All available export sections in display order (legacy)
 */
export const ALL_EXPORT_SECTIONS: ExportSection[] = [
  'items',
  'household',
  'settings',
  'customCategories',
  'customTemplates',
  'dismissedAlertIds',
  'disabledRecommendedItems',
  'customRecommendedItems',
];

/**
 * Selection for which inventory sets and sections to export
 */
export interface MultiInventoryExportSelection {
  includeSettings: boolean;
  inventorySets: {
    id: InventorySetId;
    sections: InventorySetSection[];
  }[];
}

/**
 * Selection for which inventory sets and sections to import
 */
export interface MultiInventoryImportSelection {
  includeSettings: boolean;
  inventorySets: {
    /** Index into importData.inventorySets for unambiguous matching (handles duplicate names) */
    index: number;
    originalName: string;
    sections: InventorySetSection[];
  }[];
}

/**
 * Sentinel name used for legacy single-set imports. UI should display via i18n key settings.import.legacySetName.
 */
export const LEGACY_IMPORT_SET_NAME = '__IMPORT_SET__';

/**
 * Exported inventory set with its selected sections
 */
export interface ExportedInventorySet {
  name: string;
  includedSections: InventorySetSection[];
  data: Partial<InventorySetData>;
}

/**
 * Multi-inventory export data format
 */
export interface MultiInventoryExportData {
  version: string;
  exportedAt: string;
  appVersion: string;
  settings?: UserSettings;
  inventorySets: ExportedInventorySet[];
}

/**
 * Export metadata included in exported files
 */
export interface ExportMetadata {
  exportedAt: string;
  appVersion: string;
  itemCount: number;
  categoryCount: number;
  includedSections: ExportSection[];
}

/**
 * Partial export data structure - all sections optional based on selection
 */
export interface PartialExportData {
  version: string;
  exportMetadata: ExportMetadata;
  household?: HouseholdConfig;
  settings?: UserSettings;
  items?: InventoryItem[];
  customCategories?: Category[];
  customTemplates?: ProductTemplate[];
  dismissedAlertIds?: AlertId[];
  disabledRecommendedItems?: ProductTemplateId[];
  customRecommendedItems?: RecommendedItemsFile | null;
  lastModified: string;
}

/**
 * Information about a section for UI display
 */
export interface SectionInfo {
  section: ExportSection;
  count: number;
  hasData: boolean;
}

/**
 * Get section information from app data for UI display
 */
export function getSectionInfo(
  data: AppData | PartialExportData,
): SectionInfo[] {
  return ALL_EXPORT_SECTIONS.map((section) => {
    let count = 0;
    let hasData = false;

    switch (section) {
      case 'items':
        count = data.items?.length ?? 0;
        hasData = count > 0;
        break;
      case 'household':
        hasData = data.household !== undefined;
        count = hasData ? 1 : 0;
        break;
      case 'settings':
        hasData = data.settings !== undefined;
        count = hasData ? 1 : 0;
        break;
      case 'customCategories':
        count = data.customCategories?.length ?? 0;
        hasData = count > 0;
        break;
      case 'customTemplates':
        count = data.customTemplates?.length ?? 0;
        hasData = count > 0;
        break;
      case 'dismissedAlertIds':
        count = data.dismissedAlertIds?.length ?? 0;
        hasData = count > 0;
        break;
      case 'disabledRecommendedItems':
        count = data.disabledRecommendedItems?.length ?? 0;
        hasData = count > 0;
        break;
      case 'customRecommendedItems':
        hasData =
          data.customRecommendedItems !== undefined &&
          data.customRecommendedItems !== null;
        count = hasData ? (data.customRecommendedItems?.items?.length ?? 0) : 0;
        break;
    }

    return { section, count, hasData };
  });
}

/**
 * Get sections that have data (for import, to show which sections are available)
 */
export function getSectionsWithData(
  data: AppData | PartialExportData,
): ExportSection[] {
  return getSectionInfo(data)
    .filter((info) => info.hasData)
    .map((info) => info.section);
}

/**
 * Information about an inventory set section for UI display
 */
export interface InventorySetSectionInfo {
  section: InventorySetSection;
  count: number;
  hasData: boolean;
}

/**
 * Get section information from inventory set data for UI display
 */
export function getInventorySetSectionInfo(
  data: Partial<InventorySetData>,
): InventorySetSectionInfo[] {
  return ALL_INVENTORY_SET_SECTIONS.map((section) => {
    let count = 0;
    let hasData = false;

    switch (section) {
      case 'items':
        count = data.items?.length ?? 0;
        hasData = count > 0;
        break;
      case 'household':
        hasData = data.household !== undefined;
        count = hasData ? 1 : 0;
        break;
      case 'customCategories':
        count = data.customCategories?.length ?? 0;
        hasData = count > 0;
        break;
      case 'customTemplates':
        count = data.customTemplates?.length ?? 0;
        hasData = count > 0;
        break;
      case 'dismissedAlertIds':
        count = data.dismissedAlertIds?.length ?? 0;
        hasData = count > 0;
        break;
      case 'disabledRecommendedItems':
        count = data.disabledRecommendedItems?.length ?? 0;
        hasData = count > 0;
        break;
      case 'disabledCategories':
        count = data.disabledCategories?.length ?? 0;
        hasData = count > 0;
        break;
      case 'customRecommendedItems':
        hasData =
          data.customRecommendedItems !== undefined &&
          data.customRecommendedItems !== null;
        count = hasData ? (data.customRecommendedItems?.items?.length ?? 0) : 0;
        break;
    }

    return { section, count, hasData };
  });
}

/**
 * Get inventory set sections that have data
 */
export function getInventorySetSectionsWithData(
  data: Partial<InventorySetData>,
): InventorySetSection[] {
  return getInventorySetSectionInfo(data)
    .filter((info) => info.hasData)
    .map((info) => info.section);
}

/**
 * Check if export data is in the new multi-inventory format
 */
export function isMultiInventoryExport(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any,
): data is MultiInventoryExportData {
  return (
    data &&
    typeof data === 'object' &&
    Array.isArray(data.inventorySets) &&
    (data.inventorySets.length > 0 ||
      (typeof data.exportedAt === 'string' &&
        typeof data.appVersion === 'string'))
  );
}

/**
 * Convert legacy single-set export to multi-inventory format for unified handling
 */
export function convertLegacyToMultiInventory(
  data: PartialExportData,
): MultiInventoryExportData {
  const sections = getSectionsWithData(data);
  const inventorySetSections = sections.filter(
    (s): s is InventorySetSection => s !== 'settings',
  );

  return {
    version: data.version,
    exportedAt: data.exportMetadata?.exportedAt ?? new Date().toISOString(),
    appVersion: data.exportMetadata?.appVersion ?? 'unknown',
    settings: data.settings,
    inventorySets: [
      {
        name: LEGACY_IMPORT_SET_NAME,
        includedSections: inventorySetSections,
        data: {
          id: '' as InventorySetId, // Will be assigned on import
          name: LEGACY_IMPORT_SET_NAME,
          items: data.items,
          household: data.household,
          customCategories: data.customCategories,
          customTemplates: data.customTemplates,
          dismissedAlertIds: data.dismissedAlertIds,
          disabledRecommendedItems: data.disabledRecommendedItems,
          disabledCategories: [],
          customRecommendedItems: data.customRecommendedItems,
          lastModified: data.lastModified,
        },
      },
    ],
  };
}
