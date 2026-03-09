import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
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
  mergeImportData,
  STORAGE_KEY,
  isTemplateId,
  getLastDataValidationResult,
  clearDataValidationResult,
} from './localStorage';
import type {
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
import { createTestExportMetadata } from './__helpers__/localStorage.helpers';

describe('localStorage utilities', () => {
  beforeEach(() => {
    clearAppData();
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

  describe('isTemplateId', () => {
    it('returns true for valid kebab-case template IDs', () => {
      expect(isTemplateId('bottled-water')).toBe(true);
      expect(isTemplateId('water')).toBe(true);
      expect(isTemplateId('canned-food-2')).toBe(true);
      expect(isTemplateId('a1b2')).toBe(true);
    });

    it('returns false for invalid template IDs', () => {
      expect(isTemplateId('Invalid Item Type')).toBe(false);
      expect(isTemplateId('UPPERCASE')).toBe(false);
      expect(isTemplateId('has_underscore')).toBe(false);
      expect(isTemplateId('-leading-dash')).toBe(false);
      expect(isTemplateId('trailing-dash-')).toBe(false);
      expect(isTemplateId('')).toBe(false);
    });
  });

  describe('getLastDataValidationResult and clearDataValidationResult', () => {
    afterEach(() => {
      vi.restoreAllMocks();
      clearDataValidationResult();
    });

    it('returns null when no validation has been performed', () => {
      clearDataValidationResult();
      expect(getLastDataValidationResult()).toBeNull();
    });

    it('returns null after valid data is loaded', () => {
      getAppData(); // loads valid default data
      expect(getLastDataValidationResult()).toBeNull();
    });

    it('stores validation result when data validation fails', async () => {
      const validation = await import('../validation/appDataValidation');
      const spy = vi
        .spyOn(validation, 'validateAppDataValues')
        .mockReturnValue({
          isValid: false,
          errors: [{ field: 'quantity', message: 'quantity out of range' }],
        });
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      getAppData(); // triggers validation failure
      const result = getLastDataValidationResult();

      expect(result).not.toBeNull();
      expect(result?.isValid).toBe(false);
      expect(result?.errors).toContainEqual({
        field: 'quantity',
        message: 'quantity out of range',
      });

      spy.mockRestore();
      consoleSpy.mockRestore();
    });

    it('clears validation result after clearDataValidationResult', async () => {
      const validation = await import('../validation/appDataValidation');
      const spy = vi
        .spyOn(validation, 'validateAppDataValues')
        .mockReturnValue({
          isValid: false,
          errors: [{ field: 'test', message: 'some error' }],
        });
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      getAppData();
      expect(getLastDataValidationResult()).not.toBeNull();

      clearDataValidationResult();
      expect(getLastDataValidationResult()).toBeNull();

      spy.mockRestore();
      consoleSpy.mockRestore();
    });
  });

  describe('getRootStorage edge cases', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('returns undefined when stored value is not an object', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify('a plain string'));
      const result = getAppData();
      // Non-object stored value -> getRootStorage returns undefined -> creates default
      expect(result).toBeDefined(); // creates default
    });

    it('returns undefined when stored object lacks inventorySets', () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ version: '1.0.0', something: 'else' }),
      );
      const result = getAppData();
      // Missing inventorySets -> getRootStorage returns undefined -> creates default
      expect(result).toBeDefined(); // creates default
    });

    it('returns undefined from getAppData when active inventory set is missing', () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const root = createDefaultRootStorage();
      // Set active ID to a non-existent set
      root.activeInventorySetId =
        'nonexistent' as typeof DEFAULT_INVENTORY_SET_ID;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(root));

      const result = getAppData();
      expect(result).toBeUndefined();
      consoleSpy.mockRestore();
    });
  });

  describe('setActiveInventorySetId edge cases', () => {
    it('does nothing when root storage is empty', () => {
      // No data in storage
      setActiveInventorySetId(DEFAULT_INVENTORY_SET_ID);
      // Should not throw and storage remains empty
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it('does nothing when inventory set ID does not exist in root', () => {
      getAppData();
      const before = getActiveInventorySetId();
      setActiveInventorySetId(
        'nonexistent-id' as typeof DEFAULT_INVENTORY_SET_ID,
      );
      const after = getActiveInventorySetId();
      // Active ID should remain unchanged
      expect(after).toBe(before);
    });
  });

  describe('renameInventorySet edge cases', () => {
    it('keeps existing name when empty string is provided', () => {
      getAppData();
      const id = createInventorySet('My Inventory');
      renameInventorySet(id, '');
      const list = getInventorySetList();
      const found = list.find((w) => w.id === id);
      expect(found?.name).toBe('My Inventory');
    });

    it('keeps existing name when whitespace-only string is provided', () => {
      getAppData();
      const id = createInventorySet('My Inventory');
      renameInventorySet(id, '   ');
      const list = getInventorySetList();
      const found = list.find((w) => w.id === id);
      expect(found?.name).toBe('My Inventory');
    });

    it('does nothing when inventory set does not exist', () => {
      getAppData();
      const listBefore = getInventorySetList();
      renameInventorySet(
        'nonexistent' as typeof DEFAULT_INVENTORY_SET_ID,
        'New Name',
      );
      expect(getInventorySetList()).toEqual(listBefore);
    });

    it('does nothing when root storage is empty', () => {
      renameInventorySet(DEFAULT_INVENTORY_SET_ID, 'New Name');
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });
  });

  describe('createInventorySet edge cases', () => {
    it('uses default name when empty string is provided', () => {
      getAppData();
      const id = createInventorySet('');
      const list = getInventorySetList();
      const found = list.find((w) => w.id === id);
      expect(found?.name).toBe('Inventory Set');
    });

    it('uses default name when whitespace-only string is provided', () => {
      getAppData();
      const id = createInventorySet('   ');
      const list = getInventorySetList();
      const found = list.find((w) => w.id === id);
      expect(found?.name).toBe('Inventory Set');
    });
  });

  describe('deleteInventorySet edge cases', () => {
    it('does not change active ID when deleted set was not active', () => {
      getAppData();
      const id2 = createInventorySet('Second');
      // Active is still DEFAULT, delete the non-active one
      deleteInventorySet(id2);
      expect(getInventorySetList()).toHaveLength(1);
      expect(getActiveInventorySetId()).toBe(DEFAULT_INVENTORY_SET_ID);
    });
  });

  describe('importFromJSON edge cases', () => {
    it('initializes dismissedAlertIds to empty array when absent', () => {
      const data = {
        version: CURRENT_SCHEMA_VERSION,
        household: createMockHousehold({ children: 0 }),
        settings: { language: 'en', theme: 'light', highContrast: false },
        items: [],
        // dismissedAlertIds intentionally absent
        lastModified: new Date().toISOString(),
      };
      const imported = importFromJSON(JSON.stringify(data));
      expect(imported.dismissedAlertIds).toEqual([]);
    });

    it('casts dismissedAlertIds to branded types when present', () => {
      const data = {
        version: CURRENT_SCHEMA_VERSION,
        household: createMockHousehold({ children: 0 }),
        settings: { language: 'en', theme: 'light', highContrast: false },
        items: [],
        dismissedAlertIds: ['alert-a', 'alert-b'],
        lastModified: new Date().toISOString(),
      };
      const imported = importFromJSON(JSON.stringify(data));
      expect(imported.dismissedAlertIds).toHaveLength(2);
      expect(imported.dismissedAlertIds[0]).toBe('alert-a');
      expect(imported.dismissedAlertIds[1]).toBe('alert-b');
    });

    it('initializes disabledRecommendedItems to empty array when absent', () => {
      const data = {
        version: CURRENT_SCHEMA_VERSION,
        household: createMockHousehold({ children: 0 }),
        settings: { language: 'en', theme: 'light', highContrast: false },
        items: [],
        // disabledRecommendedItems intentionally absent
        lastModified: new Date().toISOString(),
      };
      const imported = importFromJSON(JSON.stringify(data));
      expect(imported.disabledRecommendedItems).toEqual([]);
    });

    it('casts disabledRecommendedItems to branded types when present', () => {
      const data = {
        version: CURRENT_SCHEMA_VERSION,
        household: createMockHousehold({ children: 0 }),
        settings: { language: 'en', theme: 'light', highContrast: false },
        items: [],
        disabledRecommendedItems: ['item-template-1', 'item-template-2'],
        lastModified: new Date().toISOString(),
      };
      const imported = importFromJSON(JSON.stringify(data));
      expect(imported.disabledRecommendedItems).toHaveLength(2);
      expect(imported.disabledRecommendedItems[0]).toBe('item-template-1');
    });

    it('uses default kit when selectedRecommendationKit is absent', () => {
      const data = {
        version: CURRENT_SCHEMA_VERSION,
        household: createMockHousehold({ children: 0 }),
        settings: { language: 'en', theme: 'light', highContrast: false },
        items: [],
        lastModified: new Date().toISOString(),
      };
      const imported = importFromJSON(JSON.stringify(data));
      expect(imported.selectedRecommendationKit).toBe(DEFAULT_KIT_ID);
    });

    it('preserves selectedRecommendationKit when present', () => {
      const data = {
        version: CURRENT_SCHEMA_VERSION,
        household: createMockHousehold({ children: 0 }),
        settings: { language: 'en', theme: 'light', highContrast: false },
        items: [],
        selectedRecommendationKit: 'custom-kit-id',
        lastModified: new Date().toISOString(),
      };
      const imported = importFromJSON(JSON.stringify(data));
      expect(imported.selectedRecommendationKit).toBe('custom-kit-id');
    });

    it('initializes uploadedRecommendationKits to empty array when absent', () => {
      const data = {
        version: CURRENT_SCHEMA_VERSION,
        household: createMockHousehold({ children: 0 }),
        settings: { language: 'en', theme: 'light', highContrast: false },
        items: [],
        lastModified: new Date().toISOString(),
      };
      const imported = importFromJSON(JSON.stringify(data));
      expect(imported.uploadedRecommendationKits).toEqual([]);
    });

    it('does not touch neverExpires when expirationDate is not null', () => {
      const data = {
        version: CURRENT_SCHEMA_VERSION,
        household: createMockHousehold({ children: 0 }),
        settings: { language: 'en', theme: 'light', highContrast: false },
        items: [
          {
            id: 'item-1',
            name: 'With date',
            categoryId: 'food',
            quantity: 1,
            unit: 'pieces',
            expirationDate: '2026-12-31',
            neverExpires: false,
          },
          {
            id: 'item-2',
            name: 'No date never expires',
            categoryId: 'food',
            quantity: 1,
            unit: 'pieces',
            expirationDate: undefined,
            neverExpires: true,
          },
        ],
        lastModified: new Date().toISOString(),
      };
      const imported = importFromJSON(JSON.stringify(data));
      // Non-null expirationDate: neverExpires should stay false
      expect(imported.items[0].neverExpires).toBe(false);
      expect(imported.items[0].expirationDate).toBe('2026-12-31');
      // undefined expirationDate: neverExpires should stay true
      expect(imported.items[1].neverExpires).toBe(true);
    });

    it('does not set onboardingCompleted when settings is absent', () => {
      const data = {
        version: CURRENT_SCHEMA_VERSION,
        household: createMockHousehold({ children: 0 }),
        items: [],
        lastModified: new Date().toISOString(),
        // no settings field
      };
      // Should not throw
      const imported = importFromJSON(JSON.stringify(data));
      // settings should be undefined or missing; no crash
      expect(imported.settings).toBeUndefined();
    });

    it('handles import without items field', () => {
      const data = {
        version: CURRENT_SCHEMA_VERSION,
        household: createMockHousehold({ children: 0 }),
        settings: { language: 'en', theme: 'light', highContrast: false },
        lastModified: new Date().toISOString(),
      };
      const imported = importFromJSON(JSON.stringify(data));
      // items should be undefined (not normalized when absent)
      expect(imported.items).toBeUndefined();
    });
  });

  describe('exportToJSONSelective section logic', () => {
    it('includes customCategories count in categoryCount when section selected', () => {
      const mockData = createMockAppData({
        customCategories: [
          createMockCategory({ id: createCategoryId('c1') }),
          createMockCategory({ id: createCategoryId('c2') }),
        ],
      });
      const json = exportToJSONSelective(mockData, ['customCategories']);
      const parsed = JSON.parse(json);
      // categoryCount = customCategories.length + STANDARD_CATEGORIES.length
      expect(parsed.exportMetadata.categoryCount).toBeGreaterThan(2);
      expect(parsed.customCategories).toHaveLength(2);
    });

    it('uses only standard category count when customCategories not selected', () => {
      const mockData = createMockAppData({
        customCategories: [
          createMockCategory({ id: createCategoryId('c1') }),
          createMockCategory({ id: createCategoryId('c2') }),
        ],
      });
      const jsonWithout = exportToJSONSelective(mockData, ['items']);
      const parsedWithout = JSON.parse(jsonWithout);
      const jsonWith = exportToJSONSelective(mockData, [
        'items',
        'customCategories',
      ]);
      const parsedWith = JSON.parse(jsonWith);
      // With customCategories: higher count; without: just standard categories
      expect(parsedWith.exportMetadata.categoryCount).toBeGreaterThan(
        parsedWithout.exportMetadata.categoryCount,
      );
    });

    it('includes customRecommendedItems when that section is selected', () => {
      const mockData = createMockAppData({
        customRecommendedItems: {
          meta: { name: 'Test', version: '1.0', createdAt: '2024-01-01' },
          items: [],
        },
      });
      const json = exportToJSONSelective(mockData, ['customRecommendedItems']);
      const parsed = JSON.parse(json);
      expect(parsed.customRecommendedItems).toBeDefined();
      expect(parsed.customRecommendedItems.meta.name).toBe('Test');
    });

    it('excludes customRecommendedItems when that section is not selected', () => {
      const mockData = createMockAppData({
        customRecommendedItems: {
          meta: { name: 'Test', version: '1.0', createdAt: '2024-01-01' },
          items: [],
        },
      });
      const json = exportToJSONSelective(mockData, ['items']);
      const parsed = JSON.parse(json);
      expect(parsed.customRecommendedItems).toBeUndefined();
    });

    it('includes dismissedAlertIds only when selected', () => {
      const mockData = createMockAppData({
        dismissedAlertIds: [createAlertId('alert-x')],
      });
      const jsonWith = exportToJSONSelective(mockData, ['dismissedAlertIds']);
      const parsedWith = JSON.parse(jsonWith);
      expect(parsedWith.dismissedAlertIds).toHaveLength(1);

      const jsonWithout = exportToJSONSelective(mockData, ['items']);
      const parsedWithout = JSON.parse(jsonWithout);
      expect(parsedWithout.dismissedAlertIds).toBeUndefined();
    });

    it('includes disabledRecommendedItems only when selected', () => {
      const mockData = createMockAppData({
        disabledRecommendedItems: [createProductTemplateId('tmpl-1')],
      });
      const jsonWith = exportToJSONSelective(mockData, [
        'disabledRecommendedItems',
      ]);
      const parsedWith = JSON.parse(jsonWith);
      expect(parsedWith.disabledRecommendedItems).toHaveLength(1);

      const jsonWithout = exportToJSONSelective(mockData, ['items']);
      const parsedWithout = JSON.parse(jsonWithout);
      expect(parsedWithout.disabledRecommendedItems).toBeUndefined();
    });

    it('includes customTemplates only when selected', () => {
      const mockData = createMockAppData({
        customTemplates: [
          {
            id: createProductTemplateId('tmpl-1'),
            name: 'My Template',
            category: createCategoryId('food'),
            isCustom: true,
            isBuiltIn: false,
          },
        ],
      });
      const jsonWith = exportToJSONSelective(mockData, ['customTemplates']);
      const parsedWith = JSON.parse(jsonWith);
      expect(parsedWith.customTemplates).toHaveLength(1);

      const jsonWithout = exportToJSONSelective(mockData, ['items']);
      const parsedWithout = JSON.parse(jsonWithout);
      expect(parsedWithout.customTemplates).toBeUndefined();
    });
  });

  describe('mergeImportData section logic', () => {
    it('does not merge household when section not included', () => {
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
        exportMetadata: createTestExportMetadata([]),
        household: {
          adults: 99,
          children: 99,
          pets: 0,
          supplyDurationDays: 99,
          useFreezer: true,
        },
        lastModified: '2024-01-01T00:00:00.000Z',
      };
      const result = mergeImportData(existing, imported, ['settings']); // 'household' not in sections
      expect(result.household.adults).toBe(1); // unchanged
    });

    it('does not merge household when imported.household is missing', () => {
      const existing = createMockAppData({
        household: {
          adults: 2,
          children: 0,
          pets: 0,
          supplyDurationDays: 7,
          useFreezer: false,
        },
      });
      const imported: PartialExportData = {
        version: CURRENT_SCHEMA_VERSION,
        exportMetadata: createTestExportMetadata(['household']),
        // household field absent
        lastModified: '2024-01-01T00:00:00.000Z',
      };
      const result = mergeImportData(existing, imported, ['household']);
      expect(result.household.adults).toBe(2); // unchanged
    });

    it('does not merge settings when section not included', () => {
      const existing = createMockAppData();
      const imported: PartialExportData = {
        version: CURRENT_SCHEMA_VERSION,
        exportMetadata: createTestExportMetadata([]),
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
      const result = mergeImportData(existing, imported, []); // 'settings' not in sections
      expect(result.settings).toEqual(existing.settings);
    });

    it('does not merge settings when imported.settings is missing', () => {
      const existing = createMockAppData();
      const existingSettings = { ...existing.settings };
      const imported: PartialExportData = {
        version: CURRENT_SCHEMA_VERSION,
        exportMetadata: createTestExportMetadata(['settings']),
        // settings field absent
        lastModified: '2024-01-01T00:00:00.000Z',
      };
      const result = mergeImportData(existing, imported, ['settings']);
      expect(result.settings).toEqual(existingSettings);
    });

    it('does not merge items when section not included', () => {
      const existing = createMockAppData({
        items: [
          {
            id: createItemId('existing-item'),
            name: 'Existing',
            itemType: createProductTemplateId('existing'),
            categoryId: createCategoryId('food'),
            quantity: createQuantity(1),
            unit: 'pieces',
            neverExpires: true,
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
          },
        ],
      });
      const imported: PartialExportData = {
        version: CURRENT_SCHEMA_VERSION,
        exportMetadata: createTestExportMetadata([]),
        items: [
          {
            id: createItemId('new-item'),
            name: 'New Item',
            itemType: createProductTemplateId('new-thing'),
            categoryId: createCategoryId('food'),
            quantity: createQuantity(5),
            unit: 'cans',
            neverExpires: false,
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
          },
        ],
        lastModified: '2024-01-01T00:00:00.000Z',
      };
      const result = mergeImportData(existing, imported, ['household']); // 'items' not in sections
      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe('Existing');
    });

    it('does not merge items when imported.items is absent', () => {
      const existing = createMockAppData({
        items: [
          {
            id: createItemId('existing-item'),
            name: 'Existing',
            itemType: createProductTemplateId('existing'),
            categoryId: createCategoryId('food'),
            quantity: createQuantity(1),
            unit: 'pieces',
            neverExpires: true,
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
          },
        ],
      });
      const imported: PartialExportData = {
        version: CURRENT_SCHEMA_VERSION,
        exportMetadata: createTestExportMetadata(['items']),
        // items field absent
        lastModified: '2024-01-01T00:00:00.000Z',
      };
      const result = mergeImportData(existing, imported, ['items']);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe('Existing');
    });

    it('does not merge customCategories when section not included', () => {
      const existing = createMockAppData({ customCategories: [] });
      const imported: PartialExportData = {
        version: CURRENT_SCHEMA_VERSION,
        exportMetadata: createTestExportMetadata([]),
        customCategories: [
          {
            id: createCategoryId('cat-1'),
            name: 'Imported Cat',
            isCustom: true,
          },
        ],
        lastModified: '2024-01-01T00:00:00.000Z',
      };
      const result = mergeImportData(existing, imported, ['items']); // 'customCategories' not included
      expect(result.customCategories).toHaveLength(0);
    });

    it('does not merge customCategories when imported field is absent', () => {
      const existing = createMockAppData({ customCategories: [] });
      const imported: PartialExportData = {
        version: CURRENT_SCHEMA_VERSION,
        exportMetadata: createTestExportMetadata(['customCategories']),
        // customCategories absent
        lastModified: '2024-01-01T00:00:00.000Z',
      };
      const result = mergeImportData(existing, imported, ['customCategories']);
      expect(result.customCategories).toHaveLength(0);
    });

    it('does not merge customTemplates when section not included', () => {
      const existing = createMockAppData({ customTemplates: [] });
      const imported: PartialExportData = {
        version: CURRENT_SCHEMA_VERSION,
        exportMetadata: createTestExportMetadata([]),
        customTemplates: [
          {
            id: createProductTemplateId('tmpl-1'),
            name: 'T',
            category: createCategoryId('food'),
            isCustom: true,
            isBuiltIn: false,
          },
        ],
        lastModified: '2024-01-01T00:00:00.000Z',
      };
      const result = mergeImportData(existing, imported, ['items']);
      expect(result.customTemplates).toHaveLength(0);
    });

    it('does not merge customTemplates when imported field is absent', () => {
      const existing = createMockAppData({ customTemplates: [] });
      const imported: PartialExportData = {
        version: CURRENT_SCHEMA_VERSION,
        exportMetadata: createTestExportMetadata(['customTemplates']),
        // customTemplates absent
        lastModified: '2024-01-01T00:00:00.000Z',
      };
      const result = mergeImportData(existing, imported, ['customTemplates']);
      expect(result.customTemplates).toHaveLength(0);
    });

    it('does not merge dismissedAlertIds when section not included', () => {
      const existing = createMockAppData({
        dismissedAlertIds: [createAlertId('existing-alert')],
      });
      const imported: PartialExportData = {
        version: CURRENT_SCHEMA_VERSION,
        exportMetadata: createTestExportMetadata([]),
        dismissedAlertIds: [createAlertId('new-alert')],
        lastModified: '2024-01-01T00:00:00.000Z',
      };
      const result = mergeImportData(existing, imported, ['items']);
      expect(result.dismissedAlertIds).toHaveLength(1);
      expect(result.dismissedAlertIds[0]).toBe('existing-alert');
    });

    it('does not merge dismissedAlertIds when imported field is absent', () => {
      const existing = createMockAppData({
        dismissedAlertIds: [createAlertId('existing-alert')],
      });
      const imported: PartialExportData = {
        version: CURRENT_SCHEMA_VERSION,
        exportMetadata: createTestExportMetadata(['dismissedAlertIds']),
        // dismissedAlertIds absent
        lastModified: '2024-01-01T00:00:00.000Z',
      };
      const result = mergeImportData(existing, imported, ['dismissedAlertIds']);
      expect(result.dismissedAlertIds).toHaveLength(1);
      expect(result.dismissedAlertIds[0]).toBe('existing-alert');
    });

    it('does not merge disabledRecommendedItems when section not included', () => {
      const existing = createMockAppData({
        disabledRecommendedItems: [createProductTemplateId('existing-tmpl')],
      });
      const imported: PartialExportData = {
        version: CURRENT_SCHEMA_VERSION,
        exportMetadata: createTestExportMetadata([]),
        disabledRecommendedItems: [createProductTemplateId('new-tmpl')],
        lastModified: '2024-01-01T00:00:00.000Z',
      };
      const result = mergeImportData(existing, imported, ['items']);
      expect(result.disabledRecommendedItems).toHaveLength(1);
      expect(result.disabledRecommendedItems[0]).toBe('existing-tmpl');
    });

    it('does not merge disabledRecommendedItems when imported field is absent', () => {
      const existing = createMockAppData({
        disabledRecommendedItems: [createProductTemplateId('existing-tmpl')],
      });
      const imported: PartialExportData = {
        version: CURRENT_SCHEMA_VERSION,
        exportMetadata: createTestExportMetadata(['disabledRecommendedItems']),
        // disabledRecommendedItems absent
        lastModified: '2024-01-01T00:00:00.000Z',
      };
      const result = mergeImportData(existing, imported, [
        'disabledRecommendedItems',
      ]);
      expect(result.disabledRecommendedItems).toHaveLength(1);
      expect(result.disabledRecommendedItems[0]).toBe('existing-tmpl');
    });

    it('does not merge customRecommendedItems when section not included', () => {
      const existingRecs = {
        meta: { name: 'Existing', version: '1.0', createdAt: '2024-01-01' },
        items: [],
      };
      const existing = createMockAppData({
        customRecommendedItems: existingRecs,
      });
      const imported: PartialExportData = {
        version: CURRENT_SCHEMA_VERSION,
        exportMetadata: createTestExportMetadata([]),
        customRecommendedItems: {
          meta: { name: 'Imported', version: '2.0', createdAt: '2024-06-01' },
          items: [],
        },
        lastModified: '2024-01-01T00:00:00.000Z',
      };
      const result = mergeImportData(existing, imported, ['items']); // 'customRecommendedItems' not included
      expect(result.customRecommendedItems?.meta.name).toBe('Existing');
    });
  });

  describe('buildInventorySetFromImport section logic', () => {
    let importMultiInventory: typeof import('./localStorage').importMultiInventory;

    beforeEach(async () => {
      const mod = await import('./localStorage');
      importMultiInventory = mod.importMultiInventory;
      clearAppData();
    });

    it('uses default household when household section not selected', () => {
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
              household: {
                adults: 99,
                children: 99,
                pets: 99,
                supplyDurationDays: 99,
                useFreezer: true,
              },
              items: [],
            },
          },
        ],
      } as unknown as MultiInventoryExportData;

      const result = importMultiInventory(importData, {
        includeSettings: false,
        inventorySets: [
          { index: 0, originalName: 'Test', sections: ['items'] }, // 'household' not selected
        ],
      });

      const imported = Object.values(result.inventorySets).find(
        (s) => s.name === 'Test',
      );
      // Should use default household, not the imported one
      expect(imported?.household.adults).not.toBe(99);
    });

    it('uses default household when imported.household is absent even if section selected', () => {
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
              // no household field
              items: [],
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
      // Should use default household
      expect(imported?.household).toBeDefined();
      expect(imported?.household.adults).toBeGreaterThan(0);
    });

    it('uses empty items when items section not selected', () => {
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
              items: [
                {
                  id: 'item-1',
                  name: 'Some Item',
                  categoryId: 'food',
                  quantity: 1,
                  unit: 'pieces',
                  neverExpires: true,
                },
              ],
            },
          },
        ],
      } as unknown as MultiInventoryExportData;

      const result = importMultiInventory(importData, {
        includeSettings: false,
        inventorySets: [
          { index: 0, originalName: 'Test', sections: ['household'] }, // 'items' not selected
        ],
      });

      const imported = Object.values(result.inventorySets).find(
        (s) => s.name === 'Test',
      );
      expect(imported?.items).toHaveLength(0);
    });

    it('uses empty customCategories when section not selected', () => {
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
              customCategories: [
                { id: 'custom-1', name: 'Cat', isCustom: true },
              ],
            },
          },
        ],
      } as unknown as MultiInventoryExportData;

      const result = importMultiInventory(importData, {
        includeSettings: false,
        inventorySets: [
          { index: 0, originalName: 'Test', sections: ['items'] }, // 'customCategories' not selected
        ],
      });

      const imported = Object.values(result.inventorySets).find(
        (s) => s.name === 'Test',
      );
      expect(imported?.customCategories).toHaveLength(0);
    });

    it('uses empty customCategories when imported field is absent even if section selected', () => {
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
              // no customCategories field
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
            sections: ['customCategories'],
          },
        ],
      });

      const imported = Object.values(result.inventorySets).find(
        (s) => s.name === 'Test',
      );
      expect(imported?.customCategories).toHaveLength(0);
    });

    it('uses empty dismissedAlertIds when section not selected', () => {
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
              dismissedAlertIds: ['alert-1', 'alert-2'],
            },
          },
        ],
      } as unknown as MultiInventoryExportData;

      const result = importMultiInventory(importData, {
        includeSettings: false,
        inventorySets: [
          { index: 0, originalName: 'Test', sections: ['items'] }, // 'dismissedAlertIds' not selected
        ],
      });

      const imported = Object.values(result.inventorySets).find(
        (s) => s.name === 'Test',
      );
      expect(imported?.dismissedAlertIds).toHaveLength(0);
    });

    it('uses empty disabledRecommendedItems when section not selected', () => {
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
              disabledRecommendedItems: ['tmpl-1'],
            },
          },
        ],
      } as unknown as MultiInventoryExportData;

      const result = importMultiInventory(importData, {
        includeSettings: false,
        inventorySets: [
          { index: 0, originalName: 'Test', sections: ['items'] }, // 'disabledRecommendedItems' not selected
        ],
      });

      const imported = Object.values(result.inventorySets).find(
        (s) => s.name === 'Test',
      );
      expect(imported?.disabledRecommendedItems).toHaveLength(0);
    });

    it('leaves customRecommendedItems undefined when section not selected', () => {
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
              customRecommendedItems: {
                meta: { name: 'X', version: '1.0', createdAt: '2024-01-01' },
                items: [],
              },
            },
          },
        ],
      } as unknown as MultiInventoryExportData;

      const result = importMultiInventory(importData, {
        includeSettings: false,
        inventorySets: [
          { index: 0, originalName: 'Test', sections: ['items'] }, // 'customRecommendedItems' not selected
        ],
      });

      const imported = Object.values(result.inventorySets).find(
        (s) => s.name === 'Test',
      );
      expect(imported?.customRecommendedItems).toBeUndefined();
    });

    it('normalizes null expirationDate to undefined in items during import', () => {
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
              items: [
                {
                  id: 'item-legacy',
                  name: 'Legacy Item',
                  categoryId: 'food',
                  quantity: 1,
                  unit: 'pieces',
                  expirationDate: null,
                  neverExpires: false,
                },
                {
                  id: 'item-normal',
                  name: 'Normal Item',
                  categoryId: 'food',
                  quantity: 1,
                  unit: 'pieces',
                  expirationDate: '2026-01-01',
                  neverExpires: false,
                },
              ],
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
      const legacy = imported?.items.find((i) => i.id === 'item-legacy');
      const normal = imported?.items.find((i) => i.id === 'item-normal');

      expect(legacy?.expirationDate).toBeUndefined();
      expect(legacy?.neverExpires).toBe(true);
      expect(normal?.expirationDate).toBe('2026-01-01');
      expect(normal?.neverExpires).toBe(false);
    });
  });

  describe('parseMultiInventoryImport edge cases', () => {
    let parseMultiInventoryImport: typeof import('./localStorage').parseMultiInventoryImport;

    beforeEach(async () => {
      const mod = await import('./localStorage');
      parseMultiInventoryImport = mod.parseMultiInventoryImport;
    });

    it('throws MigrationError for unsupported version in multi-inventory format', () => {
      const exportData = {
        version: '0.9.0', // Unsupported
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
      expect(() =>
        parseMultiInventoryImport(JSON.stringify(exportData)),
      ).toThrow(MigrationError);
    });

    it('defaults to version 1.0.0 when version field is missing in multi-inventory format', () => {
      // If version is absent, it defaults to '1.0.0' which is currently supported
      const exportData = {
        // no version field
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
      // Should not throw since 1.0.0 is supported
      const result = parseMultiInventoryImport(JSON.stringify(exportData));
      expect(result.inventorySets).toHaveLength(1);
    });

    it('defaults to version 1.0.0 when version field is missing in legacy format', () => {
      const legacyData = {
        // no version field
        exportMetadata: {
          exportedAt: '2024-01-01T00:00:00.000Z',
          appVersion: '1.0.0',
          itemCount: 0,
          categoryCount: 0,
          includedSections: ['items'],
        },
        items: [],
        lastModified: '2024-01-01T00:00:00.000Z',
      };
      // Should not throw since 1.0.0 is supported
      const result = parseMultiInventoryImport(JSON.stringify(legacyData));
      expect(result.inventorySets).toHaveLength(1);
    });
  });

  describe('importMultiInventory settings edge cases', () => {
    let importMultiInventory: typeof import('./localStorage').importMultiInventory;

    beforeEach(async () => {
      const mod = await import('./localStorage');
      importMultiInventory = mod.importMultiInventory;
      clearAppData();
    });

    it('does not import settings when includeSettings is false', () => {
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

      const defaultRoot = createDefaultRootStorage();
      const result = importMultiInventory(
        importData,
        { includeSettings: false, inventorySets: [] },
        defaultRoot,
      );

      // Settings should remain the default, not the imported ones
      expect(result.settings.language).not.toBe('fi');
    });

    it('does not import settings when importData.settings is absent', () => {
      const importData: MultiInventoryExportData = {
        version: CURRENT_SCHEMA_VERSION,
        exportedAt: '2024-01-01T00:00:00.000Z',
        appVersion: '1.0.0',
        // no settings field
        inventorySets: [],
      };

      const defaultRoot = createDefaultRootStorage();
      const defaultLanguage = defaultRoot.settings.language;
      const result = importMultiInventory(
        importData,
        { includeSettings: true, inventorySets: [] },
        defaultRoot,
      );

      // Settings should be unchanged since there were none to import
      expect(result.settings.language).toBe(defaultLanguage);
    });
  });

  describe('exportToJSON edge cases', () => {
    it('uses 0 for itemCount when items array is empty', () => {
      const mockData = createMockAppData({ items: [] });
      const json = exportToJSON(mockData);
      const parsed = JSON.parse(json);
      expect(parsed.exportMetadata.itemCount).toBe(0);
    });

    it('uses 0 for itemCount when items is undefined', () => {
      const mockData = createMockAppData();
      const dataWithoutItems = {
        ...mockData,
        items: undefined,
      } as unknown as typeof mockData;
      const json = exportToJSON(dataWithoutItems);
      const parsed = JSON.parse(json);
      expect(parsed.exportMetadata.itemCount).toBe(0);
    });
  });

  describe('saveAppData edge cases', () => {
    it('does not update inventory set when active set does not exist', () => {
      // Bootstrap default storage
      getAppData();
      // Manually set a non-existent active ID
      const raw = localStorage.getItem(STORAGE_KEY)!;
      const root = JSON.parse(raw);
      root.activeInventorySetId = 'ghost-set';
      localStorage.setItem(STORAGE_KEY, JSON.stringify(root));

      const mockData = createMockAppData();
      // saveAppData should not throw even when active inventory set is missing
      expect(() => saveAppData(mockData)).not.toThrow();
    });

    it('creates default root when storage is empty before saving', () => {
      clearAppData();
      const mockData = createMockAppData();
      saveAppData(mockData);
      const stored = localStorage.getItem(STORAGE_KEY);
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored!);
      expect(parsed.inventorySets).toBeDefined();
    });
  });

  describe('normalizeItems edge cases', () => {
    it('handles items with empty string itemType', () => {
      const data = {
        version: CURRENT_SCHEMA_VERSION,
        household: createMockHousehold({ children: 0 }),
        settings: { language: 'en', theme: 'light', highContrast: false },
        items: [
          {
            id: 'item-1',
            name: 'Test',
            categoryId: 'food',
            quantity: 1,
            unit: 'pieces',
            itemType: '', // empty string - falsy
            neverExpires: true,
          },
        ],
        lastModified: new Date().toISOString(),
      };
      const imported = importFromJSON(JSON.stringify(data));
      expect(imported.items[0].itemType).toBe('custom');
    });

    it('handles items with single-char lowercase itemType', () => {
      const data = {
        version: CURRENT_SCHEMA_VERSION,
        household: createMockHousehold({ children: 0 }),
        settings: { language: 'en', theme: 'light', highContrast: false },
        items: [
          {
            id: 'item-1',
            name: 'Test',
            categoryId: 'food',
            quantity: 1,
            unit: 'pieces',
            itemType: 'a', // valid single char
            neverExpires: true,
          },
        ],
        lastModified: new Date().toISOString(),
      };
      const imported = importFromJSON(JSON.stringify(data));
      expect(imported.items[0].itemType).toBe('a');
    });
  });
});
