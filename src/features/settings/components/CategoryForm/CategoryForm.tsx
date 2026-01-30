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
  initialCategory?: Category;
  onSubmit: (data: CategoryFormData) => void;
  onCancel: () => void;
  existingIds?: string[];
}

function toKebabCase(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

const DEFAULT_CATEGORY_ICON = '📦';

function isValidEmoji(str: string): boolean {
  // Comprehensive emoji regex covering common emoji ranges
  const emojiRegex =
    /^(?:[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]|[\u{231A}-\u{231B}]|[\u{23E9}-\u{23F3}]|[\u{23F8}-\u{23FA}]|[\u{25AA}-\u{25AB}]|[\u{25B6}]|[\u{25C0}]|[\u{25FB}-\u{25FE}]|[\u{2614}-\u{2615}]|[\u{2648}-\u{2653}]|[\u{267F}]|[\u{2693}]|[\u{26A1}]|[\u{26AA}-\u{26AB}]|[\u{26BD}-\u{26BE}]|[\u{26C4}-\u{26C5}]|[\u{26CE}]|[\u{26D4}]|[\u{26EA}]|[\u{26F2}-\u{26F3}]|[\u{26F5}]|[\u{26FA}]|[\u{26FD}]|[\u{2702}]|[\u{2705}]|[\u{2708}-\u{270D}]|[\u{270F}]|[\u{2712}]|[\u{2714}]|[\u{2716}]|[\u{271D}]|[\u{2721}]|[\u{2728}]|[\u{2733}-\u{2734}]|[\u{2744}]|[\u{2747}]|[\u{274C}]|[\u{274E}]|[\u{2753}-\u{2755}]|[\u{2757}]|[\u{2763}-\u{2764}]|[\u{2795}-\u{2797}]|[\u{27A1}]|[\u{27B0}]|[\u{27BF}]|[\u{2934}-\u{2935}]|[\u{2B05}-\u{2B07}]|[\u{2B1B}-\u{2B1C}]|[\u{2B50}]|[\u{2B55}]|[\u{3030}]|[\u{303D}]|[\u{3297}]|[\u{3299}])[\u{FE0F}]?[\u{200D}]?/u;
  return emojiRegex.test(str.trim());
}

export function CategoryForm({
  initialCategory,
  onSubmit,
  onCancel,
  existingIds = [],
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
    initialCategory?.sortOrder?.toString() || '100',
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

    // Check for duplicate ID (but allow editing the same category)
    if (generatedId && !isEditing) {
      if (existingIds.includes(generatedId)) {
        newErrors.nameEn = t('settings.customCategories.form.error.idExists');
      }
    } else if (generatedId && isEditing) {
      // When editing, allow the same ID but not other existing IDs
      const otherIds = existingIds.filter((id) => id !== initialCategory?.id);
      if (otherIds.includes(generatedId)) {
        newErrors.nameEn = t('settings.customCategories.form.error.idExists');
      }
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

    if (sortOrder) {
      data.sortOrder = parseInt(sortOrder, 10);
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
          min={0}
          max={999}
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
