import { useState, useRef, useEffect } from 'react';
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
  createQuantity,
  isFoodCategory,
  isPowerCategory,
} from '@/shared/types';
import { isValidUnit } from '@/shared/utils/validation/unitValidation';
import { Input } from '@/shared/components/Input';
import { AutocompleteInput } from '@/shared/components/AutocompleteInput';
import { Select } from '@/shared/components/Select';
import { Button } from '@/shared/components/Button';
import { calculateCaloriesFromWeight } from '@/shared/utils/calculations/calories';
import {
  CUSTOM_ITEM_TYPE,
  DEFAULT_WEIGHT_PER_UNIT_GRAMS,
} from '@/shared/utils/constants';
import { isTemplateId } from '@/shared/utils/storage/localStorage';
import styles from './ItemForm.module.css';

export interface ItemFormProps {
  item?: InventoryItem;
  categories: Category[];
  onSubmit: (
    item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>,
    saveAsTemplate?: boolean,
  ) => void;
  onCancel: () => void;
  defaultCategoryId?: string;
  templateWeightGramsPerUnit?: number;
  templateCaloriesPer100g?: number;
  templateRequiresWaterLiters?: number;
  /** Called when form dirty state changes (user has modified fields). */
  onDirtyChange?: (dirty: boolean) => void;
  /** Optional ref for the form element (e.g. to trigger requestSubmit from parent). */
  formRef?: React.RefObject<HTMLFormElement | null>;
  locationSuggestions?: string[];
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
  saveAsTemplate: boolean;
  isNormalRotation: boolean;
  estimatedQuantity: string;
  excludeFromCalculations: boolean;
}

interface FormErrors {
  name?: string;
  categoryId?: string;
  quantity?: string;
  expirationDate?: string;
  estimatedQuantity?: string;
}

