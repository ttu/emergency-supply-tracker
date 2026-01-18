import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type {
  InventoryItem,
  Category,
  ProductTemplateId,
  Unit,
} from '@/shared/types';
import {
  createCategoryId,
  createProductTemplateId,
  createDateOnly,
  isFoodCategory,
  isPowerCategory,
} from '@/shared/types';
import { isValidUnit } from '@/shared/utils/validation/unitValidation';
import { Input } from '@/shared/components/Input';
import { Select } from '@/shared/components/Select';
import { Button } from '@/shared/components/Button';
import { calculateCaloriesFromWeight } from '@/shared/utils/calculations/calories';
import { CUSTOM_ITEM_TYPE } from '@/shared/utils/constants';
import { isTemplateId } from '@/shared/utils/storage/localStorage';
import styles from './ItemForm.module.css';

export interface ItemFormProps {
  item?: InventoryItem;
  categories: Category[];
  onSubmit: (
    item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>,
  ) => void;
  onCancel: () => void;
  defaultCategoryId?: string;
  templateWeightGramsPerUnit?: number;
  templateCaloriesPer100g?: number;
  templateRequiresWaterLiters?: number;
}

interface FormData {
  itemType: string;
  name: string;
  categoryId: string;
  quantity: string;
  unit: string;
  neverExpires: boolean;
  expirationDate: string;
  purchaseDate: string;
  location: string;
  notes: string;
  weightGrams: string;
  caloriesPerUnit: string;
  requiresWaterLiters: string;
  capacityMah: string;
  capacityWh: string;
}

interface FormErrors {
  name?: string;
  categoryId?: string;
  quantity?: string;
  expirationDate?: string;
}

