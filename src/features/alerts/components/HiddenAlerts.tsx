import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useInventory } from '@/features/inventory';
import { useHousehold } from '@/features/household';
import { generateDashboardAlerts } from '../utils';
import { Button } from '@/shared/components/Button';
import type { AlertType } from '../types';
import styles from './HiddenAlerts.module.css';

const getAlertIcon = (type: AlertType): string => {
  switch (type) {
    case 'critical':
      return '⚠️';
    case 'warning':
      return '⚡';
    case 'info':
      return 'ℹ️';
  }
};

export function HiddenAlerts() {
  const { t } = useTranslation();
  const { items, dismissedAlertIds, reactivateAlert, reactivateAllAlerts } =
    useInventory();
  const { household } = useHousehold();

  // Generate all possible alerts (including water shortage alerts)
  const allAlerts = useMemo(
    () => generateDashboardAlerts(items, t, household),
    [items, t, household],
  );

  // Get only the alerts that are currently hidden AND still relevant
  const hiddenAlerts = useMemo(() => {
    const dismissedSet = new Set(dismissedAlertIds);
    return allAlerts.filter((alert) => dismissedSet.has(alert.id));
  }, [allAlerts, dismissedAlertIds]);

  if (hiddenAlerts.length === 0) {
    return (
      <div className={styles.container}>
        <p className={styles.emptyMessage}>
          {t('settings.hiddenAlerts.empty')}
        </p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <p className={styles.description}>
        {t('settings.hiddenAlerts.description', { count: hiddenAlerts.length })}
      </p>
      <ul className={styles.alertsList}>
        {hiddenAlerts.map((alert) => (
          <li key={alert.id} className={styles.alertItem}>
            <div className={styles.alertContent}>
              <span className={styles.alertIcon} aria-hidden="true">
                {getAlertIcon(alert.type)}
              </span>
              <span className={styles.alertMessage}>
                {alert.itemName && <strong>{alert.itemName}: </strong>}
                {alert.message}
              </span>
            </div>
            <Button
              variant="secondary"
              size="small"
              className={styles.reactivateButton}
              onClick={() => reactivateAlert(alert.id)}
              aria-label={`${t('settings.hiddenAlerts.reactivate')}: ${alert.itemName || alert.message}`}
            >
              {t('settings.hiddenAlerts.reactivate')}
            </Button>
          </li>
        ))}
      </ul>
      {hiddenAlerts.length > 1 && (
        <div className={styles.reactivateAllContainer}>
          <Button variant="secondary" onClick={reactivateAllAlerts}>
            {t('settings.hiddenAlerts.reactivateAll')}
          </Button>
        </div>
      )}
    </div>
  );
}
