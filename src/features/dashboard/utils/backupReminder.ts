import type { AppData } from '@/shared/types';
import { createDateOnly } from '@/shared/types';
import { getAppData, saveAppData } from '@/shared/utils/storage/localStorage';
import {
  BACKUP_REMINDER_DAYS_THRESHOLD,
  MS_PER_DAY,
} from '@/shared/utils/constants';

/**
 * Check if the backup reminder should be shown.
 * Returns true if:
 * 1. Never backed up and there are items, OR
 * 2. Data has been modified since the last backup AND
 *    30 days have passed since the last modification
 * 3. The dismissal period hasn't expired
 */
export function shouldShowBackupReminder(
  appData: AppData | undefined,
): boolean {
  if (!appData) return false;

  const now = new Date();

  // Check if reminder was dismissed for this month
  if (appData.backupReminderDismissedUntil) {
    // Parse DateOnly as local date at midnight
    const [year, month, day] = appData.backupReminderDismissedUntil
      .split('-')
      .map(Number);
    const dismissedUntil = new Date(year, month - 1, day);
    if (now < dismissedUntil) {
      return false;
    }
  }

  // If never backed up and there are items, show reminder
  if (!appData.lastBackupDate) {
    return appData.items.length > 0;
  }

  // Parse DateOnly as local date at midnight
  const [backupYear, backupMonth, backupDay] = appData.lastBackupDate
    .split('-')
    .map(Number);
  const lastModified = new Date(appData.lastModified);

  // Check if data was modified after the last backup
  // Compare dates (not times) - set both to midnight for comparison
  const lastBackupDateOnly = new Date(backupYear, backupMonth - 1, backupDay);
  const lastModifiedDateOnly = new Date(
    lastModified.getFullYear(),
    lastModified.getMonth(),
    lastModified.getDate(),
  );
  if (lastModifiedDateOnly <= lastBackupDateOnly) {
    return false;
  }

  // Check if more than BACKUP_REMINDER_DAYS_THRESHOLD days have passed since last modification
  const daysSinceModification = Math.floor(
    (now.getTime() - lastModified.getTime()) / MS_PER_DAY,
  );

  return daysSinceModification >= BACKUP_REMINDER_DAYS_THRESHOLD;
}

/**
 * Dismiss the backup reminder until the first day of next month.
 */
export function dismissBackupReminder(): void {
  const appData = getAppData();
  if (!appData) return;

  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  // Format as YYYY-MM-DD using local date (not UTC)
  const year = nextMonth.getFullYear();
  const month = String(nextMonth.getMonth() + 1).padStart(2, '0');
  const day = String(nextMonth.getDate()).padStart(2, '0');
  const nextMonthDateOnly = `${year}-${month}-${day}`;

  appData.backupReminderDismissedUntil = createDateOnly(nextMonthDateOnly);
  saveAppData(appData);
}

/**
 * Record the current date as the last backup date.
 * Called after a successful export.
 */
export function recordBackupDate(): void {
  const appData = getAppData();
  if (!appData) return;

  const today = new Date();
  // Format as YYYY-MM-DD using local date (not UTC)
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const todayDateOnly = `${year}-${month}-${day}`;
  appData.lastBackupDate = createDateOnly(todayDateOnly);
  saveAppData(appData);
}
