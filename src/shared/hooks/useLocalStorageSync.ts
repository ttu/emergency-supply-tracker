import { useState, useEffect, useCallback } from 'react';
import type { AppData } from '@/shared/types';
import {
  getAppData,
  saveAppData,
  createDefaultAppData,
} from '@/shared/utils/storage/localStorage';

// Custom event name for localStorage sync notifications
const STORAGE_SYNC_EVENT = 'app-storage-sync';

/**
 * Dispatch a custom event to notify all useLocalStorageSync hooks to refresh their state.
 * Call this after making changes to localStorage from outside of useLocalStorageSync.
 */
export function notifyStorageChange(): void {
  window.dispatchEvent(new CustomEvent(STORAGE_SYNC_EVENT));
}

/**
 * Type for keys in AppData that can be synced with localStorage.
 * Excludes 'version' and 'lastModified' which are managed automatically.
 */
type SyncableKey = Exclude<keyof AppData, 'version' | 'lastModified'>;

/**
 * Custom hook that synchronizes a slice of state with localStorage.
 * Provides automatic loading from and saving to localStorage for a specific key in AppData.
 *
 * @template K - The key in AppData to sync
 * @param key - The key in AppData to synchronize
 * @param defaultValueOrInitializer - Default value or initializer function that receives AppData
 * @returns A tuple of [state, setState] similar to useState
 *
 * @example
 * // Simple usage with default value
 * const [household, setHousehold] = useLocalStorageSync('household', DEFAULT_HOUSEHOLD);
 *
 * @example
 * // Using an initializer function for complex initialization logic
 * const [settings, setSettings] = useLocalStorageSync('settings', (data) => {
 *   const stored = data?.settings || DEFAULT_SETTINGS;
 *   const urlLang = getLanguageFromUrl();
 *   return urlLang ? { ...stored, language: urlLang } : stored;
 * });
 *
 * @example
 * // Syncing arrays
 * const [items, setItems] = useLocalStorageSync('items', []);
 */
export function useLocalStorageSync<K extends SyncableKey>(
  key: K,
  defaultValueOrInitializer:
    | AppData[K]
    | ((data: AppData | undefined) => AppData[K]),
): [
  AppData[K],
  (value: AppData[K] | ((prev: AppData[K]) => AppData[K])) => void,
] {
  // Initialize state from localStorage
  const [state, setState] = useState<AppData[K]>(() => {
    try {
      const data = getAppData();

      // If initializer function provided, use it
      if (typeof defaultValueOrInitializer === 'function') {
        return (
          defaultValueOrInitializer as (data: AppData | undefined) => AppData[K]
        )(data);
      }

      // Use stored value if exists, otherwise use default
      return data?.[key] ?? defaultValueOrInitializer;
    } catch (error) {
      console.error(`Failed to initialize state for key "${key}":`, error);
      // Return default value or call initializer with undefined
      return typeof defaultValueOrInitializer === 'function'
        ? (
            defaultValueOrInitializer as (
              data: AppData | undefined,
            ) => AppData[K]
          )(undefined)
        : defaultValueOrInitializer;
    }
  });

  // Save to localStorage whenever state changes
  useEffect(() => {
    try {
      const data = getAppData() || createDefaultAppData();
      data[key] = state;
      data.lastModified = new Date().toISOString();
      saveAppData(data);
    } catch (error) {
      console.error(`Failed to save state for key "${key}":`, error);
    }
  }, [key, state]);

  // Refresh state from localStorage function
  const refreshFromStorage = useCallback(() => {
    try {
      const data = getAppData();
      const newValue =
        typeof defaultValueOrInitializer === 'function'
          ? (
              defaultValueOrInitializer as (
                data: AppData | undefined,
              ) => AppData[K]
            )(data)
          : (data?.[key] ?? defaultValueOrInitializer);

      setState(newValue);
    } catch (error) {
      console.error(`Failed to refresh state for key "${key}":`, error);
    }
  }, [key, defaultValueOrInitializer]);

  // Listen for custom storage sync events from other parts of the app
  useEffect(() => {
    const handleStorageSync = () => {
      refreshFromStorage();
    };

    window.addEventListener(STORAGE_SYNC_EVENT, handleStorageSync);
    return () => {
      window.removeEventListener(STORAGE_SYNC_EVENT, handleStorageSync);
    };
  }, [refreshFromStorage]);

  return [state, setState];
}
