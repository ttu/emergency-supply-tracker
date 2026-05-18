const STORAGE_KEY = 'est:shopping-checked';
// Pre-1.0 key used while v2 was an exploration. Migrated on first read.
const LEGACY_STORAGE_KEY = 'est:design:shopping-checked';

function readFromKey(key: string): Record<string, boolean> | undefined {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : undefined;
  } catch {
    return undefined;
  }
}

export function loadCheckedItems(): Record<string, boolean> {
  const current = readFromKey(STORAGE_KEY);
  if (current) return current;

  // One-shot migration from the legacy `est:design:*` namespace.
  const legacy = readFromKey(LEGACY_STORAGE_KEY);
  if (legacy) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(legacy));
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    return legacy;
  }

  return {};
}

export function saveCheckedItems(state: Record<string, boolean>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}
