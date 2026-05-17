import { useState } from 'react';

const KEY = 'est:design:prefs';

export interface DesignPrefs {
  reduceMotion: boolean;
  trackHygieneWaterSeparately: boolean;
  planViewBeta: boolean;
}

const DEFAULTS: DesignPrefs = {
  reduceMotion: false,
  trackHygieneWaterSeparately: false,
  planViewBeta: false,
};

function load(): DesignPrefs {
  try {
    const raw = localStorage.getItem(KEY);
    return raw
      ? { ...DEFAULTS, ...(JSON.parse(raw) as Partial<DesignPrefs>) }
      : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

function save(prefs: DesignPrefs) {
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch {
    /* ignore */
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