function getExpirationDateFromForm(
  data: FormData,
  isRotation: boolean,
): ReturnType<typeof createDateOnly> | undefined {
  if (isRotation || data.neverExpires) return undefined;
  if (data.expirationDate?.trim()) return createDateOnly(data.expirationDate);
  return undefined;
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
  onDirtyChange,
  formRef: formRefProp,
  locationSuggestions = [],
}: ItemFormProps) => {
  const { t, i18n } = useTranslation([
    'common',
    'categories',
    'units',
    'products',
  ]);
  const currentLang = (i18n?.language || 'en') as 'en' | 'fi';

  // Calculate default weight and calories from template
  // Always display weight in grams (even when unit is kilograms, as package labels often use grams)
  const getDefaultWeight = (): string => {
    const weightGrams = item?.weightGrams ?? templateWeightGramsPerUnit;
    if (weightGrams !== undefined) return weightGrams.toString();
    // Default to DEFAULT_WEIGHT_PER_UNIT_GRAMS for food items when no template or existing weight
    if (isFoodCategory(item?.categoryId || defaultCategoryId || '')) {
      return DEFAULT_WEIGHT_PER_UNIT_GRAMS.toString();
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
      saveAsTemplate: false,
      isNormalRotation: item?.isNormalRotation ?? false,
      estimatedQuantity: item?.estimatedQuantity?.toString() || '',
      excludeFromCalculations: item?.excludeFromCalculations ?? false,
    };
  });

  const initialFormDataRef = useRef<FormData | null>(null);
  const hasCapturedInitialRef = useRef(false);
  useEffect(() => {
    if (!hasCapturedInitialRef.current) {
      initialFormDataRef.current = { ...formData };
      hasCapturedInitialRef.current = true;
    }
  }, [formData]);
  useEffect(() => {
    if (initialFormDataRef.current === null) return;
    const dirty =
      JSON.stringify(formData) !== JSON.stringify(initialFormDataRef.current);
    onDirtyChange?.(dirty);
  }, [formData, onDirtyChange]);

  // Determine if this is a custom item (no template or itemType is 'custom')
  // and if it's a new item (no id)
  const isNewCustomItem =
    !item?.id && (!formData.itemType || formData.itemType === 'custom');

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

    // Validate quantity: must be present, numeric, finite, and non-negative
    if (formData.quantity) {
      const parsedQuantity = Number.parseFloat(formData.quantity);
      if (
        Number.isNaN(parsedQuantity) ||
        !Number.isFinite(parsedQuantity) ||
        parsedQuantity < 0
      ) {
        newErrors.quantity = t('itemForm.errors.quantityInvalid');
      }
    } else {
      newErrors.quantity = t('itemForm.errors.quantityInvalid');
    }

    // Rotation item validation
    if (formData.isNormalRotation && !formData.excludeFromCalculations) {
      const parsedEstimated = Number.parseFloat(formData.estimatedQuantity);
      if (
        !formData.estimatedQuantity ||
        Number.isNaN(parsedEstimated) ||
        parsedEstimated <= 0
      ) {
        newErrors.estimatedQuantity = t(
          'itemForm.rotation.errors.estimatedQuantityRequired',
        );
      }
    }

    // Expiration is only required for non-rotation items
    if (
      !formData.isNormalRotation &&
      !formData.neverExpires &&
      !formData.expirationDate
    ) {
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

    // Wrap createQuantity in try/catch to handle invalid values gracefully
    let quantity;
    try {
      quantity = createQuantity(Number.parseFloat(formData.quantity));
    } catch {
      setErrors((prev) => ({
        ...prev,
        quantity: t('itemForm.errors.quantityInvalid'),
      }));
      return;
    }

    const isRotation = formData.isNormalRotation;

    onSubmit(
      {
        name: formData.name.trim(),
        itemType,
        categoryId: createCategoryId(formData.categoryId),
        quantity,
        unit: isValidUnit(formData.unit) ? formData.unit : ('pieces' as Unit), // Fallback to 'pieces' if invalid
        // For rotation items, clear expiration fields
        neverExpires: isRotation ? undefined : formData.neverExpires,
        expirationDate: getExpirationDateFromForm(formData, isRotation),
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
        // Rotation item fields
        isNormalRotation: isRotation || undefined,
        estimatedQuantity:
          isRotation && formData.estimatedQuantity
            ? Number.parseFloat(formData.estimatedQuantity)
            : undefined,
        excludeFromCalculations:
          isRotation && formData.excludeFromCalculations ? true : undefined,
      },
      formData.saveAsTemplate,
    );
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

  const categoryOptions = categories.map((cat) => {
    // Custom categories have names object, standard categories use translations
    const label =
      cat.names && (cat.names[currentLang] || cat.names.en)
        ? cat.names[currentLang] || cat.names.en
        : t(cat.id, { ns: 'categories' });
    return {
      value: cat.id,
      label,
      icon: cat.icon,
    };
  });

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
      ref={formRefProp}
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

      <div className={styles.formGroup}>
        <label htmlFor="isNormalRotation" className={styles.checkboxLabel}>
          <input
            id="isNormalRotation"
            type="checkbox"
            checked={formData.isNormalRotation}
            onChange={(e) => handleChange('isNormalRotation', e.target.checked)}
            data-testid="rotation-checkbox"
          />
          {t('itemForm.rotation.label')}
        </label>
        <p className={styles.helpText}>{t('itemForm.rotation.description')}</p>
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
              step={isContinuousUnit('liters') ? '0.1' : '1'}
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

      {formData.isNormalRotation ? (
        <>
          <div className={styles.formGroup}>
            <Input
              id="estimatedQuantity"
              name="estimatedQuantity"
              label={t('itemForm.rotation.estimatedQuantity')}
              type="number"
              value={formData.estimatedQuantity}
              onChange={(e) =>
                handleChange('estimatedQuantity', e.target.value)
              }
              error={errors.estimatedQuantity}
              min="0"
              step={isContinuousUnit(formData.unit) ? '0.1' : '1'}
              required={!formData.excludeFromCalculations}
            />
            <p className={styles.helpText}>
              {t('itemForm.rotation.estimatedQuantityHelp')}
            </p>
          </div>

          <div className={styles.formGroup}>
            <label
              htmlFor="excludeFromCalculations"
              className={styles.checkboxLabel}
            >
              <input
                id="excludeFromCalculations"
                type="checkbox"
                checked={formData.excludeFromCalculations}
                onChange={(e) =>
                  handleChange('excludeFromCalculations', e.target.checked)
                }
                data-testid="exclude-from-calculations-checkbox"
              />
              {t('itemForm.rotation.excludeFromCalculations')}
            </label>
          </div>
        </>
      ) : (
        <>
          <div className={styles.formGroup}>
            <label htmlFor="neverExpires" className={styles.checkboxLabel}>
              <input
                id="neverExpires"
                type="checkbox"
                checked={formData.neverExpires}
                onChange={(e) => handleChange('neverExpires', e.target.checked)}
                data-testid="never-expires-checkbox"
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
        </>
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
        <AutocompleteInput
          id="location"
          label={t('itemForm.location')}
          value={formData.location}
          onChange={(value) => handleChange('location', value)}
          suggestions={locationSuggestions}
          placeholder={t('inventory.locationPlaceholder')}
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

      {isNewCustomItem && (
        <div className={styles.formGroup}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={formData.saveAsTemplate}
              onChange={(e) => handleChange('saveAsTemplate', e.target.checked)}
              data-testid="save-as-template-checkbox"
            />
            {t('itemForm.saveAsTemplate')}
          </label>
          <p className={styles.helperText}>
            {t('itemForm.saveAsTemplateHint')}
          </p>
        </div>
      )}

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
