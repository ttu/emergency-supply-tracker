import { useTranslation } from 'react-i18next';
import { Caption } from '@/shared/components/design-v2/primitives';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';
import type { HouseholdConfig } from '@/shared/types';
import { OnboardLayout } from './OnboardLayout';
import { ONBOARDING_PRESETS } from './onboardingPresets';

interface OnboardStep03Props {
  presetCode: string;
  onPresetChange: (code: string) => void;
  onApplyPreset: (next: Partial<HouseholdConfig>) => void;
  onNext: () => void;
  onBack: () => void;
}

/** Step 3: 4-card preset grid (single / couple / family / custom). */
export function OnboardStep03Preset({
  presetCode,
  onPresetChange,
  onApplyPreset,
  onNext,
  onBack,
}: Readonly<OnboardStep03Props>) {
  const { t } = useTranslation();
  const { themeKey } = useDesignTheme();
  return (
    <OnboardLayout
      step={3}
      title={t(`v2.voice.onbPreset.${themeKey}`)}
      lead={{
        title: t(`v2.onboarding.step03.leadTitle.${themeKey}`),
        sub: t(`v2.onboarding.step03.leadSub.${themeKey}`),
      }}
      back={onBack}
      onContinue={() => {
        const preset = ONBOARDING_PRESETS.find((p) => p.code === presetCode)!;
        if (preset.code !== 'P-04') {
          onApplyPreset({
            adults: preset.adults,
            children: preset.children,
            supplyDurationDays: preset.days,
            pets: preset.pets,
          });
        }
        onNext();
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 14,
        }}
      >
        {ONBOARDING_PRESETS.map((p) => {
          const sel = presetCode === p.code;
          return (
            <button
              key={p.code}
              type="button"
              onClick={() => onPresetChange(p.code)}
              aria-pressed={sel}
              style={{
                padding: 20,
                border: `1.5px solid ${sel ? 'var(--color-accent)' : 'var(--color-rule)'}`,
                background: sel ? 'var(--color-panel)' : 'transparent',
                borderRadius: 'var(--radius-lg)',
                cursor: 'pointer',
                fontFamily: 'inherit',
                color: 'var(--color-text)',
                textAlign: 'left',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    color: 'var(--color-text-3)',
                    letterSpacing: '0.08em',
                  }}
                >
                  {p.code}
                </span>
                <span
                  aria-hidden
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 999,
                    border: `1.5px solid ${sel ? 'var(--color-accent)' : 'var(--color-rule)'}`,
                    background: sel ? 'var(--color-accent)' : 'transparent',
                    display: 'grid',
                    placeItems: 'center',
                    color: 'var(--color-accent-ink)',
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {sel ? '✓' : ''}
                </span>
              </div>
              <div
                style={{
                  marginTop: 14,
                  fontFamily: 'var(--font-display)',
                  fontSize: 22,
                  fontWeight: 600,
                  letterSpacing: '-0.015em',
                }}
              >
                {p.name[themeKey]}
              </div>
              <div
                style={{
                  marginTop: 18,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 12,
                  paddingTop: 16,
                  borderTop: '1px solid var(--color-rule-soft)',
                }}
              >
                <PresetStat
                  label={t(`v2.onboarding.labelAdults.${themeKey}`)}
                  value={p.adults}
                />
                <PresetStat
                  label={t(`v2.onboarding.labelChildren.${themeKey}`)}
                  value={p.children}
                />
                <PresetStat
                  label={t(`v2.onboarding.labelDays.${themeKey}`)}
                  value={p.days}
                />
              </div>
            </button>
          );
        })}
      </div>
    </OnboardLayout>
  );
}

interface PresetStatProps {
  label: string;
  value: number;
}

function PresetStat({ label, value }: Readonly<PresetStatProps>) {
  return (
    <div>
      <Caption>{label}</Caption>
      <div
        style={{
          fontFamily: 'var(--display-number-font)',
          fontSize: 22,
          fontWeight: 600,
          marginTop: 4,
          color: 'var(--color-text)',
          fontFeatureSettings: '"tnum"',
        }}
      >
        {value}
      </div>
    </div>
  );
}
