/**
 * Estimates localStorage usage and checks against typical limits.
 * Browsers typically allow ~5 MB per origin for localStorage (UTF-16, so 2 bytes per character).
 */

/** Typical localStorage limit per origin in bytes (~5 MB). */
export const LOCAL_STORAGE_LIMIT_BYTES = 5 * 1024 * 1024;

/** Ratio of limit at which we show a "near limit" warning (e.g. 80%). */
export const STORAGE_WARNING_RATIO = 0.8;

/**
 * Estimates total localStorage usage in bytes for the current origin.
 * Uses key + value length; in browsers strings are UTF-16 so each character ≈ 2 bytes.
 *
 * @returns Estimated bytes used, or 0 if localStorage is unavailable
 */
export function getLocalStorageUsageBytes(): number {
  if (typeof localStorage === 'undefined') {
    return 0;
  }
  let total = 0;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key !== null) {
        const value = localStorage.getItem(key);
        total += (key.length + (value?.length ?? 0)) * 2;
      }
    }
  } catch {
    return 0;
  }
  return total;
}

/**
 * Returns localStorage usage in megabytes.
 *
 * @returns MB used (e.g. 1.25), or 0 if unavailable
 */
export function getLocalStorageUsageMB(): number {
  const bytes = getLocalStorageUsageBytes();
  return Math.round((bytes / (1024 * 1024)) * 100) / 100;
}

/**
 * Whether current localStorage usage is at or above the warning threshold.
 *
 * @param limitBytes - Limit to use (default LOCAL_STORAGE_LIMIT_BYTES)
 * @param warningRatio - Ratio at which to warn (default STORAGE_WARNING_RATIO)
 */
export function isLocalStorageNearLimit(
  limitBytes: number = LOCAL_STORAGE_LIMIT_BYTES,
  warningRatio: number = STORAGE_WARNING_RATIO,
): boolean {
  const used = getLocalStorageUsageBytes();
  return used >= limitBytes * warningRatio;
}
