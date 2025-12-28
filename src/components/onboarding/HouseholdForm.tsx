import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
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
    adults: initialData?.adults ?? 1,
    children: initialData?.children ?? 0,
    supplyDays: initialData?.supplyDays ?? 7,
    hasFreezer: initialData?.hasFreezer ?? false,
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof HouseholdData, string>>
  >({});

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof HouseholdData, string>> = {};

    if (formData.adults < 1) {
      newErrors.adults = 'At least 1 adult is required';
    }
    if (formData.adults > 20) {
      newErrors.adults = 'Maximum 20 adults allowed';
    }

    if (formData.children < 0) {
      newErrors.children = 'Cannot be negative';
    }
    if (formData.children > 20) {
      newErrors.children = 'Maximum 20 children allowed';
    }

    if (formData.supplyDays < 1) {
      newErrors.supplyDays = 'At least 1 day is required';
    }
    if (formData.supplyDays > 365) {
      newErrors.supplyDays = 'Maximum 365 days allowed';
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
              min={1}
              max={20}
              value={formData.adults}
              onChange={(e) =>
                handleChange('adults', parseInt(e.target.value) || 1)
              }
              error={errors.adults}
              required
            />

            <Input
              label={t('household.children')}
              type="number"
              min={0}
              max={20}
              value={formData.children}
              onChange={(e) =>
                handleChange('children', parseInt(e.target.value) || 0)
              }
              error={errors.children}
            />

            <Input
              label={t('household.supplyDays')}
              type="number"
              min={1}
              max={365}
              value={formData.supplyDays}
              onChange={(e) =>
                handleChange('supplyDays', parseInt(e.target.value) || 7)
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
