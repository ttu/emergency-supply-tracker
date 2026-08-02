import { useState } from 'react';

const KEY = 'est:design-prefs';
// Pre-1.0 key used while v2 was an exploration. Migrated on first read.
const LEGACY_KEY = 'est:design:prefs';

export interface DesignPrefs {
  reduceMotion: boolean;
  trackHygieneWaterSeparately: boolean;
}

const DEFAULTS: DesignPrefs = {
  reduceMotion: false,
  trackHygieneWaterSeparately: false,
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

/** Local-only design v2 prefs that don't have backing in UserSettings. */
export function useDesignPrefs(): [
  DesignPrefs,
  (k: keyof DesignPrefs, v: boolean) => void,
] {
  const [prefs, setPrefs] = useState<DesignPrefs>(load);
  const updatePref = (k: keyof DesignPrefs, v: boolean) => {
    const next = { ...prefs, [k]: v };
    setPrefs(next);
    save(next);
  };
  return [prefs, updatePref];
}
