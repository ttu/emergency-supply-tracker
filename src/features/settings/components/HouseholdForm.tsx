import { useTranslation } from 'react-i18next';
import { useHousehold } from '@/features/household';
import { Input } from '@/shared/components/Input';
import { Button } from '@/shared/components/Button';
import styles from './HouseholdForm.module.css';

export function HouseholdForm() {
  const { t } = useTranslation();
  const { household, updateHousehold, setPreset } = useHousehold();

  const handleChange = (
    field: keyof typeof household,
    value: number | boolean | undefined,
  ) => {
    updateHousehold({ [field]: value });
  };

  const isDisabled = !household.enabled;

  return (
    <div className={styles.container}>
      <div className={styles.enabledToggle}>
        <div className={styles.checkboxField}>
          <input
            type="checkbox"
            id="enabled"
            checked={household.enabled}
            onChange={(e) => handleChange('enabled', e.target.checked)}
            data-testid="household-enabled-toggle"
          />
          <label htmlFor="enabled">{t('settings.household.enabled')}</label>
        </div>
        <p className={styles.enabledDescription}>
          {t('settings.household.enabledDescription')}
        </p>
      </div>

      <div className={`${styles.presets} ${isDisabled ? styles.disabled : ''}`}>
        <p className={styles.presetsLabel}>
          {t('settings.household.presets.label')}
        </p>
        <div className={styles.presetButtons}>
          <Button
            variant="secondary"
            onClick={() => setPreset('single')}
            data-testid="preset-single"
            disabled={isDisabled}
          >
            {t('settings.household.presets.single')}
          </Button>
          <Button
            variant="secondary"
            onClick={() => setPreset('couple')}
            data-testid="preset-couple"
            disabled={isDisabled}
          >
            {t('settings.household.presets.couple')}
          </Button>
          <Button
            variant="secondary"
            onClick={() => setPreset('family')}
            data-testid="preset-family"
            disabled={isDisabled}
          >
            {t('settings.household.presets.family')}
          </Button>
        </div>
      </div>

      <div className={`${styles.fields} ${isDisabled ? styles.disabled : ''}`}>
        <Input
          id="adults"
          type="number"
          label={t('settings.household.adults')}
          value={household.adults.toString()}
          onChange={(e) =>
            handleChange('adults', Number.parseInt(e.target.value, 10) || 0)
          }
          min={0}
          disabled={isDisabled}
        />

        <Input
          id="children"
          type="number"
          label={t('settings.household.children')}
          value={household.children.toString()}
          onChange={(e) =>
            handleChange('children', Number.parseInt(e.target.value, 10) || 0)
          }
          min={0}
          disabled={isDisabled}
        />

        <Input
          id="pets"
          type="number"
          label={t('settings.household.pets')}
          value={household.pets.toString()}
          onChange={(e) =>
            handleChange('pets', Number.parseInt(e.target.value, 10) || 0)
          }
          min={0}
          disabled={isDisabled}
        />

        <Input
          id="supplyDurationDays"
          type="number"
          label={t('settings.household.supplyDays')}
          value={household.supplyDurationDays.toString()}
          onChange={(e) =>
            handleChange(
              'supplyDurationDays',
              Number.parseInt(e.target.value, 10) || 1,
            )
          }
          min={1}
          max={365}
          disabled={isDisabled}
        />

        <div className={styles.checkboxField}>
          <input
            type="checkbox"
            id="useFreezer"
            checked={household.useFreezer}
            onChange={(e) => handleChange('useFreezer', e.target.checked)}
            disabled={isDisabled}
          />
          <label htmlFor="useFreezer">
            {t('settings.household.useFreezer')}
          </label>
        </div>

        {household.useFreezer && (
          <Input
            id="freezerHoldTimeHours"
            type="number"
            label={t('settings.household.freezerHoldTime')}
            value={household.freezerHoldTimeHours?.toString() || ''}
            onChange={(e) =>
              handleChange(
                'freezerHoldTimeHours',
                Number.parseInt(e.target.value, 10) || undefined,
              )
            }
            min={0}
            max={72}
            disabled={isDisabled}
          />
        )}
      </div>
    </div>
  );
}
