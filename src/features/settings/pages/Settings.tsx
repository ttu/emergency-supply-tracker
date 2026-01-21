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

interface SectionProps {
  testId: string;
  titleKey: string;
  titleClassName?: string;
  children: ReactNode;
}

function Section({
  testId,
  titleKey,
  titleClassName = styles.sectionTitle,
  children,
}: SectionProps) {
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
          <Section
            testId="section-appearance"
            titleKey="settings.sections.appearance"
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
            titleKey="settings.sections.household"
          >
            <HouseholdForm />
          </Section>
        );

      case 'nutrition':
        return (
          <Section
            testId="section-nutrition"
            titleKey="settings.sections.nutrition"
          >
            <NutritionSettings />
          </Section>
        );

      case 'hiddenAlerts':
        return (
          <Section
            testId="section-hidden-alerts"
            titleKey="settings.sections.hiddenAlerts"
          >
            <HiddenAlerts />
          </Section>
        );

      case 'disabledRecommendations':
        return (
          <Section
            testId="section-disabled-recommendations"
            titleKey="settings.sections.disabledRecommendations"
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
              {t('settings.sections.disabledCategories')}
            </h2>
            <DisabledCategories />
          </section>
        );

      case 'overriddenRecommendations':
        return (
          <Section
            testId="section-overridden-recommendations"
            titleKey="settings.sections.overriddenRecommendations"
          >
            <OverriddenRecommendations />
          </Section>
        );

      case 'recommendedItems':
        return (
          <Section
            testId="section-recommended-items"
            titleKey="settings.sections.recommendedItems"
          >
            <RecommendationsStatus />
            <div className={styles.dataButtons}>
              <ImportRecommendationsButton />
              <ExportRecommendationsButton />
            </div>
          </Section>
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
          <Section
            testId="section-data-management"
            titleKey="settings.sections.dataManagement"
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
          <Section testId="section-about" titleKey="settings.sections.about">
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
            titleKey="settings.sections.dangerZone"
            titleClassName={styles.dangerTitle}
          >
            <ClearDataButton />
          </Section>
        );
      default: {
        // Exhaustive check: ensures all SettingsSection cases are handled
        // TypeScript's strict mode with noFallthroughCasesInSwitch enforces this at compile time,
        // but this default case provides runtime safety
        const _exhaustive: never = selectedSection as never;
        void _exhaustive; // Suppress unused variable warning
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
          ariaLabel={t('settings.menuLabel')}
        />

        <div className={styles.content}>{renderSection()}</div>
      </div>
    </div>
  );
}
