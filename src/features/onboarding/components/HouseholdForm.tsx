import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/shared/components/Input';
import { Button } from '@/shared/components/Button';
import { HOUSEHOLD_DEFAULTS, HOUSEHOLD_LIMITS } from '@/features/household';
import {
  importFromJSON,
  saveAppData,
} from '@/shared/utils/storage/localStorage';
import type { AppData } from '@/shared/types';
import styles from './HouseholdForm.module.css';

function parseIntOrDefault(value: string, defaultValue: number): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? defaultValue : parsed;
}

export interface HouseholdData {
  adults: number;
  children: number;
  supplyDays: number;
  useFreezer: boolean;
}

export interface HouseholdFormProps {
  initialData?: Partial<HouseholdData>;
  onSubmit: (data: HouseholdData) => void;
  onBack?: () => void;
}

export function HouseholdForm({
  initialData,
  onSubmit,
  onBack,
}: HouseholdFormProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<HouseholdData>({
    adults: initialData?.adults ?? HOUSEHOLD_DEFAULTS.adults,
    children: initialData?.children ?? HOUSEHOLD_DEFAULTS.children,
    supplyDays: initialData?.supplyDays ?? HOUSEHOLD_DEFAULTS.supplyDays,
    useFreezer: initialData?.useFreezer ?? HOUSEHOLD_DEFAULTS.useFreezer,
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof HouseholdData, string>>
  >({});

  const validateAppData = (data: unknown): data is AppData => {
    if (!data || typeof data !== 'object') return false;
    const d = data as Record<string, unknown>;

    return (
      typeof d.version === 'string' &&
      typeof d.household === 'object' &&
      typeof d.settings === 'object' &&
      Array.isArray(d.items) &&
      typeof d.lastModified === 'string'
    );
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = event.target?.result as string;
        const data = importFromJSON(json);

        if (!validateAppData(data)) {
          alert(t('settings.import.invalidFormat'));
          return;
        }

        if (window.confirm(t('settings.import.confirmOverwrite'))) {
          saveAppData(data);
          alert(t('settings.import.success'));
          // Reload to reflect changes and skip onboarding (imported data has onboardingCompleted: true)
          window.location.reload();
        }
      } catch (error) {
        console.error('Import error:', error);
        alert(t('settings.import.error'));
      }
    };

    reader.readAsText(file);

    // Reset input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

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
                  parseIntOrDefault(e.target.value, HOUSEHOLD_DEFAULTS.adults),
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
                  parseIntOrDefault(
                    e.target.value,
                    HOUSEHOLD_DEFAULTS.children,
                  ),
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
                  parseIntOrDefault(
                    e.target.value,
                    HOUSEHOLD_DEFAULTS.supplyDays,
                  ),
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
                  checked={formData.useFreezer}
                  onChange={(e) => handleChange('useFreezer', e.target.checked)}
                  className={styles.checkbox}
                />
                <span>{t('household.useFreezer')}</span>
              </label>
            </div>
          </div>

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
              onClick={handleImportClick}
              className={styles.importLink}
              data-testid="onboarding-import-link"
            >
              {t('onboarding.import.link')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
