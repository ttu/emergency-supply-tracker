import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { InventoryItem, Category } from '../../types';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Button } from '../common/Button';
import { calculateCaloriesFromWeight } from '../../utils/calculations/calories';
import styles from './ItemForm.module.css';

export interface ItemFormProps {
  item?: InventoryItem;
  categories: Category[];
  onSubmit: (
    item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>,
  ) => void;
  onCancel: () => void;
  defaultRecommendedQuantity?: number;
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
  recommendedQuantity: number;
  neverExpires: boolean;
  expirationDate: string;
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
  defaultRecommendedQuantity = 1,
  templateWeightGramsPerUnit,
  templateCaloriesPer100g,
  templateRequiresWaterLiters,
}: ItemFormProps) => {
  const { t } = useTranslation(['common', 'categories', 'units', 'products']);

  // Calculate default weight and calories from template
  const getDefaultWeight = (): string => {
    if (item?.weightGrams !== undefined) return item.weightGrams.toString();
    if (templateWeightGramsPerUnit !== undefined) {
      return templateWeightGramsPerUnit.toString();
    }
    return '';
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

  const [formData, setFormData] = useState<FormData>(() => ({
    itemType: item?.itemType || '',
    name: item?.name || '',
    categoryId: item?.categoryId || '',
    quantity: item?.quantity?.toString() || '',
    unit: item?.unit || 'pieces',
    recommendedQuantity:
      item?.recommendedQuantity ?? defaultRecommendedQuantity,
    neverExpires: item?.neverExpires ?? false,
    expirationDate: item?.expirationDate || '',
    location: item?.location || '',
    notes: item?.notes || '',
    weightGrams: getDefaultWeight(),
    caloriesPerUnit: getDefaultCalories(),
    requiresWaterLiters: getDefaultRequiresWaterLiters(),
    capacityMah: item?.capacityMah?.toString() || '',
    capacityWh: item?.capacityWh?.toString() || '',
  }));

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

    if (!formData.quantity || parseFloat(formData.quantity) < 0) {
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

    onSubmit({
      name: formData.name.trim(),
      itemType: formData.itemType.trim() || undefined,
      categoryId: formData.categoryId,
      quantity: parseFloat(formData.quantity),
      unit: formData.unit as
        | 'pieces'
        | 'liters'
        | 'kilograms'
        | 'cans'
        | 'bottles'
        | 'packages'
        | 'boxes',
      recommendedQuantity: formData.recommendedQuantity,
      neverExpires: formData.neverExpires,
      expirationDate: formData.neverExpires
        ? undefined
        : formData.expirationDate,
      location: formData.location.trim() || undefined,
      notes: formData.notes.trim() || undefined,
      weightGrams: formData.weightGrams
        ? parseFloat(formData.weightGrams)
        : undefined,
      caloriesPerUnit: formData.caloriesPerUnit
        ? parseFloat(formData.caloriesPerUnit)
        : undefined,
      requiresWaterLiters: formData.requiresWaterLiters
        ? parseFloat(formData.requiresWaterLiters)
        : undefined,
      capacityMah: formData.capacityMah
        ? parseFloat(formData.capacityMah)
        : undefined,
      capacityWh: formData.capacityWh
        ? parseFloat(formData.capacityWh)
        : undefined,
    });
  };

  const handleChange = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      // Recalculate calories when weight changes manually (if template has caloriesPer100g)
      // Weight and calories are per-unit values, so they don't change with quantity
      if (
        field === 'weightGrams' &&
        templateCaloriesPer100g &&
        typeof value === 'string' &&
        parseFloat(value) > 0
      ) {
        const newCalories = calculateCaloriesFromWeight(
          parseFloat(value),
          templateCaloriesPer100g,
        );
        updated.caloriesPerUnit = newCalories.toString();
      }

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

  const unitOptions = [
    { value: 'pieces', label: t('pieces', { ns: 'units' }) },
    { value: 'liters', label: t('liters', { ns: 'units' }) },
    { value: 'kilograms', label: t('kilograms', { ns: 'units' }) },
    { value: 'cans', label: t('cans', { ns: 'units' }) },
    { value: 'bottles', label: t('bottles', { ns: 'units' }) },
    { value: 'packages', label: t('packages', { ns: 'units' }) },
    { value: 'boxes', label: t('boxes', { ns: 'units' }) },
  ];

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {formData.itemType && (
        <div className={styles.formGroup}>
          <label className={styles.label}>{t('itemForm.itemType')}</label>
          <div className={styles.itemTypeDisplay}>{formData.itemType}</div>
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

      {formData.categoryId === 'food' && (
        <>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <Input
                id="weightGrams"
                name="weightGrams"
                label={t('itemForm.weightGrams')}
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

      {formData.categoryId === 'light-power' && (
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
        <Button type="submit" variant="primary">
          {item?.id ? t('common.save') : t('common.add')}
        </Button>
        {item?.id && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
        )}
      </div>
    </form>
  );
};
