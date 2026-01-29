import { ReactNode, useState } from 'react';
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
  CategoriesSection,
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
  | 'customCategories'
  | 'overriddenRecommendations'
  | 'recommendationKits'
  | 'dataManagement'
  | 'about'
  | 'dangerZone';

interface SectionProps {
  readonly testId: string;
  readonly titleKey: string;
  readonly titleClassName?: string;
  readonly children: ReactNode;
}

function Section({
  testId,
  titleKey,
  titleClassName = styles.sectionTitle,
  children,
}: Readonly<SectionProps>) {
  const { t } = useTranslation();
  return (
    <section className={styles.section} data-testid={testId}>
      <h2 className={titleClassName}>{t(titleKey)}</h2>
      {children}
    </section>
  );
}

export function Settings() {
  const { t } = useTranslation();
  const [selectedSection, setSelectedSection] =
    useState<SettingsSection>('appearance');

  const menuItems: SideMenuItem[] = [
    { id: 'appearance', label: t('settings.navigation.sections.appearance') },
    { id: 'household', label: t('settings.navigation.sections.household') },
    { id: 'nutrition', label: t('settings.navigation.sections.nutrition') },
    {
      id: 'hiddenAlerts',
      label: t('settings.navigation.sections.hiddenAlerts'),
    },
    {
      id: 'disabledRecommendations',
      label: t('settings.navigation.sections.disabledRecommendations'),
    },
    {
      id: 'disabledCategories',
      label: t('settings.navigation.sections.disabledCategories'),
    },
    {
      id: 'customCategories',
      label: t('settings.navigation.sections.customCategories'),
    },
    {
      id: 'overriddenRecommendations',
      label: t('settings.navigation.sections.overriddenRecommendations'),
    },
    {
      id: 'recommendationKits',
      label: t('settings.navigation.sections.recommendationKits'),
    },
    {
      id: 'dataManagement',
      label: t('settings.navigation.sections.dataManagement'),
    },
    { id: 'about', label: t('settings.navigation.sections.about') },
    { id: 'dangerZone', label: t('settings.navigation.sections.dangerZone') },
  ];

  const renderSection = () => {
    switch (selectedSection) {
      case 'appearance':
        return (
          <Section
            testId="section-appearance"
            titleKey="settings.navigation.sections.appearance"
          >
            <div className={styles.appearanceSettings}>
              <LanguageSelector />
              <ThemeSelector />
            </div>
          </Section>
        );

      case 'household':
        return (
          <Section
            testId="section-household"
            titleKey="settings.navigation.sections.household"
          >
            <HouseholdForm />
          </Section>
        );

      case 'nutrition':
        return (
          <Section
            testId="section-nutrition"
            titleKey="settings.navigation.sections.nutrition"
          >
            <NutritionSettings />
          </Section>
        );

      case 'hiddenAlerts':
        return (
          <Section
            testId="section-hidden-alerts"
            titleKey="settings.navigation.sections.hiddenAlerts"
          >
            <HiddenAlerts />
          </Section>
        );

      case 'disabledRecommendations':
        return (
          <Section
            testId="section-disabled-recommendations"
            titleKey="settings.navigation.sections.disabledRecommendations"
          >
            <DisabledRecommendations />
          </Section>
        );

      case 'disabledCategories':
        return (
          <section
            className={styles.section}
            data-testid="section-disabled-categories"
          >
            <h2 className={styles.sectionTitle}>
              {t('settings.navigation.sections.disabledCategories')}
            </h2>
            <DisabledCategories />
          </section>
        );

      case 'customCategories':
        return (
          <section
            className={styles.section}
            data-testid="section-custom-categories"
          >
            <CategoriesSection />
          </section>
        );

      case 'overriddenRecommendations':
        return (
          <Section
            testId="section-overridden-recommendations"
            titleKey="settings.navigation.sections.overriddenRecommendations"
          >
            <OverriddenRecommendations />
          </Section>
        );

      case 'recommendationKits':
        return (
          <section
            className={styles.section}
            data-testid="section-recommendation-kits"
          >
            <h2 className={styles.sectionTitle}>
              {t('settings.navigation.sections.recommendationKits')}
            </h2>
            <KitManagement />
          </section>
        );

      case 'dataManagement':
        return (
          <Section
            testId="section-data-management"
            titleKey="settings.navigation.sections.dataManagement"
          >
            <div className={styles.dataButtons}>
              <ExportButton />
              <ImportButton />
              <ShoppingListExport />
              <DebugExport />
            </div>
          </Section>
        );

      case 'about':
        return (
          <Section
            testId="section-about"
            titleKey="settings.navigation.sections.about"
          >
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
          </Section>
        );

      case 'dangerZone':
        return (
          <Section
            testId="section-danger-zone"
            titleKey="settings.navigation.sections.dangerZone"
            titleClassName={styles.dangerTitle}
          >
            <ClearDataButton />
          </Section>
        );
      default: {
        // Exhaustive check: ensures all SettingsSection cases are handled
        // TypeScript's strict mode with noFallthroughCasesInSwitch enforces this at compile time,
        // but this default case provides runtime safety
        // This should never be reached if all cases are handled
        return null;
      }
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
          ariaLabel={t('settings.navigation.menuLabel')}
        />

        <div className={styles.content}>{renderSection()}</div>
      </div>
    </div>
  );
}
