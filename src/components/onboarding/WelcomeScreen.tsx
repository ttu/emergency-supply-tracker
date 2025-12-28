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
            label={t('settings.language.label')}
            value={settings.language}
            onChange={handleLanguageChange}
            options={[
              { value: 'en', label: 'English' },
              { value: 'fi', label: 'Suomi' },
            ]}
          />
        </div>

        <div className={styles.sellingPoints}>
          <div className={styles.sellingPoint}>
            <span className={styles.sellingPointIcon}>&#10003;</span>
            <div>
              <strong>{t('landing.noSignup.title')}</strong>
              <p>{t('landing.noSignup.description')}</p>
            </div>
          </div>
          <div className={styles.sellingPoint}>
            <span className={styles.sellingPointIcon}>&#128274;</span>
            <div>
              <strong>{t('landing.browserBased.title')}</strong>
              <p>{t('landing.browserBased.description')}</p>
            </div>
          </div>
          <div className={styles.sellingPoint}>
            <span className={styles.sellingPointIcon}>&#127873;</span>
            <div>
              <strong>{t('landing.free.title')}</strong>
              <p>{t('landing.free.description')}</p>
            </div>
          </div>
          <div className={`${styles.sellingPoint} ${styles.comingSoon}`}>
            <span className={styles.sellingPointIcon}>&#9729;</span>
            <div>
              <strong>{t('landing.cloudSync.title')}</strong>
              <p>{t('landing.cloudSync.description')}</p>
            </div>
          </div>
        </div>

        <div className={styles.features}>
          <div className={styles.feature}>
            <h3>{t('landing.features.track.title')}</h3>
            <p>{t('landing.features.track.description')}</p>
          </div>
          <div className={styles.feature}>
            <h3>{t('landing.features.alerts.title')}</h3>
            <p>{t('landing.features.alerts.description')}</p>
          </div>
          <div className={styles.feature}>
            <h3>{t('landing.features.prepared.title')}</h3>
            <p>{t('landing.features.prepared.description')}</p>
          </div>
        </div>

        <div className={styles.actions}>
          <Button onClick={onContinue} size="large" fullWidth>
            {t('landing.getStarted')}
          </Button>
        </div>
      </div>
    </div>
  );
}
