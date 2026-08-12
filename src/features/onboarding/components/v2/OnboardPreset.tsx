import { useTranslation } from 'react-i18next';
import { Caption } from '@/shared/components/design-v2/primitives';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';
import { useImportData } from '@/shared/hooks';
import type { HouseholdConfig } from '@/shared/types';
import { OnboardLayout } from './OnboardLayout';
import { ONBOARDING_PRESETS } from './onboardingPresets';
import styles from './OnboardPreset.module.css';

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
        // An unrecognised code is treated like a non-applying preset:
        // continue without applying a household.
        if (preset?.appliesHousehold) {
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
      <div className={styles.presetGrid}>
        {ONBOARDING_PRESETS.map((p) => {
          const sel = presetCode === p.code;
          return (
            <button
              key={p.code}
              type="button"
              onClick={() => onPresetChange(p.code)}
              aria-pressed={sel}
              className={`${styles.presetCard} ${sel ? styles.presetCardSelected : ''}`}
            >
              <div className={styles.presetCardHeader}>
                <span className={styles.presetCode}>{p.code}</span>
                <span
                  aria-hidden
                  className={`${styles.presetCheck} ${sel ? styles.presetCheckSelected : ''}`}
                >
                  {sel ? '✓' : ''}
                </span>
              </div>
              <div className={styles.presetName}>
                {t(`v2.onboarding.preset.presetNames.${p.nameKey}.${themeKey}`)}
              </div>
              <div className={styles.presetStats}>
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

      <div className={styles.altActions}>
        <div>
          <button
            type="button"
            onClick={onTryDemoData}
            className={styles.link}
            data-testid="v2-try-demo-data"
          >
            {t('onboarding.tryDemoData.link')}
          </button>
          <div className={styles.demoDataHint}>
            {t('onboarding.tryDemoData.hint')}
          </div>
        </div>
        <button
          type="button"
          onClick={triggerFileInput}
          className={`${styles.link} ${styles.linkNoWrap}`}
          data-testid="v2-import-backup"
        >
          {t('onboarding.import.link')}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
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
      <div className={styles.statValue}>{value}</div>
    </div>
  );
}
