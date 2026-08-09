import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  createDefaultRootStorage,
  getAppData,
  saveAppData,
  clearAppData,
  exportToJSON,
  importFromJSON,
  exportToJSONSelective,
  parseImportJSON,
  parseMultiInventoryImport,
  buildRootStorageFromAppData,
  getInventorySetList,
  getActiveInventorySetId,
  setActiveInventorySetId,
  createInventorySet,
  renameInventorySet,
  getRootStorageForExport,
  exportMultiInventory,
  importMultiInventory,
  DEFAULT_INVENTORY_SET_ID,
  STORAGE_KEY,
} from './localStorage';
import type { ExportData } from './localStorage';
import type {
  AppData,
  InventoryItem,
  InventorySetData,
  RootStorage,
} from '@/shared/types';
import {
  createInventorySetId,
  createCategoryId,
  createItemId,
  createProductTemplateId,
  createQuantity,
} from '@/shared/types';
import type {
  MultiInventoryExportData,
  MultiInventoryImportSelection,
  PartialExportData,
} from '@/shared/types/exportImport';
import {
  createMockAppData,
  createMockHousehold,
} from '@/shared/utils/test/factories';
import { CURRENT_SCHEMA_VERSION } from './migrations';
import { DEFAULT_KIT_ID } from '@/features/templates/kits';
import { STANDARD_CATEGORIES } from '@/features/categories/data';
import { APP_VERSION } from '@/shared/utils/version';

beforeEach(() => {
  clearAppData();
  localStorage.clear();
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

const baseSettings = {
  language: 'en' as const,
  theme: 'ocean' as const,
  highContrast: false,
  onboardingCompleted: true,
  advancedFeatures: {
    calorieTracking: false,
    powerManagement: false,
    waterTracking: false,
  },
};

const baseHousehold = {
  adults: 1,
  children: 0,
  pets: 0,
  supplyDurationDays: 3,
  useFreezer: false,
};

function createBaseAppData(overrides: Partial<AppData> = {}): AppData {
  return {
    version: CURRENT_SCHEMA_VERSION,
    lastModified: new Date().toISOString(),
    items: [],
    customCategories: [],
    customTemplates: [],
    dismissedAlertIds: [],
    disabledRecommendedItems: [],
    selectedRecommendationKit: 'standard-fi',
    uploadedRecommendationKits: [],
    household: baseHousehold,
    settings: baseSettings,
    ...overrides,
  } as AppData;
}

function writeRoot(root: RootStorage): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(root));
}

function buildRoot(
  activeId: string,
  sets: Record<string, InventorySetData>,
): RootStorage {
  return {
    version: CURRENT_SCHEMA_VERSION,
    activeInventorySetId: createInventorySetId(activeId),
    inventorySets: sets,
    settings: baseSettings,
  };
}

function makeInventorySet(
  id: string,
  name: string,
  items: InventoryItem[] = [],
): InventorySetData {
  return {
    id: createInventorySetId(id),
    name,
    lastModified: new Date().toISOString(),
    items,
    customCategories: [],
    customTemplates: [],
    dismissedAlertIds: [],
    disabledRecommendedItems: [],
    disabledCategories: [],
    selectedRecommendationKit: 'standard-fi',
    uploadedRecommendationKits: [],
    household: baseHousehold,
  } as unknown as InventorySetData;
}

