import { useTranslation } from 'react-i18next';
import { Panel } from '@/shared/components/design-v2/primitives';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';
import {
  KitManagement,
  OverriddenRecommendations,
  CustomTemplates,
} from '@/features/settings';
import { PanelHeader, SectionHeader } from './SettingsRows';

export function CustomKitsSection() {
  const { t } = useTranslation();
  const { themeKey } = useDesignTheme();
  return (
    <section style={{ scrollMarginTop: 16 }}>
      <SectionHeader
        code="§7.4"
        title={t(`v2.settings.customKits.title.${themeKey}`)}
        sub={t(`v2.settings.customKits.sub.${themeKey}`)}
      />
      <Panel padding={0}>
        <div className="design-v2-embed" style={{ padding: 20 }}>
          <KitManagement />
        </div>
      </Panel>
      <Panel padding={0} style={{ marginTop: 14 }}>
        <PanelHeader>
          {t(`v2.settings.customKits.overrides.${themeKey}`)}
        </PanelHeader>
        <div className="design-v2-embed" style={{ padding: 20 }}>
          <OverriddenRecommendations />
        </div>
      </Panel>
      <Panel padding={0} style={{ marginTop: 14 }}>
        <PanelHeader>
          {t(`v2.settings.customKits.templates.${themeKey}`)}
        </PanelHeader>
        <div className="design-v2-embed" style={{ padding: 20 }}>
          <CustomTemplates />
        </div>
      </Panel>
    </section>
  );
}
