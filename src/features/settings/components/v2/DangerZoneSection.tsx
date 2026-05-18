import { useTranslation } from 'react-i18next';
import { Button, Panel } from '@/shared/components/design-v2/primitives';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';
import { ClearDataButton } from '@/features/settings';
import { useInventory } from '@/features/inventory';
import { Caption, SectionHeader } from './SettingsRows';

export function DangerZoneSection() {
  const { t } = useTranslation();
  const { themeKey } = useDesignTheme();
  const { items, deleteItems, enableAllRecommendedItems } = useInventory();

  const handleResetItems = () => {
    if (confirm(t(`v2.settings.danger.resetItemsConfirm.${themeKey}`))) {
      deleteItems(items.map((i) => i.id));
    }
  };
  const handleResetRecommendations = () => {
    if (confirm(t(`v2.settings.danger.resetRecsConfirm.${themeKey}`))) {
      enableAllRecommendedItems();
    }
  };

  return (
    <section id="sec-danger" style={{ scrollMarginTop: 16 }}>
      <SectionHeader
        code="§11"
        title={t(`v2.settings.danger.title.${themeKey}`)}
      />
      <Panel padding={0} style={{ borderColor: 'var(--color-crit)' }}>
        <div
          style={{
            padding: '14px 22px',
            borderBottom: '1px solid var(--color-crit)',
          }}
        >
          <Caption style={{ color: 'var(--color-crit)' }}>
            {t(`v2.settings.danger.irreversible.${themeKey}`)}
          </Caption>
        </div>
        <DangerRow
          title={t(`v2.settings.danger.resetItems.${themeKey}`)}
          detail={t(`v2.settings.danger.resetItemsDetail.${themeKey}`)}
          action={t(`v2.settings.danger.resetItemsBtn.${themeKey}`)}
          onClick={handleResetItems}
        />
        <DangerRow
          title={t(`v2.settings.danger.resetRecs.${themeKey}`)}
          detail={t(`v2.settings.danger.resetRecsDetail.${themeKey}`)}
          action={t(`v2.settings.danger.resetRecsBtn.${themeKey}`)}
          onClick={handleResetRecommendations}
        />
        <div
          style={{
            padding: '16px 22px',
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--color-text)',
              }}
            >
              {t(`v2.settings.danger.factoryTitle.${themeKey}`)}
            </div>
            <div
              style={{
                fontSize: 12,
                color: 'var(--color-text-2)',
                marginTop: 4,
              }}
            >
              {t(`v2.settings.danger.factoryDetail.${themeKey}`)}
            </div>
          </div>
          <div className="design-v2-embed">
            <ClearDataButton />
          </div>
        </div>
      </Panel>
    </section>
  );
}

interface DangerRowProps {
  title: string;
  detail: string;
  action: string;
  onClick: () => void;
}

function DangerRow({
  title,
  detail,
  action,
  onClick,
}: Readonly<DangerRowProps>) {
  return (
    <div
      style={{
        padding: '16px 22px',
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        alignItems: 'center',
        gap: 16,
        borderBottom: '1px solid var(--color-rule-soft)',
      }}
    >
      <div>
        <div
          style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)' }}
        >
          {title}
        </div>
        <div
          style={{ fontSize: 12, color: 'var(--color-text-2)', marginTop: 4 }}
        >
          {detail}
        </div>
      </div>
      <Button variant="secondary" onClick={onClick}>
        {action}
      </Button>
    </div>
  );
}
