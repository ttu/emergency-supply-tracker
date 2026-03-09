import { describe, it, expect, beforeEach } from 'vitest';
import {
  createDefaultAppData,
  getAppData,
  saveAppData,
  clearAppData,
  exportToJSON,
  importFromJSON,
} from './localStorage';
import {
  createMockAppData,
  createMockCategory,
  createMockHousehold,
} from '@/shared/utils/test/factories';
import { CURRENT_SCHEMA_VERSION } from './migrations';
import { createCategoryId } from '@/shared/types';
import { DEFAULT_KIT_ID } from '@/features/templates/kits';

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
});
