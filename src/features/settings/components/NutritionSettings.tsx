import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '@/features/settings';
import {
  DAILY_CALORIES_PER_PERSON,
  DAILY_WATER_PER_PERSON,
  CHILDREN_REQUIREMENT_MULTIPLIER,
} from '@/shared/utils/constants';
import styles from './NutritionSettings.module.css';

// Validation limits
const LIMITS = {
  dailyCalories: { min: 1000, max: 5000, step: 100 },
  dailyWater: { min: 1, max: 10, step: 0.5 },
  childrenPercentage: { min: 25, max: 100, step: 5 },
} as const;

export function NutritionSettings() {
  const { t } = useTranslation();
  const { settings, updateSettings } = useSettings();

  // Get current values with defaults
  const dailyCalories =
    settings.dailyCaloriesPerPerson ?? DAILY_CALORIES_PER_PERSON;
  const dailyWater = settings.dailyWaterPerPerson ?? DAILY_WATER_PER_PERSON;
  const childrenPercentage =
    settings.childrenRequirementPercentage ??
    CHILDREN_REQUIREMENT_MULTIPLIER * 100;

  // Local string state for inputs to preserve cursor position during editing
  const [caloriesInput, setCaloriesInput] = useState(dailyCalories.toString());
  const [waterInput, setWaterInput] = useState(dailyWater.toString());
  const [percentageInput, setPercentageInput] = useState(
    childrenPercentage.toString(),
  );

  // Sync local state when settings change externally (e.g., reset to defaults)
  useEffect(() => {
    setCaloriesInput(dailyCalories.toString());
  }, [dailyCalories]);

  useEffect(() => {
    setWaterInput(dailyWater.toString());
  }, [dailyWater]);

  useEffect(() => {
    setPercentageInput(childrenPercentage.toString());
  }, [childrenPercentage]);

  const handleCaloriesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCaloriesInput(e.target.value);
  };

  const handleCaloriesBlur = () => {
    const value = Number.parseInt(caloriesInput, 10);
    if (!Number.isNaN(value)) {
      const clamped = Math.max(
        LIMITS.dailyCalories.min,
        Math.min(LIMITS.dailyCalories.max, value),
      );
      updateSettings({ dailyCaloriesPerPerson: clamped });
      setCaloriesInput(clamped.toString());
    } else {
      // Reset to current value if invalid
      setCaloriesInput(dailyCalories.toString());
    }
  };

  const handleWaterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWaterInput(e.target.value);
  };

  const handleWaterBlur = () => {
    const value = Number.parseFloat(waterInput);
    if (!Number.isNaN(value)) {
      const clamped = Math.max(
        LIMITS.dailyWater.min,
        Math.min(LIMITS.dailyWater.max, value),
      );
      updateSettings({ dailyWaterPerPerson: clamped });
      setWaterInput(clamped.toString());
    } else {
      // Reset to current value if invalid
      setWaterInput(dailyWater.toString());
    }
  };

  const handleChildrenPercentageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setPercentageInput(e.target.value);
  };

  const handleChildrenPercentageBlur = () => {
    const value = Number.parseInt(percentageInput, 10);
    if (!Number.isNaN(value)) {
      const clamped = Math.max(
        LIMITS.childrenPercentage.min,
        Math.min(LIMITS.childrenPercentage.max, value),
      );
      updateSettings({ childrenRequirementPercentage: clamped });
      setPercentageInput(clamped.toString());
    } else {
      // Reset to current value if invalid
      setPercentageInput(childrenPercentage.toString());
    }
  };

  const handleResetToDefaults = () => {
    updateSettings({
      dailyCaloriesPerPerson: DAILY_CALORIES_PER_PERSON,
      dailyWaterPerPerson: DAILY_WATER_PER_PERSON,
      childrenRequirementPercentage: CHILDREN_REQUIREMENT_MULTIPLIER * 100,
    });
  };

  return (
    <div className={styles.container}>
      <p className={styles.sectionDescription}>
        {t('settings.nutrition.description')}
      </p>

      {/* Daily Calories */}
      <div className={styles.field}>
        <label htmlFor="daily-calories" className={styles.label}>
          {t('settings.nutrition.dailyCalories')}
        </label>
        <div className={styles.inputRow}>
          <input
            id="daily-calories"
            type="number"
            value={caloriesInput}
            onChange={handleCaloriesChange}
            onBlur={handleCaloriesBlur}
            min={LIMITS.dailyCalories.min}
            max={LIMITS.dailyCalories.max}
            step={LIMITS.dailyCalories.step}
            className={styles.input}
          />
          <span className={styles.unit}>kcal</span>
        </div>
        <p className={styles.hint}>
          {t('settings.nutrition.dailyCaloriesHint', {
            default: DAILY_CALORIES_PER_PERSON,
          })}
        </p>
      </div>

      {/* Daily Water */}
      <div className={styles.field}>
        <label htmlFor="daily-water" className={styles.label}>
          {t('settings.nutrition.dailyWater')}
        </label>
        <div className={styles.inputRow}>
          <input
            id="daily-water"
            type="number"
            value={waterInput}
            onChange={handleWaterChange}
            onBlur={handleWaterBlur}
            min={LIMITS.dailyWater.min}
            max={LIMITS.dailyWater.max}
            step={LIMITS.dailyWater.step}
            className={styles.input}
          />
          <span className={styles.unit}>
            {t('settings.nutrition.litersPerDay')}
          </span>
        </div>
        <p className={styles.hint}>
          {t('settings.nutrition.dailyWaterHint', {
            default: DAILY_WATER_PER_PERSON,
          })}
        </p>
      </div>

      {/* Children Requirement Percentage */}
      <div className={styles.field}>
        <label htmlFor="children-percentage" className={styles.label}>
          {t('settings.nutrition.childrenPercentage')}
        </label>
        <div className={styles.inputRow}>
          <input
            id="children-percentage"
            type="number"
            value={percentageInput}
            onChange={handleChildrenPercentageChange}
            onBlur={handleChildrenPercentageBlur}
            min={LIMITS.childrenPercentage.min}
            max={LIMITS.childrenPercentage.max}
            step={LIMITS.childrenPercentage.step}
            className={styles.input}
          />
          <span className={styles.unit}>%</span>
        </div>
        <p className={styles.hint}>
          {t('settings.nutrition.childrenPercentageHint', {
            default: CHILDREN_REQUIREMENT_MULTIPLIER * 100,
          })}
        </p>
      </div>

      {/* Reset to Defaults */}
      <button
        type="button"
        onClick={handleResetToDefaults}
        className={styles.resetButton}
      >
        {t('settings.nutrition.resetToDefaults')}
      </button>
    </div>
  );
}
