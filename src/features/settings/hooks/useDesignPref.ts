import { useEffect, useRef, useState } from 'react';

const KEY = 'est:design-prefs';
// Pre-1.0 key used while v2 was an exploration. Migrated on first read.
const LEGACY_KEY = 'est:design:prefs';

export interface DesignPrefs {
  reduceMotion: boolean;
}

const DEFAULTS: DesignPrefs = {
  reduceMotion: false,
};

function readFromKey(key: string): Partial<DesignPrefs> | undefined {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Partial<DesignPrefs>) : undefined;
  } catch (error) {
    console.warn(`Failed to read design prefs from "${key}"`, error);
    return undefined;
  }
}

function load(): DesignPrefs {
  const current = readFromKey(KEY);
  if (current) return { ...DEFAULTS, ...current };

  // One-shot migration from the legacy `est:design:*` namespace.
  const legacy = readFromKey(LEGACY_KEY);
  if (legacy) {
    const merged = { ...DEFAULTS, ...legacy };
    try {
      localStorage.setItem(KEY, JSON.stringify(merged));
      localStorage.removeItem(LEGACY_KEY);
    } catch (error) {
      console.warn('Failed to migrate legacy design prefs', error);
    }
    return merged;
  }

  return DEFAULTS;
}

function save(prefs: DesignPrefs) {
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch (error) {
    console.warn('Failed to persist design prefs', error);
  }
}

/**
 * Reflect the prefs the stylesheet acts on onto the document element.
 *
 * `reduceMotion` is a CSS concern — there is no React state to thread it
 * through to every transition on the page — so the root element carries it
 * and `global.css` does the rest.
 */
function applyToDocument(prefs: DesignPrefs) {
  document.documentElement.dataset.reduceMotion = prefs.reduceMotion
    ? 'true'
    : 'false';
}

/** Local-only design v2 prefs that don't have backing in UserSettings. */
export function useDesignPrefs(): [
  DesignPrefs,
  (k: keyof DesignPrefs, v: boolean) => void,
] {
  const [prefs, setPrefs] = useState<DesignPrefs>(load);
  const isFirstRender = useRef(true);

  useEffect(() => {
    applyToDocument(prefs);
    // Skip persisting on mount: `prefs` was just loaded from storage (or
    // defaults), so there is nothing new to save yet.
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    save(prefs);
  }, [prefs]);
  const updatePref = (k: keyof DesignPrefs, v: boolean) => {
    // Functional update: two prefs changed in the same tick must both land,
    // rather than the second overwriting the first from a stale render. The
    // updater only computes the next state — persisting happens in the
    // effect above, since React may invoke this updater more than once
    // (e.g. Strict Mode) and it must stay a pure function of prev state.
    setPrefs((prev) => ({ ...prev, [k]: v }));
  };
  return [prefs, updatePref];
}
