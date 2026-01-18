import { describe, it, expect } from 'vitest';
import { isValidAppData } from './appDataValidation';
import { CURRENT_SCHEMA_VERSION } from '@/shared/utils/storage/migrations';

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
