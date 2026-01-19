import { useState } from 'react';
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
  RecommendationsStatus,
  ImportRecommendationsButton,
  ExportRecommendationsButton,
} from '@/features/settings';
import { SideMenu, SideMenuItem } from '@/shared/components/SideMenu';
import { APP_VERSION } from '@/shared/utils/version';
import styles from './Settings.module.css';

type SettingsSection =
  | 'appearance'
  | 'household'
  | 'nutrition'
  | 'hiddenAlerts'
  | 'disabledRecommendations'
  | 'disabledCategories'
  | 'overriddenRecommendations'
  | 'recommendedItems'
  | 'recommendationKits'
  | 'dataManagement'
  | 'about'
  | 'dangerZone';

export function Settings() {
  const { t } = useTranslation();
  const [selectedSection, setSelectedSection] =
    useState<SettingsSection>('appearance');

  const menuItems: SideMenuItem[] = [
    { id: 'appearance', label: t('settings.sections.appearance') },
    { id: 'household', label: t('settings.sections.household') },
    { id: 'nutrition', label: t('settings.sections.nutrition') },
    { id: 'hiddenAlerts', label: t('settings.sections.hiddenAlerts') },
    {
      id: 'disabledRecommendations',
      label: t('settings.sections.disabledRecommendations'),
    },
    {
      id: 'disabledCategories',
      label: t('settings.sections.disabledCategories'),
    },
    {
      id: 'overriddenRecommendations',
      label: t('settings.sections.overriddenRecommendations'),
    },
    { id: 'recommendedItems', label: t('settings.sections.recommendedItems') },
    {
      id: 'recommendationKits',
      label: t('settings.sections.recommendationKits'),
    },
    { id: 'dataManagement', label: t('settings.sections.dataManagement') },
    { id: 'about', label: t('settings.sections.about') },
    { id: 'dangerZone', label: t('settings.sections.dangerZone') },
  ];

  const renderSection = () => {
    switch (selectedSection) {
      case 'appearance':
        return (
          <section className={styles.section} data-testid="section-appearance">
            <h2 className={styles.sectionTitle}>
              {t('settings.sections.appearance')}
            </h2>
            <div className={styles.appearanceSettings}>
              <LanguageSelector />
              <ThemeSelector />
            </div>
          </section>
        );

      case 'household':
        return (
          <section className={styles.section} data-testid="section-household">
            <h2 className={styles.sectionTitle}>
              {t('settings.sections.household')}
            </h2>
            <HouseholdForm />
          </section>
        );

      case 'nutrition':
        return (
          <section className={styles.section} data-testid="section-nutrition">
            <h2 className={styles.sectionTitle}>
              {t('settings.sections.nutrition')}
            </h2>
            <NutritionSettings />
          </section>
        );

      case 'hiddenAlerts':
        return (
          <section
            className={styles.section}
            data-testid="section-hidden-alerts"
          >
            <h2 className={styles.sectionTitle}>
              {t('settings.sections.hiddenAlerts')}
            </h2>
            <HiddenAlerts />
          </section>
        );

      case 'disabledRecommendations':
        return (
          <section
            className={styles.section}
            data-testid="section-disabled-recommendations"
          >
            <h2 className={styles.sectionTitle}>
              {t('settings.sections.disabledRecommendations')}
            </h2>
            <DisabledRecommendations />
          </section>
        );

      case 'disabledCategories':
        return (
          <section
            className={styles.section}
            data-testid="section-disabled-categories"
          >
            <h2 className={styles.sectionTitle}>
              {t('settings.sections.disabledCategories')}
            </h2>
            <DisabledCategories />
          </section>
        );

      case 'overriddenRecommendations':
        return (
          <section
            className={styles.section}
            data-testid="section-overridden-recommendations"
          >
            <h2 className={styles.sectionTitle}>
              {t('settings.sections.overriddenRecommendations')}
            </h2>
            <OverriddenRecommendations />
          </section>
        );

      case 'recommendedItems':
        return (
          <section
            className={styles.section}
            data-testid="section-recommended-items"
          >
            <h2 className={styles.sectionTitle}>
              {t('settings.sections.recommendedItems')}
            </h2>
            <RecommendationsStatus />
            <div className={styles.dataButtons}>
              <ImportRecommendationsButton />
              <ExportRecommendationsButton />
            </div>
          </section>
        );

      case 'recommendationKits':
        return (
          <section
            className={styles.section}
            data-testid="section-recommendation-kits"
          >
            <h2 className={styles.sectionTitle}>
              {t('settings.sections.recommendationKits')}
            </h2>
            <KitManagement />
          </section>
        );

      case 'dataManagement':
        return (
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
        );

      case 'about':
        return (
          <section className={styles.section} data-testid="section-about">
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
        );

      case 'dangerZone':
        return (
          <section className={styles.section} data-testid="section-danger-zone">
            <h2 className={styles.dangerTitle}>
              {t('settings.sections.dangerZone')}
            </h2>
            <ClearDataButton />
          </section>
        );
    }
  };

  return (
    <div className={styles.container} data-testid="page-settings">
      <header className={styles.header}>
        <h1>{t('navigation.settings')}</h1>
      </header>

      <div className={styles.layout}>
        <SideMenu
          items={menuItems}
          selectedId={selectedSection}
          onSelect={(id) => setSelectedSection(id as SettingsSection)}
          ariaLabel={t('settings.menuLabel')}
        />

        <div className={styles.content}>{renderSection()}</div>
      </div>
    </div>
  );
}
