import type { ReactNode } from 'react';
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
  DebugExport,
  ClearDataButton,
  DisabledCategories,
  DisabledRecommendations,
  OverriddenRecommendations,
  KitManagement,
  CategoriesSection,
  CustomTemplates,
  WorkspaceSection,
} from '@/features/settings';
import { GitHubIcon } from '@/shared/components';
import { SideMenu, SideMenuGroup } from '@/shared/components/SideMenu';
import { CONTACT_EMAIL } from '@/shared/utils/constants';
import {
  getLocalStorageUsageMB,
  LOCAL_STORAGE_LIMIT_BYTES,
} from '@/shared/utils/storage/storageUsage';
import { APP_VERSION } from '@/shared/utils/version';
import styles from './Settings.module.css';

type SettingsSection =
  | 'appearance'
  | 'workspaces'
  | 'household'
  | 'nutrition'
  | 'hiddenAlerts'
  | 'disabledRecommendations'
  | 'disabledCategories'
  | 'customCategories'
  | 'customTemplates'
  | 'overriddenRecommendations'
  | 'recommendationKits'
  | 'backupTransfer'
  | 'debugLog'
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

  // Use callback ref to get the hamburger container element (triggers re-render when set)
  const [hamburgerContainer, setHamburgerContainer] =
    useState<HTMLDivElement | null>(null);

  const menuGroups: SideMenuGroup[] = [
    {
      id: 'general',
      label: t('settings.navigation.groups.general'),
      items: [
        {
          id: 'appearance',
          label: t('settings.navigation.sections.appearance'),
        },
        {
          id: 'workspaces',
          label: t('settings.navigation.sections.workspaces'),
        },
        {
          id: 'backupTransfer',
          label: t('settings.navigation.sections.backupTransfer'),
        },
        { id: 'about', label: t('settings.navigation.sections.about') },
      ],
    },
    {
      id: 'household',
      label: t('settings.navigation.groups.household'),
      items: [
        { id: 'household', label: t('settings.navigation.sections.household') },
        { id: 'nutrition', label: t('settings.navigation.sections.nutrition') },
      ],
    },
    {
      id: 'recommendations',
      label: t('settings.navigation.groups.recommendations'),
      items: [
        {
          id: 'recommendationKits',
          label: t('settings.navigation.sections.recommendationKits'),
        },
        {
          id: 'customTemplates',
          label: t('settings.navigation.sections.customTemplates'),
        },
        {
          id: 'disabledRecommendations',
          label: t('settings.navigation.sections.disabledRecommendations'),
        },
        {
          id: 'overriddenRecommendations',
          label: t('settings.navigation.sections.overriddenRecommendations'),
        },
        {
          id: 'hiddenAlerts',
          label: t('settings.navigation.sections.hiddenAlerts'),
        },
      ],
    },
    {
      id: 'categories',
      label: t('settings.navigation.groups.categories'),
      items: [
        {
          id: 'disabledCategories',
          label: t('settings.navigation.sections.disabledCategories'),
        },
        {
          id: 'customCategories',
          label: t('settings.navigation.sections.customCategories'),
        },
      ],
    },
    {
      id: 'advanced',
      label: t('settings.navigation.groups.advanced'),
      items: [
        {
          id: 'debugLog',
          label: t('settings.navigation.sections.debugLog'),
        },
        {
          id: 'dangerZone',
          label: t('settings.navigation.sections.dangerZone'),
        },
      ],
    },
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

      case 'workspaces':
        return (
          <Section
            testId="section-workspaces"
            titleKey="settings.navigation.sections.workspaces"
          >
            <WorkspaceSection />
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

      case 'customTemplates':
        return (
          <Section
            testId="section-custom-templates"
            titleKey="settings.navigation.sections.customTemplates"
          >
            <CustomTemplates />
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

      case 'backupTransfer':
        return (
          <Section
            testId="section-backup-transfer"
            titleKey="settings.navigation.sections.backupTransfer"
          >
            <div className={styles.dataButtons}>
              <ExportButton />
              <ImportButton />
            </div>
          </Section>
        );

      case 'debugLog':
        return (
          <Section
            testId="section-debug-log"
            titleKey="settings.navigation.sections.debugLog"
          >
            <DebugExport />
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
              <p className={styles.tagline}>{t('app.tagline')}</p>
              <p className={styles.version}>
                {t('settings.about.version')}: {APP_VERSION}
              </p>
              <p className={styles.version} data-testid="storage-used">
                {t('settings.about.storageUsed')}:{' '}
                {t('settings.about.storageUsedValue', {
                  used: getLocalStorageUsageMB(),
                  limit: Math.round(LOCAL_STORAGE_LIMIT_BYTES / (1024 * 1024)),
                })}
              </p>
              <p className={styles.storageDescription}>
                {t('settings.about.storageDescription')}
              </p>
              <p className={styles.description}>{t('help.contactText')}</p>
              <div className={styles.contactLinks}>
                <a href={`mailto:${CONTACT_EMAIL}`} className={styles.link}>
                  {CONTACT_EMAIL}
                </a>
                <a
                  href="https://github.com/ttu/emergency-supply-tracker"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.link}
                >
                  <GitHubIcon className={styles.githubIcon} />
                  {t('help.githubLink')}
                </a>
              </div>
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
        <div className={styles.headerActions} ref={setHamburgerContainer} />
      </header>

      <div className={styles.layout}>
        <SideMenu
          groups={menuGroups}
          selectedId={selectedSection}
          onSelect={(id) => setSelectedSection(id as SettingsSection)}
          ariaLabel={t('settings.navigation.menuLabel')}
          hamburgerContainer={hamburgerContainer}
        />

        <div className={styles.content}>{renderSection()}</div>
      </div>
    </div>
  );
}
