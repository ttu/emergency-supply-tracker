import { useCallback, useMemo } from 'react';
import { useLocalStorageSync } from '@/shared/hooks';
import { createDateOnly, type DateOnly } from '@/shared/types';
import {
  BACKUP_REMINDER_DAYS_THRESHOLD,
  MS_PER_DAY,
} from '@/shared/utils/constants';

export interface UseBackupTrackingResult {
  /** ISO date of last backup export */
  lastBackupDate: DateOnly | undefined;
  /** ISO date until which the backup reminder is dismissed */
  backupReminderDismissedUntil: DateOnly | undefined;
  /** Check if the backup reminder should be shown based on current state */
  shouldShowBackupReminder: (
    itemCount: number,
    lastModified: string,
  ) => boolean;
  /** Record the current date as the last backup date (called after export) */
  recordBackupDate: () => void;
  /** Dismiss the backup reminder until the first day of next month */
  dismissBackupReminder: () => void;
}

/**
 * Hook to manage backup tracking state (last backup date and reminder dismissal).
 * Uses localStorage synchronization through useLocalStorageSync.
 */
export function useBackupTracking(): UseBackupTrackingResult {
  const [lastBackupDate, setLastBackupDate] = useLocalStorageSync(
    'lastBackupDate',
    (data) => data?.lastBackupDate,
  );

  const [backupReminderDismissedUntil, setBackupReminderDismissedUntil] =
    useLocalStorageSync(
      'backupReminderDismissedUntil',
      (data) => data?.backupReminderDismissedUntil,
    );

  /**
   * Check if the backup reminder should be shown.
   * Returns true if:
   * 1. Never backed up and there are items, OR
   * 2. Data has been modified since the last backup AND
   *    30 days have passed since the last modification
   * 3. The dismissal period hasn't expired
   */
  const shouldShowBackupReminder = useCallback(
    (itemCount: number, lastModified: string): boolean => {
      const now = new Date();

      // Check if reminder was dismissed for this month
      if (backupReminderDismissedUntil) {
        // Parse DateOnly as local date at midnight
        const [year, month, day] = backupReminderDismissedUntil
          .split('-')
          .map(Number);
        const dismissedUntil = new Date(year, month - 1, day);
        if (now < dismissedUntil) {
          return false;
        }
      }

      // If never backed up and there are items, show reminder
      if (!lastBackupDate) {
        return itemCount > 0;
      }

      // Parse DateOnly as local date at midnight
      const [backupYear, backupMonth, backupDay] = lastBackupDate
        .split('-')
        .map(Number);
      const lastModifiedDate = new Date(lastModified);

      // Check if data was modified after the last backup
      // Compare dates (not times) - set both to midnight for comparison
      const lastBackupDateOnly = new Date(
        backupYear,
        backupMonth - 1,
        backupDay,
      );
      const lastModifiedDateOnly = new Date(
        lastModifiedDate.getFullYear(),
        lastModifiedDate.getMonth(),
        lastModifiedDate.getDate(),
      );
      if (lastModifiedDateOnly <= lastBackupDateOnly) {
        return false;
      }

      // Check if more than BACKUP_REMINDER_DAYS_THRESHOLD days have passed since last modification
      const daysSinceModification = Math.floor(
        (now.getTime() - lastModifiedDate.getTime()) / MS_PER_DAY,
      );

      return daysSinceModification >= BACKUP_REMINDER_DAYS_THRESHOLD;
    },
    [lastBackupDate, backupReminderDismissedUntil],
  );

  /**
   * Record the current date as the last backup date.
   * Called after a successful export.
   */
  const recordBackupDate = useCallback(() => {
    const today = new Date();
    // Format as YYYY-MM-DD using local date (not UTC)
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayDateOnly = `${year}-${month}-${day}`;
    setLastBackupDate(createDateOnly(todayDateOnly));
  }, [setLastBackupDate]);

  /**
   * Dismiss the backup reminder until the first day of next month.
   */
  const dismissBackupReminder = useCallback(() => {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    // Format as YYYY-MM-DD using local date (not UTC)
    const year = nextMonth.getFullYear();
    const month = String(nextMonth.getMonth() + 1).padStart(2, '0');
    const day = String(nextMonth.getDate()).padStart(2, '0');
    const nextMonthDateOnly = `${year}-${month}-${day}`;
    setBackupReminderDismissedUntil(createDateOnly(nextMonthDateOnly));
  }, [setBackupReminderDismissedUntil]);

  return useMemo(
    () => ({
      lastBackupDate,
      backupReminderDismissedUntil,
      shouldShowBackupReminder,
      recordBackupDate,
      dismissBackupReminder,
    }),
    [
      lastBackupDate,
      backupReminderDismissedUntil,
      shouldShowBackupReminder,
      recordBackupDate,
      dismissBackupReminder,
    ],
  );
}
