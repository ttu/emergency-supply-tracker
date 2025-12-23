import { describe, it, expect, beforeEach } from '@jest/globals';
import { getAppData, saveAppData, clearAppData } from './localStorage';
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
  categories: [],
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
});