// ===========================================================================
// Storage error handling — guards that catch blocks log the exact message
// expected by ops/observability tools.
// ===========================================================================
describe('storage error handling logs exact diagnostics', () => {
  it('logs "getRootStorage failed:" when getItem throws', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
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

  it('logs "saveRootStorage failed:" when setItem throws', () => {
    getAppData();
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceeded');
    });

    createInventorySet('Test');
    expect(consoleSpy).toHaveBeenCalledWith(
      'saveRootStorage failed:',
      expect.any(Error),
    );
  });

  it('logs exact "getRootStorage failed:" via getActiveInventorySetId', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('test');
    });

    getActiveInventorySetId();
    expect(consoleSpy).toHaveBeenCalledWith(
      'getRootStorage failed:',
      expect.any(Error),
    );
  });

  it('logs exact "saveRootStorage failed:" via renameInventorySet', () => {
    getAppData();
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('write fail');
    });

    renameInventorySet(DEFAULT_INVENTORY_SET_ID, 'New Name');

    expect(consoleSpy).toHaveBeenCalledWith(
      'saveRootStorage failed:',
      expect.any(Error),
    );
  });

  it('logs "Data validation failed:" on validation error', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
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

  it('logs "Failed to parse import JSON:" on parse error', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => parseImportJSON('not json')).toThrow();
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to parse import JSON:',
      expect.any(Error),
    );
  });
});

// ===========================================================================
// getAppData branching on active inventory set presence
// ===========================================================================
describe('getAppData active-set branch', () => {
  it('returns undefined when activeInventorySetId points to a missing set', () => {
    const root = createDefaultRootStorage();
    root.activeInventorySetId =
      'non-existent' as typeof DEFAULT_INVENTORY_SET_ID;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(root));

    expect(getAppData()).toBeUndefined();
  });

  it('returns undefined when active set id (raw root) does not match any key', () => {
    writeRoot(buildRoot('does-not-exist', {}));
    expect(getAppData()).toBeUndefined();
  });

  it('returns data when active inventory set exists', () => {
    const data = getAppData();
    expect(data).toBeDefined();
    expect(data!.version).toBe(CURRENT_SCHEMA_VERSION);
  });

  it('returns data for raw-root with valid active set', () => {
    writeRoot(buildRoot('a', { a: makeInventorySet('a', 'A') }));
    expect(getAppData()).toBeDefined();
  });

  it('returns data without re-running migrations when version is current', () => {
    getAppData();
    const data = getAppData();
    expect(data).toBeDefined();
    expect(data!.version).toBe(CURRENT_SCHEMA_VERSION);
  });
});

// ===========================================================================
// saveAppData persistence and missing-set safety
// ===========================================================================
describe('saveAppData persistence', () => {
  it('persists items into the active inventory set', () => {
    const set = makeInventorySet('a', 'A');
    writeRoot(buildRoot('a', { a: set }));

    const item: InventoryItem = {
      id: createItemId('it-1'),
      name: 'Water',
      categoryId: createCategoryId('water-beverages'),
      itemType: createProductTemplateId('bottled-water'),
      quantity: createQuantity(5),
      unit: 'liters',
      neverExpires: true,
    } as InventoryItem;

    saveAppData(createBaseAppData({ items: [item] }));

    const stored = JSON.parse(
      localStorage.getItem(STORAGE_KEY)!,
    ) as RootStorage;
    expect(stored.inventorySets['a'].items).toHaveLength(1);
  });

  it('does not throw or create a phantom set when active id is missing', () => {
    writeRoot(buildRoot('missing', {}));
    expect(() => saveAppData(createBaseAppData({ items: [] }))).not.toThrow();
    const stored = JSON.parse(
      localStorage.getItem(STORAGE_KEY)!,
    ) as RootStorage;
    expect(stored.inventorySets['missing']).toBeUndefined();
  });
});

