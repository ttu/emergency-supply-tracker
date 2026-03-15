/**
 * Tests targeting surviving mutants in localStorage.ts.
 * Each describe block groups tests by mutation type.
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  createDefaultRootStorage,
  getAppData,
  clearAppData,
  exportToJSON,
  importFromJSON,
  exportToJSONSelective,
  parseImportJSON,
  buildRootStorageFromAppData,
  getInventorySetList,
  getActiveInventorySetId,
  createInventorySet,
  renameInventorySet,
  getRootStorageForExport,
  exportMultiInventory,
  parseMultiInventoryImport,
  importMultiInventory,
  DEFAULT_INVENTORY_SET_ID,
  STORAGE_KEY,
} from './localStorage';
import type { MultiInventoryExportData } from '@/shared/types/exportImport';
import {
  createMockAppData,
  createMockHousehold,
} from '@/shared/utils/test/factories';
import { CURRENT_SCHEMA_VERSION } from './migrations';
import {
  createCategoryId,
  createItemId,
  createProductTemplateId,
  createQuantity,
} from '@/shared/types';
import { DEFAULT_KIT_ID } from '@/features/templates/kits';
import { STANDARD_CATEGORIES } from '@/features/categories/data';
import { APP_VERSION } from '@/shared/utils/version';

describe('localStorage mutation killers', () => {
  beforeEach(() => {
    clearAppData();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('BlockStatement mutants - verifying side effects happen', () => {
    // L176: catch block in safeGetRootStorage - logs error
    it('safeGetRootStorage logs error when getItem throws (via getInventorySetList)', () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('Storage read error');
      });

      const result = getInventorySetList();
      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        'getRootStorage failed:',
        expect.any(Error),
      );
    });

    // L189: catch block in safeSaveRootStorage - logs error
    it('safeSaveRootStorage logs error when setItem throws (via setActiveInventorySetId)', () => {
      // Bootstrap storage first
      getAppData();
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceeded');
      });

      createInventorySet('Test');
      // safeSaveRootStorage is called but setItem throws
      // The error should be logged
      expect(consoleSpy).toHaveBeenCalledWith(
        'saveRootStorage failed:',
        expect.any(Error),
      );
    });

    // L289: inventorySet check in getAppData - returns undefined when no inventory set
    it('getAppData returns undefined when active inventory set is missing from storage', () => {
      const root = createDefaultRootStorage();
      // Set active to a non-existent ID
      root.activeInventorySetId =
        'non-existent' as typeof DEFAULT_INVENTORY_SET_ID;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(root));

      const result = getAppData();
      expect(result).toBeUndefined();
    });

    // L501: version fallback in importFromJSON when data.version is missing
    it('importFromJSON uses version 1.0.0 when version is missing and applies migrations', () => {
      const data = {
        household: createMockHousehold(),
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
        items: [],
        lastModified: new Date().toISOString(),
      };
      const json = JSON.stringify(data);
      const imported = importFromJSON(json);

      // Should succeed and return current version
      expect(imported.version).toBe(CURRENT_SCHEMA_VERSION);
    });

    // L516: dismissedAlertIds block in importFromJSON
    it('importFromJSON processes existing dismissedAlertIds array', () => {
      const data = {
        version: CURRENT_SCHEMA_VERSION,
        household: createMockHousehold(),
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
        items: [],
        dismissedAlertIds: ['alert-1', 'alert-2'],
        lastModified: new Date().toISOString(),
      };
      const json = JSON.stringify(data);
      const imported = importFromJSON(json);

      expect(imported.dismissedAlertIds).toHaveLength(2);
      expect(imported.dismissedAlertIds[0]).toBe('alert-1');
      expect(imported.dismissedAlertIds[1]).toBe('alert-2');
    });
  });

  describe('StringLiteral mutants - verifying specific string values', () => {
    // L177: 'getRootStorage failed:' error message
    it('safeGetRootStorage uses exact error message "getRootStorage failed:"', () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('test');
      });

      getActiveInventorySetId();
      expect(consoleSpy).toHaveBeenCalledWith(
        'getRootStorage failed:',
        expect.any(Error),
      );
    });

    // L190: 'saveRootStorage failed:' error message
    it('safeSaveRootStorage uses exact error message "saveRootStorage failed:"', () => {
      getAppData();
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      // Make getItem work but setItem throw
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('write fail');
      });

      // renameInventorySet calls safeSaveRootStorage
      renameInventorySet(DEFAULT_INVENTORY_SET_ID, 'New Name');

      expect(consoleSpy).toHaveBeenCalledWith(
        'saveRootStorage failed:',
        expect.any(Error),
      );
    });

    // L321: 'Data validation failed:' error message
    it('getAppData logs "Data validation failed:" on validation error', async () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const validation = await import('../validation/appDataValidation');
      vi.spyOn(validation, 'validateAppDataValues').mockReturnValue({
        isValid: false,
        errors: [{ field: 'test', message: 'bad' }],
      });

      getAppData();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Data validation failed:',
        expect.arrayContaining([expect.objectContaining({ field: 'test' })]),
      );
    });

    // L366: 'Default' name in buildRootStorageFromAppData
    it('buildRootStorageFromAppData uses "Default" as inventory set name', () => {
      const appData = createMockAppData();
      const root = buildRootStorageFromAppData(appData);
      const inventorySet =
        root.inventorySets[DEFAULT_INVENTORY_SET_ID as string];

      expect(inventorySet.name).toBe('Default');
    });

    // L642: 'Failed to parse import JSON:' in parseImportJSON
    it('parseImportJSON logs "Failed to parse import JSON:" on parse error', () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      expect(() => parseImportJSON('not json')).toThrow();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to parse import JSON:',
        expect.any(Error),
      );
    });
  });

  describe('LogicalOperator mutants', () => {
    // L266: data.disabledRecommendedItems || [] - test when it's falsy
    it('normalizeMergedAppData defaults disabledRecommendedItems to [] when undefined', () => {
      // Save data without disabledRecommendedItems field
      const root = createDefaultRootStorage();
      const activeSet = root.inventorySets[DEFAULT_INVENTORY_SET_ID as string];
      // Remove the field to test || [] fallback
      delete (activeSet as unknown as Record<string, unknown>)
        .disabledRecommendedItems;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(root));

      const data = getAppData();
      expect(data).toBeDefined();
      expect(data!.disabledRecommendedItems).toEqual([]);
    });

    // L266: test when disabledRecommendedItems is truthy (non-empty array)
    it('normalizeMergedAppData preserves non-empty disabledRecommendedItems', () => {
      const root = createDefaultRootStorage();
      const activeSet = root.inventorySets[DEFAULT_INVENTORY_SET_ID as string];
      activeSet.disabledRecommendedItems = [createProductTemplateId('item-1')];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(root));

      const data = getAppData();
      expect(data).toBeDefined();
      expect(data!.disabledRecommendedItems).toHaveLength(1);
      expect(data!.disabledRecommendedItems[0]).toBe('item-1');
    });

    // L470: data.customCategories?.length ?? 0 in exportToJSON
    it('exportToJSON includes customCategories count when customCategories exist', () => {
      const mockData = createMockAppData({
        customCategories: [
          {
            id: createCategoryId('custom-1'),
            name: 'Custom',
            isCustom: true,
          },
        ],
      });
      const json = exportToJSON(mockData);
      const parsed = JSON.parse(json);

      expect(parsed.exportMetadata.categoryCount).toBe(
        STANDARD_CATEGORIES.length + 1,
      );
    });

    // L470: test when customCategories is undefined/empty
    it('exportToJSON uses 0 for customCategories count when undefined', () => {
      const mockData = createMockAppData();
      // Explicitly unset customCategories
      (mockData as unknown as Record<string, unknown>).customCategories =
        undefined;
      const json = exportToJSON(mockData);
      const parsed = JSON.parse(json);

      expect(parsed.exportMetadata.categoryCount).toBe(
        STANDARD_CATEGORIES.length,
      );
    });

    // L965: imported.selectedRecommendationKit ?? DEFAULT_KIT_ID in buildInventorySetFromImport
    it('importMultiInventory uses DEFAULT_KIT_ID when selectedRecommendationKit is absent', () => {
      const importData = {
        version: CURRENT_SCHEMA_VERSION,
        exportedAt: '2024-01-01T00:00:00.000Z',
        appVersion: '1.0.0',
        inventorySets: [
          {
            name: 'Test',
            includedSections: ['items'],
            data: {
              id: '',
              name: 'Test',
              items: [],
              // selectedRecommendationKit is absent
            },
          },
        ],
      } as unknown as MultiInventoryExportData;

      const result = importMultiInventory(importData, {
        includeSettings: false,
        inventorySets: [
          { index: 0, originalName: 'Test', sections: ['items'] },
        ],
      });

      const imported = Object.values(result.inventorySets).find(
        (s) => s.name === 'Test',
      );
      expect(imported?.selectedRecommendationKit).toBe(DEFAULT_KIT_ID);
    });

    // L965: test when selectedRecommendationKit IS present
    it('importMultiInventory preserves provided selectedRecommendationKit', () => {
      const importData = {
        version: CURRENT_SCHEMA_VERSION,
        exportedAt: '2024-01-01T00:00:00.000Z',
        appVersion: '1.0.0',
        inventorySets: [
          {
            name: 'Test',
            includedSections: ['items'],
            data: {
              id: '',
              name: 'Test',
              items: [],
              selectedRecommendationKit: 'custom-kit',
            },
          },
        ],
      } as unknown as MultiInventoryExportData;

      const result = importMultiInventory(importData, {
        includeSettings: false,
        inventorySets: [
          { index: 0, originalName: 'Test', sections: ['items'] },
        ],
      });

      const imported = Object.values(result.inventorySets).find(
        (s) => s.name === 'Test',
      );
      expect(imported?.selectedRecommendationKit).toBe('custom-kit');
    });

    // L966: imported.uploadedRecommendationKits ?? [] in buildInventorySetFromImport
    it('importMultiInventory defaults uploadedRecommendationKits to [] when absent', () => {
      const importData = {
        version: CURRENT_SCHEMA_VERSION,
        exportedAt: '2024-01-01T00:00:00.000Z',
        appVersion: '1.0.0',
        inventorySets: [
          {
            name: 'Test',
            includedSections: ['items'],
            data: {
              id: '',
              name: 'Test',
              items: [],
              // uploadedRecommendationKits is absent
            },
          },
        ],
      } as unknown as MultiInventoryExportData;

      const result = importMultiInventory(importData, {
        includeSettings: false,
        inventorySets: [
          { index: 0, originalName: 'Test', sections: ['items'] },
        ],
      });

      const imported = Object.values(result.inventorySets).find(
        (s) => s.name === 'Test',
      );
      expect(imported?.uploadedRecommendationKits).toEqual([]);
    });

    // L1003: !exportedSet || setSelection.index < 0 boundary
    it('importMultiInventory skips when index is negative', () => {
      const importData = {
        version: CURRENT_SCHEMA_VERSION,
        exportedAt: '2024-01-01T00:00:00.000Z',
        appVersion: '1.0.0',
        inventorySets: [
          {
            name: 'Test',
            includedSections: ['items'],
            data: { id: '', name: 'Test', items: [] },
          },
        ],
      } as unknown as MultiInventoryExportData;

      const result = importMultiInventory(importData, {
        includeSettings: false,
        inventorySets: [
          { index: -1, originalName: 'Negative', sections: ['items'] },
        ],
      });

      const sets = Object.values(result.inventorySets);
      expect(sets).toHaveLength(1); // Only default
    });

    // L1003: test with index === 0 (boundary - should work)
    it('importMultiInventory processes index 0 correctly', () => {
      const importData = {
        version: CURRENT_SCHEMA_VERSION,
        exportedAt: '2024-01-01T00:00:00.000Z',
        appVersion: '1.0.0',
        inventorySets: [
          {
            name: 'Valid',
            includedSections: ['items'],
            data: { id: '', name: 'Valid', items: [] },
          },
        ],
      } as unknown as MultiInventoryExportData;

      const result = importMultiInventory(importData, {
        includeSettings: false,
        inventorySets: [
          { index: 0, originalName: 'Valid', sections: ['items'] },
        ],
      });

      const sets = Object.values(result.inventorySets);
      expect(sets).toHaveLength(2); // default + imported
      expect(sets.some((s) => s.name === 'Valid')).toBe(true);
    });
  });

  describe('ConditionalExpression mutants - testing ternary branches', () => {
    // L289: if (!inventorySet) return undefined - test true and false
    it('getAppData returns data when inventory set exists', () => {
      const data = getAppData();
      expect(data).toBeDefined();
      expect(data!.version).toBe(CURRENT_SCHEMA_VERSION);
    });

    // L295: needsMigration ternary - test when migration is NOT needed
    it('getAppData returns data without migration when version is current', () => {
      getAppData(); // bootstrap
      const data = getAppData();
      expect(data).toBeDefined();
      expect(data!.version).toBe(CURRENT_SCHEMA_VERSION);
    });

    // L400: crypto.randomUUID ternary in generateInventorySetId
    it('generateInventorySetId uses crypto.randomUUID when available', () => {
      getAppData();
      const id = createInventorySet('Test');
      // UUID format: 8-4-4-4-12 hex characters
      expect(id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      );
    });

    // L400: test fallback when crypto.randomUUID is not available
    it('generateInventorySetId uses fallback when randomUUID is not available', () => {
      const originalRandomUUID = crypto.randomUUID;
      // Remove randomUUID to trigger fallback
      (crypto as unknown as Record<string, unknown>).randomUUID = undefined;

      getAppData();
      const id = createInventorySet('Fallback Test');
      expect(id).toMatch(/^ws-\d+-[a-z0-9]+$/);

      // Restore
      crypto.randomUUID = originalRandomUUID;
    });
  });

  describe('OptionalChaining mutants', () => {
    // L470: data.customCategories?.length - test with undefined customCategories
    it('exportToJSON handles undefined customCategories via optional chaining', () => {
      const mockData = createMockAppData();
      (mockData as unknown as Record<string, unknown>).customCategories =
        undefined;
      const json = exportToJSON(mockData);
      const parsed = JSON.parse(json);

      expect(parsed.exportMetadata.categoryCount).toBe(
        STANDARD_CATEGORIES.length,
      );
    });

    // L587: data.items?.length in exportToJSONSelective
    it('exportToJSONSelective handles undefined items via optional chaining', () => {
      const mockData = createMockAppData();
      (mockData as unknown as Record<string, unknown>).items = undefined;
      const json = exportToJSONSelective(mockData, ['items']);
      const parsed = JSON.parse(json);

      expect(parsed.exportMetadata.itemCount).toBe(0);
    });

    // L589: data.customCategories?.length in exportToJSONSelective
    it('exportToJSONSelective handles undefined customCategories via optional chaining', () => {
      const mockData = createMockAppData();
      (mockData as unknown as Record<string, unknown>).customCategories =
        undefined;
      const json = exportToJSONSelective(mockData, ['customCategories']);
      const parsed = JSON.parse(json);

      expect(parsed.exportMetadata.categoryCount).toBe(
        STANDARD_CATEGORIES.length,
      );
    });

    // L587, L589: test with defined values to ensure both branches work
    it('exportToJSONSelective correctly counts items and categories when defined', () => {
      const mockData = createMockAppData({
        items: [
          {
            id: createItemId('i1'),
            name: 'Item',
            itemType: 'custom',
            categoryId: createCategoryId('food'),
            quantity: createQuantity(1),
            unit: 'pieces',
            neverExpires: true,
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
          },
        ],
        customCategories: [
          {
            id: createCategoryId('custom-1'),
            name: 'C1',
            isCustom: true,
          },
          {
            id: createCategoryId('custom-2'),
            name: 'C2',
            isCustom: true,
          },
        ],
      });
      const json = exportToJSONSelective(mockData, [
        'items',
        'customCategories',
      ]);
      const parsed = JSON.parse(json);

      expect(parsed.exportMetadata.itemCount).toBe(1);
      expect(parsed.exportMetadata.categoryCount).toBe(
        STANDARD_CATEGORIES.length + 2,
      );
    });
  });

  describe('ObjectLiteral mutant', () => {
    // L794: data: { id, name, lastModified } in exportMultiInventory
    it('exportMultiInventory includes id, name, lastModified in exported data', () => {
      getAppData();
      const root = getRootStorageForExport()!;
      const inventorySet =
        root.inventorySets[DEFAULT_INVENTORY_SET_ID as string];

      const json = exportMultiInventory(root, {
        includeSettings: false,
        inventorySets: [
          {
            id: DEFAULT_INVENTORY_SET_ID,
            sections: [], // No sections, just base data
          },
        ],
      });
      const parsed = JSON.parse(json);

      expect(parsed.inventorySets[0].data.id).toBe(inventorySet.id);
      expect(parsed.inventorySets[0].data.name).toBe(inventorySet.name);
      expect(parsed.inventorySets[0].data.lastModified).toBe(
        inventorySet.lastModified,
      );
    });
  });

  describe('EqualityOperator mutant', () => {
    // L1005: setSelection.index >= importData.inventorySets.length
    // Mutant changes >= to > (i.e. allows index === length)
    it('importMultiInventory skips when index equals inventorySets length', () => {
      const importData = {
        version: CURRENT_SCHEMA_VERSION,
        exportedAt: '2024-01-01T00:00:00.000Z',
        appVersion: '1.0.0',
        inventorySets: [
          {
            name: 'Only',
            includedSections: ['items'],
            data: { id: '', name: 'Only', items: [] },
          },
        ],
      } as unknown as MultiInventoryExportData;

      // index 1 === length 1, should be skipped
      const result = importMultiInventory(importData, {
        includeSettings: false,
        inventorySets: [{ index: 1, originalName: 'OOB', sections: ['items'] }],
      });

      const sets = Object.values(result.inventorySets);
      expect(sets).toHaveLength(1); // Only default, no import
    });

    // Boundary: index === length - 1 should work
    it('importMultiInventory processes last valid index', () => {
      const importData = {
        version: CURRENT_SCHEMA_VERSION,
        exportedAt: '2024-01-01T00:00:00.000Z',
        appVersion: '1.0.0',
        inventorySets: [
          {
            name: 'First',
            includedSections: ['items'],
            data: { id: '', name: 'First', items: [] },
          },
          {
            name: 'Last',
            includedSections: ['items'],
            data: { id: '', name: 'Last', items: [] },
          },
        ],
      } as unknown as MultiInventoryExportData;

      // index 1 === length - 1, should work
      const result = importMultiInventory(importData, {
        includeSettings: false,
        inventorySets: [
          { index: 1, originalName: 'Last', sections: ['items'] },
        ],
      });

      const sets = Object.values(result.inventorySets);
      expect(sets).toHaveLength(2); // default + imported
      expect(sets.some((s) => s.name === 'Last')).toBe(true);
    });
  });

  describe('Additional ConditionalExpression mutants', () => {
    // exportToJSONSelective category count when customCategories IS selected
    it('exportToJSONSelective adds custom category count when section is included', () => {
      const mockData = createMockAppData({
        customCategories: [
          {
            id: createCategoryId('c1'),
            name: 'Custom1',
            isCustom: true,
          },
        ],
      });

      const json = exportToJSONSelective(mockData, ['customCategories']);
      const parsed = JSON.parse(json);

      expect(parsed.exportMetadata.categoryCount).toBe(
        STANDARD_CATEGORIES.length + 1,
      );
    });

    // exportToJSONSelective category count when customCategories NOT selected
    it('exportToJSONSelective uses only standard category count when section not included', () => {
      const mockData = createMockAppData({
        customCategories: [
          {
            id: createCategoryId('c1'),
            name: 'Custom1',
            isCustom: true,
          },
        ],
      });

      const json = exportToJSONSelective(mockData, ['items']);
      const parsed = JSON.parse(json);

      expect(parsed.exportMetadata.categoryCount).toBe(
        STANDARD_CATEGORIES.length,
      );
    });

    // importFromJSON with disabledRecommendedItems present
    it('importFromJSON maps existing disabledRecommendedItems to branded types', () => {
      const data = {
        version: CURRENT_SCHEMA_VERSION,
        household: createMockHousehold(),
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
        items: [],
        disabledRecommendedItems: ['bottled-water', 'canned-food'],
        lastModified: new Date().toISOString(),
      };
      const json = JSON.stringify(data);
      const imported = importFromJSON(json);

      expect(imported.disabledRecommendedItems).toEqual([
        'bottled-water',
        'canned-food',
      ]);
      expect(imported.disabledRecommendedItems).toHaveLength(2);
    });

    // importFromJSON without disabledRecommendedItems - should default to []
    it('importFromJSON defaults disabledRecommendedItems to empty array when missing', () => {
      const data = {
        version: CURRENT_SCHEMA_VERSION,
        household: createMockHousehold(),
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
        items: [],
        lastModified: new Date().toISOString(),
      };
      const json = JSON.stringify(data);
      const imported = importFromJSON(json);

      expect(imported.disabledRecommendedItems).toEqual([]);
    });

    // buildInventorySetFromImport: household section inclusion
    it('importMultiInventory uses DEFAULT_HOUSEHOLD when household section not selected', () => {
      const importData = {
        version: CURRENT_SCHEMA_VERSION,
        exportedAt: '2024-01-01T00:00:00.000Z',
        appVersion: '1.0.0',
        inventorySets: [
          {
            name: 'Test',
            includedSections: ['items'],
            data: {
              id: '',
              name: 'Test',
              items: [],
              household: {
                adults: 10,
                children: 5,
                pets: 3,
                supplyDurationDays: 30,
                useFreezer: true,
              },
            },
          },
        ],
      } as unknown as MultiInventoryExportData;

      // Only select 'items', not 'household'
      const result = importMultiInventory(importData, {
        includeSettings: false,
        inventorySets: [
          { index: 0, originalName: 'Test', sections: ['items'] },
        ],
      });

      const imported = Object.values(result.inventorySets).find(
        (s) => s.name === 'Test',
      );
      // Should use default household, not the import's household
      expect(imported?.household.adults).toBe(2);
      expect(imported?.household.supplyDurationDays).toBe(3);
    });

    // buildInventorySetFromImport: household section when selected
    it('importMultiInventory uses imported household when section is selected', () => {
      const importData = {
        version: CURRENT_SCHEMA_VERSION,
        exportedAt: '2024-01-01T00:00:00.000Z',
        appVersion: '1.0.0',
        inventorySets: [
          {
            name: 'Test',
            includedSections: ['household'],
            data: {
              id: '',
              name: 'Test',
              household: {
                adults: 10,
                children: 5,
                pets: 3,
                supplyDurationDays: 30,
                useFreezer: true,
              },
            },
          },
        ],
      } as unknown as MultiInventoryExportData;

      const result = importMultiInventory(importData, {
        includeSettings: false,
        inventorySets: [
          { index: 0, originalName: 'Test', sections: ['household'] },
        ],
      });

      const imported = Object.values(result.inventorySets).find(
        (s) => s.name === 'Test',
      );
      expect(imported?.household.adults).toBe(10);
      expect(imported?.household.supplyDurationDays).toBe(30);
    });

    // buildInventorySetFromImport: disabledCategories section inclusion
    it('importMultiInventory uses empty disabledCategories when section not selected', () => {
      const importData = {
        version: CURRENT_SCHEMA_VERSION,
        exportedAt: '2024-01-01T00:00:00.000Z',
        appVersion: '1.0.0',
        inventorySets: [
          {
            name: 'Test',
            includedSections: ['disabledCategories'],
            data: {
              id: '',
              name: 'Test',
              disabledCategories: [createCategoryId('food')],
            },
          },
        ],
      } as unknown as MultiInventoryExportData;

      // Don't select disabledCategories
      const result = importMultiInventory(importData, {
        includeSettings: false,
        inventorySets: [
          { index: 0, originalName: 'Test', sections: ['items'] },
        ],
      });

      const imported = Object.values(result.inventorySets).find(
        (s) => s.name === 'Test',
      );
      expect(imported?.disabledCategories).toEqual([]);
    });

    // buildInventorySetFromImport: disabledCategories when selected
    it('importMultiInventory imports disabledCategories when section is selected', () => {
      const importData = {
        version: CURRENT_SCHEMA_VERSION,
        exportedAt: '2024-01-01T00:00:00.000Z',
        appVersion: '1.0.0',
        inventorySets: [
          {
            name: 'Test',
            includedSections: ['disabledCategories'],
            data: {
              id: '',
              name: 'Test',
              disabledCategories: ['food'],
            },
          },
        ],
      } as unknown as MultiInventoryExportData;

      const result = importMultiInventory(importData, {
        includeSettings: false,
        inventorySets: [
          { index: 0, originalName: 'Test', sections: ['disabledCategories'] },
        ],
      });

      const imported = Object.values(result.inventorySets).find(
        (s) => s.name === 'Test',
      );
      expect(imported?.disabledCategories).toEqual(['food']);
    });

    // buildInventorySetFromImport: customRecommendedItems when NOT selected
    it('importMultiInventory sets customRecommendedItems to undefined when section not selected', () => {
      const importData = {
        version: CURRENT_SCHEMA_VERSION,
        exportedAt: '2024-01-01T00:00:00.000Z',
        appVersion: '1.0.0',
        inventorySets: [
          {
            name: 'Test',
            includedSections: ['customRecommendedItems'],
            data: {
              id: '',
              name: 'Test',
              customRecommendedItems: {
                meta: { name: 'Kit', version: '1.0', createdAt: '2024-01-01' },
                items: [],
              },
            },
          },
        ],
      } as unknown as MultiInventoryExportData;

      // Don't select customRecommendedItems
      const result = importMultiInventory(importData, {
        includeSettings: false,
        inventorySets: [
          { index: 0, originalName: 'Test', sections: ['items'] },
        ],
      });

      const imported = Object.values(result.inventorySets).find(
        (s) => s.name === 'Test',
      );
      expect(imported?.customRecommendedItems).toBeUndefined();
    });
  });

  describe('exportMultiInventory disabledCategories section', () => {
    it('exports disabledCategories section when selected', () => {
      getAppData();
      const root = getRootStorageForExport()!;
      root.inventorySets[
        DEFAULT_INVENTORY_SET_ID as string
      ].disabledCategories = ['food'];

      const json = exportMultiInventory(root, {
        includeSettings: false,
        inventorySets: [
          {
            id: DEFAULT_INVENTORY_SET_ID,
            sections: ['disabledCategories'],
          },
        ],
      });
      const parsed = JSON.parse(json);

      expect(parsed.inventorySets[0].data.disabledCategories).toEqual(['food']);
    });
  });

  describe('parseMultiInventoryImport with unsupported multi-inventory version', () => {
    it('throws MigrationError for unsupported version in multi-inventory format', () => {
      const data = {
        version: '0.9.0',
        exportedAt: '2024-01-01T00:00:00.000Z',
        appVersion: '1.0.0',
        inventorySets: [
          {
            name: 'Test',
            includedSections: ['items'],
            data: { id: '', name: 'Test' },
          },
        ],
      };
      const json = JSON.stringify(data);

      expect(() => parseMultiInventoryImport(json)).toThrow();
    });
  });

  describe('importFromJSON version and selectedRecommendationKit defaults', () => {
    // L500: version fallback - test with version present
    it('importFromJSON uses provided version when present', () => {
      const data = {
        version: CURRENT_SCHEMA_VERSION,
        household: createMockHousehold(),
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
        items: [],
        lastModified: new Date().toISOString(),
      };
      const json = JSON.stringify(data);
      const imported = importFromJSON(json);

      expect(imported.version).toBe(CURRENT_SCHEMA_VERSION);
    });

    // L534: selectedRecommendationKit ??= DEFAULT_KIT_ID
    it('importFromJSON defaults selectedRecommendationKit when not present', () => {
      const data = {
        version: CURRENT_SCHEMA_VERSION,
        household: createMockHousehold(),
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
        items: [],
        lastModified: new Date().toISOString(),
      };
      const json = JSON.stringify(data);
      const imported = importFromJSON(json);

      expect(imported.selectedRecommendationKit).toBe(DEFAULT_KIT_ID);
    });

    // L534: selectedRecommendationKit is present - should keep it
    it('importFromJSON preserves existing selectedRecommendationKit', () => {
      const data = {
        version: CURRENT_SCHEMA_VERSION,
        household: createMockHousehold(),
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
        items: [],
        selectedRecommendationKit: 'my-custom-kit',
        lastModified: new Date().toISOString(),
      };
      const json = JSON.stringify(data);
      const imported = importFromJSON(json);

      expect(imported.selectedRecommendationKit).toBe('my-custom-kit');
    });

    // L535: uploadedRecommendationKits ??= []
    it('importFromJSON defaults uploadedRecommendationKits when not present', () => {
      const data = {
        version: CURRENT_SCHEMA_VERSION,
        household: createMockHousehold(),
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
        items: [],
        lastModified: new Date().toISOString(),
      };
      const json = JSON.stringify(data);
      const imported = importFromJSON(json);

      expect(imported.uploadedRecommendationKits).toEqual([]);
    });
  });

  describe('parseImportJSON version fallback', () => {
    it('parseImportJSON uses 1.0.0 as fallback when version is missing', () => {
      // Version missing means it falls back to 1.0.0.
      // Since 1.0.0 is supported, it should not throw
      const data = {
        household: {
          adults: 1,
          children: 0,
          supplyDurationDays: 3,
          useFreezer: false,
        },
        lastModified: '2024-01-01T00:00:00.000Z',
      };
      const json = JSON.stringify(data);
      const result = parseImportJSON(json);

      expect(result).toBeDefined();
      expect(result.household).toEqual(data.household);
    });
  });

  describe('parseMultiInventoryImport version fallback', () => {
    it('uses 1.0.0 as fallback when version is missing in legacy format', () => {
      const legacyData = {
        exportMetadata: {
          exportedAt: '2024-01-01T00:00:00.000Z',
          appVersion: '1.0.0',
          itemCount: 0,
          categoryCount: 0,
          includedSections: [],
        },
        lastModified: '2024-01-01T00:00:00.000Z',
      };
      const json = JSON.stringify(legacyData);
      const result = parseMultiInventoryImport(json);

      expect(result).toBeDefined();
      expect(result.inventorySets).toBeDefined();
    });

    it('uses 1.0.0 as fallback when version is missing in multi-inventory format', () => {
      const data = {
        exportedAt: '2024-01-01T00:00:00.000Z',
        appVersion: '1.0.0',
        inventorySets: [
          {
            name: 'Test',
            includedSections: ['items'],
            data: { id: '', name: 'Test' },
          },
        ],
      };
      const json = JSON.stringify(data);
      const result = parseMultiInventoryImport(json);

      expect(result).toBeDefined();
      expect(result.inventorySets).toHaveLength(1);
    });
  });

  describe('exportToJSON items optional chaining', () => {
    // L468: data.items?.length ?? 0
    it('exportToJSON uses 0 for itemCount when items is undefined', () => {
      const mockData = createMockAppData();
      (mockData as unknown as Record<string, unknown>).items = undefined;
      const json = exportToJSON(mockData);
      const parsed = JSON.parse(json);

      expect(parsed.exportMetadata.itemCount).toBe(0);
    });

    it('exportToJSON counts items correctly when items exist', () => {
      const mockData = createMockAppData({
        items: [
          {
            id: createItemId('item-1'),
            name: 'Item 1',
            itemType: 'custom',
            categoryId: createCategoryId('food'),
            quantity: createQuantity(1),
            unit: 'pieces',
            neverExpires: true,
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
          },
          {
            id: createItemId('item-2'),
            name: 'Item 2',
            itemType: 'custom',
            categoryId: createCategoryId('food'),
            quantity: createQuantity(2),
            unit: 'pieces',
            neverExpires: true,
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
          },
        ],
      });
      const json = exportToJSON(mockData);
      const parsed = JSON.parse(json);

      expect(parsed.exportMetadata.itemCount).toBe(2);
    });
  });

  describe('exportToJSON metadata strings', () => {
    it('exportToJSON uses APP_VERSION in metadata', () => {
      const mockData = createMockAppData();
      const json = exportToJSON(mockData);
      const parsed = JSON.parse(json);

      expect(parsed.exportMetadata.appVersion).toBe(APP_VERSION);
      expect(typeof parsed.exportMetadata.appVersion).toBe('string');
      expect(parsed.exportMetadata.appVersion.length).toBeGreaterThan(0);
    });
  });

  describe('exportMultiInventory metadata', () => {
    it('exportMultiInventory includes appVersion in output', () => {
      getAppData();
      const root = getRootStorageForExport()!;

      const json = exportMultiInventory(root, {
        includeSettings: false,
        inventorySets: [{ id: DEFAULT_INVENTORY_SET_ID, sections: [] }],
      });
      const parsed = JSON.parse(json);

      expect(parsed.appVersion).toBe(APP_VERSION);
      expect(parsed.appVersion.length).toBeGreaterThan(0);
    });

    it('exportMultiInventory includes exportedAt timestamp', () => {
      getAppData();
      const root = getRootStorageForExport()!;

      const json = exportMultiInventory(root, {
        includeSettings: false,
        inventorySets: [],
      });
      const parsed = JSON.parse(json);

      expect(parsed.exportedAt).toBeDefined();
      const date = new Date(parsed.exportedAt);
      expect(date.getTime()).not.toBeNaN();
    });
  });
});
