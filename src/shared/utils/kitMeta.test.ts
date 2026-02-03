import { describe, it, expect } from 'vitest';
import { getLocalizedKitMetaString } from './kitMeta';

describe('getLocalizedKitMetaString', () => {
  it('returns empty string for undefined', () => {
    expect(getLocalizedKitMetaString(undefined, 'en')).toBe('');
  });

  it('returns string as-is', () => {
    expect(getLocalizedKitMetaString('72 Hours Standard Kit', 'en')).toBe(
      '72 Hours Standard Kit',
    );
    expect(getLocalizedKitMetaString('72 Hours Standard Kit', 'fi')).toBe(
      '72 Hours Standard Kit',
    );
  });

  it('returns requested language when present', () => {
    const value = { en: '72 Hours Kit', fi: '72 tunnin paketti' };
    expect(getLocalizedKitMetaString(value, 'fi')).toBe('72 tunnin paketti');
    expect(getLocalizedKitMetaString(value, 'en')).toBe('72 Hours Kit');
  });

  it('falls back to English when requested language is missing', () => {
    const value = { en: '72 Hours Kit', fi: '72 tunnin paketti' };
    expect(getLocalizedKitMetaString(value, 'sv')).toBe('72 Hours Kit');
  });

  it('falls back to first available value when en is missing (edge case)', () => {
    const value = { fi: '72 tunnin paketti' };
    expect(getLocalizedKitMetaString(value, 'en')).toBe('72 tunnin paketti');
  });

  it('returns empty string for empty object', () => {
    expect(getLocalizedKitMetaString({}, 'en')).toBe('');
  });
});
