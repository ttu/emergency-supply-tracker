import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import {
  DEFAULT_NOTIFICATION_PREFS,
  readNotificationPrefs,
  useNotificationPrefs,
} from './useNotificationPrefs';

const STORAGE_KEY = 'est:notification-prefs';
const LEGACY_STORAGE_KEY = 'est:design:notification-prefs';

describe('notification prefs', () => {
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('readNotificationPrefs', () => {
    it('defaults every category to on', () => {
      expect(readNotificationPrefs()).toEqual(DEFAULT_NOTIFICATION_PREFS);
    });

    it('merges a partial stored value over the defaults', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ backup: false }));
      expect(readNotificationPrefs()).toEqual({
        ...DEFAULT_NOTIFICATION_PREFS,
        backup: false,
      });
    });

    it('falls back to defaults when the stored value is unparseable', () => {
      localStorage.setItem(STORAGE_KEY, 'not json');
      expect(readNotificationPrefs()).toEqual(DEFAULT_NOTIFICATION_PREFS);
    });

    it('migrates the pre-1.0 key once, then clears it', () => {
      localStorage.setItem(
        LEGACY_STORAGE_KEY,
        JSON.stringify({ expiry: false }),
      );

      expect(readNotificationPrefs()).toEqual({
        ...DEFAULT_NOTIFICATION_PREFS,
        expiry: false,
      });
      expect(localStorage.getItem(LEGACY_STORAGE_KEY)).toBeNull();
      expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual({
        ...DEFAULT_NOTIFICATION_PREFS,
        expiry: false,
      });
    });

    it('prefers the current key over a stale legacy one', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ critical: false }));
      localStorage.setItem(
        LEGACY_STORAGE_KEY,
        JSON.stringify({ critical: true }),
      );
      expect(readNotificationPrefs().critical).toBe(false);
    });
  });

  describe('useNotificationPrefs', () => {
    it('exposes the stored prefs and persists a change', () => {
      const { result } = renderHook(() => useNotificationPrefs());
      expect(result.current[0]).toEqual(DEFAULT_NOTIFICATION_PREFS);

      act(() => result.current[1]('lowStock', false));

      expect(result.current[0].lowStock).toBe(false);
      expect(readNotificationPrefs().lowStock).toBe(false);
    });

    it('keeps a stable setter so consumers can memoise on it', () => {
      const { result } = renderHook(() => useNotificationPrefs());
      const setter = result.current[1];

      act(() => result.current[1]('backup', false));

      expect(result.current[1]).toBe(setter);
    });

    it('composes multiple updates made in the same tick', () => {
      const { result } = renderHook(() => useNotificationPrefs());

      act(() => {
        result.current[1]('critical', false);
        result.current[1]('expiry', false);
      });

      expect(result.current[0]).toEqual({
        ...DEFAULT_NOTIFICATION_PREFS,
        critical: false,
        expiry: false,
      });
    });

    it('survives a storage write failure without throwing', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('quota exceeded');
      });
      const { result } = renderHook(() => useNotificationPrefs());

      expect(() => act(() => result.current[1]('backup', false))).not.toThrow();
      expect(result.current[0].backup).toBe(false);
    });
  });
});
