import { useTranslation } from 'react-i18next';
import { HiddenAlerts } from '@/features/alerts';
import {
  LanguageSelector,
  ThemeSelector,
  HouseholdForm,
  NutritionSettings,
  ExportButton,
  ImportButton,
  ShoppingListExport,
  DebugExport,
  ClearDataButton,
  DisabledCategories,
  DisabledRecommendations,
  OverriddenRecommendations,
  KitManagement,
} from '@/features/settings';
import { APP_VERSION } from '@/shared/utils/version';
import styles from './Settings.module.css';

export function Settings() {
  const { t } = useTranslation();

  return (
    <div className={styles.container} data-testid="page-settings">
      <header className={styles.header}>
        <h1>{t('navigation.settings')}</h1>
      </header>

      <div className={styles.content}>
        {/* Appearance Settings */}
        <section className={styles.section} data-testid="section-appearance">
          <h2 className={styles.sectionTitle}>
            {t('settings.sections.appearance')}
          </h2>
          <div className={styles.appearanceSettings}>
            <LanguageSelector />
            <ThemeSelector />
          </div>
        </section>

        {/* Household Configuration */}
        <section className={styles.section} data-testid="section-household">
          <h2 className={styles.sectionTitle}>
            {t('settings.sections.household')}
          </h2>
          <HouseholdForm />
        </section>

        {/* Nutrition & Requirements */}
        <section className={styles.section} data-testid="section-nutrition">
          <h2 className={styles.sectionTitle}>
            {t('settings.sections.nutrition')}
          </h2>
          <NutritionSettings />
        </section>

        {/* Hidden Alerts */}
        <section className={styles.section} data-testid="section-hidden-alerts">
          <h2 className={styles.sectionTitle}>
            {t('settings.sections.hiddenAlerts')}
          </h2>
          <HiddenAlerts />
        </section>

        {/* Disabled Recommendations */}
        <section
          className={styles.section}
          data-testid="section-disabled-recommendations"
        >
          <h2 className={styles.sectionTitle}>
            {t('settings.sections.disabledRecommendations')}
          </h2>
          <DisabledRecommendations />
        </section>

        {/* Disabled Categories */}
        <section
          className={styles.section}
          data-testid="section-disabled-categories"
        >
          <h2 className={styles.sectionTitle}>
            {t('settings.sections.disabledCategories')}
          </h2>
          <DisabledCategories />
        </section>

        {/* Overridden Recommendations */}
        <section
          className={styles.section}
          data-testid="section-overridden-recommendations"
        >
          <h2 className={styles.sectionTitle}>
            {t('settings.sections.overriddenRecommendations')}
          </h2>
          <OverriddenRecommendations />
        </section>

        {/* Recommendation Kits */}
        <section
          className={styles.section}
          data-testid="section-recommendation-kits"
        >
          <h2 className={styles.sectionTitle}>
            {t('settings.sections.recommendationKits')}
          </h2>
          <KitManagement />
        </section>

        {/* Data Management */}
        <section
          className={styles.section}
          data-testid="section-data-management"
        >
          <h2 className={styles.sectionTitle}>
            {t('settings.sections.dataManagement')}
          </h2>
          <div className={styles.dataButtons}>
            <ExportButton />
            <ImportButton />
            <ShoppingListExport />
            <DebugExport />
          </div>
        </section>

        {/* About */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            {t('settings.sections.about')}
          </h2>
          <div className={styles.about}>
            <p className={styles.appName}>{t('app.title')}</p>
            <p className={styles.version}>
              {t('settings.about.version')}: {APP_VERSION}
            </p>
            <p className={styles.description}>{t('app.tagline')}</p>
            <a
              href="https://github.com/ttu/emergency-supply-tracker"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}
            >
              {t('settings.about.viewOnGitHub')}
            </a>
          </div>
        </section>

        {/* Danger Zone */}
        <section className={styles.section}>
          <h2 className={styles.dangerTitle}>
            {t('settings.sections.dangerZone')}
          </h2>
          <ClearDataButton />
        </section>
      </div>
    </div>
  );
}
