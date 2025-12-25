import { useTranslation } from 'react-i18next';
import { useHousehold } from '../../hooks/useHousehold';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
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

  return (
    <div className={styles.container}>
      <div className={styles.presets}>
        <p className={styles.presetsLabel}>
          {t('settings.household.presets.label')}
        </p>
        <div className={styles.presetButtons}>
          <Button variant="secondary" onClick={() => setPreset('single')}>
            {t('settings.household.presets.single')}
          </Button>
          <Button variant="secondary" onClick={() => setPreset('couple')}>
            {t('settings.household.presets.couple')}
          </Button>
          <Button variant="secondary" onClick={() => setPreset('family')}>
            {t('settings.household.presets.family')}
          </Button>
        </div>
      </div>

      <div className={styles.fields}>
        <Input
          id="adults"
          type="number"
          label={t('settings.household.adults')}
          value={household.adults.toString()}
          onChange={(e) =>
            handleChange('adults', parseInt(e.target.value, 10) || 0)
          }
          min={0}
        />

        <Input
          id="children"
          type="number"
          label={t('settings.household.children')}
          value={household.children.toString()}
          onChange={(e) =>
            handleChange('children', parseInt(e.target.value, 10) || 0)
          }
          min={0}
        />

        <Input
          id="supplyDurationDays"
          type="number"
          label={t('settings.household.supplyDays')}
          value={household.supplyDurationDays.toString()}
          onChange={(e) =>
            handleChange(
              'supplyDurationDays',
              parseInt(e.target.value, 10) || 1,
            )
          }
          min={1}
          max={365}
        />

        <div className={styles.checkboxField}>
          <input
            type="checkbox"
            id="hasFreezer"
            checked={household.hasFreezer}
            onChange={(e) => handleChange('hasFreezer', e.target.checked)}
          />
          <label htmlFor="hasFreezer">
            {t('settings.household.hasFreezer')}
          </label>
        </div>

        {household.hasFreezer && (
          <Input
            id="freezerHoldTimeHours"
            type="number"
            label={t('settings.household.freezerHoldTime')}
            value={household.freezerHoldTimeHours?.toString() || ''}
            onChange={(e) =>
              handleChange(
                'freezerHoldTimeHours',
                parseInt(e.target.value, 10) || undefined,
              )
            }
            min={0}
            max={72}
          />
        )}
      </div>
    </div>
  );
}
