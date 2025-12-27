import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  getAppData,
  saveAppData,
  clearAppData,
  exportToJSON,
  importFromJSON,
} from './localStorage';
import { createMockAppData, createMockCategory } from '../test/factories';

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
    it('exports data to JSON', () => {
      const mockData = createMockAppData();
      const json = exportToJSON(mockData);
      const parsed = JSON.parse(json);
      expect(parsed).toEqual(mockData);
    });

    it('imports data from JSON with customCategories', () => {
      const mockData = createMockAppData({
        customCategories: [createMockCategory({ id: 'custom-1' })],
      });
      const json = JSON.stringify(mockData);
      const imported = importFromJSON(json);
      expect(imported).toEqual(mockData);
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
  });
});
