import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createDefaultAppData,
  getAppData,
  saveAppData,
  clearAppData,
  exportToJSON,
  importFromJSON,
  exportToJSONSelective,
  parseImportJSON,
  mergeImportData,
} from './localStorage';
import type {
  ExportSection,
  PartialExportData,
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
} from '@/shared/types';

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
      expect(defaultData.household.children).toBe(0);
      expect(defaultData.household.supplyDurationDays).toBe(7);
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
    expect(loaded).toEqual(mockData);
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

  it('returns undefined when no data exists', () => {
    expect(getAppData()).toBeUndefined();
  });

  it('clears data', () => {
    const mockData = createMockAppData();
    saveAppData(mockData);
    clearAppData();
    expect(getAppData()).toBeUndefined();
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
      expect(imported).toEqual({
        ...mockData,
        settings: { ...mockData.settings, onboardingCompleted: true },
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
        'Failed to parse JSON from localStorage:',
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
      localStorage.setItem(
        'emergencySupplyTracker',
        JSON.stringify(unsupportedData),
      );

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

      // Create data that needs migration but will fail
      const oldData = createMockAppData({ version: '1.0.0' });
      localStorage.setItem('emergencySupplyTracker', JSON.stringify(oldData));

      // Import migrations module and mock functions
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

      // Should return the unmigrated data
      expect(result).toBeDefined();
      expect(result?.version).toBe('1.0.0');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(
          /Migration failed from .* to .*: Migration failed/,
        ),
      );

      needsMigrationSpy.mockRestore();
      migrateSpy.mockRestore();
      consoleSpy.mockRestore();
    });

    it('handles migration failure with generic error in getAppData', async () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const oldData = createMockAppData({ version: '1.0.0' });
      localStorage.setItem('emergencySupplyTracker', JSON.stringify(oldData));

      // Import migrations module and mock functions
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

      // Should return the unmigrated data
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
            quantity: 5,
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
            quantity: 1,
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
            quantity: 2,
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
            quantity: 1,
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
            quantity: 5,
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
