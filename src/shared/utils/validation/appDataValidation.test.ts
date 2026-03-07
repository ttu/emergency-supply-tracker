import { describe, it, expect } from 'vitest';
import { isValidAppData, validateAppDataValues } from './appDataValidation';
import { CURRENT_SCHEMA_VERSION } from '@/shared/utils/storage/migrations';
import type { AppData, Percentage } from '@/shared/types';
import { createPercentage } from '@/shared/types';

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

  it('returns false when household is a string', () => {
    expect(isValidAppData({ ...validAppData, household: 'household' })).toBe(
      false,
    );
  });

  it('returns false when household is a number', () => {
    expect(isValidAppData({ ...validAppData, household: 42 })).toBe(false);
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

  it('returns false when settings is a string', () => {
    expect(isValidAppData({ ...validAppData, settings: 'settings' })).toBe(
      false,
    );
  });

  it('returns false when settings is a number', () => {
    expect(isValidAppData({ ...validAppData, settings: 0 })).toBe(false);
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
    it('detects invalid language and includes correct error message and interpolation', () => {
      const data = createValidAppData();
      // @ts-expect-error - testing invalid value
      data.settings.language = 'invalid';
      const result = validateAppDataValues(data);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('settings.language');
      expect(result.errors[0].message).toBe(
        'validation.settings.languageInvalid',
      );
      expect(result.errors[0].value).toBe('invalid');
      expect(result.errors[0].interpolation).toBeDefined();
      expect(result.errors[0].interpolation).toEqual(
        expect.objectContaining({
          value: 'invalid',
          allowed: expect.stringContaining('en'),
        }),
      );
    });

    it('does not flag language when it is undefined (optional field)', () => {
      const data = createValidAppData();
      // @ts-expect-error - removing field to test optional behavior
      delete data.settings.language;
      const result = validateAppDataValues(data);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('detects invalid theme and includes correct error message and interpolation', () => {
      const data = createValidAppData();
      // @ts-expect-error - testing invalid value
      data.settings.theme = 'invalid-theme';
      const result = validateAppDataValues(data);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('settings.theme');
      expect(result.errors[0].message).toBe('validation.settings.themeInvalid');
      expect(result.errors[0].value).toBe('invalid-theme');
      expect(result.errors[0].interpolation).toBeDefined();
      expect(result.errors[0].interpolation).toEqual(
        expect.objectContaining({
          value: 'invalid-theme',
          allowed: expect.any(String),
        }),
      );
    });

    it('does not flag theme when it is undefined (optional field)', () => {
      const data = createValidAppData();
      // @ts-expect-error - removing field to test optional behavior
      delete data.settings.theme;
      const result = validateAppDataValues(data);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('detects negative dailyCaloriesPerPerson with correct message', () => {
      const data = createValidAppData();
      data.settings.dailyCaloriesPerPerson = -100;
      const result = validateAppDataValues(data);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('settings.dailyCaloriesPerPerson');
      expect(result.errors[0].message).toBe(
        'validation.settings.dailyCaloriesPerPerson',
      );
      expect(result.errors[0].value).toBe(-100);
    });

    it('accepts dailyCaloriesPerPerson of exactly 0 (boundary: valid)', () => {
      const data = createValidAppData();
      data.settings.dailyCaloriesPerPerson = 0;
      const result = validateAppDataValues(data);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('accepts positive dailyCaloriesPerPerson', () => {
      const data = createValidAppData();
      data.settings.dailyCaloriesPerPerson = 1;
      const result = validateAppDataValues(data);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('detects non-finite dailyCaloriesPerPerson (NaN)', () => {
      const data = createValidAppData();
      data.settings.dailyCaloriesPerPerson = Number.NaN;
      const result = validateAppDataValues(data);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe('settings.dailyCaloriesPerPerson');
      expect(result.errors[0].message).toBe(
        'validation.settings.dailyCaloriesPerPerson',
      );
    });

    it('detects non-finite dailyCaloriesPerPerson (Infinity)', () => {
      const data = createValidAppData();
      data.settings.dailyCaloriesPerPerson = Infinity;
      const result = validateAppDataValues(data);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe('settings.dailyCaloriesPerPerson');
    });

    it('does not flag dailyCaloriesPerPerson when undefined (optional field)', () => {
      const data = createValidAppData();
      delete data.settings.dailyCaloriesPerPerson;
      const result = validateAppDataValues(data);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('detects negative dailyWaterPerPerson with correct message', () => {
      const data = createValidAppData();
      data.settings.dailyWaterPerPerson = -5;
      const result = validateAppDataValues(data);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('settings.dailyWaterPerPerson');
      expect(result.errors[0].message).toBe(
        'validation.settings.dailyWaterPerPerson',
      );
      expect(result.errors[0].value).toBe(-5);
    });

    it('accepts dailyWaterPerPerson of exactly 0 (boundary: valid)', () => {
      const data = createValidAppData();
      data.settings.dailyWaterPerPerson = 0;
      const result = validateAppDataValues(data);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('accepts positive dailyWaterPerPerson', () => {
      const data = createValidAppData();
      data.settings.dailyWaterPerPerson = 1;
      const result = validateAppDataValues(data);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('detects non-finite dailyWaterPerPerson (NaN)', () => {
      const data = createValidAppData();
      data.settings.dailyWaterPerPerson = Number.NaN;
      const result = validateAppDataValues(data);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe('settings.dailyWaterPerPerson');
      expect(result.errors[0].message).toBe(
        'validation.settings.dailyWaterPerPerson',
      );
    });

    it('does not flag dailyWaterPerPerson when undefined (optional field)', () => {
      const data = createValidAppData();
      delete data.settings.dailyWaterPerPerson;
      const result = validateAppDataValues(data);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('detects childrenRequirementPercentage below minimum (negative) with correct message', () => {
      const data = createValidAppData();
      data.settings.childrenRequirementPercentage =
        -10 as unknown as Percentage;
      const result = validateAppDataValues(data);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe(
        'settings.childrenRequirementPercentage',
      );
      expect(result.errors[0].message).toBe(
        'validation.settings.childrenRequirementPercentage',
      );
      expect(result.errors[0].value).toBe(-10);
    });

    it('accepts childrenRequirementPercentage at minimum boundary of exactly 0', () => {
      const data = createValidAppData();
      data.settings.childrenRequirementPercentage = 0 as unknown as Percentage;
      const result = validateAppDataValues(data);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects childrenRequirementPercentage at -1 (one below minimum)', () => {
      const data = createValidAppData();
      data.settings.childrenRequirementPercentage = -1 as unknown as Percentage;
      const result = validateAppDataValues(data);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe(
        'settings.childrenRequirementPercentage',
      );
    });

    it('detects childrenRequirementPercentage above maximum (>100) with correct message', () => {
      const data = createValidAppData();
      data.settings.childrenRequirementPercentage =
        150 as unknown as Percentage;
      const result = validateAppDataValues(data);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe(
        'settings.childrenRequirementPercentage',
      );
      expect(result.errors[0].message).toBe(
        'validation.settings.childrenRequirementPercentage',
      );
      expect(result.errors[0].value).toBe(150);
    });

    it('accepts childrenRequirementPercentage at maximum boundary of exactly 100', () => {
      const data = createValidAppData();
      data.settings.childrenRequirementPercentage =
        100 as unknown as Percentage;
      const result = validateAppDataValues(data);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects childrenRequirementPercentage at 101 (one above maximum)', () => {
      const data = createValidAppData();
      data.settings.childrenRequirementPercentage =
        101 as unknown as Percentage;
      const result = validateAppDataValues(data);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe(
        'settings.childrenRequirementPercentage',
      );
    });

    it('detects non-finite childrenRequirementPercentage (NaN)', () => {
      const data = createValidAppData();
      data.settings.childrenRequirementPercentage =
        Number.NaN as unknown as Percentage;
      const result = validateAppDataValues(data);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe(
        'settings.childrenRequirementPercentage',
      );
      expect(result.errors[0].message).toBe(
        'validation.settings.childrenRequirementPercentage',
      );
    });

    it('does not flag childrenRequirementPercentage when undefined (optional field)', () => {
      const data = createValidAppData();
      delete data.settings.childrenRequirementPercentage;
      const result = validateAppDataValues(data);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('accepts valid optional settings values', () => {
      const data = createValidAppData();
      data.settings.dailyCaloriesPerPerson = 2500;
      data.settings.dailyWaterPerPerson = 3.5;
      data.settings.childrenRequirementPercentage = createPercentage(75);
      const result = validateAppDataValues(data);
      expect(result.isValid).toBe(true);
    });

    it('skips settings validation when settings is falsy (null-like cast)', () => {
      const data = createValidAppData();
      // Simulate settings being falsy — validateAppDataValues guards with `data.settings &&`
      // Force via type assertion to test the guard branch
      (data as unknown as Record<string, unknown>).settings = null;
      const result = validateAppDataValues(data);
      // Should not crash and should not produce settings errors
      expect(
        result.errors.filter((e) => e.field.startsWith('settings')),
      ).toHaveLength(0);
    });

    it('skips settings validation when settings is false (logical guard test)', () => {
      const data = createValidAppData();
      (data as unknown as Record<string, unknown>).settings = false;
      const result = validateAppDataValues(data);
      expect(
        result.errors.filter((e) => e.field.startsWith('settings')),
      ).toHaveLength(0);
    });

    it('skips settings validation when settings is 0 (falsy number)', () => {
      const data = createValidAppData();
      (data as unknown as Record<string, unknown>).settings = 0;
      const result = validateAppDataValues(data);
      expect(
        result.errors.filter((e) => e.field.startsWith('settings')),
      ).toHaveLength(0);
    });

    it('skips settings validation when settings is a truthy non-object (string)', () => {
      const data = createValidAppData();
      (data as unknown as Record<string, unknown>).settings = 'not-an-object';
      const result = validateAppDataValues(data);
      expect(
        result.errors.filter((e) => e.field.startsWith('settings')),
      ).toHaveLength(0);
    });

    it('skips settings validation when settings is a truthy non-object (number)', () => {
      const data = createValidAppData();
      (data as unknown as Record<string, unknown>).settings = 42;
      const result = validateAppDataValues(data);
      expect(
        result.errors.filter((e) => e.field.startsWith('settings')),
      ).toHaveLength(0);
    });
  });

  describe('household validation', () => {
    it('detects negative adults with correct message and interpolation', () => {
      const data = createValidAppData();
      data.household.adults = -1;
      const result = validateAppDataValues(data);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe('household.adults');
      expect(result.errors[0].message).toBe(
        'validation.household.nonNegativeNumber',
      );
      expect(result.errors[0].value).toBe(-1);
      expect(result.errors[0].interpolation).toBeDefined();
      expect(result.errors[0].interpolation).toEqual(
        expect.objectContaining({ field: 'adults' }),
      );
    });

    it('accepts adults of exactly 0 (boundary: valid)', () => {
      const data = createValidAppData();
      data.household.adults = 0;
      const result = validateAppDataValues(data);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('detects negative children with correct message', () => {
      const data = createValidAppData();
      data.household.children = -5;
      const result = validateAppDataValues(data);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe('household.children');
      expect(result.errors[0].message).toBe(
        'validation.household.nonNegativeNumber',
      );
      expect(result.errors[0].interpolation).toEqual(
        expect.objectContaining({ field: 'children' }),
      );
    });

    it('detects negative pets with correct message', () => {
      const data = createValidAppData();
      data.household.pets = -2;
      const result = validateAppDataValues(data);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe('household.pets');
      expect(result.errors[0].message).toBe(
        'validation.household.nonNegativeNumber',
      );
      expect(result.errors[0].interpolation).toEqual(
        expect.objectContaining({ field: 'pets' }),
      );
    });

    it('detects negative supplyDurationDays with correct message', () => {
      const data = createValidAppData();
      data.household.supplyDurationDays = -7;
      const result = validateAppDataValues(data);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe('household.supplyDurationDays');
      expect(result.errors[0].message).toBe(
        'validation.household.nonNegativeNumber',
      );
      expect(result.errors[0].interpolation).toEqual(
        expect.objectContaining({ field: 'supplyDurationDays' }),
      );
    });

    it('detects non-finite number (Infinity) with correct message', () => {
      const data = createValidAppData();
      data.household.adults = Infinity;
      const result = validateAppDataValues(data);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe('household.adults');
      expect(result.errors[0].message).toBe(
        'validation.household.nonNegativeNumber',
      );
    });

    it('detects non-finite number (NaN) with correct message', () => {
      const data = createValidAppData();
      data.household.adults = Number.NaN;
      const result = validateAppDataValues(data);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe('household.adults');
      expect(result.errors[0].message).toBe(
        'validation.household.nonNegativeNumber',
      );
    });

    it('detects non-number type for adults (string) with correct message', () => {
      const data = createValidAppData();
      // @ts-expect-error - testing invalid value
      data.household.adults = '2';
      const result = validateAppDataValues(data);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe('household.adults');
      expect(result.errors[0].message).toBe(
        'validation.household.nonNegativeNumber',
      );
    });

    it('detects non-boolean useFreezer with correct message', () => {
      const data = createValidAppData();
      // @ts-expect-error - testing invalid value
      data.household.useFreezer = 'yes';
      const result = validateAppDataValues(data);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe('household.useFreezer');
      expect(result.errors[0].message).toBe(
        'validation.household.useFreezerBoolean',
      );
      expect(result.errors[0].value).toBe('yes');
    });

    it('detects non-boolean useFreezer (number)', () => {
      const data = createValidAppData();
      // @ts-expect-error - testing invalid value
      data.household.useFreezer = 1;
      const result = validateAppDataValues(data);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe('household.useFreezer');
      expect(result.errors[0].message).toBe(
        'validation.household.useFreezerBoolean',
      );
    });

    it('does not flag useFreezer when undefined (optional field)', () => {
      const data = createValidAppData();
      // @ts-expect-error - removing field to test optional behavior
      delete data.household.useFreezer;
      const result = validateAppDataValues(data);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
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

    it('skips household validation when household is falsy (null-like cast)', () => {
      const data = createValidAppData();
      (data as unknown as Record<string, unknown>).household = null;
      const result = validateAppDataValues(data);
      expect(
        result.errors.filter((e) => e.field.startsWith('household')),
      ).toHaveLength(0);
    });

    it('skips household validation when household is false (logical guard test)', () => {
      const data = createValidAppData();
      (data as unknown as Record<string, unknown>).household = false;
      const result = validateAppDataValues(data);
      expect(
        result.errors.filter((e) => e.field.startsWith('household')),
      ).toHaveLength(0);
    });

    it('skips household validation when household is 0 (falsy number)', () => {
      const data = createValidAppData();
      (data as unknown as Record<string, unknown>).household = 0;
      const result = validateAppDataValues(data);
      expect(
        result.errors.filter((e) => e.field.startsWith('household')),
      ).toHaveLength(0);
    });

    it('skips household validation when household is a truthy non-object (string)', () => {
      const data = createValidAppData();
      (data as unknown as Record<string, unknown>).household = 'not-an-object';
      const result = validateAppDataValues(data);
      expect(
        result.errors.filter((e) => e.field.startsWith('household')),
      ).toHaveLength(0);
    });

    it('skips household validation when household is a truthy non-object (number)', () => {
      const data = createValidAppData();
      (data as unknown as Record<string, unknown>).household = 42;
      const result = validateAppDataValues(data);
      expect(
        result.errors.filter((e) => e.field.startsWith('household')),
      ).toHaveLength(0);
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

    it('returns result with isValid false and non-empty errors array when there are errors', () => {
      const data = createValidAppData();
      // @ts-expect-error - testing invalid value
      data.settings.language = 'invalid';
      const result = validateAppDataValues(data);
      expect(result.isValid).toBe(false);
      expect(result.errors).not.toHaveLength(0);
    });

    it('returns result with isValid true and empty errors array for clean data', () => {
      const result = validateAppDataValues(createValidAppData());
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('safeStringify coverage via interpolation values', () => {
    it('includes object language value in interpolation as JSON string', () => {
      const data = createValidAppData();
      // @ts-expect-error - testing invalid value
      data.settings.language = { lang: 'en' };
      const result = validateAppDataValues(data);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].interpolation?.value).toBe('{"lang":"en"}');
    });

    it('includes null language value in interpolation as "null"', () => {
      const data = createValidAppData();
      // @ts-expect-error - testing invalid value
      data.settings.language = null;
      const result = validateAppDataValues(data);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].interpolation?.value).toBe('null');
    });

    it('includes boolean language value in interpolation as string', () => {
      const data = createValidAppData();
      // @ts-expect-error - testing invalid value
      data.settings.language = true;
      const result = validateAppDataValues(data);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].interpolation?.value).toBe('true');
    });

    it('includes numeric language value in interpolation as string', () => {
      const data = createValidAppData();
      // @ts-expect-error - testing invalid value
      data.settings.language = 42;
      const result = validateAppDataValues(data);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].interpolation?.value).toBe('42');
    });

    it('stringifies non-string theme value in interpolation', () => {
      const data = createValidAppData();
      // Setting theme to a value that will be stringified; undefined is tricky
      // since the guard checks `!== undefined`. Use an array to test JSON.stringify path.
      // @ts-expect-error - testing invalid value
      data.settings.theme = [1, 2];
      const result = validateAppDataValues(data);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].interpolation?.value).toBe('[1,2]');
    });

    it('includes string theme value in interpolation as-is', () => {
      const data = createValidAppData();
      // @ts-expect-error - testing invalid value
      data.settings.theme = 'bad-theme';
      const result = validateAppDataValues(data);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].interpolation?.value).toBe('bad-theme');
      expect(result.errors[0].interpolation?.allowed).toContain('ocean');
    });
  });
});
