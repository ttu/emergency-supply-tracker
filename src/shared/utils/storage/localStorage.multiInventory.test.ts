import { describe, it, expect, beforeEach } from 'vitest';
import {
  createDefaultRootStorage,
  getAppData,
  clearAppData,
  setActiveInventorySetId,
  createInventorySet,
  DEFAULT_INVENTORY_SET_ID,
  STORAGE_KEY,
} from './localStorage';
import type { MultiInventoryExportData } from '@/shared/types/exportImport';
import { createMockAppData } from '@/shared/utils/test/factories';
import { CURRENT_SCHEMA_VERSION, MigrationError } from './migrations';
import {
  createCategoryId,
  createProductTemplateId,
  createAlertId,
} from '@/shared/types';

describe('localStorage utilities', () => {
  beforeEach(() => {
    clearAppData();
  });

  describe('multi-inventory export/import', () => {
    let getRootStorageForExport: typeof import('./localStorage').getRootStorageForExport;
    let exportMultiInventory: typeof import('./localStorage').exportMultiInventory;
    let parseMultiInventoryImport: typeof import('./localStorage').parseMultiInventoryImport;
    let importMultiInventory: typeof import('./localStorage').importMultiInventory;
    let generateUniqueInventorySetName: typeof import('./localStorage').generateUniqueInventorySetName;
    let saveRootStorageAfterImport: typeof import('./localStorage').saveRootStorageAfterImport;
    let getInventorySetsForExport: typeof import('./localStorage').getInventorySetsForExport;
    let hasSettingsData: typeof import('./localStorage').hasSettingsData;
    let buildRootStorageFromAppData: typeof import('./localStorage').buildRootStorageFromAppData;

    beforeEach(async () => {
      const mod = await import('./localStorage');
      getRootStorageForExport = mod.getRootStorageForExport;
      exportMultiInventory = mod.exportMultiInventory;
      parseMultiInventoryImport = mod.parseMultiInventoryImport;
      importMultiInventory = mod.importMultiInventory;
      generateUniqueInventorySetName = mod.generateUniqueInventorySetName;
      saveRootStorageAfterImport = mod.saveRootStorageAfterImport;
      getInventorySetsForExport = mod.getInventorySetsForExport;
      hasSettingsData = mod.hasSettingsData;
      buildRootStorageFromAppData = mod.buildRootStorageFromAppData;
      clearAppData();
    });

    describe('getRootStorageForExport', () => {
      it('returns undefined when no data exists', () => {
        expect(getRootStorageForExport()).toBeUndefined();
      });

      it('returns root storage after data is saved', () => {
        getAppData(); // bootstrap default
        const root = getRootStorageForExport();
        expect(root).toBeDefined();
        expect(root?.inventorySets).toBeDefined();
      });
    });

    describe('exportMultiInventory', () => {
      it('exports selected inventory sets', () => {
        getAppData();
        const root = getRootStorageForExport()!;

        const json = exportMultiInventory(root, {
          includeSettings: true,
          inventorySets: [
            { id: DEFAULT_INVENTORY_SET_ID, sections: ['items', 'household'] },
          ],
        });
        const parsed = JSON.parse(json);

        expect(parsed.version).toBeDefined();
        expect(parsed.exportedAt).toBeDefined();
        expect(parsed.appVersion).toBeDefined();
        expect(parsed.settings).toBeDefined();
        expect(parsed.inventorySets).toHaveLength(1);
        expect(parsed.inventorySets[0].name).toBe('Default');
        expect(parsed.inventorySets[0].includedSections).toEqual([
          'items',
          'household',
        ]);
      });

      it('excludes settings when not selected', () => {
        getAppData();
        const root = getRootStorageForExport()!;

        const json = exportMultiInventory(root, {
          includeSettings: false,
          inventorySets: [
            { id: DEFAULT_INVENTORY_SET_ID, sections: ['items'] },
          ],
        });
        const parsed = JSON.parse(json);

        expect(parsed.settings).toBeUndefined();
      });

      it('exports only selected sections', () => {
        getAppData();
        const root = getRootStorageForExport()!;

        const json = exportMultiInventory(root, {
          includeSettings: false,
          inventorySets: [
            { id: DEFAULT_INVENTORY_SET_ID, sections: ['household'] },
          ],
        });
        const parsed = JSON.parse(json);

        expect(parsed.inventorySets[0].data.household).toBeDefined();
        expect(parsed.inventorySets[0].data.items).toBeUndefined();
      });

      it('skips non-existent inventory sets', () => {
        getAppData();
        const root = getRootStorageForExport()!;

        const json = exportMultiInventory(root, {
          includeSettings: false,
          inventorySets: [
            {
              id: 'non-existent' as typeof DEFAULT_INVENTORY_SET_ID,
              sections: ['items'],
            },
          ],
        });
        const parsed = JSON.parse(json);

        expect(parsed.inventorySets).toHaveLength(0);
      });

      it('exports customCategories section', () => {
        getAppData();
        const root = getRootStorageForExport()!;
        root.inventorySets[
          DEFAULT_INVENTORY_SET_ID as string
        ].customCategories = [
          { id: createCategoryId('custom-1'), name: 'Custom', isCustom: true },
        ];

        const json = exportMultiInventory(root, {
          includeSettings: false,
          inventorySets: [
            { id: DEFAULT_INVENTORY_SET_ID, sections: ['customCategories'] },
          ],
        });
        const parsed = JSON.parse(json);

        expect(parsed.inventorySets[0].data.customCategories).toHaveLength(1);
      });

      it('exports customTemplates section', () => {
        getAppData();
        const root = getRootStorageForExport()!;
        root.inventorySets[DEFAULT_INVENTORY_SET_ID as string].customTemplates =
          [
            {
              id: createProductTemplateId('custom-1'),
              name: 'Custom',
              category: 'food',
              isCustom: true,
              isBuiltIn: false,
            },
          ];

        const json = exportMultiInventory(root, {
          includeSettings: false,
          inventorySets: [
            { id: DEFAULT_INVENTORY_SET_ID, sections: ['customTemplates'] },
          ],
        });
        const parsed = JSON.parse(json);

        expect(parsed.inventorySets[0].data.customTemplates).toHaveLength(1);
      });

      it('exports dismissedAlertIds section', () => {
        getAppData();
        const root = getRootStorageForExport()!;
        root.inventorySets[
          DEFAULT_INVENTORY_SET_ID as string
        ].dismissedAlertIds = [createAlertId('alert-1')];

        const json = exportMultiInventory(root, {
          includeSettings: false,
          inventorySets: [
            { id: DEFAULT_INVENTORY_SET_ID, sections: ['dismissedAlertIds'] },
          ],
        });
        const parsed = JSON.parse(json);

        expect(parsed.inventorySets[0].data.dismissedAlertIds).toHaveLength(1);
      });

      it('exports disabledRecommendedItems section', () => {
        getAppData();
        const root = getRootStorageForExport()!;
        root.inventorySets[
          DEFAULT_INVENTORY_SET_ID as string
        ].disabledRecommendedItems = [createProductTemplateId('rec-1')];

        const json = exportMultiInventory(root, {
          includeSettings: false,
          inventorySets: [
            {
              id: DEFAULT_INVENTORY_SET_ID,
              sections: ['disabledRecommendedItems'],
            },
          ],
        });
        const parsed = JSON.parse(json);

        expect(
          parsed.inventorySets[0].data.disabledRecommendedItems,
        ).toHaveLength(1);
      });

      it('exports customRecommendedItems section', () => {
        getAppData();
        const root = getRootStorageForExport()!;
        root.inventorySets[
          DEFAULT_INVENTORY_SET_ID as string
        ].customRecommendedItems = {
          meta: { name: 'Custom', version: '1.0', createdAt: '2024-01-01' },
          items: [],
        };

        const json = exportMultiInventory(root, {
          includeSettings: false,
          inventorySets: [
            {
              id: DEFAULT_INVENTORY_SET_ID,
              sections: ['customRecommendedItems'],
            },
          ],
        });
        const parsed = JSON.parse(json);

        expect(
          parsed.inventorySets[0].data.customRecommendedItems,
        ).toBeDefined();
      });
    });

    describe('parseMultiInventoryImport', () => {
      it('parses multi-inventory format', () => {
        const exportData = {
          version: CURRENT_SCHEMA_VERSION,
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
        const json = JSON.stringify(exportData);

        const result = parseMultiInventoryImport(json);

        expect(result.inventorySets).toHaveLength(1);
        expect(result.inventorySets[0].name).toBe('Test');
      });

      it('converts legacy format to multi-inventory format', () => {
        const legacyData = {
          version: CURRENT_SCHEMA_VERSION,
          exportMetadata: {
            exportedAt: '2024-01-01T00:00:00.000Z',
            appVersion: '1.0.0',
            itemCount: 0,
            categoryCount: 0,
            includedSections: ['items', 'household'],
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
        const json = JSON.stringify(legacyData);

        const result = parseMultiInventoryImport(json);

        expect(result.inventorySets).toHaveLength(1);
        // Legacy imports use special sentinel name
        expect(result.inventorySets[0].name).toBe('__IMPORT_SET__');
      });

      it('throws error for invalid JSON', () => {
        const consoleSpy = vi
          .spyOn(console, 'error')
          .mockImplementation(() => {});
        expect(() => parseMultiInventoryImport('invalid json')).toThrow();
        consoleSpy.mockRestore();
      });

      it('throws MigrationError for unsupported version in legacy format', () => {
        const legacyData = {
          version: '0.9.0',
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

        expect(() => parseMultiInventoryImport(json)).toThrow(MigrationError);
      });
    });

    describe('generateUniqueInventorySetName', () => {
      it('returns base name when no conflict', () => {
        const result = generateUniqueInventorySetName('Home', [
          'Car',
          'Office',
        ]);
        expect(result).toBe('Home');
      });

      it('appends (imported) when base name conflicts', () => {
        const result = generateUniqueInventorySetName('Home', [
          'Home',
          'Office',
        ]);
        expect(result).toBe('Home (imported)');
      });

      it('appends (imported N) when both base and imported conflict', () => {
        const result = generateUniqueInventorySetName('Home', [
          'Home',
          'Home (imported)',
        ]);
        expect(result).toBe('Home (imported 2)');
      });

      it('increments counter until unique name found', () => {
        const result = generateUniqueInventorySetName('Home', [
          'Home',
          'Home (imported)',
          'Home (imported 2)',
          'Home (imported 3)',
        ]);
        expect(result).toBe('Home (imported 4)');
      });
    });

    describe('importMultiInventory', () => {
      it('imports inventory sets from multi-inventory format', () => {
        const importData = {
          version: CURRENT_SCHEMA_VERSION,
          exportedAt: '2024-01-01T00:00:00.000Z',
          appVersion: '1.0.0',
          inventorySets: [
            {
              name: 'Car Kit',
              includedSections: ['items', 'household'],
              data: {
                id: '',
                name: 'Car Kit',
                items: [],
                household: {
                  adults: 1,
                  children: 0,
                  pets: 0,
                  supplyDurationDays: 3,
                  useFreezer: false,
                },
              },
            },
          ],
        } as unknown as MultiInventoryExportData;

        const result = importMultiInventory(importData, {
          includeSettings: false,
          inventorySets: [
            {
              index: 0,
              originalName: 'Car Kit',
              sections: ['items', 'household'],
            },
          ],
        });

        const inventorySets = Object.values(result.inventorySets);
        expect(inventorySets).toHaveLength(2); // default + imported
        expect(inventorySets.some((s) => s.name === 'Car Kit')).toBe(true);
      });

      it('imports settings when selected', () => {
        const importData: MultiInventoryExportData = {
          version: CURRENT_SCHEMA_VERSION,
          exportedAt: '2024-01-01T00:00:00.000Z',
          appVersion: '1.0.0',
          settings: {
            language: 'fi',
            theme: 'dark',
            highContrast: true,
            onboardingCompleted: false,
            advancedFeatures: {
              calorieTracking: true,
              powerManagement: false,
              waterTracking: false,
            },
          },
          inventorySets: [],
        };

        const result = importMultiInventory(importData, {
          includeSettings: true,
          inventorySets: [],
        });

        expect(result.settings.language).toBe('fi');
        expect(result.settings.theme).toBe('dark');
        expect(result.settings.onboardingCompleted).toBe(true); // Always set to true
      });

      it('generates unique names for conflicting inventory sets', () => {
        getAppData(); // bootstrap default
        const existingRoot = getRootStorageForExport()!;

        const importData = {
          version: CURRENT_SCHEMA_VERSION,
          exportedAt: '2024-01-01T00:00:00.000Z',
          appVersion: '1.0.0',
          inventorySets: [
            {
              name: 'Default',
              includedSections: ['items'],
              data: { id: '', name: 'Default', items: [] },
            },
          ],
        } as unknown as MultiInventoryExportData;

        const result = importMultiInventory(
          importData,
          {
            includeSettings: false,
            inventorySets: [
              { index: 0, originalName: 'Default', sections: ['items'] },
            ],
          },
          existingRoot,
        );

        const names = Object.values(result.inventorySets).map((s) => s.name);
        expect(names).toContain('Default');
        expect(names).toContain('Default (imported)');
      });

      it('skips invalid inventory set indices', () => {
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
            { index: 5, originalName: 'Invalid', sections: ['items'] }, // Invalid index
            { index: -1, originalName: 'Negative', sections: ['items'] }, // Negative index
          ],
        });

        const inventorySets = Object.values(result.inventorySets);
        expect(inventorySets).toHaveLength(1); // Only default
      });

      it('imports customCategories with proper ID casting', () => {
        const importData = {
          version: CURRENT_SCHEMA_VERSION,
          exportedAt: '2024-01-01T00:00:00.000Z',
          appVersion: '1.0.0',
          inventorySets: [
            {
              name: 'Test',
              includedSections: ['customCategories'],
              data: {
                id: '',
                name: 'Test',
                customCategories: [
                  { id: 'custom-1', name: 'Custom', isCustom: true },
                ],
              },
            },
          ],
        } as unknown as MultiInventoryExportData;

        const result = importMultiInventory(importData, {
          includeSettings: false,
          inventorySets: [
            { index: 0, originalName: 'Test', sections: ['customCategories'] },
          ],
        });

        const imported = Object.values(result.inventorySets).find(
          (s) => s.name === 'Test',
        );
        expect(imported?.customCategories[0].id).toBe('custom-1');
      });

      it('imports customTemplates with proper ID casting', () => {
        const importData = {
          version: CURRENT_SCHEMA_VERSION,
          exportedAt: '2024-01-01T00:00:00.000Z',
          appVersion: '1.0.0',
          inventorySets: [
            {
              name: 'Test',
              includedSections: ['customTemplates'],
              data: {
                id: '',
                name: 'Test',
                customTemplates: [
                  {
                    id: 'custom-template-1',
                    name: 'Template',
                    category: 'food',
                    isCustom: true,
                    isBuiltIn: false,
                  },
                ],
              },
            },
          ],
        } as unknown as MultiInventoryExportData;

        const result = importMultiInventory(importData, {
          includeSettings: false,
          inventorySets: [
            { index: 0, originalName: 'Test', sections: ['customTemplates'] },
          ],
        });

        const imported = Object.values(result.inventorySets).find(
          (s) => s.name === 'Test',
        );
        expect(imported?.customTemplates[0].id).toBe('custom-template-1');
      });

      it('imports dismissedAlertIds with proper ID casting', () => {
        const importData = {
          version: CURRENT_SCHEMA_VERSION,
          exportedAt: '2024-01-01T00:00:00.000Z',
          appVersion: '1.0.0',
          inventorySets: [
            {
              name: 'Test',
              includedSections: ['dismissedAlertIds'],
              data: {
                id: '',
                name: 'Test',
                dismissedAlertIds: ['alert-1', 'alert-2'],
              },
            },
          ],
        } as unknown as MultiInventoryExportData;

        const result = importMultiInventory(importData, {
          includeSettings: false,
          inventorySets: [
            { index: 0, originalName: 'Test', sections: ['dismissedAlertIds'] },
          ],
        });

        const imported = Object.values(result.inventorySets).find(
          (s) => s.name === 'Test',
        );
        expect(imported?.dismissedAlertIds).toHaveLength(2);
      });

      it('imports disabledRecommendedItems with proper ID casting', () => {
        const importData = {
          version: CURRENT_SCHEMA_VERSION,
          exportedAt: '2024-01-01T00:00:00.000Z',
          appVersion: '1.0.0',
          inventorySets: [
            {
              name: 'Test',
              includedSections: ['disabledRecommendedItems'],
              data: {
                id: '',
                name: 'Test',
                disabledRecommendedItems: ['rec-1'],
              },
            },
          ],
        } as unknown as MultiInventoryExportData;

        const result = importMultiInventory(importData, {
          includeSettings: false,
          inventorySets: [
            {
              index: 0,
              originalName: 'Test',
              sections: ['disabledRecommendedItems'],
            },
          ],
        });

        const imported = Object.values(result.inventorySets).find(
          (s) => s.name === 'Test',
        );
        expect(imported?.disabledRecommendedItems).toHaveLength(1);
      });

      it('imports customRecommendedItems when selected', () => {
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
                  meta: {
                    name: 'Custom',
                    version: '1.0',
                    createdAt: '2024-01-01',
                  },
                  items: [],
                },
              },
            },
          ],
        } as unknown as MultiInventoryExportData;

        const result = importMultiInventory(importData, {
          includeSettings: false,
          inventorySets: [
            {
              index: 0,
              originalName: 'Test',
              sections: ['customRecommendedItems'],
            },
          ],
        });

        const imported = Object.values(result.inventorySets).find(
          (s) => s.name === 'Test',
        );
        expect(imported?.customRecommendedItems).toBeDefined();
      });
    });

    describe('saveRootStorageAfterImport', () => {
      it('saves root storage to localStorage', () => {
        const root = createDefaultRootStorage();
        saveRootStorageAfterImport(root);

        const stored = localStorage.getItem(STORAGE_KEY);
        expect(stored).toBeDefined();
        const parsed = JSON.parse(stored!);
        expect(parsed.inventorySets).toBeDefined();
      });

      it('handles storage errors gracefully', () => {
        const consoleSpy = vi
          .spyOn(console, 'error')
          .mockImplementation(() => {});
        const setItemSpy = vi
          .spyOn(Storage.prototype, 'setItem')
          .mockImplementation(() => {
            throw new Error('QuotaExceededError');
          });

        const root = createDefaultRootStorage();
        expect(() => saveRootStorageAfterImport(root)).not.toThrow();

        setItemSpy.mockRestore();
        consoleSpy.mockRestore();
      });
    });

    describe('getInventorySetsForExport', () => {
      it('returns empty array when no data exists', () => {
        expect(getInventorySetsForExport()).toEqual([]);
      });

      it('returns inventory sets with export info', () => {
        getAppData();
        const inventorySets = getInventorySetsForExport();

        expect(inventorySets).toHaveLength(1);
        expect(inventorySets[0].id).toBe(DEFAULT_INVENTORY_SET_ID);
        expect(inventorySets[0].name).toBe('Default');
        expect(inventorySets[0].isActive).toBe(true);
        expect(inventorySets[0].sectionsWithData).toBeDefined();
        expect(inventorySets[0].data).toBeDefined();
      });

      it('marks active inventory set correctly', () => {
        getAppData();
        const newId = createInventorySet('Second');
        setActiveInventorySetId(newId);

        const inventorySets = getInventorySetsForExport();
        const defaultSet = inventorySets.find(
          (s) => s.id === DEFAULT_INVENTORY_SET_ID,
        );
        const newSet = inventorySets.find((s) => s.id === newId);

        expect(defaultSet?.isActive).toBe(false);
        expect(newSet?.isActive).toBe(true);
      });
    });

    describe('hasSettingsData', () => {
      it('returns false when no data exists', () => {
        expect(hasSettingsData()).toBe(false);
      });

      it('returns true when settings exist', () => {
        getAppData();
        expect(hasSettingsData()).toBe(true);
      });
    });

    describe('buildRootStorageFromAppData', () => {
      it('builds root storage from app data', () => {
        const appData = createMockAppData();
        const root = buildRootStorageFromAppData(appData);

        expect(root.version).toBe(CURRENT_SCHEMA_VERSION);
        expect(root.settings).toEqual(appData.settings);
        expect(root.activeInventorySetId).toBe(DEFAULT_INVENTORY_SET_ID);
        expect(
          root.inventorySets[DEFAULT_INVENTORY_SET_ID as string],
        ).toBeDefined();
      });
    });
  });
});