// ===========================================================================
// generateInventorySetId — crypto.randomUUID with fallback
// ===========================================================================
describe('generateInventorySetId crypto fallback', () => {
  it('uses crypto.randomUUID when available (UUID format)', () => {
    getAppData();
    const id = createInventorySet('Test');
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });

  it('falls back to ws-<timestamp>-<rand> when randomUUID is missing', () => {
    const originalRandomUUID = crypto.randomUUID;
    (crypto as unknown as Record<string, unknown>).randomUUID = undefined;

    try {
      getAppData();
      const id = createInventorySet('Fallback Test');
      expect(id).toMatch(/^ws-\d+-[a-z0-9]+$/);
    } finally {
      crypto.randomUUID = originalRandomUUID;
    }
  });

  it('imported set ids use ws- fallback when randomUUID is unavailable', () => {
    const originalRandomUUID = (
      crypto as unknown as { randomUUID?: () => string }
    ).randomUUID;
    Object.defineProperty(crypto, 'randomUUID', {
      configurable: true,
      value: undefined,
    });

    try {
      writeRoot(buildRoot('a', { a: makeInventorySet('a', 'A') }));
      const importData = {
        version: CURRENT_SCHEMA_VERSION,
        exportedAt: new Date().toISOString(),
        appVersion: '1.0.0',
        inventorySets: [
          {
            name: 'Imported',
            includedSections: ['items'],
            data: {
              id: 'imported-id',
              name: 'Imported',
              lastModified: new Date().toISOString(),
              items: [],
            },
          },
        ],
      } as unknown as MultiInventoryExportData;
      const selection: MultiInventoryImportSelection = {
        includeSettings: false,
        inventorySets: [{ index: 0, originalName: 'n', sections: ['items'] }],
      };
      const result = importMultiInventory(importData, selection);
      const newKeys = Object.keys(result.inventorySets);
      const newKey = newKeys.find((k) => k.startsWith('ws-'));
      expect(newKey).toBeDefined();
    } finally {
      if (originalRandomUUID !== undefined) {
        Object.defineProperty(crypto, 'randomUUID', {
          configurable: true,
          value: originalRandomUUID,
        });
      }
    }
  });
});

// ===========================================================================
// buildRootStorageFromAppData — default inventory set name
// ===========================================================================
describe('buildRootStorageFromAppData defaults', () => {
  it('uses "Default" as the inventory set name', () => {
    const appData = createMockAppData();
    const root = buildRootStorageFromAppData(appData);
    const inventorySet = root.inventorySets[DEFAULT_INVENTORY_SET_ID as string];

    expect(inventorySet.name).toBe('Default');
  });
});

// ===========================================================================
// setActiveInventorySetId is a no-op when target set is absent
// ===========================================================================
describe('setActiveInventorySetId guards against missing target', () => {
  it('does nothing when set id does not exist', () => {
    const rootData = {
      version: CURRENT_SCHEMA_VERSION,
      activeInventorySetId: 'default',
      inventorySets: {
        default: {
          id: 'default',
          name: 'Default',
          items: [],
          household: baseHousehold,
          settings: baseSettings,
          customCategories: [],
          disabledCategories: [],
          customTemplates: [],
          dismissedAlertIds: [],
          disabledRecommendedItems: [],
          lastModified: '2024-01-01T00:00:00.000Z',
        },
      },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rootData));

    setActiveInventorySetId(createInventorySetId('nonexistent'));

    const stored = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || '{}',
    ) as RootStorage;
    expect(stored.activeInventorySetId).toBe('default');
  });
});

// ===========================================================================
// normalizeMergedAppData — falsy fallbacks for legacy data
// ===========================================================================
describe('normalizeMergedAppData defaults for legacy data', () => {
  it('defaults disabledRecommendedItems to [] when undefined', () => {
    const root = createDefaultRootStorage();
    const activeSet = root.inventorySets[DEFAULT_INVENTORY_SET_ID as string];
    delete (activeSet as unknown as Record<string, unknown>)
      .disabledRecommendedItems;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(root));

    const data = getAppData();
    expect(data).toBeDefined();
    expect(data!.disabledRecommendedItems).toEqual([]);
  });

  it('preserves a non-empty disabledRecommendedItems array', () => {
    const root = createDefaultRootStorage();
    const activeSet = root.inventorySets[DEFAULT_INVENTORY_SET_ID as string];
    activeSet.disabledRecommendedItems = [createProductTemplateId('item-1')];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(root));

    const data = getAppData();
    expect(data).toBeDefined();
    expect(data!.disabledRecommendedItems).toHaveLength(1);
    expect(data!.disabledRecommendedItems[0]).toBe('item-1');
  });
});

