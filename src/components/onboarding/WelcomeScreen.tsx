import { useTranslation } from 'react-i18next';
import { Button } from '../common/Button';
import { Select } from '../common/Select';
import { useSettings } from '../../hooks/useSettings';
import styles from './WelcomeScreen.module.css';

export interface WelcomeScreenProps {
  onContinue: () => void;
}

export function WelcomeScreen({ onContinue }: WelcomeScreenProps) {
  const { t, i18n } = useTranslation();
  const { settings, updateSettings } = useSettings();

  const handleLanguageChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const newLanguage = event.target.value as 'en' | 'fi';
    updateSettings({ language: newLanguage });
    i18n.changeLanguage(newLanguage).catch((error) => {
      console.error('Failed to change language:', error);
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.header}>
          <h1 className={styles.title}>{t('app.title')}</h1>
          <p className={styles.tagline}>{t('app.tagline')}</p>
        </div>

        <div className={styles.languageSection}>
          <Select
            id="language-select"
            label={t('settings.language')}
            value={settings.language}
            onChange={handleLanguageChange}
            options={[
              { value: 'en', label: 'English' },
              { value: 'fi', label: 'Suomi' },
            ]}
          />
        </div>

        <div className={styles.features}>
          <div className={styles.feature}>
            <h3>📦 Track Supplies</h3>
            <p>Keep track of your emergency supplies and expiration dates</p>
          </div>
          <div className={styles.feature}>
            <h3>🔔 Get Alerts</h3>
            <p>Receive notifications when items are running low or expiring</p>
          </div>
          <div className={styles.feature}>
            <h3>📊 Stay Prepared</h3>
            <p>Ensure your household is ready for any emergency</p>
          </div>
        </div>

        <div className={styles.actions}>
          <Button onClick={onContinue} size="large" fullWidth>
            Get Started
          </Button>
        </div>
      </div>
    </div>
  );
}
