import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useDesignPrefs } from './useDesignPref';

const KEY = 'est:design-prefs';
const LEGACY_KEY = 'est:design:prefs';

describe('useDesignPrefs', () => {
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('defaults both prefs to off', () => {
    const { result } = renderHook(() => useDesignPrefs());
    expect(result.current[0]).toEqual({ reduceMotion: false });
  });

  it('merges a partial stored value over the defaults', () => {
    localStorage.setItem(KEY, JSON.stringify({ reduceMotion: true }));
    const { result } = renderHook(() => useDesignPrefs());
    expect(result.current[0].reduceMotion).toBe(true);
  });

  it('falls back to defaults when the stored value is unparseable', () => {
    localStorage.setItem(KEY, 'not json');
    const { result } = renderHook(() => useDesignPrefs());
    expect(result.current[0].reduceMotion).toBe(false);
  });

  it('persists an update', () => {
    const { result } = renderHook(() => useDesignPrefs());

    act(() => result.current[1]('reduceMotion', true));

    expect(result.current[0].reduceMotion).toBe(true);
    expect(JSON.parse(localStorage.getItem(KEY)!).reduceMotion).toBe(true);
  });

  it('migrates the pre-1.0 key once, then clears it', () => {
    localStorage.setItem(LEGACY_KEY, JSON.stringify({ reduceMotion: true }));

    const { result } = renderHook(() => useDesignPrefs());

    expect(result.current[0].reduceMotion).toBe(true);
    expect(localStorage.getItem(LEGACY_KEY)).toBeNull();
    expect(JSON.parse(localStorage.getItem(KEY)!).reduceMotion).toBe(true);
  });

  it('prefers the current key over a stale legacy one', () => {
    localStorage.setItem(KEY, JSON.stringify({ reduceMotion: false }));
    localStorage.setItem(LEGACY_KEY, JSON.stringify({ reduceMotion: true }));
    const { result } = renderHook(() => useDesignPrefs());
    expect(result.current[0].reduceMotion).toBe(false);
  });

  it('survives a storage write failure', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded');
    });
    const { result } = renderHook(() => useDesignPrefs());

    expect(() =>
      act(() => result.current[1]('reduceMotion', true)),
    ).not.toThrow();
    expect(result.current[0].reduceMotion).toBe(true);
  });

  describe('reduce motion', () => {
    it('marks the document so the stylesheet can stop animating', () => {
      // The pref was stored and read back to render its own switch, and
      // nothing else ever looked at it — the toggle disabled no transition.
      const { result } = renderHook(() => useDesignPrefs());

      act(() => result.current[1]('reduceMotion', true));

      expect(document.documentElement.dataset.reduceMotion).toBe('true');
    });

    it('marks the document on mount from what was already stored', () => {
      localStorage.setItem(KEY, JSON.stringify({ reduceMotion: true }));
      renderHook(() => useDesignPrefs());
      expect(document.documentElement.dataset.reduceMotion).toBe('true');
    });

    it('clears the mark when switched back off', () => {
      const { result } = renderHook(() => useDesignPrefs());
      act(() => result.current[1]('reduceMotion', true));
      act(() => result.current[1]('reduceMotion', false));
      expect(document.documentElement.dataset.reduceMotion).toBe('false');
    });
  });
});
