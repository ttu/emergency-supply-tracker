import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createDefaultAppData,
  createDefaultRootStorage,
  getAppData,
  saveAppData,
  clearAppData,
  getInventorySetList,
  getActiveInventorySetId,
  setActiveInventorySetId,
  createInventorySet,
  deleteInventorySet,
  renameInventorySet,
  DEFAULT_INVENTORY_SET_ID,
  exportToJSON,
  importFromJSON,
  exportToJSONSelective,
  parseImportJSON,
  mergeImportData,
  STORAGE_KEY,
} from './localStorage';
import type {
  ExportSection,
  PartialExportData,
  MultiInventoryExportData,
} from '@/shared/types/exportImport';
import {
  createMockAppData,
  createMockCategory,
  createMockHousehold,
} from '@/shared/utils/test/factories';
import { CURRENT_SCHEMA_VERSION, MigrationError } from './migrations';
import {
  createCategoryId,
  createItemId,
  createProductTemplateId,
  createAlertId,
  createQuantity,
} from '@/shared/types';
import { DEFAULT_KIT_ID } from '@/features/templates/kits';

// Helper to create minimal export metadata for tests
const createTestExportMetadata = (
  sections: string[] = [],
): PartialExportData['exportMetadata'] => ({
  exportedAt: '2024-01-01T00:00:00.000Z',
  appVersion: CURRENT_SCHEMA_VERSION,
  itemCount: 0,
  categoryCount: 0,
  includedSections:
    sections as PartialExportData['exportMetadata']['includedSections'],
});

