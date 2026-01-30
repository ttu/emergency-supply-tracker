import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Category, LocalizedNames } from '@/shared/types';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import styles from './CategoryForm.module.css';

export interface CategoryFormData {
  names: LocalizedNames;
  icon: string;
  descriptions?: LocalizedNames;
  color?: string;
  sortOrder?: number;
}

export interface CategoryFormProps {
  readonly initialCategory?: Category;
  readonly onSubmit: (data: CategoryFormData) => void;
  readonly onCancel: () => void;
  /** Existing category names (lowercase) for duplicate checking */
  readonly existingNames?: string[];
}

function toKebabCase(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replaceAll(/[^\w\s-]/g, '')
    .replaceAll(/\s+/g, '-')
    .replaceAll(/-+/g, '-');
}

const DEFAULT_CATEGORY_ICON = '📦';
const SORT_ORDER_MIN = 0;
const SORT_ORDER_MAX = 999;

function isValidEmoji(str: string): boolean {
  // Use Unicode property escapes for modern emoji validation
  // Extended_Pictographic covers all emoji, followed by optional variation selector (FE0F)
  // and optional ZWJ sequences for compound emoji
  const emojiRegex =
    /^\p{Extended_Pictographic}(\uFE0F|\u200D\p{Extended_Pictographic})*$/u;
  return emojiRegex.test(str.trim());
}

export function CategoryForm({
  initialCategory,
  onSubmit,
  onCancel,
  existingNames = [],
}: CategoryFormProps) {
  const { t } = useTranslation();
  const isEditing = !!initialCategory;

  const [nameEn, setNameEn] = useState(initialCategory?.names?.en || '');
  const [nameFi, setNameFi] = useState(initialCategory?.names?.fi || '');
  const [icon, setIcon] = useState(initialCategory?.icon || '');
  const [descriptionEn, setDescriptionEn] = useState(
    initialCategory?.descriptions?.en || '',
  );
  const [descriptionFi, setDescriptionFi] = useState(
    initialCategory?.descriptions?.fi || '',
  );
  const [color, setColor] = useState(initialCategory?.color || '');
  const [sortOrder, setSortOrder] = useState(
    initialCategory?.sortOrder != null
      ? initialCategory.sortOrder.toString()
      : '',
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  const generatedId = useMemo(() => {
    if (!nameEn.trim()) return '';
    return `custom-${toKebabCase(nameEn)}`;
  }, [nameEn]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!nameEn.trim()) {
      newErrors.nameEn = t('settings.customCategories.form.error.nameRequired');
    }

    // Icon is optional - if provided, must be a valid emoji
    if (icon.trim() && !isValidEmoji(icon.trim())) {
      newErrors.icon = t('settings.customCategories.form.error.iconInvalid');
    }

    // Check for duplicate name (case-insensitive)
    const normalizedName = nameEn.trim().toLowerCase();
    if (normalizedName && existingNames.includes(normalizedName)) {
      newErrors.nameEn = t('settings.customCategories.form.error.nameExists');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const data: CategoryFormData = {
      names: { en: nameEn.trim() },
      icon: icon.trim() || DEFAULT_CATEGORY_ICON,
    };

    if (nameFi.trim()) {
      data.names.fi = nameFi.trim();
    }

    if (descriptionEn.trim() || descriptionFi.trim()) {
      data.descriptions = {};
      if (descriptionEn.trim()) {
        data.descriptions.en = descriptionEn.trim();
      }
      if (descriptionFi.trim()) {
        data.descriptions.fi = descriptionFi.trim();
      }
    }

    if (color.trim()) {
      data.color = color.trim();
    }

    // Only include sortOrder if user entered a value
    if (sortOrder.trim()) {
      const parsedSortOrder = Number.parseInt(sortOrder, 10);
      // Validate within allowed range
      if (
        !Number.isNaN(parsedSortOrder) &&
        parsedSortOrder >= SORT_ORDER_MIN &&
        parsedSortOrder <= SORT_ORDER_MAX
      ) {
        data.sortOrder = parsedSortOrder;
      }
    }

    onSubmit(data);
  };

  return (
    <form
      className={styles.form}
      onSubmit={handleSubmit}
      noValidate
      data-testid="category-form"
    >
      <h3 className={styles.title} data-testid="category-form-title">
        {isEditing
          ? t('settings.customCategories.form.title.edit')
          : t('settings.customCategories.form.title.create')}
      </h3>

      <div className={styles.fields}>
        <Input
          label={t('settings.customCategories.form.nameEn')}
          value={nameEn}
          onChange={(e) => setNameEn(e.target.value)}
          error={errors.nameEn}
          required
          fullWidth
          data-testid="category-name-en"
        />

        <Input
          label={t('settings.customCategories.form.nameFi')}
          value={nameFi}
          onChange={(e) => setNameFi(e.target.value)}
          fullWidth
          data-testid="category-name-fi"
        />

        <Input
          label={t('settings.customCategories.form.icon')}
          value={icon}
          onChange={(e) => setIcon(e.target.value)}
          error={errors.icon}
          placeholder={DEFAULT_CATEGORY_ICON}
          helperText={t('settings.customCategories.form.iconHelper')}
          data-testid="category-icon"
        />

        {generatedId && (
          <p className={styles.idPreview} data-testid="category-id-preview">
            {t('settings.customCategories.form.idPreview')}
            {generatedId.replace('custom-', '')}
          </p>
        )}

        <Input
          label={t('settings.customCategories.form.descriptionEn')}
          value={descriptionEn}
          onChange={(e) => setDescriptionEn(e.target.value)}
          fullWidth
          data-testid="category-description-en"
        />

        <Input
          label={t('settings.customCategories.form.descriptionFi')}
          value={descriptionFi}
          onChange={(e) => setDescriptionFi(e.target.value)}
          fullWidth
          data-testid="category-description-fi"
        />

        <Input
          label={t('settings.customCategories.form.color')}
          type="color"
          value={color || '#6b7280'}
          onChange={(e) => setColor(e.target.value)}
          data-testid="category-color"
        />

        <Input
          label={t('settings.customCategories.form.sortOrder')}
          type="number"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          helperText={t('settings.customCategories.form.sortOrderHelper')}
          min={SORT_ORDER_MIN}
          max={SORT_ORDER_MAX}
          data-testid="category-sort-order"
        />
      </div>

      <div className={styles.buttons}>
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          data-testid="category-form-cancel"
        >
          {t('settings.customCategories.form.cancel')}
        </Button>
        <Button
          type="submit"
          variant="primary"
          data-testid="category-form-save"
        >
          {t('settings.customCategories.form.save')}
        </Button>
      </div>
    </form>
  );
}
