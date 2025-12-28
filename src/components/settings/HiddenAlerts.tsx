import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useInventory } from '../../hooks/useInventory';
import { generateDashboardAlerts } from '../../utils/dashboard/alerts';
import { Button } from '../common/Button';
import styles from './HiddenAlerts.module.css';

export function HiddenAlerts() {
  const { t } = useTranslation();
  const { items, dismissedAlertIds, reactivateAlert, reactivateAllAlerts } =
    useInventory();

  // Generate all possible alerts
  const allAlerts = useMemo(
    () => generateDashboardAlerts(items, t),
    [items, t],
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
      <div className={styles.alertsList}>
        {hiddenAlerts.map((alert) => (
          <div key={alert.id} className={styles.alertItem}>
            <div className={styles.alertContent}>
              <span className={styles.alertIcon}>
                {alert.type === 'critical'
                  ? '⚠️'
                  : alert.type === 'warning'
                    ? '⚡'
                    : 'ℹ️'}
              </span>
              <span className={styles.alertMessage}>
                {alert.itemName && <strong>{alert.itemName}: </strong>}
                {alert.message}
              </span>
            </div>
            <button
              className={styles.reactivateButton}
              onClick={() => reactivateAlert(alert.id)}
            >
              {t('settings.hiddenAlerts.reactivate')}
            </button>
          </div>
        ))}
      </div>
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
