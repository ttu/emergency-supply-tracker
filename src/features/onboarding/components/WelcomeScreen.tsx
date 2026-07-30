import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/components/Button';
import { Select } from '@/shared/components/Select';
import { useSettings } from '@/features/settings';
import { SELECTABLE_THEMES, type Theme } from '@/shared/types';
import styles from './WelcomeScreen.module.css';

export interface WelcomeScreenProps {
  onContinue: () => void;
}

/** Selling points shown on the landing screen, in display order. */
const SELLING_POINTS: {
  key: string;
  icon: string;
  comingSoon?: boolean;
}[] = [
  { key: 'noSignup', icon: '✓' },
  { key: 'browserBased', icon: '🔒' },
  { key: 'free', icon: '🎁' },
  { key: 'worksOffline', icon: '🔌' },
  { key: 'openSource', icon: '💻' },
  { key: 'cloudSync', icon: '☁', comingSoon: true },
];

/** Feature highlights shown on the landing screen, in display order. */
const FEATURES = ['track', 'alerts', 'prepared'] as const;

interface SellingPointProps {
  icon: string;
  title: string;
  description: string;
  comingSoon?: boolean;
}

function SellingPoint({
  icon,
  title,
  description,
  comingSoon = false,
}: SellingPointProps) {
  const className = comingSoon
    ? `${styles.sellingPoint} ${styles.comingSoon}`
    : styles.sellingPoint;

  return (
    <div className={className}>
      <span className={styles.sellingPointIcon} aria-hidden="true">
        {icon}
      </span>
      <div>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
    </div>
  );
}

interface FeatureProps {
  title: string;
  description: string;
}

function Feature({ title, description }: FeatureProps) {
  return (
    <div className={styles.feature}>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
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
          {SELLING_POINTS.map(({ key, icon, comingSoon }) => (
            <SellingPoint
              key={key}
              icon={icon}
              title={t(`landing.${key}.title`)}
              description={t(`landing.${key}.description`)}
              comingSoon={comingSoon}
            />
          ))}
        </section>

        <section className={styles.features} aria-labelledby="features-heading">
          <h2 id="features-heading" className="sr-only">
            {t('landing.features.title')}
          </h2>
          {FEATURES.map((feature) => (
            <Feature
              key={feature}
              title={t(`landing.features.${feature}.title`)}
              description={t(`landing.features.${feature}.description`)}
            />
          ))}
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
