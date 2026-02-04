import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/components/Button';
import type {
  ImportedRecommendedItem,
  Unit,
  StandardCategoryId,
} from '@/shared/types';
import { VALID_UNITS, VALID_CATEGORIES, createQuantity } from '@/shared/types';
import styles from './ItemEditor.module.css';

// List of available built-in product translation keys
const BUILT_IN_PRODUCT_KEYS = [
  'bottled-water',
  'long-life-milk',
  'long-life-juice',
  'canned-soup',
  'canned-vegetables',
  'canned-beans',
  'canned-fish',
  'canned-meat',
  'pasta',
  'rice',
  'oats',
  'oatmeal',
  'crackers',
  'energy-bars',
  'cookies',
  'spreads',
  'peanut-butter',
  'jam',
  'dried-fruits',
  'nuts',
  'salt',
  'sugar',
  'coffee-tea',
  'frozen-vegetables',
  'frozen-meat',
  'frozen-meals',
  'frozen-bread',
  'instant-coffee',
  'camping-stove',
  'stove-fuel',
  'matches',
  'lighter',
  'candles',
  'fire-starter',
  'flashlight',
  'headlamp',
  'batteries-aa',
  'batteries-aaa',
  'batteries-d',
  'batteries-9v',
  'power-bank',
  'charging-cables',
  'solar-charger',
  'power-generator',
  'generator-fuel',
  'battery-radio',
  'hand-crank-radio',
  'first-aid-kit',
  'prescription-meds',
  'pain-relievers',
  'fever-reducers',
  'bandages',
  'disinfectant',
  'antiseptic',
  'thermometer',
  'antihistamines',
  'diarrhea-meds',
  'tweezers-scissors',
  'allergy-meds',
  'anti-diarrheal',
  'rehydration-salts',
  'toilet-paper',
  'wet-wipes',
  'hand-sanitizer',
  'soap',
  'toothbrush',
  'toothpaste',
  'shampoo',
  'deodorant',
  'feminine-hygiene',
  'diapers',
  'garbage-bags',
  'paper-towels',
  'trash-bags',
  'bucket',
  'water-container',
  'water-purification',
  'duct-tape',
  'multi-tool',
  'can-opener',
  'plastic-bags',
  'aluminum-foil',
  'plastic-wrap',
  'rope',
  'plastic-sheeting',
  'rope-cord',
  'whistle',
  'emergency-blanket',
  'work-gloves',
  'dust-masks',
  'cash',
  'document-copies',
  'contact-list',
  'pet-food-dry',
  'pet-food-wet',
  'pet-water-bowl',
  'pet-food-bowl',
  'pet-carrier',
  'pet-leash-collar',
  'pet-waste-bags',
  'pet-medications',
  'pet-comfort-items',
  'pet-vaccination-records',
] as const;

type NameType = 'builtin' | 'custom';

export interface ItemEditorProps {
  readonly item?: ImportedRecommendedItem;
  readonly onSave: (item: ImportedRecommendedItem) => void;
  readonly onCancel: () => void;
  readonly existingIds?: Set<string>;
}

