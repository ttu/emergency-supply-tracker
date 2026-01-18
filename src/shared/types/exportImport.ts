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
} from './index';

/**
 * Available sections for selective export/import
 */
export type ExportSection =
  | 'items'
  | 'household'
  | 'settings'
  | 'customCategories'
  | 'customTemplates'
  | 'dismissedAlertIds'
  | 'disabledRecommendedItems'
  | 'customRecommendedItems';

/**
 * All available export sections in display order
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
