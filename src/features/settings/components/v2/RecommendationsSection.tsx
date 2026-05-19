import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AccentTextButton,
  Button,
  Panel,
} from '@/shared/components/design-v2/primitives';
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

  const totalItems = recommendedItems.length;

  const activeKit =
    availableKits.find((k) => k.id === selectedKitId) ?? availableKits[0];
  const activeKitName = activeKit?.name ?? '72tuntia.fi';
  const displayKitName =
    themeKey === 'pantry' ? activeKitName : String(activeKitName).toUpperCase();

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

  // Kit import lives in §7.4 Custom kits (which mounts the v1 KitManagement
  // UI). The Import button used to live here too but only fired an alert
  // pointing the user there, which was confusing — better to expose the one
  // working entry point. The v2.settings.recommendations.importAlert /
  // importBtn locale keys are now unused; safe to remove in the next batch.

  return (
    <section id="sec-recommendations" style={{ scrollMarginTop: 16 }}>
      <SectionHeader
        code="§7"
        title={t(`v2.settings.recommendations.title.${themeKey}`)}
        sub={t(`v2.settings.recommendations.sub.${themeKey}`)}
      />

      <Panel padding={0}>
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
              {t(`v2.settings.recommendations.activeCaption.${themeKey}`)}
            </Caption>
            <div style={{ marginTop: 6, fontSize: 16, fontWeight: 600 }}>
              {t(`v2.settings.recommendations.activeValue.${themeKey}`, {
                kit: displayKitName,
                total: totalItems,
              })}
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
                ? t('v2.settings.recommendations.kitLabel', {
                    kit: String(selectedKitId).toUpperCase(),
                  })
                : t('v2.settings.recommendations.builtIn')}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" onClick={handleExport}>
              {t(`v2.settings.recommendations.exportBtn.${themeKey}`)}
            </Button>
          </div>
        </div>

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
            {t(`v2.settings.recommendations.disabledCaption.${themeKey}`, {
              count: disabledList.length,
              total: totalItems,
            })}
          </Caption>
          <div
            style={{
              fontSize: 12,
              color: 'var(--color-text-2)',
              marginTop: 4,
            }}
          >
            {t(`v2.settings.recommendations.disabledExplain.${themeKey}`)}
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
            {t(`v2.settings.recommendations.disabledEmpty.${themeKey}`)}
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
              {t(`v2.settings.recommendations.enableBtn.${themeKey}`)}
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
              {t(`v2.settings.recommendations.disabledFooter.${themeKey}`, {
                count: disabledList.length,
                total: totalItems,
              })}
            </span>
            <AccentTextButton onClick={enableAllRecommendedItems} fontSize={11}>
              {t(`v2.settings.recommendations.enableAllBtn.${themeKey}`)}
            </AccentTextButton>
          </div>
        )}
      </Panel>
    </section>
  );
}