// ===========================================================================
// exportToJSON — counts and metadata
// ===========================================================================
describe('exportToJSON metadata counts', () => {
  it('itemCount=0 when items is undefined', () => {
    const mockData = createMockAppData();
    (mockData as unknown as Record<string, unknown>).items = undefined;
    const json = exportToJSON(mockData);
    const parsed = JSON.parse(json) as ExportData;

    expect(parsed.exportMetadata.itemCount).toBe(0);
  });

  it('itemCount reflects actual items array length', () => {
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
    const parsed = JSON.parse(json) as ExportData;

    expect(parsed.exportMetadata.itemCount).toBe(2);
  });

  it('categoryCount adds custom categories to standard count when present', () => {
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
    const parsed = JSON.parse(json) as ExportData;

    expect(parsed.exportMetadata.categoryCount).toBe(
      STANDARD_CATEGORIES.length + 1,
    );
  });

  it('categoryCount = standard count when customCategories is undefined', () => {
    const mockData = createMockAppData();
    (mockData as unknown as Record<string, unknown>).customCategories =
      undefined;
    const json = exportToJSON(mockData);
    const parsed = JSON.parse(json) as ExportData;

    expect(parsed.exportMetadata.categoryCount).toBe(
      STANDARD_CATEGORIES.length,
    );
  });

  it('appVersion is set from APP_VERSION constant', () => {
    const mockData = createMockAppData();
    const json = exportToJSON(mockData);
    const parsed = JSON.parse(json) as ExportData;

    expect(parsed.exportMetadata.appVersion).toBe(APP_VERSION);
    expect(typeof parsed.exportMetadata.appVersion).toBe('string');
    expect(parsed.exportMetadata.appVersion.length).toBeGreaterThan(0);
  });
});

// ===========================================================================
// exportToJSONSelective — section-driven counts
// ===========================================================================
describe('exportToJSONSelective section-driven counts', () => {
  it('handles undefined items via optional chaining', () => {
    const mockData = createMockAppData();
    (mockData as unknown as Record<string, unknown>).items = undefined;
    const json = exportToJSONSelective(mockData, ['items']);
    const parsed = JSON.parse(json) as PartialExportData;

    expect(parsed.exportMetadata.itemCount).toBe(0);
  });

  it('handles undefined customCategories via optional chaining', () => {
    const mockData = createMockAppData();
    (mockData as unknown as Record<string, unknown>).customCategories =
      undefined;
    const json = exportToJSONSelective(mockData, ['customCategories']);
    const parsed = JSON.parse(json) as PartialExportData;

    expect(parsed.exportMetadata.categoryCount).toBe(
      STANDARD_CATEGORIES.length,
    );
  });

  it('counts items and categories correctly when both are defined', () => {
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
        { id: createCategoryId('custom-1'), name: 'C1', isCustom: true },
        { id: createCategoryId('custom-2'), name: 'C2', isCustom: true },
      ],
    });
    const json = exportToJSONSelective(mockData, ['items', 'customCategories']);
    const parsed = JSON.parse(json) as PartialExportData;

    expect(parsed.exportMetadata.itemCount).toBe(1);
    expect(parsed.exportMetadata.categoryCount).toBe(
      STANDARD_CATEGORIES.length + 2,
    );
  });

  it('adds custom category count when customCategories section is included', () => {
    const mockData = createMockAppData({
      customCategories: [
        { id: createCategoryId('c1'), name: 'Custom1', isCustom: true },
      ],
    });

    const json = exportToJSONSelective(mockData, ['customCategories']);
    const parsed = JSON.parse(json) as PartialExportData;

    expect(parsed.exportMetadata.categoryCount).toBe(
      STANDARD_CATEGORIES.length + 1,
    );
  });

  it('uses only standard category count when customCategories section omitted', () => {
    const mockData = createMockAppData({
      customCategories: [
        { id: createCategoryId('c1'), name: 'Custom1', isCustom: true },
      ],
    });

    const json = exportToJSONSelective(mockData, ['items']);
    const parsed = JSON.parse(json) as PartialExportData;

    expect(parsed.exportMetadata.categoryCount).toBe(
      STANDARD_CATEGORIES.length,
    );
  });
});

