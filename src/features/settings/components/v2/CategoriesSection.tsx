import { useTranslation } from 'react-i18next';
import { Panel } from '@/shared/components/design-v2/primitives';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';
import {
  CategoriesSection as ClassicCategoriesSection,
  DisabledCategories,
} from '@/features/settings';
import { PanelHeader, SectionHeader } from './SettingsRows';

export function CategoriesSection() {
  const { t } = useTranslation();
  const { themeKey } = useDesignTheme();
  return (
    <section id="sec-categories" style={{ scrollMarginTop: 16 }}>
      <SectionHeader
        code="§8"
        title={t(`v2.settings.categories.title.${themeKey}`)}
        sub={t(`v2.settings.categories.sub.${themeKey}`)}
      />
      <Panel padding={0}>
        <PanelHeader>
          {t(`v2.settings.categories.customHeader.${themeKey}`)}
        </PanelHeader>
        <div className="design-v2-embed" style={{ padding: 20 }}>
          <ClassicCategoriesSection />
        </div>
      </Panel>
      <Panel padding={0} style={{ marginTop: 14 }}>
        <PanelHeader>
          {t(`v2.settings.categories.disabledHeader.${themeKey}`)}
        </PanelHeader>
        <div className="design-v2-embed" style={{ padding: 20 }}>
          <DisabledCategories />
        </div>
      </Panel>
    </section>
  );
}
