import { useTranslation } from 'react-i18next';
import { LanguageSelector } from '../components/settings/LanguageSelector';
import { HouseholdForm } from '../components/settings/HouseholdForm';
import { AdvancedFeatures } from '../components/settings/AdvancedFeatures';
import { ExportButton } from '../components/settings/ExportButton';
import { ImportButton } from '../components/settings/ImportButton';
import { ShoppingListExport } from '../components/settings/ShoppingListExport';
import { ClearDataButton } from '../components/settings/ClearDataButton';
import styles from './Settings.module.css';

export function Settings() {
  const { t } = useTranslation();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>{t('navigation.settings')}</h1>
      </header>

      <div className={styles.content}>
        {/* Language Settings */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            {t('settings.sections.language')}
          </h2>
          <LanguageSelector />
        </section>

        {/* Household Configuration */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            {t('settings.sections.household')}
          </h2>
          <HouseholdForm />
        </section>

        {/* Advanced Features */}
        <section className={styles.section}>
          <AdvancedFeatures />
        </section>

        {/* Data Management */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            {t('settings.sections.dataManagement')}
          </h2>
          <div className={styles.dataButtons}>
            <ExportButton />
            <ImportButton />
            <ShoppingListExport />
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
              {t('settings.about.version')}: {t('settings.about.versionNumber')}
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
