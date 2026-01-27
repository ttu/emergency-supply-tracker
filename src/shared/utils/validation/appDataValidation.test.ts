import { describe, it, expect } from 'vitest';
import { isValidAppData, validateAppDataValues } from './appDataValidation';
import { CURRENT_SCHEMA_VERSION } from '@/shared/utils/storage/migrations';
import type { AppData } from '@/shared/types';

describe('isValidAppData', () => {
  const validAppData = {
    version: CURRENT_SCHEMA_VERSION,
    household: { adults: 2, children: 0, supplyDays: 3, useFreezer: false },
    settings: { language: 'en', theme: 'ocean' },
    items: [],
    lastModified: '2024-01-01T00:00:00.000Z',
  };

  it('returns true for valid AppData', () => {
    expect(isValidAppData(validAppData)).toBe(true);
  });

  it('returns true for AppData with items', () => {
    const dataWithItems = {
      ...validAppData,
      items: [{ id: '1', name: 'Test' }],
    };
    expect(isValidAppData(dataWithItems)).toBe(true);
  });

  it('returns false for null', () => {
    expect(isValidAppData(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isValidAppData(undefined)).toBe(false);
  });

  it('returns false for non-object', () => {
    expect(isValidAppData('string')).toBe(false);
    expect(isValidAppData(123)).toBe(false);
    expect(isValidAppData(true)).toBe(false);
  });

  it('returns false when version is missing', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { version: _version, ...data } = validAppData;
    expect(isValidAppData(data)).toBe(false);
  });

  it('returns false when version is not a string', () => {
    expect(isValidAppData({ ...validAppData, version: 123 })).toBe(false);
  });

  it('returns false when household is missing', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { household: _household, ...data } = validAppData;
    expect(isValidAppData(data)).toBe(false);
  });

  it('returns false when household is null', () => {
    expect(isValidAppData({ ...validAppData, household: null })).toBe(false);
  });

  it('returns false when household is an array', () => {
    expect(isValidAppData({ ...validAppData, household: [] })).toBe(false);
  });

  it('returns false when settings is missing', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { settings: _settings, ...data } = validAppData;
    expect(isValidAppData(data)).toBe(false);
  });

  it('returns false when settings is null', () => {
    expect(isValidAppData({ ...validAppData, settings: null })).toBe(false);
  });

  it('returns false when settings is an array', () => {
    expect(isValidAppData({ ...validAppData, settings: [] })).toBe(false);
  });

  it('returns false when items is missing', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { items: _items, ...data } = validAppData;
    expect(isValidAppData(data)).toBe(false);
  });

  it('returns false when items is not an array', () => {
    expect(isValidAppData({ ...validAppData, items: {} })).toBe(false);
    expect(isValidAppData({ ...validAppData, items: 'items' })).toBe(false);
  });

  it('returns false when lastModified is missing', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { lastModified: _lastModified, ...data } = validAppData;
    expect(isValidAppData(data)).toBe(false);
  });

  it('returns false when lastModified is not a string', () => {
    expect(isValidAppData({ ...validAppData, lastModified: 12345 })).toBe(
      false,
    );
  });

  it('returns true when optional categories is present', () => {
    const dataWithCategories = {
      ...validAppData,
      categories: [{ id: 'food', name: 'Food' }],
    };
    expect(isValidAppData(dataWithCategories)).toBe(true);
  });
});

