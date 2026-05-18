import { useTranslation } from 'react-i18next';
import { Panel } from '@/shared/components/design-v2/primitives';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';
import { InventorySetSection as ClassicInventorySets } from '@/features/settings';
import { SectionHeader } from './SettingsRows';

/** §3 Inventory sets — wraps the classic InventorySetSection in a v2 panel. */
export function InventorySetsSection() {
  const { t } = useTranslation();
  const { themeKey } = useDesignTheme();
  return (
    <section id="sec-inventorysets" style={{ scrollMarginTop: 16 }}>
      <SectionHeader
        code="§3"
        title={t(`v2.settings.inventorySets.title.${themeKey}`)}
        sub={t(`v2.settings.inventorySets.sub.${themeKey}`)}
      />
      <Panel padding={0}>
        <div className="design-v2-embed" style={{ padding: 20 }}>
          <ClassicInventorySets />
        </div>
      </Panel>
    </section>
  );
}
