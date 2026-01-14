import { useMemo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useInventory } from '@/features/inventory';
import { useHousehold } from '@/features/household';
import { generateDashboardAlerts, type Alert } from '@/features/alerts';
import { getAppData } from '@/shared/utils/storage/localStorage';
import { shouldShowBackupReminder, dismissBackupReminder } from '../utils';
import { createAlertId, type AlertId } from '@/shared/types';

const BACKUP_REMINDER_ALERT_ID = createAlertId('backup-reminder');

export interface UseDashboardAlertsResult {
  activeAlerts: Alert[];
  hiddenAlertsCount: number;
  handleDismissAlert: (alertId: AlertId) => void;
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
  const [backupReminderDismissed, setBackupReminderDismissed] = useState(false);

  // Generate alerts (including water shortage alerts)
  const allAlerts = useMemo(
    () => generateDashboardAlerts(items, t, household),
    [items, t, household],
  );

  // Generate backup reminder alert if needed
  // Note: items is included in deps to re-evaluate when inventory changes
  const backupReminderAlert: Alert | undefined = useMemo(() => {
    if (backupReminderDismissed) return undefined;

    const appData = getAppData();
    if (!shouldShowBackupReminder(appData)) return undefined;

    return {
      id: BACKUP_REMINDER_ALERT_ID,
      type: 'info',
      message: t('alerts.backup.reminderMessage'),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backupReminderDismissed, t, items]);

  // Combine all alerts with backup reminder first
  const combinedAlerts = useMemo(() => {
    const alerts = [...allAlerts];
    if (backupReminderAlert) {
      alerts.unshift(backupReminderAlert);
    }
    return alerts;
  }, [allAlerts, backupReminderAlert]);

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
        dismissBackupReminder();
        setBackupReminderDismissed(true);
      } else {
        dismissAlert(alertId);
      }
    },
    [dismissAlert],
  );

  const handleShowAllAlerts = useCallback(() => {
    reactivateAllAlerts();
  }, [reactivateAllAlerts]);

  return {
    activeAlerts,
    hiddenAlertsCount,
    handleDismissAlert,
    handleShowAllAlerts,
  };
}