describe('localStorage utilities', () => {
  beforeEach(() => {
    clearAppData();
  });

  describe('createDefaultAppData', () => {
    it('creates default app data with correct structure', () => {
      const defaultData = createDefaultAppData();

      expect(defaultData.version).toBe(CURRENT_SCHEMA_VERSION);
      expect(defaultData.household).toBeDefined();
      expect(defaultData.household.adults).toBe(2);
      expect(defaultData.household.children).toBe(3);
      expect(defaultData.household.supplyDurationDays).toBe(3);
      expect(defaultData.household.useFreezer).toBe(false);
      expect(defaultData.settings).toBeDefined();
      expect(defaultData.customCategories).toEqual([]);
      expect(defaultData.items).toEqual([]);
      expect(defaultData.customTemplates).toEqual([]);
      expect(defaultData.dismissedAlertIds).toEqual([]);
      expect(defaultData.disabledRecommendedItems).toEqual([]);
      expect(defaultData.lastModified).toBeDefined();
      expect(typeof defaultData.lastModified).toBe('string');
    });

    it('creates valid ISO date string for lastModified', () => {
      const defaultData = createDefaultAppData();
      const date = new Date(defaultData.lastModified);
      expect(date.toISOString()).toBe(defaultData.lastModified);
      expect(date.getTime()).not.toBeNaN();
    });
  });

  it('saves and loads data', () => {
    const mockData = createMockAppData();
    saveAppData(mockData);
    const loaded = getAppData();
    // Normalization adds selectedRecommendationKit and uploadedRecommendationKits if missing
    const expectedData = {
      ...mockData,
      selectedRecommendationKit:
        mockData.selectedRecommendationKit ?? DEFAULT_KIT_ID,
      uploadedRecommendationKits: mockData.uploadedRecommendationKits ?? [],
    };
    expect(loaded).toEqual(expectedData);
  });

  it('handles data with empty customCategories array', () => {
    const mockData = createMockAppData({
      customCategories: [],
    });
    saveAppData(mockData);
    const loaded = getAppData();
    expect(loaded?.customCategories).toEqual([]);
  });

  it('handles data with customCategories that need ID casting', () => {
    const mockData = createMockAppData({
      customCategories: [
        createMockCategory({ id: createCategoryId('test-cat-1') }),
        createMockCategory({ id: createCategoryId('test-cat-2') }),
      ],
    });
    saveAppData(mockData);
    const loaded = getAppData();
    expect(loaded?.customCategories).toHaveLength(2);
    expect(loaded?.customCategories[0].id).toBe('test-cat-1');
    expect(loaded?.customCategories[1].id).toBe('test-cat-2');
  });

  it('creates and returns default app data when no data exists', () => {
    const result = getAppData();
    expect(result).toBeDefined();
    expect(result?.version).toBe(CURRENT_SCHEMA_VERSION);
    expect(result?.household).toBeDefined();
    expect(result?.items).toEqual([]);
  });

  it('clears data; next getAppData creates default inventory set', () => {
    const mockData = createMockAppData();
    saveAppData(mockData);
    clearAppData();
    const result = getAppData();
    expect(result).toBeDefined();
    expect(result?.version).toBe(CURRENT_SCHEMA_VERSION);
    expect(result?.items).toEqual([]);
  });

  describe('import/export', () => {
    it('exports data to JSON with export metadata', () => {
      const mockData = createMockAppData();
      const json = exportToJSON(mockData);
      const parsed = JSON.parse(json);

      // Verify all original data is present
      expect(parsed.version).toBe(mockData.version);
      expect(parsed.household).toEqual(mockData.household);
      expect(parsed.settings).toEqual(mockData.settings);
      expect(parsed.items).toEqual(mockData.items);

      // Verify export metadata is included
      expect(parsed.exportMetadata).toBeDefined();
      expect(parsed.exportMetadata.exportedAt).toBeDefined();
      expect(typeof parsed.exportMetadata.exportedAt).toBe('string');
      expect(parsed.exportMetadata.appVersion).toBeDefined();
      expect(typeof parsed.exportMetadata.appVersion).toBe('string');
      expect(parsed.exportMetadata.itemCount).toBe(mockData.items?.length ?? 0);
      expect(parsed.exportMetadata.categoryCount).toBeGreaterThanOrEqual(9); // At least standard categories

      // Verify exportedAt is a valid ISO date
      const exportedDate = new Date(parsed.exportMetadata.exportedAt);
      expect(exportedDate.toISOString()).toBe(parsed.exportMetadata.exportedAt);
    });

    it('imports data from JSON with customCategories', () => {
      const mockData = createMockAppData({
        customCategories: [
          createMockCategory({ id: createCategoryId('custom-1') }),
        ],
      });
      const json = JSON.stringify(mockData);
      const imported = importFromJSON(json);
      // onboardingCompleted is always set to true on import
      // Kit fields are initialized with defaults if absent
      expect(imported).toEqual({
        ...mockData,
        settings: { ...mockData.settings, onboardingCompleted: true },
        selectedRecommendationKit: '72tuntia-standard',
        uploadedRecommendationKits: [],
      });
    });

    it('imports data from exported JSON with exportMetadata', () => {
      const mockData = createMockAppData({
        customCategories: [
          createMockCategory({ id: createCategoryId('custom-1') }),
        ],
      });
      // Export the data (which adds exportMetadata)
      const exportedJson = exportToJSON(mockData);
      // Import should work and ignore exportMetadata
      const imported = importFromJSON(exportedJson);

      // Verify data is imported correctly (exportMetadata should be ignored)
      expect(imported.version).toBe(mockData.version);
      expect(imported.household).toEqual(mockData.household);
      expect(imported.settings.onboardingCompleted).toBe(true);
      expect(imported.customCategories).toEqual(mockData.customCategories);
      expect(imported.items).toEqual(mockData.items);
    });

    it('imports data from JSON without customCategories field', () => {
      const mockData = createMockAppData();
      const dataWithoutCustomCategories = {
        version: mockData.version,
        household: mockData.household,
        settings: mockData.settings,
        items: mockData.items,
        customTemplates: mockData.customTemplates,
        lastModified: mockData.lastModified,
      };
      const json = JSON.stringify(dataWithoutCustomCategories);
      const imported = importFromJSON(json);

      expect(imported.customCategories).toEqual([]);
      expect(imported.version).toBe(mockData.version);
      expect(imported.household).toEqual(mockData.household);
    });

    it('ensures customTemplates exists when missing', () => {
      const mockData = createMockAppData();
      const dataWithoutTemplates = {
        version: mockData.version,
        household: mockData.household,
        settings: mockData.settings,
        customCategories: [],
        items: mockData.items,
        lastModified: mockData.lastModified,
      };
      const json = JSON.stringify(dataWithoutTemplates);
      const imported = importFromJSON(json);

      expect(imported.customTemplates).toEqual([]);
    });

    it('sets onboardingCompleted to true when settings exist', () => {
      const mockData = createMockAppData({
        settings: {
          language: 'en',
          theme: 'light',
          highContrast: false,
          advancedFeatures: {
            calorieTracking: false,
            powerManagement: false,
            waterTracking: false,
          },
          onboardingCompleted: false,
        },
      });
      const json = JSON.stringify(mockData);
      const imported = importFromJSON(json);

      expect(imported.settings.onboardingCompleted).toBe(true);
    });

    it('sets onboardingCompleted to true even when not present in imported data', () => {
      const mockData = createMockAppData();
      const dataWithoutOnboarding = {
        version: mockData.version,
        household: mockData.household,
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
        items: mockData.items,
        lastModified: mockData.lastModified,
      };
      const json = JSON.stringify(dataWithoutOnboarding);
      const imported = importFromJSON(json);

      expect(imported.settings.onboardingCompleted).toBe(true);
    });

    it('throws error for invalid JSON', () => {
      const invalidJson = '{ invalid json }';
      // Suppress console.error for this expected error
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      expect(() => importFromJSON(invalidJson)).toThrow();
      consoleSpy.mockRestore();
    });

    it('sets neverExpires to true when expirationDate is null', () => {
      const dataWithNullExpiration = {
        version: CURRENT_SCHEMA_VERSION,
        household: createMockHousehold({ children: 0 }),
        settings: { language: 'en', theme: 'light', highContrast: false },
        items: [
          {
            id: 'item-1',
            name: 'Test Item',
            categoryId: 'water',
            quantity: 1,
            unit: 'liters',
            expirationDate: null,
            neverExpires: false,
          },
          {
            id: 'item-2',
            name: 'Test Item 2',
            categoryId: 'food',
            quantity: 1,
            unit: 'pieces',
            expirationDate: '2025-12-31',
            neverExpires: false,
          },
        ],
        lastModified: new Date().toISOString(),
      };
      const json = JSON.stringify(dataWithNullExpiration);
      const imported = importFromJSON(json);

      // Item with null expirationDate should have neverExpires set to true
      expect(imported.items[0].neverExpires).toBe(true);
      // Item with valid expirationDate should keep original neverExpires value
      expect(imported.items[1].neverExpires).toBe(false);
    });

    it('preserves valid template ID in itemType', () => {
      const dataWithTemplateId = {
        version: CURRENT_SCHEMA_VERSION,
        household: createMockHousehold({ children: 0 }),
        settings: { language: 'en', theme: 'light', highContrast: false },
        items: [
          {
            id: 'item-1',
            name: 'Water',
            itemType: 'bottled-water', // Already a valid template ID
            categoryId: 'water-beverages',
            quantity: 1,
            unit: 'liters',
            neverExpires: true,
          },
        ],
        lastModified: new Date().toISOString(),
      };
      const json = JSON.stringify(dataWithTemplateId);
      const imported = importFromJSON(json);

      expect(imported.items[0].itemType).toBe('bottled-water');
    });

    it('sets itemType to custom when invalid template ID is provided', () => {
      const dataWithInvalidItemType = {
        version: CURRENT_SCHEMA_VERSION,
        household: createMockHousehold({ children: 0 }),
        settings: { language: 'en', theme: 'light', highContrast: false },
        items: [
          {
            id: 'item-1',
            name: 'My Custom Thing',
            itemType: 'Invalid Item Type', // Not a valid kebab-case template ID
            categoryId: 'food',
            quantity: 1,
            unit: 'pieces',
            neverExpires: true,
          },
        ],
        lastModified: new Date().toISOString(),
      };
      const json = JSON.stringify(dataWithInvalidItemType);
      const imported = importFromJSON(json);

      expect(imported.items[0].itemType).toBe('custom');
    });

    it('sets itemType to custom when itemType is missing', () => {
      const dataWithNoItemType = {
        version: CURRENT_SCHEMA_VERSION,
        household: createMockHousehold({ children: 0 }),
        settings: { language: 'en', theme: 'light', highContrast: false },
        items: [
          {
            id: 'item-1',
            name: 'Custom Item',
            categoryId: 'food',
            quantity: 1,
            unit: 'cans',
            neverExpires: false,
            expirationDate: '2025-12-31',
          },
        ],
        lastModified: new Date().toISOString(),
      };
      const json = JSON.stringify(dataWithNoItemType);
      const imported = importFromJSON(json);

      expect(imported.items[0].itemType).toBe('custom');
    });

    it('maps customCategories and customTemplates with createCategoryId and createProductTemplateId', () => {
      const dataWithCustoms = {
        version: CURRENT_SCHEMA_VERSION,
        household: createMockHousehold({ children: 0 }),
        settings: { language: 'en', theme: 'light', highContrast: false },
        customCategories: [
          { id: 'custom-cat-1', name: 'Custom Category 1', isCustom: true },
        ],
        customTemplates: [
          {
            id: 'custom-template-1',
            name: 'Custom Template 1',
            category: 'food',
            isCustom: true,
          },
        ],
        items: [],
        lastModified: new Date().toISOString(),
      };
      const json = JSON.stringify(dataWithCustoms);
      const imported = importFromJSON(json);

      // Verify IDs are properly converted using branded types
      expect(imported.customCategories[0].id).toBe('custom-cat-1');
      expect(imported.customTemplates[0].id).toBe('custom-template-1');
    });
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

  describe('inventory set API', () => {
    beforeEach(() => {
      clearAppData();
    });

    it('getInventorySetList returns default inventory set after getAppData', () => {
      getAppData(); // bootstrap default root
      const list = getInventorySetList();
      expect(list).toHaveLength(1);
      expect(list[0].id).toBe(DEFAULT_INVENTORY_SET_ID);
      expect(list[0].name).toBe('Default');
    });

    it('getActiveInventorySetId returns default after bootstrap', () => {
      getAppData();
      expect(getActiveInventorySetId()).toBe(DEFAULT_INVENTORY_SET_ID);
    });

    it('createInventorySet adds a new inventory set', () => {
      getAppData();
      const id = createInventorySet('Car kit');
      const list = getInventorySetList();
      expect(list).toHaveLength(2);
      expect(list.find((w) => w.id === id)?.name).toBe('Car kit');
    });

    it('setActiveInventorySetId switches active inventory set', () => {
      getAppData();
      const id = createInventorySet('Car kit');
      setActiveInventorySetId(id);
      expect(getActiveInventorySetId()).toBe(id);
      const data = getAppData();
      expect(data).toBeDefined();
      expect(data?.household).toBeDefined();
    });

    it('renameInventorySet updates inventory set name', () => {
      getAppData();
      const id = createInventorySet('Car kit');
      renameInventorySet(id, 'Vehicle emergency');
      const list = getInventorySetList();
      expect(list.find((w) => w.id === id)?.name).toBe('Vehicle emergency');
    });

    it('deleteInventorySet removes inventory set and switches active when needed', () => {
      getAppData();
      const id = createInventorySet('Car kit');
      setActiveInventorySetId(id);
      deleteInventorySet(id);
      expect(getInventorySetList()).toHaveLength(1);
      expect(getActiveInventorySetId()).toBe(DEFAULT_INVENTORY_SET_ID);
    });

    it('deleteInventorySet does nothing when only one inventory set', () => {
      getAppData();
      const listBefore = getInventorySetList();
      deleteInventorySet(DEFAULT_INVENTORY_SET_ID);
      expect(getInventorySetList()).toEqual(listBefore);
    });

    it('getInventorySetList returns empty array when storage throws', () => {
      const getItem = localStorage.getItem.bind(localStorage);
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => {
        if (key === STORAGE_KEY) throw new Error('Storage unavailable');
        return getItem(key);
      });
      expect(getInventorySetList()).toEqual([]);
      vi.restoreAllMocks();
    });

    it('setActiveInventorySetId does not throw when setItem throws', () => {
      getAppData();
      const id = createInventorySet('Car kit');
      const setItem = localStorage.setItem.bind(localStorage);
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(
        (key, value) => {
          if (key === STORAGE_KEY) throw new Error('QuotaExceededError');
          return setItem(key, value);
        },
      );
      expect(() => setActiveInventorySetId(id)).not.toThrow();
      vi.restoreAllMocks();
    });
  });
});
