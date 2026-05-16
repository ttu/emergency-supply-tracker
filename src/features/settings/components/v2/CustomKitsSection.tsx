import { Panel } from '@/shared/components/design-v2/primitives';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';
import {
  KitManagement,
  OverriddenRecommendations,
  CustomTemplates,
} from '@/features/settings';
import { PanelHeader, SectionHeader } from './SettingsRows';

/** §7.4 Custom kits — wraps the classic kit management UI in v2 panels. */
export function CustomKitsSection() {
  const { themeKey } = useDesignTheme();
  return (
    <section style={{ scrollMarginTop: 16 }}>
      <SectionHeader
        code="§7.4"
        title={themeKey === 'pantry' ? 'Custom kits' : 'CUSTOM KITS'}
        sub={
          themeKey === 'pantry'
            ? 'Manage uploaded recommendation files'
            : 'UPLOADED RECOMMENDATION FILES'
        }
      />
      <Panel padding={0}>
        <div className="design-v2-embed" style={{ padding: 20 }}>
          <KitManagement />
        </div>
      </Panel>
      <Panel padding={0} style={{ marginTop: 14 }}>
        <PanelHeader>
          {themeKey === 'pantry' ? 'Custom overrides' : 'OVERRIDES'}
        </PanelHeader>
        <div className="design-v2-embed" style={{ padding: 20 }}>
          <OverriddenRecommendations />
        </div>
      </Panel>
      <Panel padding={0} style={{ marginTop: 14 }}>
        <PanelHeader>
          {themeKey === 'pantry' ? 'Custom item templates' : 'CUSTOM TEMPLATES'}
        </PanelHeader>
        <div className="design-v2-embed" style={{ padding: 20 }}>
          <CustomTemplates />
        </div>
      </Panel>
    </section>
  );
}
