import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/components/Button';
import { clearAppData } from '@/shared/utils/storage/localStorage';
import styles from './ClearDataButton.module.css';

export function ClearDataButton() {
  const { t } = useTranslation();

  const handleClear = () => {
    if (window.confirm(t('settings.clearData.confirmMessage'))) {
      if (window.confirm(t('settings.clearData.confirmAgain'))) {
        clearAppData();
        alert(t('settings.clearData.success'));
        // Reload to reset to default state
        window.location.reload();
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
