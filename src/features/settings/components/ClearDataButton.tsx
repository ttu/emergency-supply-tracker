import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/components/Button';
import { useNotification } from '@/shared/hooks/useNotification';
import { clearAppData } from '@/shared/utils/storage/localStorage';
import { clearErrorLogs } from '@/shared/utils/errorLogger/storage';
import { clearAnalyticsData } from '@/shared/utils/analytics/storage';
import styles from './ClearDataButton.module.css';

const RELOAD_DELAY_MS = 800;

export function ClearDataButton() {
  const { t } = useTranslation();
  const { showNotification } = useNotification();

  const handleClear = () => {
    if (globalThis.confirm(t('settings.clearData.confirmMessage'))) {
      if (globalThis.confirm(t('settings.clearData.confirmAgain'))) {
        clearAppData();
        clearErrorLogs();
        clearAnalyticsData();
        showNotification(t('notifications.data.cleared'), 'success');
        // Reload after a short delay so the notification is visible
        globalThis.setTimeout(
          () => globalThis.location.reload(),
          RELOAD_DELAY_MS,
        );
      }
    }
  };

  return (
    <div className={styles.container}>
      <Button
        variant="danger"
        onClick={handleClear}
        data-testid="clear-data-button"
      >
        {t('settings.clearData.button')}
      </Button>
      <p className={styles.warning}>{t('settings.clearData.warning')}</p>
    </div>
  );
}
