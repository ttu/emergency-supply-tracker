import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useSettingsScrollSpy } from './useSettingsScrollSpy';

const SECTIONS = ['appearance', 'household', 'data'] as const;

type ObserverCallback = (entries: IntersectionObserverEntry[]) => void;

/** Capture the observer so tests can drive intersection events by hand. */
function stubIntersectionObserver() {
  const state: {
    callback?: ObserverCallback;
    observed: Element[];
    disconnected: boolean;
  } = { observed: [], disconnected: false };

  class FakeObserver {
    constructor(cb: ObserverCallback) {
      state.callback = cb;
    }
    observe(el: Element) {
      state.observed.push(el);
    }
    disconnect() {
      state.disconnected = true;
    }
    unobserve() {}
    takeRecords() {
      return [];
    }
  }
  vi.stubGlobal('IntersectionObserver', FakeObserver);
  return state;
}

/** An entry shaped just enough for the hook's sorting. */
const entry = (id: string, top: number, isIntersecting = true) =>
  ({
    target: Object.assign(document.createElement('div'), { id }),
    isIntersecting,
    boundingClientRect: { top } as DOMRect,
  }) as unknown as IntersectionObserverEntry;

function renderSections() {
  document.body.innerHTML = SECTIONS.map(
    (id) => `<div id="sec-${id}"></div>`,
  ).join('');
}

describe('useSettingsScrollSpy', () => {
  beforeEach(() => {
    // jsdom implements neither, and the hook calls whichever applies.
    Element.prototype.scrollIntoView = vi.fn();
    Element.prototype.scrollTo = vi.fn();
    renderSections();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.innerHTML = '';
  });

  it('starts on the first section', () => {
    stubIntersectionObserver();
    const { result } = renderHook(() => useSettingsScrollSpy(SECTIONS, true));
    expect(result.current.activeSection).toBe('appearance');
  });

  it('observes every section that exists in the DOM', () => {
    const observer = stubIntersectionObserver();
    renderHook(() => useSettingsScrollSpy(SECTIONS, true));
    expect(observer.observed).toHaveLength(SECTIONS.length);
  });

  it('activates the topmost intersecting section', () => {
    const observer = stubIntersectionObserver();
    const { result } = renderHook(() => useSettingsScrollSpy(SECTIONS, true));

    act(() =>
      observer.callback?.([entry('sec-data', 300), entry('sec-household', 80)]),
    );

    expect(result.current.activeSection).toBe('household');
  });

  it('falls back to a still-visible section when the active one scrolls out', () => {
    const observer = stubIntersectionObserver();
    const { result } = renderHook(() => useSettingsScrollSpy(SECTIONS, true));

    act(() =>
      observer.callback?.([entry('sec-household', 80), entry('sec-data', 300)]),
    );
    expect(result.current.activeSection).toBe('household');

    // Only the section that left the viewport is reported. The one below it is
    // still on screen and should take over.
    act(() => observer.callback?.([entry('sec-household', -40, false)]));

    expect(result.current.activeSection).toBe('data');
  });

  it('ignores sections that are not intersecting', () => {
    const observer = stubIntersectionObserver();
    const { result } = renderHook(() => useSettingsScrollSpy(SECTIONS, true));

    act(() => observer.callback?.([entry('sec-data', 10, false)]));

    expect(result.current.activeSection).toBe('appearance');
  });

  it('does nothing while disabled', () => {
    const observer = stubIntersectionObserver();
    renderHook(() => useSettingsScrollSpy(SECTIONS, false));
    expect(observer.observed).toHaveLength(0);
  });

  it('disconnects on unmount', () => {
    const observer = stubIntersectionObserver();
    const { unmount } = renderHook(() => useSettingsScrollSpy(SECTIONS, true));
    unmount();
    expect(observer.disconnected).toBe(true);
  });

  it('survives an environment without IntersectionObserver', () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    expect(() =>
      renderHook(() => useSettingsScrollSpy(SECTIONS, true)),
    ).not.toThrow();
  });

  it('observes nothing when the sections are not in the DOM', () => {
    document.body.innerHTML = '';
    const observer = stubIntersectionObserver();
    renderHook(() => useSettingsScrollSpy(SECTIONS, true));
    expect(observer.observed).toHaveLength(0);
  });

  describe('scrollToSection', () => {
    it('marks the requested section active', () => {
      stubIntersectionObserver();
      const { result } = renderHook(() => useSettingsScrollSpy(SECTIONS, true));

      act(() => result.current.scrollToSection('data'));

      expect(result.current.activeSection).toBe('data');
    });

    it('ignores an unknown section', () => {
      stubIntersectionObserver();
      const { result } = renderHook(() => useSettingsScrollSpy(SECTIONS, true));

      act(() => result.current.scrollToSection('nope'));

      expect(result.current.activeSection).toBe('appearance');
    });

    it('scrolls the nearest scrollable ancestor rather than the document', () => {
      stubIntersectionObserver();
      document.body.innerHTML =
        '<div id="scroller" style="overflow-y: auto"><div id="sec-data"></div></div>';
      const scroller = document.getElementById('scroller')!;
      const scrollTo = vi.fn();
      Object.assign(scroller, { scrollTo });

      const { result } = renderHook(() => useSettingsScrollSpy(SECTIONS, true));
      act(() => result.current.scrollToSection('data'));

      expect(scrollTo).toHaveBeenCalledWith(
        expect.objectContaining({ behavior: 'smooth' }),
      );
    });

    it('falls back to scrollIntoView with no scrollable ancestor', () => {
      stubIntersectionObserver();
      const el = document.getElementById('sec-data')!;
      const scrollIntoView = vi.fn();
      Object.assign(el, { scrollIntoView });

      const { result } = renderHook(() => useSettingsScrollSpy(SECTIONS, true));
      act(() => result.current.scrollToSection('data'));

      expect(scrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'start',
      });
    });
  });
});
