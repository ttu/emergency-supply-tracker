import type { AppData } from '../../types';
import { getAppData, saveAppData } from '../storage/localStorage';
import { BACKUP_REMINDER_DAYS_THRESHOLD, MS_PER_DAY } from '../constants';

/**
 * Check if the backup reminder should be shown.
 * Returns true if:
 * 1. Last backup was more than 30 days ago (or never)
 * 2. Data has been modified since the last backup
 * 3. The dismissal period hasn't expired
 */
export function shouldShowBackupReminder(appData: AppData | null): boolean {
  if (!appData) return false;

  const now = new Date();

  // Check if reminder was dismissed for this month
  if (appData.backupReminderDismissedUntil) {
    const dismissedUntil = new Date(appData.backupReminderDismissedUntil);
    if (now < dismissedUntil) {
      return false;
    }
  }

  // If never backed up and there are items, show reminder
  if (!appData.lastBackupDate) {
    return appData.items.length > 0;
  }

  const lastBackup = new Date(appData.lastBackupDate);
  const lastModified = new Date(appData.lastModified);

  // Check if data was modified after the last backup
  if (lastModified <= lastBackup) {
    return false;
  }

  // Check if more than BACKUP_REMINDER_DAYS_THRESHOLD days have passed since last backup
  const daysSinceBackup = Math.floor(
    (now.getTime() - lastBackup.getTime()) / MS_PER_DAY,
  );

  return daysSinceBackup >= BACKUP_REMINDER_DAYS_THRESHOLD;
}

/**
 * Dismiss the backup reminder until the first day of next month.
 */
export function dismissBackupReminder(): void {
  const appData = getAppData();
  if (!appData) return;

  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  appData.backupReminderDismissedUntil = nextMonth.toISOString();
  saveAppData(appData);
}

/**
 * Record the current date as the last backup date.
 * Called after a successful export.
 */
export function recordBackupDate(): void {
  const appData = getAppData();
  if (!appData) return;

  appData.lastBackupDate = new Date().toISOString();
  saveAppData(appData);
}
