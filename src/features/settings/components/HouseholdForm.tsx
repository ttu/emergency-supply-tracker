import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHousehold } from '@/features/household';
import { Input } from '@/shared/components/Input';
import { Button } from '@/shared/components/Button';
import styles from './HouseholdForm.module.css';

export function HouseholdForm() {
  const { t } = useTranslation();
  const { household, updateHousehold, setPreset } = useHousehold();

  // Local string state for inputs to preserve cursor position during editing
  // We don't sync household changes back to these inputs because the household
  // context already manages the canonical state. Users edit the local input,
  // then we validate and save to household on blur.
  const [adultsInput, setAdultsInput] = useState(household.adults.toString());
  const [childrenInput, setChildrenInput] = useState(
    household.children.toString(),
  );
  const [petsInput, setPetsInput] = useState(household.pets.toString());
  const [supplyDaysInput, setSupplyDaysInput] = useState(
    household.supplyDurationDays.toString(),
  );
  const [freezerHoursInput, setFreezerHoursInput] = useState(
    household.freezerHoldTimeHours?.toString() || '',
  );

  const handleChange = (
    field: keyof typeof household,
    value: number | boolean | undefined,
  ) => {
    updateHousehold({ [field]: value });
  };

  const handleNumberBlur = (
    field: 'adults' | 'children' | 'pets' | 'supplyDurationDays',
    inputValue: string,
    setInput: (value: string) => void,
    defaultValue: number,
    min: number = 0,
  ) => {
    const parsed = Number.parseInt(inputValue, 10);
    if (Number.isNaN(parsed) || parsed < min) {
      const value = Math.max(min, defaultValue);
      setInput(value.toString());
      updateHousehold({ [field]: value });
    } else {
      updateHousehold({ [field]: parsed });
    }
  };

  const handleFreezerHoursBlur = () => {
    if (freezerHoursInput === '') {
      updateHousehold({ freezerHoldTimeHours: undefined });
    } else {
      const parsed = Number.parseInt(freezerHoursInput, 10);
      if (Number.isNaN(parsed) || parsed < 0) {
        setFreezerHoursInput(household.freezerHoldTimeHours?.toString() || '');
      } else {
        const clamped = Math.min(72, Math.max(0, parsed));
        updateHousehold({ freezerHoldTimeHours: clamped });
        setFreezerHoursInput(clamped.toString());
      }
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.presets}>
        <p className={styles.presetsLabel}>
          {t('settings.household.presets.label')}
        </p>
        <div className={styles.presetButtons}>
          <Button
            variant="secondary"
            onClick={() => setPreset('single')}
            data-testid="preset-single"
          >
            {t('settings.household.presets.single')}
          </Button>
          <Button
            variant="secondary"
            onClick={() => setPreset('couple')}
            data-testid="preset-couple"
          >
            {t('settings.household.presets.couple')}
          </Button>
          <Button
            variant="secondary"
            onClick={() => setPreset('family')}
            data-testid="preset-family"
          >
            {t('settings.household.presets.family')}
          </Button>
        </div>
      </div>

      <div className={styles.fields}>
        <Input
          id="adults"
          type="number"
          label={t('settings.household.adults')}
          value={adultsInput}
          onChange={(e) => setAdultsInput(e.target.value)}
          onBlur={() =>
            handleNumberBlur('adults', adultsInput, setAdultsInput, 0, 0)
          }
          min={0}
        />

        <Input
          id="children"
          type="number"
          label={t('settings.household.children')}
          value={childrenInput}
          onChange={(e) => setChildrenInput(e.target.value)}
          onBlur={() =>
            handleNumberBlur('children', childrenInput, setChildrenInput, 0, 0)
          }
          min={0}
        />

        <Input
          id="pets"
          type="number"
          label={t('settings.household.pets')}
          value={petsInput}
          onChange={(e) => setPetsInput(e.target.value)}
          onBlur={() => handleNumberBlur('pets', petsInput, setPetsInput, 0, 0)}
          min={0}
        />

        <Input
          id="supplyDurationDays"
          type="number"
          label={t('settings.household.supplyDays')}
          value={supplyDaysInput}
          onChange={(e) => setSupplyDaysInput(e.target.value)}
          onBlur={() =>
            handleNumberBlur(
              'supplyDurationDays',
              supplyDaysInput,
              setSupplyDaysInput,
              1,
              1,
            )
          }
          min={1}
          max={365}
        />

        <div className={styles.checkboxField}>
          <input
            type="checkbox"
            id="useFreezer"
            checked={household.useFreezer}
            onChange={(e) => handleChange('useFreezer', e.target.checked)}
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
            value={freezerHoursInput}
            onChange={(e) => setFreezerHoursInput(e.target.value)}
            onBlur={handleFreezerHoursBlur}
            min={0}
            max={72}
          />
        )}
      </div>
    </div>
  );
}
