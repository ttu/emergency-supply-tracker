import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  getAppData,
  saveAppData,
  clearAppData,
  exportToJSON,
  importFromJSON,
} from './localStorage';
import {
  createMockAppData,
  createMockCategory,
} from '@/shared/utils/test/factories';

describe('localStorage utilities', () => {
  beforeEach(() => {
    clearAppData();
  });

  it('saves and loads data', () => {
    const mockData = createMockAppData();
    saveAppData(mockData);
    const loaded = getAppData();
    expect(loaded).toEqual(mockData);
  });

  it('returns null when no data exists', () => {
    expect(getAppData()).toBeNull();
  });

  it('clears data', () => {
    const mockData = createMockAppData();
    saveAppData(mockData);
    clearAppData();
    expect(getAppData()).toBeNull();
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
        customCategories: [createMockCategory({ id: 'custom-1' })],
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
        customCategories: [createMockCategory({ id: 'custom-1' })],
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

    it('imports data from legacy format with categories field', () => {
      const mockData = createMockAppData();
      const legacyData = {
        version: mockData.version,
        household: mockData.household,
        settings: mockData.settings,
        categories: [createMockCategory({ id: 'custom-1' })],
        items: mockData.items,
        customTemplates: mockData.customTemplates,
        lastModified: mockData.lastModified,
      };
      const json = JSON.stringify(legacyData);
      const imported = importFromJSON(json);

      // Should initialize customCategories even if old format has categories
      expect(imported.customCategories).toEqual([]);
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
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      expect(() => importFromJSON(invalidJson)).toThrow();
      consoleSpy.mockRestore();
    });

    it('sets neverExpires to true when expirationDate is null', () => {
      const dataWithNullExpiration = {
        version: '1.0.0',
        household: { adults: 2, children: 0, supplyDurationDays: 3 },
        settings: { language: 'en', theme: 'light', highContrast: false },
        items: [
          {
            id: 'item-1',
            name: 'Test Item',
            categoryId: 'water',
            quantity: 5,
            unit: 'liters',
            expirationDate: null,
            neverExpires: false,
          },
          {
            id: 'item-2',
            name: 'Test Item 2',
            categoryId: 'food',
            quantity: 3,
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

    it('migrates legacy English translated itemType to template ID', () => {
      const dataWithLegacyItemType = {
        version: '1.0.0',
        household: { adults: 2, children: 0, supplyDurationDays: 3 },
        settings: { language: 'en', theme: 'light', highContrast: false },
        items: [
          {
            id: 'item-1',
            name: 'My Water',
            itemType: 'Bottled Water', // Legacy translated name
            categoryId: 'water-beverages',
            quantity: 5,
            unit: 'liters',
            neverExpires: true,
          },
        ],
        lastModified: new Date().toISOString(),
      };
      const json = JSON.stringify(dataWithLegacyItemType);
      const imported = importFromJSON(json);

      expect(imported.items[0].itemType).toBe('bottled-water');
    });

    it('migrates legacy Finnish translated itemType to template ID', () => {
      const dataWithLegacyItemType = {
        version: '1.0.0',
        household: { adults: 2, children: 0, supplyDurationDays: 3 },
        settings: { language: 'fi', theme: 'light', highContrast: false },
        items: [
          {
            id: 'item-1',
            name: 'Vesi',
            itemType: 'Pullovesi', // Legacy Finnish translated name
            categoryId: 'water-beverages',
            quantity: 5,
            unit: 'liters',
            neverExpires: true,
          },
        ],
        lastModified: new Date().toISOString(),
      };
      const json = JSON.stringify(dataWithLegacyItemType);
      const imported = importFromJSON(json);

      expect(imported.items[0].itemType).toBe('bottled-water');
    });

    it('preserves valid template ID in itemType', () => {
      const dataWithTemplateId = {
        version: '1.0.0',
        household: { adults: 2, children: 0, supplyDurationDays: 3 },
        settings: { language: 'en', theme: 'light', highContrast: false },
        items: [
          {
            id: 'item-1',
            name: 'Water',
            itemType: 'bottled-water', // Already a valid template ID
            categoryId: 'water-beverages',
            quantity: 5,
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

    it('sets itemType to custom when no match found', () => {
      const dataWithUnknownItemType = {
        version: '1.0.0',
        household: { adults: 2, children: 0, supplyDurationDays: 3 },
        settings: { language: 'en', theme: 'light', highContrast: false },
        items: [
          {
            id: 'item-1',
            name: 'My Custom Thing',
            itemType: 'Unknown Item Type',
            categoryId: 'food',
            quantity: 3,
            unit: 'pieces',
            neverExpires: true,
          },
        ],
        lastModified: new Date().toISOString(),
      };
      const json = JSON.stringify(dataWithUnknownItemType);
      const imported = importFromJSON(json);

      expect(imported.items[0].itemType).toBe('custom');
    });

    it('uses item name to find template ID when itemType is missing', () => {
      const dataWithNoItemType = {
        version: '1.0.0',
        household: { adults: 2, children: 0, supplyDurationDays: 3 },
        settings: { language: 'en', theme: 'light', highContrast: false },
        items: [
          {
            id: 'item-1',
            name: 'Canned Soup', // Name matches a known product
            categoryId: 'food',
            quantity: 3,
            unit: 'cans',
            neverExpires: false,
            expirationDate: '2025-12-31',
          },
        ],
        lastModified: new Date().toISOString(),
      };
      const json = JSON.stringify(dataWithNoItemType);
      const imported = importFromJSON(json);

      expect(imported.items[0].itemType).toBe('canned-soup');
    });
  });
});
