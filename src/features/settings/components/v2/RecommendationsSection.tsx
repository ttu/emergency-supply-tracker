import { useMemo, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Panel } from '@/shared/components/design-v2/primitives';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';
import { Caption, SectionHeader } from './SettingsRows';
import { useInventory } from '@/features/inventory';
import { useRecommendedItems, RECOMMENDED_ITEMS } from '@/features/templates';
import { categoryCode } from '@/shared/i18n/voice';

export function RecommendationsSection() {
  const { themeKey } = useDesignTheme();
  const { t, i18n } = useTranslation(['common', 'products', 'categories']);
  const {
    disabledRecommendedItems,
    enableRecommendedItem,
    enableAllRecommendedItems,
  } = useInventory();
  const {
    recommendedItems,
    selectedKitId,
    availableKits,
    exportRecommendedItems,
  } = useRecommendedItems();

  const isPantry = themeKey === 'pantry';
  const totalItems = recommendedItems.length;

  const activeKit =
    availableKits.find((k) => k.id === selectedKitId) ?? availableKits[0];
  const activeKitName = activeKit?.name ?? '72tuntia.fi';

  const disabledList = useMemo(() => {
    return disabledRecommendedItems
      .map((id) => {
        const item = RECOMMENDED_ITEMS.find((rec) => rec.id === id);
        if (!item) return null;
        return {
          id,
          name: t(item.i18nKey.replace(/^(products\.|custom\.)/, ''), {
            ns: 'products',
          }),
          category: String(item.category),
          categoryCode: categoryCode(String(item.category)),
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .sort((a, b) => a.name.localeCompare(b.name, i18n.language));
  }, [disabledRecommendedItems, t, i18n.language]);

  const handleExport = () => {
    try {
      const file = exportRecommendedItems();
      const blob = new Blob([JSON.stringify(file, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recommended-items-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export failed', e);
    }
  };

  const handleImportClick = () => {
    // Defer to v1 import infrastructure: synthesize a click on a hidden file input.
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = () => {
      // Importing kits is handled via the v1 KitManagement component which
      // is mounted in the Custom kits panel below — direct the user there.
      alert(
        isPantry
          ? 'Use the Custom kits panel below to import a kit file.'
          : 'IMPORT VIA CUSTOM KITS · §7.2',
      );
    };
    input.click();
  };

  return (
    <section id="sec-recommendations" style={{ scrollMarginTop: 16 }}>
      <SectionHeader
        code="§7"
        title={isPantry ? 'Recommendations' : 'RECOMMENDATIONS'}
        sub={
          isPantry
            ? 'The 72tuntia.fi baseline — or your own'
            : 'SOURCE LIST · IMPORT / EXPORT'
        }
      />

      <Panel padding={0}>
        {/* Active recommendations row */}
        <div
          style={{
            padding: '18px 22px',
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            alignItems: 'center',
            gap: 16,
            borderBottom: '1px solid var(--color-rule-soft)',
          }}
        >
          <div>
            <Caption>
              {isPantry ? 'Current source' : 'ACTIVE RECOMMENDATIONS'}
            </Caption>
            <div style={{ marginTop: 6, fontSize: 16, fontWeight: 600 }}>
              {isPantry
                ? `${activeKitName} · ${totalItems} items`
                : `${String(activeKitName).toUpperCase()} · ${totalItems} ITEMS`}
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: 'var(--color-text-3)',
                marginTop: 4,
                letterSpacing: '0.06em',
              }}
            >
              {selectedKitId
                ? `KIT · ${String(selectedKitId).toUpperCase()}`
                : 'BUILT-IN'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" onClick={handleExport}>
              {isPantry ? 'Export current' : 'EXPORT JSON'}
            </Button>
            <Button variant="primary" onClick={handleImportClick}>
              {isPantry ? 'Import custom' : 'IMPORT JSON'}
            </Button>
          </div>
        </div>

        {/* Disabled section header */}
        <div
          style={{
            padding: '14px 22px',
            borderBottom:
              disabledList.length > 0
                ? '1px solid var(--color-rule-soft)'
                : 'none',
          }}
        >
          <Caption>
            {isPantry
              ? `Disabled items · ${disabledList.length} of ${totalItems}`
              : `DISABLED · ${disabledList.length} OF ${totalItems}`}
          </Caption>
          <div
            style={{
              fontSize: 12,
              color: 'var(--color-text-2)',
              marginTop: 4,
            }}
          >
            {isPantry
              ? "Items you've turned off — they won't appear in your inventory recommendations."
              : 'EXCLUDED FROM BASELINE COMPUTATION + COVERAGE METRICS'}
          </div>
        </div>

        {disabledList.length === 0 && (
          <div
            style={{
              padding: 24,
              textAlign: 'center',
              color: 'var(--color-text-2)',
              fontSize: 13,
            }}
          >
            {isPantry
              ? 'Nothing disabled — every recommended item is active.'
              : 'NIL · ALL RECOMMENDATIONS ACTIVE'}
          </div>
        )}

        {disabledList.map((r, i) => (
          <div
            key={String(r.id)}
            style={{
              padding: '12px 22px',
              display: 'grid',
              gridTemplateColumns: '90px 1fr 1fr auto',
              gap: 14,
              alignItems: 'center',
              borderBottom:
                i < disabledList.length - 1
                  ? '1px solid var(--color-rule-soft)'
                  : 'none',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: 'var(--color-text-3)',
              }}
            >
              {String(r.id).slice(0, 14)}
            </span>
            <span
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: 'var(--color-text)',
              }}
            >
              {r.name}
            </span>
            <span
              style={{
                fontSize: 12,
                color: 'var(--color-text-2)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {r.categoryCode}
            </span>
            <Button
              variant="secondary"
              onClick={() => enableRecommendedItem(r.id)}
            >
              {isPantry ? 'Enable' : 'ENABLE'}
            </Button>
          </div>
        ))}

        {disabledList.length > 0 && (
          <div
            style={{
              padding: '12px 22px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid var(--color-rule-soft)',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                color: 'var(--color-text-3)',
              }}
            >
              {isPantry
                ? `${disabledList.length} of ${totalItems} disabled`
                : `${disabledList.length} / ${totalItems} DISABLED`}
            </span>
            <button
              type="button"
              onClick={enableAllRecommendedItems}
              style={enableAllStyle}
            >
              {isPantry ? 'Enable all' : 'ENABLE ALL'}
            </button>
          </div>
        )}
      </Panel>
    </section>
  );
}

const enableAllStyle: CSSProperties = {
  background: 'transparent',
  border: 0,
  color: 'var(--color-accent)',
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  letterSpacing: '0.08em',
  fontWeight: 700,
  cursor: 'pointer',
  padding: 0,
};
