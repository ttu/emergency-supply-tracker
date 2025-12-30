import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../common/Button';
import { downloadDebugExport, getLogCount } from '../../utils/errorLogger';
import styles from './DebugExport.module.css';

export function DebugExport() {
  const { t } = useTranslation();
  const [logCount] = useState(() => getLogCount());

  const handleExport = () => {
    downloadDebugExport();
  };

  return (
    <div className={styles.container}>
      <Button variant="secondary" onClick={handleExport}>
        {t('settings.debugExport.button')}
      </Button>
      <p className={styles.description}>
        {t('settings.debugExport.description')}
      </p>
      {logCount > 0 && (
        <p className={styles.logCount}>
          {t('settings.debugExport.logCount', { count: logCount })}
        </p>
      )}
    </div>
  );
}