const generateId = (): string => {
  return `custom-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
};

/** Parse a string as a positive number, returns undefined if invalid */
const parsePositiveNumber = (value: string): number | undefined => {
  if (!value) return undefined;
  const num = Number.parseFloat(value);
  return !Number.isNaN(num) && num > 0 ? num : undefined;
};

/** Parse a string as a positive integer, returns undefined if invalid */
const parsePositiveInt = (value: string): number | undefined => {
  if (!value) return undefined;
  const num = Number.parseInt(value, 10);
  return !Number.isNaN(num) && num > 0 ? num : undefined;
};

/** Extract product key from i18nKey (e.g., "products.bottled-water" -> "bottled-water") */
const extractProductKey = (i18nKey: string | undefined): string => {
  if (!i18nKey) return '';
  return i18nKey.startsWith('products.') ? i18nKey.substring(9) : i18nKey;
};

/** Check if a unit is continuous (allows decimal values with 0.1 step) */
const isContinuousUnit = (unit: string): boolean => {
  return ['kilograms', 'liters', 'grams', 'meters'].includes(unit);
};

export function ItemEditor({
  item,
  onSave,
  onCancel,
  existingIds = new Set(),
}: ItemEditorProps) {
  const { t } = useTranslation(['common', 'categories', 'units', 'products']);
  const isEditing = !!item;

  // Determine initial name type based on item data
  const initialNameType: NameType = item?.i18nKey ? 'builtin' : 'custom';
  const initialProductKey = extractProductKey(item?.i18nKey);

  // Form state - use initializer function to guarantee unique ID at mount
  const [id] = useState(() => {
    if (item?.id) return item.id;
    let candidate: string;
    do {
      candidate = generateId();
    } while (existingIds.has(candidate));
    return candidate;
  });

  // Name type state
  const [nameType, setNameType] = useState<NameType>(initialNameType);
  const [selectedProductKey, setSelectedProductKey] =
    useState(initialProductKey);
  const [nameEn, setNameEn] = useState(item?.names?.en || '');
  const [nameFi, setNameFi] = useState(item?.names?.fi || '');

  const [category, setCategory] = useState<StandardCategoryId | string>(
    item?.category || 'food',
  );
  const [baseQuantity, setBaseQuantity] = useState(
    item?.baseQuantity?.toString() || '1',
  );
  const [unit, setUnit] = useState<Unit>(item?.unit || 'pieces');
  const [scaleWithPeople, setScaleWithPeople] = useState(
    item?.scaleWithPeople ?? true,
  );
  const [scaleWithDays, setScaleWithDays] = useState(
    item?.scaleWithDays ?? false,
  );
  const [requiresFreezer, setRequiresFreezer] = useState(
    item?.requiresFreezer ?? false,
  );
  const [defaultExpirationMonths, setDefaultExpirationMonths] = useState(
    item?.defaultExpirationMonths?.toString() || '',
  );
  const [weightGramsPerUnit, setWeightGramsPerUnit] = useState(
    item?.weightGramsPerUnit?.toString() || '',
  );
  const [caloriesPer100g, setCaloriesPer100g] = useState(
    item?.caloriesPer100g?.toString() || '',
  );

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Sort product keys alphabetically by their translated names
  const sortedProductKeys = useMemo(() => {
    return [...BUILT_IN_PRODUCT_KEYS].sort((a, b) => {
      const nameA = t(a, { ns: 'products' });
      const nameB = t(b, { ns: 'products' });
      return nameA.localeCompare(nameB);
    });
  }, [t]);

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    // Validation depends on name type
    if (nameType === 'builtin' && !selectedProductKey) {
      newErrors.name = t('kitEditor.validation.nameRequired');
    } else if (nameType === 'custom' && !nameEn.trim() && !nameFi.trim()) {
      // At least one custom name is required
      newErrors.name = t('kitEditor.validation.nameRequired');
    }

    // ID must be unique for new items
    if (!isEditing && existingIds.has(id)) {
      newErrors.id = t('kitEditor.validation.idExists');
    }

    // Base quantity must be positive
    const qty = Number.parseFloat(baseQuantity);
    if (Number.isNaN(qty) || qty <= 0) {
      newErrors.baseQuantity = t('kitEditor.validation.quantityPositive');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [
    nameType,
    selectedProductKey,
    nameEn,
    nameFi,
    id,
    baseQuantity,
    isEditing,
    existingIds,
    t,
  ]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      if (!validate()) {
        return;
      }

      const savedItem: ImportedRecommendedItem = {
        id: id as ImportedRecommendedItem['id'],
        category,
        baseQuantity: createQuantity(Number.parseFloat(baseQuantity)),
        unit,
        scaleWithPeople,
        scaleWithDays,
      };

      // Set name based on type - explicitly clear the opposite field to prevent stale data
      if (nameType === 'builtin') {
        savedItem.i18nKey = `products.${selectedProductKey}`;
        // Explicitly clear names when using built-in product key
        delete savedItem.names;
      } else {
        savedItem.names = {
          en: nameEn.trim() || nameFi.trim(),
          fi: nameFi.trim() || nameEn.trim(),
        };
        // Explicitly clear i18nKey when using custom names
        delete savedItem.i18nKey;
      }

      if (requiresFreezer) {
        savedItem.requiresFreezer = true;
      }

      const months = parsePositiveInt(defaultExpirationMonths);
      if (months !== undefined) {
        savedItem.defaultExpirationMonths = months;
      }

      // Only add food-specific fields for food category
      if (category === 'food') {
        const weight = parsePositiveNumber(weightGramsPerUnit);
        if (weight !== undefined) {
          savedItem.weightGramsPerUnit = weight;
        }

        const calories = parsePositiveNumber(caloriesPer100g);
        if (calories !== undefined) {
          savedItem.caloriesPer100g = calories;
        }
      }

      onSave(savedItem);
    },
    [
      validate,
      id,
      nameType,
      selectedProductKey,
      nameEn,
      nameFi,
      category,
      baseQuantity,
      unit,
      scaleWithPeople,
      scaleWithDays,
      requiresFreezer,
      defaultExpirationMonths,
      weightGramsPerUnit,
      caloriesPer100g,
      onSave,
    ],
  );

  const isFoodCategory = category === 'food';

  return (
    <form
      className={styles.form}
      onSubmit={handleSubmit}
      data-testid="item-editor"
    >
      <div className={styles.header}>
        <h3 className={styles.title}>
          {isEditing ? t('kitEditor.editItem') : t('kitEditor.addItem')}
        </h3>
      </div>

      {/* Names Section */}
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>{t('kitEditor.names')}</h4>

        {/* Name Type Toggle */}
        <div className={styles.radioGroup} data-testid="name-type-selector">
          <label className={styles.radio}>
            <input
              type="radio"
              name="nameType"
              value="builtin"
              checked={nameType === 'builtin'}
              onChange={() => setNameType('builtin')}
              data-testid="name-type-builtin"
            />
            <span>{t('kitEditor.useBuiltInName')}</span>
          </label>
          <label className={styles.radio}>
            <input
              type="radio"
              name="nameType"
              value="custom"
              checked={nameType === 'custom'}
              onChange={() => setNameType('custom')}
              data-testid="name-type-custom"
            />
            <span>{t('kitEditor.useCustomName')}</span>
          </label>
        </div>

        {/* Built-in Product Selector */}
        {nameType === 'builtin' && (
          <div className={styles.field}>
            <label htmlFor="productKey" className={styles.label}>
              {t('kitEditor.builtInProduct')}
            </label>
            <select
              id="productKey"
              className={styles.select}
              value={selectedProductKey}
              onChange={(e) => setSelectedProductKey(e.target.value)}
              data-testid="item-product-key"
            >
              <option value="">{t('kitEditor.selectProduct')}</option>
              {sortedProductKeys.map((key) => (
                <option key={key} value={key}>
                  {t(key, { ns: 'products' })}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Custom Name Inputs */}
        {nameType === 'custom' && (
          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="nameEn" className={styles.label}>
                {t('kitEditor.nameEn')}
              </label>
              <input
                type="text"
                id="nameEn"
                className={styles.input}
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                placeholder={t('kitEditor.nameEnPlaceholder')}
                data-testid="item-name-en"
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="nameFi" className={styles.label}>
                {t('kitEditor.nameFi')}
              </label>
              <input
                type="text"
                id="nameFi"
                className={styles.input}
                value={nameFi}
                onChange={(e) => setNameFi(e.target.value)}
                placeholder={t('kitEditor.nameFiPlaceholder')}
                data-testid="item-name-fi"
              />
            </div>
          </div>
        )}
        {errors.name && <p className={styles.error}>{errors.name}</p>}
      </div>

      {/* Category & Unit */}
      <div className={styles.section}>
        <div className={styles.row}>
          <div className={styles.field}>
            <label htmlFor="category" className={styles.label}>
              {t('kitEditor.category')}
            </label>
            <select
              id="category"
              className={styles.select}
              value={category}
              onChange={(e) =>
                setCategory(e.target.value as StandardCategoryId)
              }
              data-testid="item-category"
            >
              {VALID_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {t(cat, { ns: 'categories' })}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="unit" className={styles.label}>
              {t('kitEditor.unit')}
            </label>
            <select
              id="unit"
              className={styles.select}
              value={unit}
              onChange={(e) => setUnit(e.target.value as Unit)}
              data-testid="item-unit"
            >
              {VALID_UNITS.map((u) => (
                <option key={u} value={u}>
                  {t(u, { ns: 'units' })}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Quantity */}
      <div className={styles.section}>
        <div className={styles.row}>
          <div className={styles.field}>
            <label htmlFor="baseQuantity" className={styles.label}>
              {t('kitEditor.baseQuantity')}
            </label>
            <input
              type="number"
              id="baseQuantity"
              className={styles.input}
              value={baseQuantity}
              onChange={(e) => setBaseQuantity(e.target.value)}
              min={isContinuousUnit(unit) ? '0.1' : '1'}
              step={isContinuousUnit(unit) ? '0.1' : '1'}
              data-testid="item-base-quantity"
            />
            {errors.baseQuantity && (
              <p className={styles.error}>{errors.baseQuantity}</p>
            )}
          </div>
          <div className={styles.field}>
            <label htmlFor="defaultExpirationMonths" className={styles.label}>
              {t('kitEditor.defaultExpirationMonths')}
            </label>
            <input
              type="number"
              id="defaultExpirationMonths"
              className={styles.input}
              value={defaultExpirationMonths}
              onChange={(e) => setDefaultExpirationMonths(e.target.value)}
              min="1"
              step="1"
              placeholder={t('kitEditor.optional')}
              data-testid="item-expiration-months"
            />
          </div>
        </div>
      </div>

      {/* Scaling Options */}
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>{t('kitEditor.scaling')}</h4>
        <div className={styles.checkboxGroup}>
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={scaleWithPeople}
              onChange={(e) => setScaleWithPeople(e.target.checked)}
              data-testid="item-scale-people"
            />
            <span>{t('kitEditor.scaleWithPeople')}</span>
          </label>
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={scaleWithDays}
              onChange={(e) => setScaleWithDays(e.target.checked)}
              data-testid="item-scale-days"
            />
            <span>{t('kitEditor.scaleWithDays')}</span>
          </label>
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={requiresFreezer}
              onChange={(e) => setRequiresFreezer(e.target.checked)}
              data-testid="item-requires-freezer"
            />
            <span>{t('kitEditor.requiresFreezer')}</span>
          </label>
        </div>
      </div>

      {/* Nutrition (only for food categories) */}
      {isFoodCategory && (
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>{t('kitEditor.nutrition')}</h4>
          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="weightGramsPerUnit" className={styles.label}>
                {t('kitEditor.weightGramsPerUnit')}
              </label>
              <input
                type="number"
                id="weightGramsPerUnit"
                className={styles.input}
                value={weightGramsPerUnit}
                onChange={(e) => setWeightGramsPerUnit(e.target.value)}
                min="1"
                step="1"
                placeholder={t('kitEditor.optional')}
                data-testid="item-weight"
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="caloriesPer100g" className={styles.label}>
                {t('kitEditor.caloriesPer100g')}
              </label>
              <input
                type="number"
                id="caloriesPer100g"
                className={styles.input}
                value={caloriesPer100g}
                onChange={(e) => setCaloriesPer100g(e.target.value)}
                min="1"
                step="1"
                placeholder={t('kitEditor.optional')}
                data-testid="item-calories"
              />
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className={styles.actions}>
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          data-testid="item-editor-cancel"
        >
          {t('actions.cancel')}
        </Button>
        <Button type="submit" variant="primary" data-testid="item-editor-save">
          {isEditing ? t('actions.save') : t('kitEditor.addItem')}
        </Button>
      </div>
    </form>
  );
}
