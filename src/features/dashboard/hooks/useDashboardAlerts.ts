import { useMemo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useInventory } from '@/features/inventory';
import { useHousehold } from '@/features/household';
import { useRecommendedItems } from '@/features/templates';
import { generateDashboardAlerts, type Alert } from '@/features/alerts';
import { useBackupTracking } from './useBackupTracking';
import { useSeenNotifications } from './useSeenNotifications';
import { APP_NOTIFICATIONS } from '../constants/notifications';
import { useNotification } from '@/shared/hooks/useNotification';
import { getAppData } from '@/shared/utils/storage/localStorage';
import { createAlertId, type AlertId } from '@/shared/types';

const BACKUP_REMINDER_ALERT_ID = createAlertId('backup-reminder');

const NOTIFICATION_IDS = new Set(APP_NOTIFICATIONS.map((n) => n.id));

export interface UseDashboardAlertsResult {
  activeAlerts: Alert[];
  hiddenAlertsCount: number;
  handleDismissAlert: (alertId: AlertId) => void;
  handleDismissAllAlerts: () => void;
  handleShowAllAlerts: () => void;
}

/**
 * Hook to manage dashboard alerts including generation, filtering, and dismissal.
 * Consolidates alert logic that was previously scattered across the Dashboard component.
 */
export function useDashboardAlerts(): UseDashboardAlertsResult {
  const { t } = useTranslation();
  const { items, dismissedAlertIds, dismissAlert, reactivateAllAlerts } =
    useInventory();
  const { household } = useHousehold();
  const { recommendedItems } = useRecommendedItems();
  const {
    lastBackupDate,
    shouldShowBackupReminder,
    dismissBackupReminder: dismissBackup,
  } = useBackupTracking();
  const { seenNotificationIds, markNotificationSeen } = useSeenNotifications();
  const { showNotification } = useNotification();
  const [backupReminderDismissed, setBackupReminderDismissed] = useState(false);

  // Generate alerts (including water shortage alerts)
  const allAlerts = useMemo(
    () => generateDashboardAlerts(items, t, household, recommendedItems),
    [items, t, household, recommendedItems],
  );

  // Generate backup reminder alert if needed
  // Note: items is included in deps to re-evaluate when inventory changes
  const backupReminderAlert: Alert | undefined = useMemo(() => {
    if (backupReminderDismissed) return undefined;

    // Get lastModified from appData for backup reminder check
    const appData = getAppData();
    const lastModified = appData?.lastModified ?? new Date().toISOString();
    if (!shouldShowBackupReminder(items.length, lastModified)) return undefined;

    const message =
      lastBackupDate === undefined
        ? t('alerts.backup.neverBackedUpMessage')
        : t('alerts.backup.reminderMessage');

    return {
      id: BACKUP_REMINDER_ALERT_ID,
      type: 'info',
      message,
    };
  }, [
    backupReminderDismissed,
    t,
    items,
    lastBackupDate,
    shouldShowBackupReminder,
  ]);

  // App notifications (hardcoded); filter out seen
  const notificationAlerts = useMemo(() => {
    return APP_NOTIFICATIONS.filter((n) => !seenNotificationIds.has(n.id)).map(
      (n) => ({
        id: n.id,
        type: n.type,
        message: t(n.messageKey),
      }),
    ) as Alert[];
  }, [seenNotificationIds, t]);

  // Combine: backup first, then notifications, then inventory alerts
  const combinedAlerts = useMemo(
    () => [
      ...(backupReminderAlert ? [backupReminderAlert] : []),
      ...notificationAlerts,
      ...allAlerts,
    ],
    [allAlerts, backupReminderAlert, notificationAlerts],
  );

  // Filter out dismissed alerts
  const dismissedSet = useMemo(
    () => new Set(dismissedAlertIds),
    [dismissedAlertIds],
  );

  const activeAlerts = useMemo(
    () => combinedAlerts.filter((alert) => !dismissedSet.has(alert.id)),
    [combinedAlerts, dismissedSet],
  );

  // Count hidden alerts that still exist (excluding backup reminder)
  const hiddenAlertsCount = useMemo(
    () => allAlerts.filter((alert) => dismissedSet.has(alert.id)).length,
    [allAlerts, dismissedSet],
  );

  const handleDismissAlert = useCallback(
    (alertId: AlertId) => {
      if (alertId === BACKUP_REMINDER_ALERT_ID) {
        dismissBackup();
        setBackupReminderDismissed(true);
        showNotification(
          t('notifications.backup.reminderDismissed'),
          'success',
        );
      } else if (NOTIFICATION_IDS.has(alertId)) {
        markNotificationSeen(alertId);
      } else {
        dismissAlert(alertId);
      }
    },
    [dismissAlert, dismissBackup, markNotificationSeen, showNotification, t],
  );

  const handleDismissAllAlerts = useCallback(() => {
    activeAlerts.forEach((alert) => handleDismissAlert(alert.id));
  }, [activeAlerts, handleDismissAlert]);

  const handleShowAllAlerts = useCallback(() => {
    reactivateAllAlerts();
  }, [reactivateAllAlerts]);

  return {
    activeAlerts,
    hiddenAlertsCount,
    handleDismissAlert,
    handleDismissAllAlerts,
    handleShowAllAlerts,
  };
}
