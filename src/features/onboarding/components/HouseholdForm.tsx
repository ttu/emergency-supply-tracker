import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/shared/components/Input';
import { Button } from '@/shared/components/Button';
import { HOUSEHOLD_DEFAULTS, HOUSEHOLD_LIMITS } from '@/features/household';
import styles from './HouseholdForm.module.css';

function parseIntOrDefault(value: string, defaultValue: number): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? defaultValue : parsed;
}

export interface HouseholdData {
  adults: number;
  children: number;
  pets: number;
  supplyDays: number;
  useFreezer: boolean;
}

export interface HouseholdFormProps {
  initialData?: Partial<HouseholdData>;
  onSubmit: (data: HouseholdData) => void;
  onBack?: () => void;
}

/** Numeric household fields, in display order. */
const NUMBER_FIELDS: {
  field: 'adults' | 'children' | 'pets' | 'supplyDays';
  id?: string;
  required?: boolean;
  helperTextKey?: string;
}[] = [
  { field: 'adults', required: true },
  { field: 'children' },
  { field: 'pets', id: 'pets' },
  {
    field: 'supplyDays',
    required: true,
    helperTextKey: 'household.supplyDaysHelper',
  },
];

interface HouseholdFieldsProps {
  formData: HouseholdData;
  errors: Partial<Record<keyof HouseholdData, string>>;
  onChange: (field: keyof HouseholdData, value: number | boolean) => void;
}

function HouseholdFields({
  formData,
  errors,
  onChange,
}: Readonly<HouseholdFieldsProps>) {
  const { t } = useTranslation();

  return (
    <div className={styles.fields}>
      {NUMBER_FIELDS.map(({ field, id, required, helperTextKey }) => (
        <Input
          key={field}
          id={id}
          label={t(`household.${field}`)}
          type="number"
          min={HOUSEHOLD_LIMITS[field].min}
          max={HOUSEHOLD_LIMITS[field].max}
          value={formData[field]}
          onChange={(e) =>
            onChange(
              field,
              parseIntOrDefault(e.target.value, HOUSEHOLD_DEFAULTS[field]),
            )
          }
          error={errors[field]}
          helperText={helperTextKey ? t(helperTextKey) : undefined}
          required={required}
        />
      ))}

      <div className={styles.checkboxField}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={formData.useFreezer}
            onChange={(e) => onChange('useFreezer', e.target.checked)}
            className={styles.checkbox}
          />
          <span>{t('household.useFreezer')}</span>
        </label>
      </div>
    </div>
  );
}

export function HouseholdForm({
  initialData,
  onSubmit,
  onBack,
}: Readonly<HouseholdFormProps>) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<HouseholdData>({
    adults: initialData?.adults ?? HOUSEHOLD_DEFAULTS.adults,
    children: initialData?.children ?? HOUSEHOLD_DEFAULTS.children,
    pets: initialData?.pets ?? HOUSEHOLD_DEFAULTS.pets,
    supplyDays: initialData?.supplyDays ?? HOUSEHOLD_DEFAULTS.supplyDays,
    useFreezer: initialData?.useFreezer ?? HOUSEHOLD_DEFAULTS.useFreezer,
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof HouseholdData, string>>
  >({});

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof HouseholdData, string>> = {};

    if (formData.adults < HOUSEHOLD_LIMITS.adults.min) {
      newErrors.adults = t('household.errors.adultsMin', {
        min: HOUSEHOLD_LIMITS.adults.min,
      });
    }
    if (formData.adults > HOUSEHOLD_LIMITS.adults.max) {
      newErrors.adults = t('household.errors.adultsMax', {
        max: HOUSEHOLD_LIMITS.adults.max,
      });
    }

    if (formData.children < HOUSEHOLD_LIMITS.children.min) {
      newErrors.children = t('household.errors.childrenNegative');
    }
    if (formData.children > HOUSEHOLD_LIMITS.children.max) {
      newErrors.children = t('household.errors.childrenMax', {
        max: HOUSEHOLD_LIMITS.children.max,
      });
    }

    if (formData.pets < HOUSEHOLD_LIMITS.pets.min) {
      newErrors.pets = t('household.errors.petsNegative');
    }
    if (formData.pets > HOUSEHOLD_LIMITS.pets.max) {
      newErrors.pets = t('household.errors.petsMax', {
        max: HOUSEHOLD_LIMITS.pets.max,
      });
    }

    if (formData.supplyDays < HOUSEHOLD_LIMITS.supplyDays.min) {
      newErrors.supplyDays = t('household.errors.supplyDaysMin', {
        min: HOUSEHOLD_LIMITS.supplyDays.min,
      });
    }
    if (formData.supplyDays > HOUSEHOLD_LIMITS.supplyDays.max) {
      newErrors.supplyDays = t('household.errors.supplyDaysMax', {
        max: HOUSEHOLD_LIMITS.supplyDays.max,
      });
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
    <div className={styles.container} data-testid="onboarding-household-form">
      <div className={styles.content}>
        <form
          onSubmit={handleSubmit}
          className={styles.form}
          data-testid="household-form"
        >
          <h2 className={styles.title}>{t('household.title')}</h2>
          <p className={styles.subtitle}>{t('household.formSubtitle')}</p>

          <HouseholdFields
            formData={formData}
            errors={errors}
            onChange={handleChange}
          />

          <div className={styles.actions}>
            {onBack && (
              <Button
                type="button"
                variant="secondary"
                onClick={onBack}
                data-testid="household-back-button"
              >
                {t('actions.back')}
              </Button>
            )}
            <Button
              type="submit"
              variant="primary"
              data-testid="household-save-button"
            >
              {t('actions.save')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
