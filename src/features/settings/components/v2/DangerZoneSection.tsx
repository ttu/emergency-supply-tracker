import { Button, Panel } from '@/shared/components/design-v2/primitives';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';
import { ClearDataButton } from '@/features/settings';
import { useInventory } from '@/features/inventory';
import { Caption, SectionHeader } from './SettingsRows';

/** §11 Danger zone: reset items, reset recommendations, factory reset. */
export function DangerZoneSection() {
  const { themeKey } = useDesignTheme();
  const { items, deleteItems, enableAllRecommendedItems } = useInventory();

  const handleResetItems = () => {
    if (
      confirm(
        themeKey === 'pantry'
          ? 'Remove every item? Household and settings will be kept.'
          : 'PURGE ALL ITEMS? HOUSEHOLD + CONFIG RETAINED.',
      )
    ) {
      deleteItems(items.map((i) => i.id));
    }
  };
  const handleResetRecommendations = () => {
    if (
      confirm(
        themeKey === 'pantry'
          ? 'Restore default recommendations and re-enable all items?'
          : 'REVERT TO BUILT-IN BASELINE + CLEAR DISABLED LIST?',
      )
    ) {
      enableAllRecommendedItems();
    }
  };

  return (
    <section id="sec-danger" style={{ scrollMarginTop: 16 }}>
      <SectionHeader
        code="§11"
        title={themeKey === 'pantry' ? 'Danger zone' : 'DANGER ZONE'}
      />
      <Panel padding={0} style={{ borderColor: 'var(--color-crit)' }}>
        <div
          style={{
            padding: '14px 22px',
            borderBottom: '1px solid var(--color-crit)',
          }}
        >
          <Caption style={{ color: 'var(--color-crit)' }}>
            {themeKey === 'pantry'
              ? 'Irreversible actions'
              : 'IRREVERSIBLE · CONFIRM EACH ACTION'}
          </Caption>
        </div>
        <DangerRow
          title={themeKey === 'pantry' ? 'Reset all items' : 'RESET INVENTORY'}
          detail={
            themeKey === 'pantry'
              ? 'Removes every item but keeps household and settings.'
              : 'PURGE ITEMS · RETAIN HOUSEHOLD + CONFIG'
          }
          action={themeKey === 'pantry' ? 'Reset items' : 'RESET'}
          onClick={handleResetItems}
        />
        <DangerRow
          title={
            themeKey === 'pantry'
              ? 'Reset recommendations'
              : 'RESET RECOMMENDATIONS'
          }
          detail={
            themeKey === 'pantry'
              ? 'Re-enable every recommended item.'
              : 'CLEAR DISABLED LIST · ENABLE ALL'
          }
          action={themeKey === 'pantry' ? 'Reset list' : 'RESET'}
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
              {themeKey === 'pantry' ? 'Clear all data' : 'FACTORY RESET'}
            </div>
            <div
              style={{
                fontSize: 12,
                color: 'var(--color-text-2)',
                marginTop: 4,
              }}
            >
              {themeKey === 'pantry'
                ? 'Removes every item, setting, and history entry on this device.'
                : 'PURGE ALL LOCAL STATE · CANNOT BE UNDONE'}
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

function DangerRow({
  title,
  detail,
  action,
  onClick,
}: {
  title: string;
  detail: string;
  action: string;
  onClick: () => void;
}) {
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
