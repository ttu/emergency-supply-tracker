import { useTranslation } from 'react-i18next';
import { Card } from '../common/Card';
import styles from './HouseholdPresetSelector.module.css';

export interface HouseholdPreset {
  id: 'single' | 'couple' | 'family' | 'custom';
  adults: number;
  children: number;
}

export interface HouseholdPresetSelectorProps {
  selectedPreset?: string;
  onSelectPreset: (preset: HouseholdPreset) => void;
}

const PRESETS: HouseholdPreset[] = [
  { id: 'single', adults: 1, children: 0 },
  { id: 'couple', adults: 2, children: 0 },
  { id: 'family', adults: 2, children: 2 },
];

export function HouseholdPresetSelector({
  selectedPreset,
  onSelectPreset,
}: HouseholdPresetSelectorProps) {
  const { t } = useTranslation();

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>{t('household.title')}</h2>
      <p className={styles.description}>
        Choose a preset or customize your household configuration
      </p>

      <div className={styles.presets}>
        {PRESETS.map((preset) => (
          <Card
            key={preset.id}
            variant={selectedPreset === preset.id ? 'elevated' : 'outlined'}
            padding="medium"
            className={`${styles.presetCard} ${selectedPreset === preset.id ? styles.selected : ''}`}
            onClick={() => onSelectPreset(preset)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectPreset(preset);
              }
            }}
          >
            <div className={styles.presetContent}>
              <h3 className={styles.presetTitle}>
                {t(`household.presets.${preset.id}`)}
              </h3>
              <p className={styles.presetDetails}>
                {preset.adults} {t('household.adults')}
                {preset.children > 0 &&
                  `, ${preset.children} ${t('household.children')}`}
              </p>
            </div>
          </Card>
        ))}

        <Card
          variant={selectedPreset === 'custom' ? 'elevated' : 'outlined'}
          padding="medium"
          className={`${styles.presetCard} ${selectedPreset === 'custom' ? styles.selected : ''}`}
          onClick={() =>
            onSelectPreset({ id: 'custom', adults: 1, children: 0 })
          }
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onSelectPreset({ id: 'custom', adults: 1, children: 0 });
            }
          }}
        >
          <div className={styles.presetContent}>
            <h3 className={styles.presetTitle}>Custom</h3>
            <p className={styles.presetDetails}>Set your own configuration</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
