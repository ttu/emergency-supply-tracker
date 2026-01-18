import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/components/Button';
import { Select } from '@/shared/components/Select';
import { useSettings } from '@/features/settings';
import { SELECTABLE_THEMES, type Theme } from '@/shared/types';
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

  const handleThemeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const theme = event.target.value as Theme;
    updateSettings({ theme });
    document.documentElement.dataset.theme = theme;
  };

  return (
    <main className={styles.container} data-testid="onboarding-welcome">
      <div className={styles.content}>
        <header className={styles.header}>
          <h1 className={styles.title}>{t('app.title')}</h1>
          <p className={styles.tagline}>{t('app.tagline')}</p>
        </header>

        <section className={styles.preferencesSection}>
          <Select
            id="language-select"
            label={t('settings.language.label')}
            value={settings.language}
            onChange={handleLanguageChange}
            options={[
              { value: 'en', label: t('settings.language.option.en') },
              { value: 'fi', label: t('settings.language.option.fi') },
            ]}
          />
          <Select
            id="theme-select"
            label={t('settings.theme.label')}
            value={settings.theme}
            onChange={handleThemeChange}
            options={SELECTABLE_THEMES.map((theme) => ({
              value: theme,
              label: t(`settings.theme.${theme}`),
            }))}
          />
        </section>

        <section
          className={styles.sellingPoints}
          aria-label={t('landing.sellingPoints')}
        >
          <div className={styles.sellingPoint}>
            <span className={styles.sellingPointIcon} aria-hidden="true">
              &#10003;
            </span>
            <div>
              <strong>{t('landing.noSignup.title')}</strong>
              <p>{t('landing.noSignup.description')}</p>
            </div>
          </div>
          <div className={styles.sellingPoint}>
            <span className={styles.sellingPointIcon} aria-hidden="true">
              &#128274;
            </span>
            <div>
              <strong>{t('landing.browserBased.title')}</strong>
              <p>{t('landing.browserBased.description')}</p>
            </div>
          </div>
          <div className={styles.sellingPoint}>
            <span className={styles.sellingPointIcon} aria-hidden="true">
              &#127873;
            </span>
            <div>
              <strong>{t('landing.free.title')}</strong>
              <p>{t('landing.free.description')}</p>
            </div>
          </div>
          <div className={styles.sellingPoint}>
            <span className={styles.sellingPointIcon} aria-hidden="true">
              &#128268;
            </span>
            <div>
              <strong>{t('landing.worksOffline.title')}</strong>
              <p>{t('landing.worksOffline.description')}</p>
            </div>
          </div>
          <div className={styles.sellingPoint}>
            <span className={styles.sellingPointIcon} aria-hidden="true">
              &#128187;
            </span>
            <div>
              <strong>{t('landing.openSource.title')}</strong>
              <p>{t('landing.openSource.description')}</p>
            </div>
          </div>
          <div className={`${styles.sellingPoint} ${styles.comingSoon}`}>
            <span className={styles.sellingPointIcon} aria-hidden="true">
              &#9729;
            </span>
            <div>
              <strong>{t('landing.cloudSync.title')}</strong>
              <p>{t('landing.cloudSync.description')}</p>
            </div>
          </div>
        </section>

        <section className={styles.features} aria-labelledby="features-heading">
          <h2 id="features-heading" className="sr-only">
            {t('landing.features.title')}
          </h2>
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
        </section>

        <div className={styles.actions}>
          <Button
            onClick={onContinue}
            size="large"
            fullWidth
            data-testid="get-started-button"
          >
            {t('landing.getStarted')}
          </Button>
        </div>
      </div>
    </main>
  );
}
