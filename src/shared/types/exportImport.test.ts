import { describe, it, expect } from 'vitest';
import {
  getSectionInfo,
  getSectionsWithData,
  getInventorySetSectionInfo,
  getInventorySetSectionsWithData,
  isMultiInventoryExport,
  convertLegacyToMultiInventory,
  ALL_EXPORT_SECTIONS,
  ALL_INVENTORY_SET_SECTIONS,
  LEGACY_IMPORT_SET_NAME,
} from './exportImport';
import type { PartialExportData, ExportSection } from './exportImport';
import { createMockAppData } from '@/shared/utils/test/factories';
import { CURRENT_SCHEMA_VERSION } from '@/shared/utils/storage/migrations';
import {
  createItemId,
  createCategoryId,
  createProductTemplateId,
  createAlertId,
  createQuantity,
} from '@/shared/types';

describe('exportImport types and helpers', () => {
  describe('getSectionInfo', () => {
    it('returns info for all sections', () => {
      const data = createMockAppData({ items: [] });
      const info = getSectionInfo(data);

      expect(info).toHaveLength(ALL_EXPORT_SECTIONS.length);
      expect(info.map((i) => i.section)).toEqual(ALL_EXPORT_SECTIONS);
    });

    it('correctly identifies items section with data', () => {
      const data = createMockAppData({
        items: [
          {
            id: createItemId('item-1'),
            name: 'Test Item',
            itemType: 'custom',
            categoryId: createCategoryId('food'),
            quantity: createQuantity(1),
            unit: 'pieces',
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
          },
        ],
      });
      const info = getSectionInfo(data);
      const itemsInfo = info.find((i) => i.section === 'items');

      expect(itemsInfo?.hasData).toBe(true);
      expect(itemsInfo?.count).toBe(1);
    });

    it('correctly identifies items section without data', () => {
      const data = createMockAppData({ items: [] });
      const info = getSectionInfo(data);
      const itemsInfo = info.find((i) => i.section === 'items');

      expect(itemsInfo?.hasData).toBe(false);
      expect(itemsInfo?.count).toBe(0);
    });

    it('correctly identifies household section', () => {
      const data = createMockAppData();
      const info = getSectionInfo(data);
      const householdInfo = info.find((i) => i.section === 'household');

      expect(householdInfo?.hasData).toBe(true);
      expect(householdInfo?.count).toBe(1);
    });

    it('correctly identifies settings section', () => {
      const data = createMockAppData();
      const info = getSectionInfo(data);
      const settingsInfo = info.find((i) => i.section === 'settings');

      expect(settingsInfo?.hasData).toBe(true);
      expect(settingsInfo?.count).toBe(1);
    });

    it('correctly identifies customCategories section', () => {
      const data = createMockAppData({
        customCategories: [
          { id: createCategoryId('custom-1'), name: 'Custom', isCustom: true },
        ],
      });
      const info = getSectionInfo(data);
      const customCategoriesInfo = info.find(
        (i) => i.section === 'customCategories',
      );

      expect(customCategoriesInfo?.hasData).toBe(true);
      expect(customCategoriesInfo?.count).toBe(1);
    });

    it('correctly identifies customTemplates section', () => {
      const data = createMockAppData({
        customTemplates: [
          {
            id: createProductTemplateId('template-1'),
            name: 'Template',
            category: 'food',
            isCustom: true,
            isBuiltIn: false,
          },
        ],
      });
      const info = getSectionInfo(data);
      const customTemplatesInfo = info.find(
        (i) => i.section === 'customTemplates',
      );

      expect(customTemplatesInfo?.hasData).toBe(true);
      expect(customTemplatesInfo?.count).toBe(1);
    });

    it('correctly identifies dismissedAlertIds section', () => {
      const data = createMockAppData({
        dismissedAlertIds: [createAlertId('alert-1')],
      });
      const info = getSectionInfo(data);
      const dismissedAlertIdsInfo = info.find(
        (i) => i.section === 'dismissedAlertIds',
      );

      expect(dismissedAlertIdsInfo?.hasData).toBe(true);
      expect(dismissedAlertIdsInfo?.count).toBe(1);
    });

    it('correctly identifies disabledRecommendedItems section', () => {
      const data = createMockAppData({
        disabledRecommendedItems: [createProductTemplateId('rec-1')],
      });
      const info = getSectionInfo(data);
      const disabledRecommendedItemsInfo = info.find(
        (i) => i.section === 'disabledRecommendedItems',
      );

      expect(disabledRecommendedItemsInfo?.hasData).toBe(true);
      expect(disabledRecommendedItemsInfo?.count).toBe(1);
    });

    it('correctly identifies customRecommendedItems section', () => {
      const data = createMockAppData({
        customRecommendedItems: {
          meta: { name: 'Custom', version: '1.0', createdAt: '2024-01-01' },
          items: [
            {
              id: createProductTemplateId('item-1'),
              i18nKey: 'test.item',
              category: 'food',
              baseQuantity: createQuantity(1),
              unit: 'pieces',
              scaleWithPeople: true,
              scaleWithDays: true,
            },
          ],
        },
      });
      const info = getSectionInfo(data);
      const customRecommendedItemsInfo = info.find(
        (i) => i.section === 'customRecommendedItems',
      );

      expect(customRecommendedItemsInfo?.hasData).toBe(true);
      expect(customRecommendedItemsInfo?.count).toBe(1);
    });

    it('handles null customRecommendedItems', () => {
      const data = createMockAppData({
        customRecommendedItems: null,
      });
      const info = getSectionInfo(data);
      const customRecommendedItemsInfo = info.find(
        (i) => i.section === 'customRecommendedItems',
      );

      expect(customRecommendedItemsInfo?.hasData).toBe(false);
      expect(customRecommendedItemsInfo?.count).toBe(0);
    });
  });

  describe('getSectionsWithData', () => {
    it('returns only sections that have data', () => {
      const data = createMockAppData({
        items: [],
        customCategories: [],
        customTemplates: [],
        dismissedAlertIds: [],
        disabledRecommendedItems: [],
      });
      const sections = getSectionsWithData(data);

      // Should have household and settings at minimum
      expect(sections).toContain('household');
      expect(sections).toContain('settings');
      expect(sections).not.toContain('items');
      expect(sections).not.toContain('customCategories');
    });

    it('returns all sections when all have data', () => {
      const data = createMockAppData({
        items: [
          {
            id: createItemId('item-1'),
            name: 'Test',
            itemType: 'custom',
            categoryId: createCategoryId('food'),
            quantity: createQuantity(1),
            unit: 'pieces',
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
          },
        ],
        customCategories: [
          { id: createCategoryId('custom-1'), name: 'Custom', isCustom: true },
        ],
        customTemplates: [
          {
            id: createProductTemplateId('template-1'),
            name: 'Template',
            category: 'food',
            isCustom: true,
            isBuiltIn: false,
          },
        ],
        dismissedAlertIds: [createAlertId('alert-1')],
        disabledRecommendedItems: [createProductTemplateId('rec-1')],
        customRecommendedItems: {
          meta: { name: 'Custom', version: '1.0', createdAt: '2024-01-01' },
          items: [],
        },
      });
      const sections = getSectionsWithData(data);

      expect(sections).toHaveLength(ALL_EXPORT_SECTIONS.length);
    });
  });

  describe('getInventorySetSectionInfo', () => {
    it('returns info for all inventory set sections', () => {
      const data = { items: [] };
      const info = getInventorySetSectionInfo(data);

      expect(info).toHaveLength(ALL_INVENTORY_SET_SECTIONS.length);
      expect(info.map((i) => i.section)).toEqual(ALL_INVENTORY_SET_SECTIONS);
    });

    it('correctly identifies sections with data', () => {
      const data = {
        items: [
          {
            id: createItemId('item-1'),
            name: 'Test',
            itemType: 'custom' as const,
            categoryId: createCategoryId('food'),
            quantity: createQuantity(1),
            unit: 'pieces' as const,
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
          },
        ],
        household: {
          adults: 2,
          children: 0,
          pets: 0,
          supplyDurationDays: 3,
          useFreezer: false,
        },
      };
      const info = getInventorySetSectionInfo(data);

      const itemsInfo = info.find((i) => i.section === 'items');
      const householdInfo = info.find((i) => i.section === 'household');

      expect(itemsInfo?.hasData).toBe(true);
      expect(itemsInfo?.count).toBe(1);
      expect(householdInfo?.hasData).toBe(true);
      expect(householdInfo?.count).toBe(1);
    });
  });

  describe('getInventorySetSectionsWithData', () => {
    it('returns only sections that have data', () => {
      const data = {
        items: [],
        household: {
          adults: 2,
          children: 0,
          pets: 0,
          supplyDurationDays: 3,
          useFreezer: false,
        },
        customCategories: [],
      };
      const sections = getInventorySetSectionsWithData(data);

      expect(sections).toContain('household');
      expect(sections).not.toContain('items');
      expect(sections).not.toContain('customCategories');
    });
  });

  describe('isMultiInventoryExport', () => {
    it('returns true for multi-inventory format with inventory sets', () => {
      const data = {
        version: CURRENT_SCHEMA_VERSION,
        exportedAt: '2024-01-01T00:00:00.000Z',
        appVersion: '1.0.0',
        inventorySets: [{ name: 'Test', includedSections: [], data: {} }],
      };

      expect(isMultiInventoryExport(data)).toBe(true);
    });

    it('returns true for multi-inventory format with empty inventory sets but with metadata', () => {
      const data = {
        version: CURRENT_SCHEMA_VERSION,
        exportedAt: '2024-01-01T00:00:00.000Z',
        appVersion: '1.0.0',
        inventorySets: [],
      };

      expect(isMultiInventoryExport(data)).toBe(true);
    });

    it('returns false for legacy format', () => {
      const data = {
        version: CURRENT_SCHEMA_VERSION,
        exportMetadata: {
          exportedAt: '2024-01-01T00:00:00.000Z',
          appVersion: '1.0.0',
          itemCount: 0,
          categoryCount: 0,
          includedSections: [],
        },
        items: [],
        household: { adults: 2 },
        lastModified: '2024-01-01T00:00:00.000Z',
      };

      expect(isMultiInventoryExport(data)).toBe(false);
    });

    it('returns falsy for null', () => {
      expect(isMultiInventoryExport(null)).toBeFalsy();
    });

    it('returns falsy for undefined', () => {
      expect(isMultiInventoryExport(undefined)).toBeFalsy();
    });

    it('returns falsy for non-object', () => {
      expect(isMultiInventoryExport('string')).toBeFalsy();
      expect(isMultiInventoryExport(123)).toBeFalsy();
    });
  });

  describe('convertLegacyToMultiInventory', () => {
    it('converts legacy format to multi-inventory format', () => {
      const legacyData: PartialExportData = {
        version: CURRENT_SCHEMA_VERSION,
        exportMetadata: {
          exportedAt: '2024-01-01T00:00:00.000Z',
          appVersion: '1.0.0',
          itemCount: 0,
          categoryCount: 0,
          includedSections: ['items', 'household'] as ExportSection[],
        },
        items: [],
        household: {
          adults: 2,
          children: 0,
          pets: 0,
          supplyDurationDays: 3,
          useFreezer: false,
        },
        lastModified: '2024-01-01T00:00:00.000Z',
      };

      const result = convertLegacyToMultiInventory(legacyData);

      expect(result.version).toBe(CURRENT_SCHEMA_VERSION);
      expect(result.exportedAt).toBe('2024-01-01T00:00:00.000Z');
      expect(result.appVersion).toBe('1.0.0');
      expect(result.inventorySets).toHaveLength(1);
      expect(result.inventorySets[0].name).toBe(LEGACY_IMPORT_SET_NAME);
      expect(result.inventorySets[0].data.household).toEqual(
        legacyData.household,
      );
    });

    it('preserves settings from legacy format', () => {
      const legacyData: PartialExportData = {
        version: CURRENT_SCHEMA_VERSION,
        exportMetadata: {
          exportedAt: '2024-01-01T00:00:00.000Z',
          appVersion: '1.0.0',
          itemCount: 0,
          categoryCount: 0,
          includedSections: ['settings'] as ExportSection[],
        },
        settings: {
          language: 'fi',
          theme: 'dark',
          highContrast: true,
          advancedFeatures: {
            calorieTracking: false,
            powerManagement: false,
            waterTracking: false,
          },
        },
        lastModified: '2024-01-01T00:00:00.000Z',
      };

      const result = convertLegacyToMultiInventory(legacyData);

      expect(result.settings).toEqual(legacyData.settings);
    });

    it('handles missing exportMetadata gracefully', () => {
      const legacyData = {
        version: CURRENT_SCHEMA_VERSION,
        items: [],
        household: {
          adults: 2,
          children: 0,
          pets: 0,
          supplyDurationDays: 3,
          useFreezer: false,
        },
        lastModified: '2024-01-01T00:00:00.000Z',
      } as unknown as PartialExportData;

      const result = convertLegacyToMultiInventory(legacyData);

      expect(result.inventorySets).toHaveLength(1);
      expect(result.appVersion).toBe('unknown');
      // exportedAt should be generated
      expect(result.exportedAt).toBeDefined();
    });

    it('includes only non-settings sections in inventory set', () => {
      const legacyData: PartialExportData = {
        version: CURRENT_SCHEMA_VERSION,
        exportMetadata: {
          exportedAt: '2024-01-01T00:00:00.000Z',
          appVersion: '1.0.0',
          itemCount: 0,
          categoryCount: 0,
          includedSections: [
            'items',
            'household',
            'settings',
          ] as ExportSection[],
        },
        items: [],
        household: {
          adults: 2,
          children: 0,
          pets: 0,
          supplyDurationDays: 3,
          useFreezer: false,
        },
        settings: {
          language: 'en',
          theme: 'light',
          highContrast: false,
          advancedFeatures: {
            calorieTracking: false,
            powerManagement: false,
            waterTracking: false,
          },
        },
        lastModified: '2024-01-01T00:00:00.000Z',
      };

      const result = convertLegacyToMultiInventory(legacyData);

      // settings should be in result.settings, not in inventorySets[0].includedSections
      expect(result.inventorySets[0].includedSections).not.toContain(
        'settings',
      );
      expect(result.settings).toBeDefined();
    });
  });
});
