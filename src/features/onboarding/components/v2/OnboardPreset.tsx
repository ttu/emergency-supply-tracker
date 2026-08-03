import { useTranslation } from 'react-i18next';
import { Caption } from '@/shared/components/design-v2/primitives';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';
import { useImportData } from '@/shared/hooks';
import type { HouseholdConfig } from '@/shared/types';
import { OnboardLayout } from './OnboardLayout';
import { ONBOARDING_PRESETS } from './onboardingPresets';

interface OnboardPresetProps {
  presetCode: string;
  onPresetChange: (code: string) => void;
  onApplyPreset: (next: Partial<HouseholdConfig>) => void;
  onTryDemoData: () => void;
  onNext: () => void;
  onBack: () => void;
}

/**
 * Step 3: 4-card preset grid (single / couple / family / custom), plus the two
 * ways past the questionnaire entirely — demo data to look around with, and a
 * backup file for someone who already has one.
 */
export function OnboardPreset({
  presetCode,
  onPresetChange,
  onApplyPreset,
  onTryDemoData,
  onNext,
  onBack,
}: Readonly<OnboardPresetProps>) {
  const { t } = useTranslation();
  const { themeKey } = useDesignTheme();
  // There is nothing to overwrite this early, so importing does not stop to
  // ask — the same call v1's preset screen makes.
  const { fileInputRef, handleFileChange, triggerFileInput } = useImportData({
    skipConfirmation: true,
  });

  const linkStyle = {
    background: 'transparent',
    border: 0,
    padding: 0,
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    fontWeight: 700,
    color: 'var(--color-accent)',
    letterSpacing: '0.06em',
    textDecoration: 'underline',
    cursor: 'pointer',
  } as const;

  return (
    <OnboardLayout
      step={3}
      title={t(`v2.voice.onbPreset.${themeKey}`)}
      lead={{
        title: t(`v2.onboarding.preset.leadTitle.${themeKey}`),
        sub: t(`v2.onboarding.preset.leadSub.${themeKey}`),
      }}
      back={onBack}
      onContinue={() => {
        const preset = ONBOARDING_PRESETS.find((p) => p.code === presetCode);
        // 'P-04' is the "start from scratch" preset, and an unrecognised code
        // is treated the same way: continue without applying a household.
        if (preset && preset.code !== 'P-04') {
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
          // Two across where there is room, one on a phone.
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
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

      <div
        style={{
          marginTop: 18,
          paddingTop: 16,
          borderTop: '1px solid var(--color-rule-soft)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 20,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <button
            type="button"
            onClick={onTryDemoData}
            style={linkStyle}
            data-testid="v2-try-demo-data"
          >
            {t('onboarding.tryDemoData.link')}
          </button>
          <div
            style={{
              marginTop: 6,
              fontSize: 12,
              color: 'var(--color-text-2)',
              lineHeight: 1.45,
              maxWidth: 360,
            }}
          >
            {t('onboarding.tryDemoData.hint')}
          </div>
        </div>
        <button
          type="button"
          onClick={triggerFileInput}
          style={{ ...linkStyle, whiteSpace: 'nowrap' }}
          data-testid="v2-import-backup"
        >
          {t('onboarding.import.link')}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          hidden
          aria-label={t('onboarding.import.button')}
          data-testid="v2-import-file-input"
        />
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
