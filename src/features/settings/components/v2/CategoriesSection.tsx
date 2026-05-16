import { Panel } from '@/shared/components/design-v2/primitives';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';
import {
  CategoriesSection as ClassicCategoriesSection,
  DisabledCategories,
} from '@/features/settings';
import { PanelHeader, SectionHeader } from './SettingsRows';

/** §8 Categories — custom categories + disabled built-in categories. */
export function CategoriesSection() {
  const { themeKey } = useDesignTheme();
  return (
    <section id="sec-categories" style={{ scrollMarginTop: 16 }}>
      <SectionHeader
        code="§8"
        title={themeKey === 'pantry' ? 'Categories' : 'CATEGORIES'}
        sub={
          themeKey === 'pantry'
            ? 'Hide built-ins, add your own'
            : 'CUSTOM + DISABLED CATEGORIES'
        }
      />
      <Panel padding={0}>
        <PanelHeader>
          {themeKey === 'pantry' ? 'Custom categories' : 'CUSTOM · §8.1'}
        </PanelHeader>
        <div className="design-v2-embed" style={{ padding: 20 }}>
          <ClassicCategoriesSection />
        </div>
      </Panel>
      <Panel padding={0} style={{ marginTop: 14 }}>
        <PanelHeader>
          {themeKey === 'pantry'
            ? 'Disabled built-in categories'
            : 'DISABLED · §8.2'}
        </PanelHeader>
        <div className="design-v2-embed" style={{ padding: 20 }}>
          <DisabledCategories />
        </div>
      </Panel>
    </section>
  );
}
