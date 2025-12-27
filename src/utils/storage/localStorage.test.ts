import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  getAppData,
  saveAppData,
  clearAppData,
  exportToJSON,
  importFromJSON,
} from './localStorage';
import type { AppData } from '../../types';

const mockData: AppData = {
  version: '1.0.0',
  household: {
    adults: 2,
    children: 1,
    supplyDurationDays: 7,
    hasFreezer: true,
  },
  settings: {
    language: 'en',
    theme: 'light',
    advancedFeatures: {
      calorieTracking: false,
      powerManagement: false,
      waterTracking: false,
    },
  },
  customCategories: [],
  items: [],
  customTemplates: [],
  lastModified: new Date().toISOString(),
};

describe('localStorage utilities', () => {
  beforeEach(() => {
    clearAppData();
  });

  it('saves and loads data', () => {
    saveAppData(mockData);
    const loaded = getAppData();
    expect(loaded).toEqual(mockData);
  });

  it('returns null when no data exists', () => {
    expect(getAppData()).toBeNull();
  });

  it('clears data', () => {
    saveAppData(mockData);
    clearAppData();
    expect(getAppData()).toBeNull();
  });

  describe('import/export', () => {
    it('exports data to JSON', () => {
      const json = exportToJSON(mockData);
      const parsed = JSON.parse(json);
      expect(parsed).toEqual(mockData);
    });

    it('imports data from JSON with customCategories', () => {
      const json = JSON.stringify(mockData);
      const imported = importFromJSON(json);
      expect(imported).toEqual(mockData);
    });

    it('imports data from JSON without customCategories field', () => {
      const dataWithoutCustomCategories = {
        version: '1.0.0',
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
      const legacyData = {
        version: '1.0.0',
        household: mockData.household,
        settings: mockData.settings,
        categories: [
          {
            id: 'custom-1',
            name: 'Custom Category',
            icon: '🎯',
            isCustom: true,
          },
        ],
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
      const dataWithoutTemplates = {
        version: '1.0.0',
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
  });
});
