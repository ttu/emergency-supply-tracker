import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import {
  HOUSEHOLD_DEFAULTS,
  HOUSEHOLD_LIMITS,
} from '../../constants/household';
import styles from './HouseholdForm.module.css';

export interface HouseholdData {
  adults: number;
  children: number;
  supplyDays: number;
  hasFreezer: boolean;
}

export interface HouseholdFormProps {
  initialData?: Partial<HouseholdData>;
  onSubmit: (data: HouseholdData) => void;
  onCancel?: () => void;
}

export function HouseholdForm({
  initialData,
  onSubmit,
  onCancel,
}: HouseholdFormProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<HouseholdData>({
    adults: initialData?.adults ?? HOUSEHOLD_DEFAULTS.adults,
    children: initialData?.children ?? HOUSEHOLD_DEFAULTS.children,
    supplyDays: initialData?.supplyDays ?? HOUSEHOLD_DEFAULTS.supplyDays,
    hasFreezer: initialData?.hasFreezer ?? HOUSEHOLD_DEFAULTS.hasFreezer,
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof HouseholdData, string>>
  >({});

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof HouseholdData, string>> = {};

    if (formData.adults < HOUSEHOLD_LIMITS.adults.min) {
      newErrors.adults = `At least ${HOUSEHOLD_LIMITS.adults.min} adult is required`;
    }
    if (formData.adults > HOUSEHOLD_LIMITS.adults.max) {
      newErrors.adults = `Maximum ${HOUSEHOLD_LIMITS.adults.max} adults allowed`;
    }

    if (formData.children < HOUSEHOLD_LIMITS.children.min) {
      newErrors.children = 'Cannot be negative';
    }
    if (formData.children > HOUSEHOLD_LIMITS.children.max) {
      newErrors.children = `Maximum ${HOUSEHOLD_LIMITS.children.max} children allowed`;
    }

    if (formData.supplyDays < HOUSEHOLD_LIMITS.supplyDays.min) {
      newErrors.supplyDays = `At least ${HOUSEHOLD_LIMITS.supplyDays.min} day is required`;
    }
    if (formData.supplyDays > HOUSEHOLD_LIMITS.supplyDays.max) {
      newErrors.supplyDays = `Maximum ${HOUSEHOLD_LIMITS.supplyDays.max} days allowed`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  const handleChange = (
    field: keyof HouseholdData,
    value: number | boolean,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user makes a change
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <h2 className={styles.title}>{t('household.title')}</h2>
          <p className={styles.subtitle}>{t('household.formSubtitle')}</p>

          <div className={styles.fields}>
            <Input
              label={t('household.adults')}
              type="number"
              min={HOUSEHOLD_LIMITS.adults.min}
              max={HOUSEHOLD_LIMITS.adults.max}
              value={formData.adults}
              onChange={(e) =>
                handleChange(
                  'adults',
                  parseInt(e.target.value) || HOUSEHOLD_DEFAULTS.adults,
                )
              }
              error={errors.adults}
              required
            />

            <Input
              label={t('household.children')}
              type="number"
              min={HOUSEHOLD_LIMITS.children.min}
              max={HOUSEHOLD_LIMITS.children.max}
              value={formData.children}
              onChange={(e) =>
                handleChange(
                  'children',
                  parseInt(e.target.value) || HOUSEHOLD_DEFAULTS.children,
                )
              }
              error={errors.children}
            />

            <Input
              label={t('household.supplyDays')}
              type="number"
              min={HOUSEHOLD_LIMITS.supplyDays.min}
              max={HOUSEHOLD_LIMITS.supplyDays.max}
              value={formData.supplyDays}
              onChange={(e) =>
                handleChange(
                  'supplyDays',
                  parseInt(e.target.value) || HOUSEHOLD_DEFAULTS.supplyDays,
                )
              }
              error={errors.supplyDays}
              helperText={t('household.supplyDaysHelper')}
              required
            />

            <div className={styles.checkboxField}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={formData.hasFreezer}
                  onChange={(e) => handleChange('hasFreezer', e.target.checked)}
                  className={styles.checkbox}
                />
                <span>{t('household.hasFreezer')}</span>
              </label>
            </div>
          </div>

          <div className={styles.actions}>
            {onCancel && (
              <Button type="button" variant="secondary" onClick={onCancel}>
                {t('actions.cancel')}
              </Button>
            )}
            <Button type="submit" variant="primary">
              {t('actions.save')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
