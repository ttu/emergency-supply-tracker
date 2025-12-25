import { useTranslation } from 'react-i18next';
import { Button } from '../common/Button';
import { getAppData, exportToJSON } from '../../utils/storage/localStorage';
import styles from './ExportButton.module.css';

export function ExportButton() {
  const { t } = useTranslation();

  const handleExport = () => {
    const data = getAppData();
    if (!data) {
      alert(t('settings.export.noData'));
      return;
    }

    const json = exportToJSON(data);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `emergency-supplies-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.container}>
      <Button variant="secondary" onClick={handleExport}>
        {t('settings.export.button')}
      </Button>
      <p className={styles.description}>{t('settings.export.description')}</p>
    </div>
  );
}
