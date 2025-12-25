import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { InventoryItem, Category } from '../../types';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Button } from '../common/Button';
import styles from './ItemForm.module.css';

export interface ItemFormProps {
  item?: InventoryItem;
  categories: Category[];
  onSubmit: (
    item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>,
  ) => void;
  onCancel: () => void;
}

interface FormData {
  name: string;
  categoryId: string;
  quantity: string;
  unit: string;
  recommendedQuantity: string;
  neverExpires: boolean;
  expirationDate: string;
  location: string;
  notes: string;
}

interface FormErrors {
  name?: string;
  categoryId?: string;
  quantity?: string;
  recommendedQuantity?: string;
  expirationDate?: string;
}

export const ItemForm = ({
  item,
  categories,
  onSubmit,
  onCancel,
}: ItemFormProps) => {
  const { t } = useTranslation();

  const [formData, setFormData] = useState<FormData>(() => ({
    name: item?.name || '',
    categoryId: item?.categoryId || '',
    quantity: item?.quantity?.toString() || '',
    unit: item?.unit || 'pieces',
    recommendedQuantity: item?.recommendedQuantity?.toString() || '',
    neverExpires: item?.neverExpires ?? false,
    expirationDate: item?.expirationDate || '',
    location: item?.location || '',
    notes: item?.notes || '',
  }));

  const [errors, setErrors] = useState<FormErrors>({});

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

    if (
      !formData.recommendedQuantity ||
      parseFloat(formData.recommendedQuantity) < 0
    ) {
      newErrors.recommendedQuantity = t(
        'itemForm.errors.recommendedQuantityInvalid',
      );
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
      recommendedQuantity: parseFloat(formData.recommendedQuantity),
      neverExpires: formData.neverExpires,
      expirationDate: formData.neverExpires
        ? undefined
        : formData.expirationDate,
      location: formData.location.trim() || undefined,
      notes: formData.notes.trim() || undefined,
    });
  };

  const handleChange = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const categoryOptions = categories.map((cat) => ({
    value: cat.id,
    label: t(`categories.${cat.id}`),
    icon: cat.icon,
  }));

  const unitOptions = [
    { value: 'pieces', label: t('units.pieces') },
    { value: 'liters', label: t('units.liters') },
    { value: 'kilograms', label: t('units.kilograms') },
    { value: 'cans', label: t('units.cans') },
    { value: 'bottles', label: t('units.bottles') },
    { value: 'packages', label: t('units.packages') },
    { value: 'boxes', label: t('units.boxes') },
  ];

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.formGroup}>
        <Input
          id="name"
          name="name"
          label={t('itemForm.name')}
          type="text"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          error={errors.name}
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
            step="0.1"
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

      <div className={styles.formGroup}>
        <Input
          id="recommendedQuantity"
          name="recommendedQuantity"
          label={t('itemForm.recommendedQuantity')}
          type="number"
          value={formData.recommendedQuantity}
          onChange={(e) => handleChange('recommendedQuantity', e.target.value)}
          error={errors.recommendedQuantity}
          min="0"
          step="0.1"
          required
        />
      </div>

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
        <Button type="button" variant="secondary" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" variant="primary">
          {item ? t('common.save') : t('common.add')}
        </Button>
      </div>
    </form>
  );
};