export const ItemForm = ({
  item,
  categories,
  onSubmit,
  onCancel,
  defaultCategoryId,
  templateWeightGramsPerUnit,
  templateCaloriesPer100g,
  templateRequiresWaterLiters,
}: ItemFormProps) => {
  const { t } = useTranslation(['common', 'categories', 'units', 'products']);

  // Calculate default weight and calories from template
  // Always display weight in grams (even when unit is kilograms, as package labels often use grams)
  const getDefaultWeight = (): string => {
    const weightGrams = item?.weightGrams ?? templateWeightGramsPerUnit;
    if (weightGrams === undefined) return '';
    return weightGrams.toString();
  };

  const getDefaultCalories = (): string => {
    if (item?.caloriesPerUnit !== undefined)
      return item.caloriesPerUnit.toString();
    if (templateWeightGramsPerUnit && templateCaloriesPer100g) {
      return calculateCaloriesFromWeight(
        templateWeightGramsPerUnit,
        templateCaloriesPer100g,
      ).toString();
    }
    return '';
  };

  const getDefaultRequiresWaterLiters = (): string => {
    if (item?.requiresWaterLiters !== undefined)
      return item.requiresWaterLiters.toString();
    if (templateRequiresWaterLiters !== undefined) {
      return templateRequiresWaterLiters.toString();
    }
    return '';
  };

  const [formData, setFormData] = useState<FormData>(() => {
    const initialUnit = item?.unit || 'pieces';
    return {
      itemType: item?.itemType || '',
      name: item?.name || '',
      categoryId: item?.categoryId || defaultCategoryId || '',
      quantity: item?.quantity?.toString() || '',
      unit: initialUnit,
      neverExpires: item?.neverExpires ?? false,
      expirationDate: item?.expirationDate || '',
      purchaseDate: item?.purchaseDate || '',
      location: item?.location || '',
      notes: item?.notes || '',
      weightGrams: getDefaultWeight(),
      caloriesPerUnit: getDefaultCalories(),
      requiresWaterLiters: getDefaultRequiresWaterLiters(),
      capacityMah: item?.capacityMah?.toString() || '',
      capacityWh: item?.capacityWh?.toString() || '',
    };
  });

  const [errors, setErrors] = useState<FormErrors>({});

  // Continuous units allow decimal quantities (e.g., 2.5 kg), discrete units require integers
  const isContinuousUnit = (unit: string): boolean => {
    return ['kilograms', 'liters', 'grams', 'meters'].includes(unit);
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = t('itemForm.errors.nameRequired');
    }

    if (!formData.categoryId) {
      newErrors.categoryId = t('itemForm.errors.categoryRequired');
    }

    if (!formData.quantity || Number.parseFloat(formData.quantity) < 0) {
      newErrors.quantity = t('itemForm.errors.quantityInvalid');
    }

    if (!formData.neverExpires && !formData.expirationDate) {
      newErrors.expirationDate = t('itemForm.errors.expirationRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    const trimmedItemType = formData.itemType.trim();
    const itemType: ProductTemplateId | 'custom' =
      trimmedItemType && isTemplateId(trimmedItemType)
        ? createProductTemplateId(trimmedItemType)
        : CUSTOM_ITEM_TYPE;

    // Weight input always accepts grams (even when unit is kilograms)
    const weightGrams = formData.weightGrams
      ? Number.parseFloat(formData.weightGrams)
      : undefined;

    onSubmit({
      name: formData.name.trim(),
      itemType,
      categoryId: createCategoryId(formData.categoryId),
      quantity: Number.parseFloat(formData.quantity),
      unit: isValidUnit(formData.unit) ? formData.unit : ('pieces' as Unit), // Fallback to 'pieces' if invalid
      neverExpires: formData.neverExpires,
      expirationDate: (() => {
        if (formData.neverExpires) {
          return undefined;
        }
        if (formData.expirationDate && formData.expirationDate.trim()) {
          return createDateOnly(formData.expirationDate);
        }
        return undefined;
      })(),
      purchaseDate: formData.purchaseDate?.trim()
        ? createDateOnly(formData.purchaseDate)
        : undefined,
      location: formData.location.trim() || undefined,
      notes: formData.notes.trim() || undefined,
      weightGrams,
      caloriesPerUnit: formData.caloriesPerUnit
        ? Number.parseFloat(formData.caloriesPerUnit)
        : undefined,
      requiresWaterLiters: formData.requiresWaterLiters
        ? Number.parseFloat(formData.requiresWaterLiters)
        : undefined,
      capacityMah: formData.capacityMah
        ? Number.parseFloat(formData.capacityMah)
        : undefined,
      capacityWh: formData.capacityWh
        ? Number.parseFloat(formData.capacityWh)
        : undefined,
    });
  };

  const handleChange = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      // Recalculate calories when weight changes manually (if template has caloriesPer100g)
      // Weight and calories are per-unit values, so they don't change with quantity
      // Weight input always accepts grams (even when unit is kilograms)
      if (
        field === 'weightGrams' &&
        templateCaloriesPer100g &&
        typeof value === 'string' &&
        Number.parseFloat(value) > 0
      ) {
        // Weight is already in grams (no conversion needed)
        const weightGrams = Number.parseFloat(value);
        const newCalories = calculateCaloriesFromWeight(
          weightGrams,
          templateCaloriesPer100g,
        );
        updated.caloriesPerUnit = newCalories.toString();
      }

      // Note: Weight input always accepts grams, even when unit is kilograms
      // (package labels often show weight in grams)

      return updated;
    });
    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const categoryOptions = categories.map((cat) => ({
    value: cat.id,
    label: t(cat.id, { ns: 'categories' }),
    icon: cat.icon,
  }));

  // Common units shown in the form (subset of VALID_UNITS for better UX)
  const COMMON_UNITS: Unit[] = [
    'pieces',
    'liters',
    'kilograms',
    'cans',
    'bottles',
    'packages',
    'boxes',
  ] as const;

  const unitOptions = COMMON_UNITS.map((unit) => ({
    value: unit,
    label: t(unit, { ns: 'units' }),
  }));

  return (
    <form
      className={styles.form}
      onSubmit={handleSubmit}
      data-testid="item-form"
    >
      {formData.itemType && (
        <div className={styles.formGroup}>
          <label className={styles.label}>{t('itemForm.itemType')}</label>
          <div className={styles.itemTypeDisplay}>
            {t(formData.itemType, { ns: 'products' })}
          </div>
        </div>
      )}

      <div className={styles.formGroup}>
        <Input
          id="name"
          name="name"
          label={t('itemForm.name')}
          type="text"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          error={errors.name}
          placeholder={
            item?.itemType ? t('itemForm.namePlaceholder') : undefined
          }
          required
        />
      </div>

      <div className={styles.formGroup}>
        <Select
          id="categoryId"
          name="category"
          label={t('itemForm.category')}
          value={formData.categoryId}
          options={categoryOptions}
          onChange={(e) => handleChange('categoryId', e.target.value)}
          error={errors.categoryId}
          required
        />
      </div>

      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <Input
            id="quantity"
            name="quantity"
            label={t('itemForm.quantity')}
            type="number"
            value={formData.quantity}
            onChange={(e) => handleChange('quantity', e.target.value)}
            error={errors.quantity}
            min="0"
            step={isContinuousUnit(formData.unit) ? '0.1' : '1'}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <Select
            id="unit"
            name="unit"
            label={t('itemForm.unit')}
            value={formData.unit}
            options={unitOptions}
            onChange={(e) => handleChange('unit', e.target.value)}
          />
        </div>
      </div>

      {isFoodCategory(formData.categoryId) && (
        <>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <Input
                id="weightGrams"
                name="weightGrams"
                label={
                  formData.unit === 'kilograms'
                    ? t('itemForm.weightKilograms')
                    : t('itemForm.weightGrams')
                }
                type="number"
                value={formData.weightGrams}
                onChange={(e) => handleChange('weightGrams', e.target.value)}
                min="0"
                step="1"
              />
            </div>

            <div className={styles.formGroup}>
              <Input
                id="caloriesPerUnit"
                name="caloriesPerUnit"
                label={t('itemForm.caloriesPerUnit')}
                type="number"
                value={formData.caloriesPerUnit}
                onChange={(e) =>
                  handleChange('caloriesPerUnit', e.target.value)
                }
                min="0"
                step="1"
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <Input
              id="requiresWaterLiters"
              name="requiresWaterLiters"
              label={t('itemForm.requiresWaterLiters')}
              type="number"
              value={formData.requiresWaterLiters}
              onChange={(e) =>
                handleChange('requiresWaterLiters', e.target.value)
              }
              min="0"
              step="0.1"
            />
          </div>
        </>
      )}

      {isPowerCategory(formData.categoryId) && (
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <Input
              id="capacityMah"
              name="capacityMah"
              label={t('itemForm.capacityMah')}
              type="number"
              value={formData.capacityMah}
              onChange={(e) => handleChange('capacityMah', e.target.value)}
              min="0"
              step="1"
            />
          </div>

          <div className={styles.formGroup}>
            <Input
              id="capacityWh"
              name="capacityWh"
              label={t('itemForm.capacityWh')}
              type="number"
              value={formData.capacityWh}
              onChange={(e) => handleChange('capacityWh', e.target.value)}
              min="0"
              step="0.1"
            />
          </div>
        </div>
      )}

      <div className={styles.formGroup}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={formData.neverExpires}
            onChange={(e) => handleChange('neverExpires', e.target.checked)}
          />
          {t('itemForm.neverExpires')}
        </label>
      </div>

      {!formData.neverExpires && (
        <div className={styles.formGroup}>
          <Input
            id="expirationDate"
            label={t('itemForm.expirationDate')}
            type="date"
            value={formData.expirationDate}
            onChange={(e) => handleChange('expirationDate', e.target.value)}
            error={errors.expirationDate}
            required
          />
        </div>
      )}

      <div className={styles.formGroup}>
        <Input
          id="purchaseDate"
          label={t('itemForm.purchaseDate')}
          type="date"
          value={formData.purchaseDate}
          onChange={(e) => handleChange('purchaseDate', e.target.value)}
        />
      </div>

      <div className={styles.formGroup}>
        <Input
          id="location"
          label={t('itemForm.location')}
          type="text"
          value={formData.location}
          onChange={(e) => handleChange('location', e.target.value)}
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="notes" className={styles.textareaLabel}>
          {t('itemForm.notes')}
        </label>
        <textarea
          id="notes"
          className={styles.textarea}
          value={formData.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          rows={3}
        />
      </div>

      <div className={styles.actions}>
        <Button type="submit" variant="primary" data-testid="save-item-button">
          {item?.id ? t('common.save') : t('common.add')}
        </Button>
        {item?.id && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            data-testid="cancel-item-button"
          >
            {t('common.cancel')}
          </Button>
        )}
      </div>
    </form>
  );
};
