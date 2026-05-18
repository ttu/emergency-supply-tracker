import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Title } from '@/shared/components/design-v2/primitives';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';
import { useIsMobile } from '@/shared/hooks/useIsMobile';
import { useSettingsScrollSpy } from '@/features/settings/hooks/useSettingsScrollSpy';
import { Caption } from './SettingsRows';
import { SettingsRail, type SettingsNavItem } from './SettingsRail';
import { AppearanceSection } from './AppearanceSection';
import { HouseholdSection } from './HouseholdSection';
import { InventorySetsSection } from './InventorySetsSection';
import { NutritionSection } from './NutritionSection';
import { AdvancedSection } from './AdvancedSection';
import { NotificationsSection } from './NotificationsSection';
import { RecommendationsSection } from './RecommendationsSection';
import { CustomKitsSection } from './CustomKitsSection';
import { CategoriesSection } from './CategoriesSection';
import { DataBackupSection } from './DataBackupSection';
import { AboutSection } from './AboutSection';
import { DangerZoneSection } from './DangerZoneSection';

const SECTION_IDS = [
  'appearance',
  'household',
  'inventorysets',
  'nutrition',
  'advanced',
  'notifications',
  'recommendations',
  'categories',
  'data',
  'about',
  'danger',
] as const;

export function SettingsFull() {
  const { t } = useTranslation();
  const { themeKey } = useDesignTheme();
  const isMobile = useIsMobile();
  const { activeSection, scrollToSection } = useSettingsScrollSpy(
    SECTION_IDS,
    !isMobile,
  );

  const sections: SettingsNavItem[] = useMemo(
    () => [
      {
        id: 'appearance',
        code: '01',
        label: t(`v2.settings.nav.appearance.${themeKey}`),
      },
      {
        id: 'household',
        code: '02',
        label: t(`v2.settings.nav.household.${themeKey}`),
      },
      {
        id: 'inventorysets',
        code: '03',
        label: t(`v2.settings.nav.inventorysets.${themeKey}`),
      },
      {
        id: 'nutrition',
        code: '04',
        label: t(`v2.settings.nav.nutrition.${themeKey}`),
      },
      {
        id: 'advanced',
        code: '05',
        label: t(`v2.settings.nav.advanced.${themeKey}`),
      },
      {
        id: 'notifications',
        code: '06',
        label: t(`v2.settings.nav.notifications.${themeKey}`),
      },
      {
        id: 'recommendations',
        code: '07',
        label: t(`v2.settings.nav.recommendations.${themeKey}`),
      },
      {
        id: 'categories',
        code: '08',
        label: t(`v2.settings.nav.categories.${themeKey}`),
      },
      { id: 'data', code: '09', label: t(`v2.settings.nav.data.${themeKey}`) },
      {
        id: 'about',
        code: '10',
        label: t(`v2.settings.nav.about.${themeKey}`),
      },
      {
        id: 'danger',
        code: '11',
        label: t(`v2.settings.nav.danger.${themeKey}`),
        danger: true,
      },
    ],
    [t, themeKey],
  );

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'minmax(180px, 220px) 1fr',
        gap: isMobile ? 16 : 28,
        padding: isMobile ? 16 : 0,
      }}
    >
      {!isMobile && (
        <SettingsRail
          sections={sections}
          activeSection={activeSection}
          onSelect={scrollToSection}
        />
      )}

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 36,
          maxWidth: 940,
          minWidth: 0,
        }}
      >
        <div>
          <Caption>{t(`v2.voice.settings.${themeKey}`)}</Caption>
          <Title size={36} style={{ marginTop: 6 }}>
            {t(`v2.settings.title.${themeKey}`)}
          </Title>
          <p
            style={{
              marginTop: 8,
              marginBottom: 0,
              fontSize: 14,
              color: 'var(--color-text-2)',
              maxWidth: 660,
              lineHeight: 1.55,
            }}
          >
            {t(`v2.settings.intro.${themeKey}`)}
          </p>
        </div>

        <AppearanceSection />
        <HouseholdSection />
        <InventorySetsSection />
        <NutritionSection />
        <AdvancedSection />
        <NotificationsSection />
        <RecommendationsSection />
        <CustomKitsSection />
        <CategoriesSection />
        <DataBackupSection />
        <AboutSection />
        <DangerZoneSection />

        <div
          style={{
            marginTop: 12,
            padding: 12,
            background: 'var(--color-panel-2)',
            border: '1px solid var(--color-rule-soft)',
            borderRadius: 'var(--radius-sm)',
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--color-text-3)',
            letterSpacing: '0.06em',
            textAlign: 'center',
          }}
        >
          <Button
            variant="ghost"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            ↑ {t(`v2.settings.backToTop.${themeKey}`)}
          </Button>
        </div>
      </div>
    </div>
  );
}
