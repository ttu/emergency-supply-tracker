import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Caption, Panel } from '@/shared/components/design-v2/primitives';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';
import { OnboardLayout } from './OnboardLayout';

interface OnboardStep05Props {
  enabledCategories: Set<string>;
  onToggleCategory: (id: string) => void;
  onNext: () => void;
  onBack: () => void;
}

const CAT_IDS = [
  'water-beverages',
  'food',
  'cooking-heat',
  'light-power',
  'communication-info',
  'medical-health',
  'hygiene-sanitation',
  'tools-supplies',
  'cash-documents',
  'pets',
] as const;
const CAT_CODES: Record<(typeof CAT_IDS)[number], string> = {
  'water-beverages': 'H2O',
  food: 'FUD',
  'cooking-heat': 'CKH',
  'light-power': 'PWR',
  'communication-info': 'CMM',
  'medical-health': 'MED',
  'hygiene-sanitation': 'HYG',
  'tools-supplies': 'TLS',
  'cash-documents': 'DOC',
  pets: 'PET',
};

export function OnboardStep05Items({
  enabledCategories,
  onToggleCategory,
  onNext,
  onBack,
}: Readonly<OnboardStep05Props>) {
  const { t } = useTranslation();
  const { themeKey } = useDesignTheme();
  const cats = useMemo(
    () =>
      CAT_IDS.map(
        (id) =>
          [
            id,
            CAT_CODES[id],
            t(`v2.onboarding.step05.cat.${id}.${themeKey}`),
          ] as const,
      ),
    [t, themeKey],
  );

  return (
    <OnboardLayout
      step={5}
      title={t(`v2.voice.onbItems.${themeKey}`)}
      lead={{
        title: t(`v2.onboarding.step05.leadTitle.${themeKey}`),
        sub: t(`v2.onboarding.step05.leadSub.${themeKey}`),
      }}
      back={onBack}
      onContinue={onNext}
      primaryLabel={t(`v2.onboarding.step05.primaryLabel.${themeKey}`)}
    >
      <Panel padding={0}>
        <div
          style={{
            padding: '12px 18px',
            borderBottom: '1px solid var(--color-rule-soft)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Caption>
            {t(`v2.onboarding.step05.enabledCount.${themeKey}`, {
              enabled: enabledCategories.size,
              total: cats.length,
            })}
          </Caption>
        </div>
        {cats.map(([id, code, name], i) => {
          const enabled = enabledCategories.has(id);
          return (
            <button
              key={id}
              type="button"
              onClick={() => onToggleCategory(id)}
              aria-pressed={enabled}
              style={{
                padding: '14px 18px',
                display: 'grid',
                gridTemplateColumns: '20px 60px 1fr',
                gap: 14,
                alignItems: 'center',
                borderBottom:
                  i < cats.length - 1
                    ? '1px solid var(--color-rule-soft)'
                    : 'none',
                background: 'transparent',
                border: 0,
                fontFamily: 'inherit',
                color: 'inherit',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                opacity: enabled ? 1 : 0.5,
              }}
            >
              <span
                aria-hidden
                style={{
                  width: 18,
                  height: 18,
                  border: `1.5px solid ${enabled ? 'var(--color-accent)' : 'var(--color-rule)'}`,
                  background: enabled ? 'var(--color-accent)' : 'transparent',
                  borderRadius: themeKey === 'pantry' ? 4 : 0,
                  display: 'grid',
                  placeItems: 'center',
                  color: 'var(--color-accent-ink)',
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                {enabled ? '✓' : ''}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  color: 'var(--color-text-3)',
                  fontWeight: 600,
                }}
              >
                {code}
              </span>
              <span style={{ fontSize: 14, fontWeight: 500 }}>{name}</span>
            </button>
          );
        })}
      </Panel>
    </OnboardLayout>
  );
}
