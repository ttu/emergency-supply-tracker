import { useTranslation } from 'react-i18next';
import { Button } from '../common/Button';
import { clearAppData } from '../../utils/storage/localStorage';
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
      <Button variant="danger" onClick={handleClear}>
        {t('settings.clearData.button')}
      </Button>
      <p className={styles.warning}>{t('settings.clearData.warning')}</p>
    </div>
  );
}
