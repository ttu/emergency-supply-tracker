import { useState, useCallback, useMemo, useEffect } from 'react';
import { createAlertId, type AlertId } from '@/shared/types';

const NOTIFICATIONS_SEEN_STORAGE_KEY =
  'emergencySupplyTracker_notifications_seen';

function loadSeenIds(): AlertId[] {
  try {
    const json = localStorage.getItem(NOTIFICATIONS_SEEN_STORAGE_KEY);
    if (!json) return [];
    const raw = JSON.parse(json) as unknown;
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((x): x is string => typeof x === 'string')
      .map((id) => createAlertId(id));
  } catch {
    return [];
  }
}

function saveSeenIds(ids: AlertId[]): void {
  try {
    const json = JSON.stringify(ids.map(String));
    localStorage.setItem(NOTIFICATIONS_SEEN_STORAGE_KEY, json);
  } catch (error) {
    console.error('Failed to save seen notification IDs:', error);
  }
}

export interface UseSeenNotificationsResult {
  seenNotificationIds: Set<AlertId>;
  markNotificationSeen: (id: AlertId) => void;
}

/**
 * Hook to persist which app notifications the user has dismissed (seen).
 * Uses a separate localStorage key; not part of AppData.
 */
export function useSeenNotifications(): UseSeenNotificationsResult {
  const [seenIds, setSeenIds] = useState<AlertId[]>(() => loadSeenIds());

  useEffect(() => {
    saveSeenIds(seenIds);
  }, [seenIds]);

  const markNotificationSeen = useCallback((id: AlertId) => {
    setSeenIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  const seenNotificationIds = useMemo(() => new Set(seenIds), [seenIds]);

  return {
    seenNotificationIds,
    markNotificationSeen,
  };
}