describe('validateAppDataValues', () => {
  const createValidAppData = (): AppData => ({
    version: CURRENT_SCHEMA_VERSION,
    household: {
      adults: 2,
      children: 0,
      pets: 0,
      supplyDurationDays: 3,
      useFreezer: false,
    },
    settings: {
      language: 'en',
      theme: 'ocean',
      highContrast: false,
      advancedFeatures: {
        calorieTracking: false,
        powerManagement: false,
        waterTracking: false,
      },
    },
    customCategories: [],
    disabledCategories: [],
    items: [],
    customTemplates: [],
    dismissedAlertIds: [],
    disabledRecommendedItems: [],
    lastModified: '2024-01-01T00:00:00.000Z',
  });

  it('returns isValid: true for valid data', () => {
    const result = validateAppDataValues(createValidAppData());
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  describe('settings validation', () => {
    it('detects invalid language', () => {
      const data = createValidAppData();
      // @ts-expect-error - testing invalid value
      data.settings.language = 'invalid';
      const result = validateAppDataValues(data);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('settings.language');
    });

    it('detects invalid theme', () => {
      const data = createValidAppData();
      // @ts-expect-error - testing invalid value
      data.settings.theme = 'invalid-theme';
      const result = validateAppDataValues(data);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('settings.theme');
    });

    it('detects negative dailyCaloriesPerPerson', () => {
      const data = createValidAppData();
      data.settings.dailyCaloriesPerPerson = -100;
      const result = validateAppDataValues(data);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('settings.dailyCaloriesPerPerson');
    });

    it('detects negative dailyWaterPerPerson', () => {
      const data = createValidAppData();
      data.settings.dailyWaterPerPerson = -5;
      const result = validateAppDataValues(data);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('settings.dailyWaterPerPerson');
    });

    it('detects childrenRequirementPercentage out of range (negative)', () => {
      const data = createValidAppData();
      data.settings.childrenRequirementPercentage = -10;
      const result = validateAppDataValues(data);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe(
        'settings.childrenRequirementPercentage',
      );
    });

    it('detects childrenRequirementPercentage out of range (>100)', () => {
      const data = createValidAppData();
      data.settings.childrenRequirementPercentage = 150;
      const result = validateAppDataValues(data);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe(
        'settings.childrenRequirementPercentage',
      );
    });

    it('accepts valid optional settings values', () => {
      const data = createValidAppData();
      data.settings.dailyCaloriesPerPerson = 2500;
      data.settings.dailyWaterPerPerson = 3.5;
      data.settings.childrenRequirementPercentage = 75;
      const result = validateAppDataValues(data);
      expect(result.isValid).toBe(true);
    });
  });

  describe('household validation', () => {
    it('detects negative adults', () => {
      const data = createValidAppData();
      data.household.adults = -1;
      const result = validateAppDataValues(data);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe('household.adults');
    });

    it('detects negative children', () => {
      const data = createValidAppData();
      data.household.children = -5;
      const result = validateAppDataValues(data);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe('household.children');
    });

    it('detects negative pets', () => {
      const data = createValidAppData();
      data.household.pets = -2;
      const result = validateAppDataValues(data);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe('household.pets');
    });

    it('detects negative supplyDurationDays', () => {
      const data = createValidAppData();
      data.household.supplyDurationDays = -7;
      const result = validateAppDataValues(data);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe('household.supplyDurationDays');
    });

    it('detects non-finite number (Infinity)', () => {
      const data = createValidAppData();
      data.household.adults = Infinity;
      const result = validateAppDataValues(data);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe('household.adults');
    });

    it('detects non-finite number (NaN)', () => {
      const data = createValidAppData();
      data.household.adults = Number.NaN;
      const result = validateAppDataValues(data);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe('household.adults');
    });

    it('detects non-boolean useFreezer', () => {
      const data = createValidAppData();
      // @ts-expect-error - testing invalid value
      data.household.useFreezer = 'yes';
      const result = validateAppDataValues(data);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe('household.useFreezer');
    });

    it('accepts valid household values', () => {
      const data = createValidAppData();
      data.household.adults = 4;
      data.household.children = 2;
      data.household.pets = 1;
      data.household.supplyDurationDays = 14;
      data.household.useFreezer = true;
      const result = validateAppDataValues(data);
      expect(result.isValid).toBe(true);
    });
  });

  describe('multiple errors', () => {
    it('collects all validation errors', () => {
      const data = createValidAppData();
      // @ts-expect-error - testing invalid value
      data.settings.language = 'invalid';
      // @ts-expect-error - testing invalid value
      data.settings.theme = 'bad-theme';
      data.household.adults = -1;
      const result = validateAppDataValues(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(3);
    });
  });
});
