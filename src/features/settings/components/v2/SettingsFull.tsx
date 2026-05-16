import { useMemo } from 'react';
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
  const { themeKey, voice } = useDesignTheme();
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
        label: themeKey === 'pantry' ? 'Appearance' : 'APPEARANCE',
      },
      {
        id: 'household',
        code: '02',
        label: themeKey === 'pantry' ? 'Household' : 'HOUSEHOLD',
      },
      {
        id: 'inventorysets',
        code: '03',
        label: themeKey === 'pantry' ? 'Inventory sets' : 'INVENTORY SETS',
      },
      {
        id: 'nutrition',
        code: '04',
        label: themeKey === 'pantry' ? 'Nutrition' : 'NUTRITION',
      },
      {
        id: 'advanced',
        code: '05',
        label: themeKey === 'pantry' ? 'Advanced' : 'ADVANCED',
      },
      {
        id: 'notifications',
        code: '06',
        label: themeKey === 'pantry' ? 'Notifications' : 'NOTIFICATIONS',
      },
      {
        id: 'recommendations',
        code: '07',
        label: themeKey === 'pantry' ? 'Recommendations' : 'RECOMMENDATIONS',
      },
      {
        id: 'categories',
        code: '08',
        label: themeKey === 'pantry' ? 'Categories' : 'CATEGORIES',
      },
      {
        id: 'data',
        code: '09',
        label: themeKey === 'pantry' ? 'Data & backup' : 'DATA & BACKUP',
      },
      {
        id: 'about',
        code: '10',
        label: themeKey === 'pantry' ? 'About' : 'ABOUT',
      },
      {
        id: 'danger',
        code: '11',
        label: themeKey === 'pantry' ? 'Danger zone' : 'DANGER ZONE',
        danger: true,
      },
    ],
    [themeKey],
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
          <Caption>{voice.settings}</Caption>
          <Title size={36} style={{ marginTop: 6 }}>
            {themeKey === 'pantry' ? 'Settings' : 'SYSTEM CONFIGURATION'}
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
            {themeKey === 'pantry'
              ? 'Everything that changes how the app behaves. Most of these have sensible defaults — change what matters to you.'
              : 'COMPLETE PARAMETER SET. ALL VALUES PERSIST LOCALLY. CHANGES TAKE EFFECT IMMEDIATELY UNLESS NOTED.'}
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
            ↑ {themeKey === 'pantry' ? 'Back to top' : 'BACK TO TOP'}
          </Button>
        </div>
      </div>
    </div>
  );
}