// ===========================================================================
// importFromJSON — version handling and field defaults
// ===========================================================================
describe('importFromJSON version handling', () => {
  it('falls back to 1.0.0 and applies migrations when version missing', () => {
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

    expect(imported.version).toBe(CURRENT_SCHEMA_VERSION);
  });

  it('preserves provided version when present', () => {
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

  it('throws on version below minimum supported', () => {
    const json = JSON.stringify({
      version: '0.0.1',
      household: baseHousehold,
      settings: baseSettings,
      items: [],
    });
    expect(() => importFromJSON(json)).toThrow();
  });

  it('does not throw on supported version', () => {
    const json = JSON.stringify({
      version: CURRENT_SCHEMA_VERSION,
      household: baseHousehold,
      settings: baseSettings,
      items: [],
    });
    expect(() => importFromJSON(json)).not.toThrow();
  });

  it('throws on invalid JSON', () => {
    expect(() => importFromJSON('not json')).toThrow();
  });
});

describe('importFromJSON field defaults', () => {
  it('processes existing dismissedAlertIds array', () => {
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
    const imported = importFromJSON(JSON.stringify(data));

    expect(imported.dismissedAlertIds).toHaveLength(2);
    expect(imported.dismissedAlertIds[0]).toBe('alert-1');
    expect(imported.dismissedAlertIds[1]).toBe('alert-2');
  });

  it('maps existing disabledRecommendedItems to branded types', () => {
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
    const imported = importFromJSON(JSON.stringify(data));

    expect(imported.disabledRecommendedItems).toEqual([
      'bottled-water',
      'canned-food',
    ]);
    expect(imported.disabledRecommendedItems).toHaveLength(2);
  });

  it('defaults disabledRecommendedItems to [] when missing', () => {
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
    const imported = importFromJSON(JSON.stringify(data));

    expect(imported.disabledRecommendedItems).toEqual([]);
  });

  it('defaults selectedRecommendationKit to DEFAULT_KIT_ID when missing', () => {
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
    const imported = importFromJSON(JSON.stringify(data));

    expect(imported.selectedRecommendationKit).toBe(DEFAULT_KIT_ID);
  });

  it('preserves a provided selectedRecommendationKit', () => {
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
    const imported = importFromJSON(JSON.stringify(data));

    expect(imported.selectedRecommendationKit).toBe('my-custom-kit');
  });

  it('defaults uploadedRecommendationKits to [] when missing', () => {
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
    const imported = importFromJSON(JSON.stringify(data));

    expect(imported.uploadedRecommendationKits).toEqual([]);
  });

  it('normalizes missing array fields to empty arrays', () => {
    const json = JSON.stringify({
      version: CURRENT_SCHEMA_VERSION,
      items: [],
      household: baseHousehold,
      settings: baseSettings,
      lastModified: '2024-01-01T00:00:00.000Z',
    });

    const result = importFromJSON(json);
    expect(result.customCategories).toEqual([]);
    expect(result.customTemplates).toEqual([]);
    expect(result.dismissedAlertIds).toEqual([]);
    expect(result.disabledRecommendedItems).toEqual([]);
  });

  it('treats legacy expirationDate=null as neverExpires=true', () => {
    const json = JSON.stringify({
      version: CURRENT_SCHEMA_VERSION,
      items: [
        {
          id: 'item-1',
          name: 'Test',
          categoryId: 'food',
          quantity: 5,
          unit: 'pieces',
          itemType: 'custom',
          addedDate: '2024-01-01',
          expirationDate: null,
          neverExpires: false,
        },
      ],
      household: baseHousehold,
      settings: baseSettings,
      customCategories: [],
      disabledCategories: [],
      customTemplates: [],
      dismissedAlertIds: [],
      disabledRecommendedItems: [],
      lastModified: '2024-01-01T00:00:00.000Z',
    });

    const result = importFromJSON(json);
    expect(result.items[0].neverExpires).toBe(true);
  });

  it('round-trips an item with all required fields', () => {
    const json = JSON.stringify({
      version: CURRENT_SCHEMA_VERSION,
      items: [
        {
          id: 'item-1',
          name: 'Test Item',
          categoryId: 'food',
          quantity: 5,
          unit: 'pieces',
          itemType: 'custom',
          addedDate: '2024-01-01',
        },
      ],
      household: { ...baseHousehold, adults: 2, children: 1 },
      settings: baseSettings,
      customCategories: [],
      disabledCategories: [],
      customTemplates: [],
      dismissedAlertIds: [],
      disabledRecommendedItems: [],
      lastModified: '2024-01-01T00:00:00.000Z',
    });

    const result = importFromJSON(json);
    expect(result.items).toHaveLength(1);
    expect(result.version).toBe(CURRENT_SCHEMA_VERSION);
    expect(result.settings.onboardingCompleted).toBe(true);
  });
});

// ===========================================================================
// parseImportJSON / parseMultiInventoryImport — version fallback
// ===========================================================================
describe('parseImportJSON version fallback', () => {
  it('uses 1.0.0 fallback when version is missing', () => {
    const data = {
      items: [],
      household: baseHousehold,
      settings: baseSettings,
    };
    expect(() => parseImportJSON(JSON.stringify(data))).not.toThrow();
  });

  it('does not throw and returns parsed household when version absent', () => {
    const data = {
      household: {
        adults: 1,
        children: 0,
        supplyDurationDays: 3,
        useFreezer: false,
      },
      lastModified: '2024-01-01T00:00:00.000Z',
    };
    const result = parseImportJSON(JSON.stringify(data));

    expect(result).toBeDefined();
    expect(result.household).toEqual(data.household);
  });
});

describe('parseMultiInventoryImport version fallback', () => {
  it('uses 1.0.0 fallback when version is missing in legacy format', () => {
    const data = {
      items: [],
      household: baseHousehold,
      settings: baseSettings,
    };
    expect(() => parseMultiInventoryImport(JSON.stringify(data))).not.toThrow();
    const result = parseMultiInventoryImport(JSON.stringify(data));
    expect(result).toBeDefined();
    expect(result.inventorySets.length).toBeGreaterThan(0);
  });

  it('returns inventorySets when legacy data lacks version', () => {
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
    const result = parseMultiInventoryImport(JSON.stringify(legacyData));

    expect(result).toBeDefined();
    expect(result.inventorySets).toBeDefined();
  });

  it('returns inventorySets when multi-inventory format lacks version', () => {
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
    const result = parseMultiInventoryImport(JSON.stringify(data));

    expect(result).toBeDefined();
    expect(result.inventorySets).toHaveLength(1);
  });

  it('throws MigrationError on unsupported multi-inventory version', () => {
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
    expect(() => parseMultiInventoryImport(JSON.stringify(data))).toThrow();
  });
});

// ===========================================================================
// importMultiInventory — index bounds and section selection
// ===========================================================================
function buildImportData(setCount: number): MultiInventoryExportData {
  return {
    version: CURRENT_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    appVersion: '1.0.0',
    inventorySets: Array.from({ length: setCount }, (_, i) => ({
      name: `Set ${i}`,
      includedSections: ['items'] as const,
      data: {
        id: createInventorySetId(`s-${i}`),
        name: `Set ${i}`,
        lastModified: new Date().toISOString(),
        items: [],
      },
    })) as MultiInventoryExportData['inventorySets'],
  };
}

describe('importMultiInventory index bounds', () => {
  it('skips negative indices', () => {
    const importData = buildImportData(2);
    const selection: MultiInventoryImportSelection = {
      includeSettings: false,
      inventorySets: [{ index: -1, originalName: 'n', sections: ['items'] }],
    };
    const result = importMultiInventory(importData, selection);
    expect(Object.keys(result.inventorySets)).toHaveLength(1);
  });

  it('skips index equal to inventorySets.length', () => {
    const importData = buildImportData(2);
    const selection: MultiInventoryImportSelection = {
      includeSettings: false,
      inventorySets: [{ index: 2, originalName: 'n', sections: ['items'] }],
    };
    const result = importMultiInventory(importData, selection);
    expect(Object.keys(result.inventorySets)).toHaveLength(1);
  });

  it('imports valid in-range index', () => {
    const importData = buildImportData(2);
    const selection: MultiInventoryImportSelection = {
      includeSettings: false,
      inventorySets: [{ index: 0, originalName: 'n', sections: ['items'] }],
    };
    const result = importMultiInventory(importData, selection);
    expect(Object.keys(result.inventorySets).length).toBeGreaterThanOrEqual(2);
  });

  it('skips when index is negative (single-set payload)', () => {
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

    expect(Object.values(result.inventorySets)).toHaveLength(1);
  });

  it('processes index 0 correctly', () => {
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
      inventorySets: [{ index: 0, originalName: 'Valid', sections: ['items'] }],
    });

    const sets = Object.values(result.inventorySets);
    expect(sets).toHaveLength(2);
    expect(sets.some((s) => s.name === 'Valid')).toBe(true);
  });

  it('skips when index equals inventorySets.length (boundary)', () => {
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

    const result = importMultiInventory(importData, {
      includeSettings: false,
      inventorySets: [{ index: 1, originalName: 'OOB', sections: ['items'] }],
    });

    expect(Object.values(result.inventorySets)).toHaveLength(1);
  });

  it('processes the last valid index (length - 1)', () => {
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

    const result = importMultiInventory(importData, {
      includeSettings: false,
      inventorySets: [{ index: 1, originalName: 'Last', sections: ['items'] }],
    });

    const sets = Object.values(result.inventorySets);
    expect(sets).toHaveLength(2);
    expect(sets.some((s) => s.name === 'Last')).toBe(true);
  });
});

