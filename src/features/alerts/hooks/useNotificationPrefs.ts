import { useCallback, useState } from 'react';

/**
 * Per-category notification preferences. All default to `true` — turning a
 * category off suppresses those alerts from the dashboard surface.
 */
export interface NotificationPrefs {
  /** Critical alerts (items at zero / expired / categories with no coverage). */
  critical: boolean;
  /** Low-stock warnings (categories below recommended thresholds, water shortage). */
  lowStock: boolean;
  /** Expiry warnings (items expiring within the warn window). */
  expiry: boolean;
  /** Backup reminder when no export has happened recently. */
  backup: boolean;
}

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  critical: true,
  lowStock: true,
  expiry: true,
  backup: true,
};

const STORAGE_KEY = 'est:notification-prefs';
// Pre-1.0 key used while v2 was an exploration. Migrated on first read.
const LEGACY_STORAGE_KEY = 'est:design:notification-prefs';

function readFromKey(key: string): Partial<NotificationPrefs> | undefined {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Partial<NotificationPrefs>) : undefined;
  } catch {
    return undefined;
  }
}

function loadPrefs(): NotificationPrefs {
  const current = readFromKey(STORAGE_KEY);
  if (current) return { ...DEFAULT_NOTIFICATION_PREFS, ...current };

  // Migrate the legacy `est:design:*` key once and clear it.
  const legacy = readFromKey(LEGACY_STORAGE_KEY);
  if (legacy) {
    const merged = { ...DEFAULT_NOTIFICATION_PREFS, ...legacy };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    return merged;
  }

  return DEFAULT_NOTIFICATION_PREFS;
}

function savePrefs(prefs: NotificationPrefs): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    /* ignore */
  }
}

/**
 * Read the prefs without subscribing to React state. Used by hooks that need a
 * snapshot at render time (e.g. {@link useDashboardAlerts}).
 */
export function readNotificationPrefs(): NotificationPrefs {
  return loadPrefs();
}

/** React hook for the NotificationsSection editor. */
export function useNotificationPrefs(): readonly [
  NotificationPrefs,
  (key: keyof NotificationPrefs, value: boolean) => void,
] {
  const [prefs, setPrefs] = useState<NotificationPrefs>(loadPrefs);
  const set = useCallback(
    (key: keyof NotificationPrefs, value: boolean) => {
      const next = { ...prefs, [key]: value };
      setPrefs(next);
      savePrefs(next);
    },
    [prefs],
  );
  return [prefs, set] as const;
}
