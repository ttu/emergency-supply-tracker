import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  createDefaultRootStorage,
  getAppData,
  saveAppData,
  clearAppData,
  importFromJSON,
  exportToJSONSelective,
  parseImportJSON,
  mergeImportData,
  STORAGE_KEY,
} from './localStorage';
import type {
  ExportSection,
  PartialExportData,
} from '@/shared/types/exportImport';
import {
  createMockAppData,
  createMockCategory,
} from '@/shared/utils/test/factories';
import { CURRENT_SCHEMA_VERSION, MigrationError } from './migrations';
import {
  createCategoryId,
  createItemId,
  createProductTemplateId,
  createAlertId,
  createQuantity,
} from '@/shared/types';
import { createTestExportMetadata } from './__helpers__/localStorage.helpers';

describe('localStorage utilities', () => {
  beforeEach(() => {
    clearAppData();
  });

  describe('error handling', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('handles localStorage.getItem error gracefully', () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const getItemSpy = vi
        .spyOn(Storage.prototype, 'getItem')
        .mockImplementation(() => {
          throw new Error('Storage error');
        });

      const result = getAppData();

      expect(result).toBeUndefined();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to load data from localStorage:',
        expect.any(Error),
      );

      getItemSpy.mockRestore();
      consoleSpy.mockRestore();
    });

    it('handles localStorage.setItem error gracefully', () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const setItemSpy = vi
        .spyOn(Storage.prototype, 'setItem')
        .mockImplementation(() => {
          throw new Error('Storage quota exceeded');
        });

      const mockData = createMockAppData();
      saveAppData(mockData);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to save data to localStorage:',
        expect.any(Error),
      );

      setItemSpy.mockRestore();
      consoleSpy.mockRestore();
    });

    it('handles invalid JSON gracefully', () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      localStorage.setItem('emergencySupplyTracker', '{ invalid json }');

      const result = getAppData();

      expect(result).toBeUndefined();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to load data from localStorage:',
        expect.any(Error),
      );

      consoleSpy.mockRestore();
    });

    it('handles invalid JSON in importFromJSON', () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const invalidJson = '{ invalid json }';

      expect(() => importFromJSON(invalidJson)).toThrow();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to parse import JSON:',
        expect.any(Error),
      );

      consoleSpy.mockRestore();
    });

    it('handles unsupported version in getAppData', () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const root = createDefaultRootStorage();
      root.version = '0.9.0';
      localStorage.setItem(STORAGE_KEY, JSON.stringify(root));

      const result = getAppData();

      expect(result).toBeUndefined();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/Data schema version .* is not supported/),
      );

      consoleSpy.mockRestore();
    });

    it('handles migration failure with MigrationError in getAppData', async () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const root = createDefaultRootStorage();
      root.version = '1.0.0';
      localStorage.setItem(STORAGE_KEY, JSON.stringify(root));

      const migrations = await import('./migrations');
      const needsMigrationSpy = vi
        .spyOn(migrations, 'needsMigration')
        .mockReturnValue(true);
      const migrateSpy = vi
        .spyOn(migrations, 'migrateToCurrentVersion')
        .mockImplementation(() => {
          throw new MigrationError(
            'Migration failed',
            '1.0.0',
            CURRENT_SCHEMA_VERSION,
          );
        });

      const result = getAppData();

      expect(result).toBeDefined();
      expect(result?.version).toBe('1.0.0');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/Migration failed: .* to .*: Migration failed/),
      );

      needsMigrationSpy.mockRestore();
      migrateSpy.mockRestore();
      consoleSpy.mockRestore();
    });

    it('handles migration failure with generic error in getAppData', async () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const root = createDefaultRootStorage();
      root.version = '1.0.0';
      localStorage.setItem(STORAGE_KEY, JSON.stringify(root));

      const migrations = await import('./migrations');
      const needsMigrationSpy = vi
        .spyOn(migrations, 'needsMigration')
        .mockReturnValue(true);
      const migrateSpy = vi
        .spyOn(migrations, 'migrateToCurrentVersion')
        .mockImplementation(() => {
          throw new Error('Generic migration error');
        });

      const result = getAppData();

      expect(result).toBeDefined();
      expect(result?.version).toBe('1.0.0');
      expect(consoleSpy).toHaveBeenCalledWith(
        'Migration failed:',
        expect.any(Error),
      );

      needsMigrationSpy.mockRestore();
      migrateSpy.mockRestore();
      consoleSpy.mockRestore();
    });

    it('handles unsupported version in importFromJSON', () => {
      const unsupportedData = {
        version: '0.9.0', // Unsupported version
        household: {
          adults: 2,
          children: 0,
          pets: 0,
          supplyDurationDays: 7,
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
        customCategories: [],
        items: [],
        customTemplates: [],
        dismissedAlertIds: [],
        disabledRecommendedItems: [],
        lastModified: new Date().toISOString(),
      };
      const json = JSON.stringify(unsupportedData);

      try {
        importFromJSON(json);
        expect.fail('Should have thrown MigrationError');
      } catch (error) {
        expect(error).toBeInstanceOf(MigrationError);
        expect((error as Error).message).toContain('is not supported');
      }
    });

    it('applies migration in importFromJSON when data needs migration', async () => {
      // Create data with an older version that needs migration
      const oldData = {
        version: '1.0.0',
        household: {
          adults: 2,
          children: 0,
          pets: 0,
          supplyDurationDays: 7,
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
        customCategories: [],
        items: [],
        customTemplates: [],
        dismissedAlertIds: [],
        disabledRecommendedItems: [],
        lastModified: new Date().toISOString(),
      };
      const json = JSON.stringify(oldData);

      // Mock needsMigration to return true to trigger migration path
      const migrations = await import('./migrations');
      const needsMigrationSpy = vi
        .spyOn(migrations, 'needsMigration')
        .mockReturnValue(true);

      const result = importFromJSON(json);

      // Should have migrated to current version
      expect(result.version).toBe(CURRENT_SCHEMA_VERSION);

      needsMigrationSpy.mockRestore();
    });
  });

  describe('exportToJSONSelective', () => {
    it('exports only selected sections', () => {
      const mockData = createMockAppData({
        items: [
          {
            id: createItemId('item-1'),
            name: 'Test Item',
            itemType: 'custom',
            categoryId: createCategoryId('food'),
            quantity: createQuantity(5),
            unit: 'pieces',
            neverExpires: true,
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
          },
        ],
        customCategories: [
          createMockCategory({ id: createCategoryId('custom-1') }),
        ],
      });

      const sections: ExportSection[] = ['items', 'household'];
      const json = exportToJSONSelective(mockData, sections);
      const parsed = JSON.parse(json);

      expect(parsed.items).toBeDefined();
      expect(parsed.household).toBeDefined();
      expect(parsed.settings).toBeUndefined();
      expect(parsed.customCategories).toBeUndefined();
      expect(parsed.exportMetadata.includedSections).toEqual(sections);
    });

    it('exports all sections when all selected', () => {
      const mockData = createMockAppData();
      const allSections: ExportSection[] = [
        'items',
        'household',
        'settings',
        'customCategories',
        'customTemplates',
        'dismissedAlertIds',
        'disabledRecommendedItems',
        'customRecommendedItems',
      ];
      const json = exportToJSONSelective(mockData, allSections);
      const parsed = JSON.parse(json);

      expect(parsed.items).toBeDefined();
      expect(parsed.household).toBeDefined();
      expect(parsed.settings).toBeDefined();
      expect(parsed.customCategories).toBeDefined();
      expect(parsed.customTemplates).toBeDefined();
    });

    it('includes correct item count in metadata', () => {
      const mockData = createMockAppData({
        items: [
          {
            id: createItemId('item-1'),
            name: 'Test Item 1',
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
            name: 'Test Item 2',
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

      const json = exportToJSONSelective(mockData, ['items']);
      const parsed = JSON.parse(json);

      expect(parsed.exportMetadata.itemCount).toBe(2);
    });

    it('sets itemCount to 0 when items section not selected', () => {
      const mockData = createMockAppData({
        items: [
          {
            id: createItemId('item-1'),
            name: 'Test Item',
            itemType: 'custom',
            categoryId: createCategoryId('food'),
            quantity: createQuantity(1),
            unit: 'pieces',
            neverExpires: true,
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
          },
        ],
      });

      const json = exportToJSONSelective(mockData, ['household']);
      const parsed = JSON.parse(json);

      expect(parsed.exportMetadata.itemCount).toBe(0);
    });
  });

  describe('parseImportJSON', () => {
    it('parses valid JSON and returns data', () => {
      const testData = {
        version: CURRENT_SCHEMA_VERSION,
        household: {
          adults: 2,
          children: 0,
          supplyDurationDays: 7,
          useFreezer: false,
        },
        lastModified: '2024-01-01T00:00:00.000Z',
      };
      const json = JSON.stringify(testData);
      const result = parseImportJSON(json);

      expect(result.version).toBe(CURRENT_SCHEMA_VERSION);
      expect(result.household).toEqual(testData.household);
    });

    it('throws error for invalid JSON', () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      expect(() => parseImportJSON('invalid json')).toThrow();
      consoleSpy.mockRestore();
    });

    it('throws MigrationError for unsupported version', () => {
      const testData = {
        version: '0.9.0',
        household: {
          adults: 2,
          children: 0,
          supplyDurationDays: 7,
          useFreezer: false,
        },
        lastModified: '2024-01-01T00:00:00.000Z',
      };
      const json = JSON.stringify(testData);

      expect(() => parseImportJSON(json)).toThrow(MigrationError);
    });
  });

  describe('mergeImportData', () => {
    it('merges selected sections only', () => {
      const existing = createMockAppData({
        household: {
          adults: 1,
          children: 0,
          pets: 0,
          supplyDurationDays: 3,
          useFreezer: false,
        },
      });
      const imported: PartialExportData = {
        version: CURRENT_SCHEMA_VERSION,
        exportMetadata: createTestExportMetadata(['household', 'settings']),
        household: {
          adults: 4,
          children: 2,
          pets: 0,
          supplyDurationDays: 14,
          useFreezer: true,
        },
        settings: {
          language: 'fi' as const,
          theme: 'dark' as const,
          highContrast: true,
          advancedFeatures: {
            calorieTracking: true,
            powerManagement: true,
            waterTracking: true,
          },
        },
        lastModified: '2024-01-01T00:00:00.000Z',
      };

      const result = mergeImportData(existing, imported, ['household']);

      expect(result.household).toEqual(imported.household);
      expect(result.settings).toEqual(existing.settings); // Not merged
    });

    it('marks onboarding complete when importing settings', () => {
      const existing = createMockAppData();
      const imported: PartialExportData = {
        version: CURRENT_SCHEMA_VERSION,
        exportMetadata: createTestExportMetadata(['settings']),
        settings: {
          language: 'fi' as const,
          theme: 'dark' as const,
          highContrast: false,
          onboardingCompleted: false,
          advancedFeatures: {
            calorieTracking: false,
            powerManagement: false,
            waterTracking: false,
          },
        },
        lastModified: '2024-01-01T00:00:00.000Z',
      };

      const result = mergeImportData(existing, imported, ['settings']);

      expect(result.settings.onboardingCompleted).toBe(true);
    });

    it('normalizes items with null expirationDate when importing', () => {
      const existing = createMockAppData();
      // Cast to bypass type checking since we're testing handling of legacy null values
      const imported = {
        version: CURRENT_SCHEMA_VERSION,
        exportMetadata: createTestExportMetadata(['items']),
        items: [
          {
            id: createItemId('item-1'),
            name: 'Test Item',
            itemType: 'custom',
            categoryId: createCategoryId('food'),
            quantity: createQuantity(5),
            unit: 'pieces',
            expirationDate: null, // Legacy format used null
            neverExpires: false,
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
          },
        ],
        lastModified: '2024-01-01T00:00:00.000Z',
      } as unknown as PartialExportData;

      const result = mergeImportData(existing, imported, ['items']);

      // When expirationDate is null, it should be converted to undefined and neverExpires set to true
      expect(result.items[0].neverExpires).toBe(true);
      expect(result.items[0].expirationDate).toBeUndefined();
    });

    it('merges customCategories with proper ID casting', () => {
      const existing = createMockAppData();
      const imported: PartialExportData = {
        version: CURRENT_SCHEMA_VERSION,
        exportMetadata: createTestExportMetadata(['customCategories']),
        customCategories: [
          {
            id: createCategoryId('custom-cat-1'),
            name: 'Custom Category',
            isCustom: true,
          },
        ],
        lastModified: '2024-01-01T00:00:00.000Z',
      };

      const result = mergeImportData(existing, imported, ['customCategories']);

      expect(result.customCategories[0].id).toBe('custom-cat-1');
    });

    it('merges customTemplates with proper ID casting', () => {
      const existing = createMockAppData();
      const imported: PartialExportData = {
        version: CURRENT_SCHEMA_VERSION,
        exportMetadata: createTestExportMetadata(['customTemplates']),
        customTemplates: [
          {
            id: createProductTemplateId('custom-template-1'),
            name: 'Custom Template',
            category: createCategoryId('food'),
            isCustom: true,
            isBuiltIn: false,
          },
        ],
        lastModified: '2024-01-01T00:00:00.000Z',
      };

      const result = mergeImportData(existing, imported, ['customTemplates']);

      expect(result.customTemplates[0].id).toBe('custom-template-1');
    });

    it('merges dismissedAlertIds', () => {
      const existing = createMockAppData();
      const imported: PartialExportData = {
        version: CURRENT_SCHEMA_VERSION,
        exportMetadata: createTestExportMetadata(['dismissedAlertIds']),
        dismissedAlertIds: [createAlertId('alert-1'), createAlertId('alert-2')],
        lastModified: '2024-01-01T00:00:00.000Z',
      };

      const result = mergeImportData(existing, imported, ['dismissedAlertIds']);

      expect(result.dismissedAlertIds).toHaveLength(2);
    });

    it('merges disabledRecommendedItems', () => {
      const existing = createMockAppData();
      const imported: PartialExportData = {
        version: CURRENT_SCHEMA_VERSION,
        exportMetadata: createTestExportMetadata(['disabledRecommendedItems']),
        disabledRecommendedItems: [
          createProductTemplateId('rec-1'),
          createProductTemplateId('rec-2'),
        ],
        lastModified: '2024-01-01T00:00:00.000Z',
      };

      const result = mergeImportData(existing, imported, [
        'disabledRecommendedItems',
      ]);

      expect(result.disabledRecommendedItems).toHaveLength(2);
    });

    it('merges customRecommendedItems when defined', () => {
      const existing = createMockAppData({ customRecommendedItems: null });
      const imported: PartialExportData = {
        version: CURRENT_SCHEMA_VERSION,
        exportMetadata: createTestExportMetadata(['customRecommendedItems']),
        customRecommendedItems: {
          meta: {
            name: 'Test Recommendations',
            version: '1.0.0',
            createdAt: '2024-01-01T00:00:00.000Z',
          },
          items: [],
        },
        lastModified: '2024-01-01T00:00:00.000Z',
      };

      const result = mergeImportData(existing, imported, [
        'customRecommendedItems',
      ]);

      expect(result.customRecommendedItems).toBeDefined();
      expect(result.customRecommendedItems?.meta.name).toBe(
        'Test Recommendations',
      );
    });

    it('does not overwrite customRecommendedItems when undefined in import', () => {
      const existingRecs = {
        meta: {
          name: 'Existing Recommendations',
          version: '1.0.0',
          createdAt: '2024-01-01T00:00:00.000Z',
        },
        items: [],
      };
      const existing = createMockAppData({
        customRecommendedItems: existingRecs,
      });
      const imported: PartialExportData = {
        version: CURRENT_SCHEMA_VERSION,
        exportMetadata: createTestExportMetadata([]),
        lastModified: '2024-01-01T00:00:00.000Z',
        // customRecommendedItems is undefined
      };

      const result = mergeImportData(existing, imported, [
        'customRecommendedItems',
      ]);

      expect(result.customRecommendedItems).toEqual(existingRecs);
    });

    it('updates lastModified timestamp', () => {
      const existing = createMockAppData();
      const imported: PartialExportData = {
        version: CURRENT_SCHEMA_VERSION,
        exportMetadata: createTestExportMetadata(['household']),
        household: {
          adults: 2,
          children: 0,
          pets: 0,
          supplyDurationDays: 7,
          useFreezer: false,
        },
        lastModified: '2020-01-01T00:00:00.000Z',
      };

      const beforeMerge = new Date().toISOString();
      const result = mergeImportData(existing, imported, ['household']);
      const afterMerge = new Date().toISOString();

      expect(result.lastModified >= beforeMerge).toBe(true);
      expect(result.lastModified <= afterMerge).toBe(true);
    });
  });
});