describe('importMultiInventory section selection', () => {
  it('uses DEFAULT_KIT_ID when selectedRecommendationKit is absent', () => {
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
      inventorySets: [{ index: 0, originalName: 'Test', sections: ['items'] }],
    });

    const imported = Object.values(result.inventorySets).find(
      (s) => s.name === 'Test',
    );
    expect(imported?.selectedRecommendationKit).toBe(DEFAULT_KIT_ID);
  });

  it('preserves a provided selectedRecommendationKit', () => {
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
      inventorySets: [{ index: 0, originalName: 'Test', sections: ['items'] }],
    });

    const imported = Object.values(result.inventorySets).find(
      (s) => s.name === 'Test',
    );
    expect(imported?.selectedRecommendationKit).toBe('custom-kit');
  });

  it('defaults uploadedRecommendationKits to [] when absent', () => {
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
      inventorySets: [{ index: 0, originalName: 'Test', sections: ['items'] }],
    });

    const imported = Object.values(result.inventorySets).find(
      (s) => s.name === 'Test',
    );
    expect(imported?.uploadedRecommendationKits).toEqual([]);
  });

  it('uses default household when household section is not selected', () => {
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

    const result = importMultiInventory(importData, {
      includeSettings: false,
      inventorySets: [{ index: 0, originalName: 'Test', sections: ['items'] }],
    });

    const imported = Object.values(result.inventorySets).find(
      (s) => s.name === 'Test',
    );
    expect(imported?.household.adults).toBe(2);
    expect(imported?.household.supplyDurationDays).toBe(3);
  });

  it('uses imported household when section is selected', () => {
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

  it('uses empty disabledCategories when section is not selected', () => {
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

    const result = importMultiInventory(importData, {
      includeSettings: false,
      inventorySets: [{ index: 0, originalName: 'Test', sections: ['items'] }],
    });

    const imported = Object.values(result.inventorySets).find(
      (s) => s.name === 'Test',
    );
    expect(imported?.disabledCategories).toEqual([]);
  });

  it('imports disabledCategories when section is selected', () => {
    const importData = {
      version: CURRENT_SCHEMA_VERSION,
      exportedAt: '2024-01-01T00:00:00.000Z',
      appVersion: '1.0.0',
      inventorySets: [
        {
          name: 'Test',
          includedSections: ['disabledCategories'],
          data: { id: '', name: 'Test', disabledCategories: ['food'] },
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

  it('leaves customRecommendedItems undefined when section is not selected', () => {
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

    const result = importMultiInventory(importData, {
      includeSettings: false,
      inventorySets: [{ index: 0, originalName: 'Test', sections: ['items'] }],
    });

    const imported = Object.values(result.inventorySets).find(
      (s) => s.name === 'Test',
    );
    expect(imported?.customRecommendedItems).toBeUndefined();
  });
});

// ===========================================================================
// exportMultiInventory — payload shape and metadata
// ===========================================================================
describe('exportMultiInventory payload shape', () => {
  it('includes id, name, lastModified for each exported set', () => {
    getAppData();
    const root = getRootStorageForExport()!;
    const inventorySet = root.inventorySets[DEFAULT_INVENTORY_SET_ID as string];

    const json = exportMultiInventory(root, {
      includeSettings: false,
      inventorySets: [{ id: DEFAULT_INVENTORY_SET_ID, sections: [] }],
    });
    const parsed = JSON.parse(json) as MultiInventoryExportData;

    expect(parsed.inventorySets[0].data.id).toBe(inventorySet.id);
    expect(parsed.inventorySets[0].data.name).toBe(inventorySet.name);
    expect(parsed.inventorySets[0].data.lastModified).toBe(
      inventorySet.lastModified,
    );
  });

  it('exports disabledCategories when section is selected', () => {
    getAppData();
    const root = getRootStorageForExport()!;
    root.inventorySets[DEFAULT_INVENTORY_SET_ID as string].disabledCategories =
      ['food'];

    const json = exportMultiInventory(root, {
      includeSettings: false,
      inventorySets: [
        { id: DEFAULT_INVENTORY_SET_ID, sections: ['disabledCategories'] },
      ],
    });
    const parsed = JSON.parse(json) as MultiInventoryExportData;

    expect(parsed.inventorySets[0].data.disabledCategories).toEqual(['food']);
  });

  it('includes appVersion in output', () => {
    getAppData();
    const root = getRootStorageForExport()!;

    const json = exportMultiInventory(root, {
      includeSettings: false,
      inventorySets: [{ id: DEFAULT_INVENTORY_SET_ID, sections: [] }],
    });
    const parsed = JSON.parse(json) as MultiInventoryExportData;

    expect(parsed.appVersion).toBe(APP_VERSION);
    expect(parsed.appVersion.length).toBeGreaterThan(0);
  });

  it('includes a valid exportedAt timestamp', () => {
    getAppData();
    const root = getRootStorageForExport()!;

    const json = exportMultiInventory(root, {
      includeSettings: false,
      inventorySets: [],
    });
    const parsed = JSON.parse(json) as MultiInventoryExportData;

    expect(parsed.exportedAt).toBeDefined();
    const date = new Date(parsed.exportedAt);
    expect(date.getTime()).not.toBeNaN();
  });
});
