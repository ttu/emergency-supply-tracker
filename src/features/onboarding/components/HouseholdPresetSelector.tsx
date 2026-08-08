import { useTranslation } from 'react-i18next';
import { Card } from '@/shared/components/Card';
import { Button } from '@/shared/components/Button';
import { useImportData } from '@/shared/hooks';
import { HOUSEHOLD_PRESETS } from '@/features/household';
import type { HouseholdPreset as HouseholdPresetId } from '@/features/household';
import styles from './HouseholdPresetSelector.module.css';

export interface HouseholdPreset {
  id: 'single' | 'couple' | 'family' | 'custom';
  adults: number;
  children: number;
  pets: number;
}

export interface HouseholdPresetSelectorProps {
  selectedPreset?: string;
  onSelectPreset: (preset: HouseholdPreset) => void;
  onBack?: () => void;
  onTryDemoData?: () => void;
}

const PRESET_IDS: HouseholdPresetId[] = ['single', 'couple', 'family'];

const PRESETS: HouseholdPreset[] = PRESET_IDS.map((id) => ({
  id,
  adults: HOUSEHOLD_PRESETS[id].adults,
  children: HOUSEHOLD_PRESETS[id].children,
  pets: HOUSEHOLD_PRESETS[id].pets,
}));

const CUSTOM_PRESET: HouseholdPreset = {
  id: 'custom',
  adults: 1,
  children: 0,
  pets: 0,
};

interface PresetCardProps {
  preset: HouseholdPreset;
  selected: boolean;
  onSelect: (preset: HouseholdPreset) => void;
  title: string;
  details: React.ReactNode;
}

function PresetCard({
  preset,
  selected,
  onSelect,
  title,
  details,
}: Readonly<PresetCardProps>) {
  return (
    <Card
      variant={selected ? 'elevated' : 'outlined'}
      padding="medium"
      className={`${styles.presetCard} ${selected ? styles.selected : ''}`}
      onClick={() => onSelect(preset)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(preset);
        }
      }}
      data-testid={`preset-${preset.id}`}
    >
      <div className={styles.presetContent}>
        <h3 className={styles.presetTitle}>{title}</h3>
        <p className={styles.presetDetails}>{details}</p>
      </div>
    </Card>
  );
}

export function HouseholdPresetSelector({
  selectedPreset,
  onSelectPreset,
  onBack,
  onTryDemoData,
}: Readonly<HouseholdPresetSelectorProps>) {
  const { t } = useTranslation();
  const { fileInputRef, handleFileChange, triggerFileInput } = useImportData({
    skipConfirmation: true,
  });

  return (
    <div className={styles.container} data-testid="onboarding-preset-selector">
      <div className={styles.content}>
        <h2 className={styles.title}>{t('household.title')}</h2>
        <p className={styles.description}>{t('household.description')}</p>

        <div className={styles.presets}>
          {PRESETS.map((preset) => (
            <PresetCard
              key={preset.id}
              preset={preset}
              selected={selectedPreset === preset.id}
              onSelect={onSelectPreset}
              title={t(`household.presets.${preset.id}`)}
              details={
                <>
                  {preset.adults} {t('household.adults')}
                  {preset.children > 0 &&
                    `, ${preset.children} ${t('household.children')}`}
                </>
              }
            />
          ))}

          <PresetCard
            preset={CUSTOM_PRESET}
            selected={selectedPreset === 'custom'}
            onSelect={onSelectPreset}
            title={t('household.presets.custom')}
            details={t('household.customDescription')}
          />
        </div>

        {onTryDemoData && (
          <div className={styles.demoSection}>
            <button
              type="button"
              onClick={onTryDemoData}
              className={styles.demoLink}
              data-testid="try-demo-data-link"
            >
              {t('onboarding.tryDemoData.link')}
            </button>
            <p className={styles.demoHint}>
              {t('onboarding.tryDemoData.hint')}
            </p>
          </div>
        )}

        {onBack && (
          <div className={styles.actions}>
            <Button
              type="button"
              variant="secondary"
              onClick={onBack}
              data-testid="preset-back-button"
            >
              {t('actions.back')}
            </Button>
          </div>
        )}

        <div className={styles.importSection}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className={styles.fileInput}
            aria-label={t('onboarding.import.button')}
            data-testid="onboarding-import-file-input"
          />
          <button
            type="button"
            onClick={triggerFileInput}
            className={styles.importLink}
            data-testid="onboarding-import-link"
          >
            {t('onboarding.import.link')}
          </button>
        </div>
      </div>
    </div>
  );
}
