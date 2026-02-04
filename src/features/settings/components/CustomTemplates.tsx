import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useInventory } from '@/features/inventory';
import { STANDARD_CATEGORIES } from '@/features/categories';
import { Button } from '@/shared/components/Button';
import { Modal } from '@/shared/components/Modal';
import { Input } from '@/shared/components/Input';
import { Select } from '@/shared/components/Select';
import type { ProductTemplate, Unit } from '@/shared/types';
import { VALID_UNITS, isFoodCategory } from '@/shared/types';
import styles from './CustomTemplates.module.css';

export interface EditFormData {
  nameEn: string;
  nameFi: string;
  category: string;
  defaultUnit: Unit;
  neverExpires: boolean;
  defaultExpirationMonths: string;
  weightGrams: string;
  caloriesPerUnit: string;
  caloriesPer100g: string;
  requiresWaterLiters: string;
}

const INITIAL_FORM_DATA: EditFormData = {
  nameEn: '',
  nameFi: '',
  category: '',
  defaultUnit: 'pieces',
  neverExpires: true,
  defaultExpirationMonths: '',
  weightGrams: '',
  caloriesPerUnit: '',
  caloriesPer100g: '',
  requiresWaterLiters: '',
};

/** Get the localized name for a template based on current language */
function getLocalizedName(template: ProductTemplate, language: string): string {
  if (template.names?.[language]) return template.names[language];
  return template.name || '';
}

/** Parse string to number; returns undefined if empty or not finite */
function parseOptionalNumber(s: string): number | undefined {
  const val = s.trim() ? Number.parseFloat(s) : undefined;
  return val !== undefined && Number.isFinite(val) ? val : undefined;
}

type TemplateUpdatePayload = Parameters<
  ReturnType<typeof useInventory>['updateCustomTemplate']
>[1];

/** Build template update payload from form data; returns null if names are empty */
function buildTemplateUpdate(
  formData: EditFormData,
): TemplateUpdatePayload | null {
  const nameEn = formData.nameEn.trim();
  const nameFi = formData.nameFi.trim();
  if (!nameEn && !nameFi) return null;
  const primaryName = nameEn || nameFi;
  const expMonths = parseOptionalNumber(formData.defaultExpirationMonths);
  const defaultExpirationMonths =
    !formData.neverExpires && expMonths !== undefined && expMonths > 0
      ? Math.round(expMonths)
      : undefined;
  return {
    name: primaryName,
    names: { en: nameEn || primaryName, fi: nameFi || primaryName },
    category: formData.category,
    defaultUnit: formData.defaultUnit,
    neverExpires: formData.neverExpires,
    defaultExpirationMonths,
    weightGrams: parseOptionalNumber(formData.weightGrams),
    caloriesPerUnit: parseOptionalNumber(formData.caloriesPerUnit),
    caloriesPer100g: parseOptionalNumber(formData.caloriesPer100g),
    requiresWaterLiters: parseOptionalNumber(formData.requiresWaterLiters),
  };
}

function formDataFromTemplate(template: ProductTemplate): EditFormData {
  return {
    nameEn: template.names?.en || template.name || '',
    nameFi: template.names?.fi || template.name || '',
    category: template.category,
    defaultUnit: template.defaultUnit || 'pieces',
    neverExpires: template.neverExpires ?? true,
    defaultExpirationMonths: template.defaultExpirationMonths?.toString() ?? '',
    weightGrams: template.weightGrams?.toString() ?? '',
    caloriesPerUnit: template.caloriesPerUnit?.toString() ?? '',
    caloriesPer100g: template.caloriesPer100g?.toString() ?? '',
    requiresWaterLiters: template.requiresWaterLiters?.toString() ?? '',
  };
}

interface TemplateEditFormProps {
  readonly formData: EditFormData;
  readonly setFormData: React.Dispatch<React.SetStateAction<EditFormData>>;
  readonly categoryOptions: { value: string; label: string }[];
  readonly unitOptions: { value: string; label: string }[];
  readonly onSave: () => void;
  readonly onCancel: () => void;
}

function TemplateEditForm({
  formData,
  setFormData,
  categoryOptions,
  unitOptions,
  onSave,
  onCancel,
}: TemplateEditFormProps) {
  const { t } = useTranslation(['common', 'categories', 'units']);
  const update = (patch: Partial<EditFormData>) =>
    setFormData((prev) => ({ ...prev, ...patch }));

  const hasValidNames = Boolean(
    formData.nameEn.trim() || formData.nameFi.trim(),
  );

  return (
    <form
      className={styles.editForm}
      onSubmit={(e) => {
        e.preventDefault();
        if (!hasValidNames) return;
        onSave();
      }}
    >
      <Input
        id="edit-template-name-en"
        label={t('settings.customTemplates.nameEn')}
        value={formData.nameEn}
        onChange={(e) => update({ nameEn: e.target.value })}
        autoFocus
      />
      <Input
        id="edit-template-name-fi"
        label={t('settings.customTemplates.nameFi')}
        value={formData.nameFi}
        onChange={(e) => update({ nameFi: e.target.value })}
      />
      {!hasValidNames && (
        <p
          id="edit-template-name-error"
          className={styles.validationError}
          role="alert"
        >
          {t('settings.customTemplates.nameRequired')}
        </p>
      )}
      <Select
        id="edit-template-category"
        label={t('itemForm.category')}
        value={formData.category}
        onChange={(e) => update({ category: e.target.value })}
        options={categoryOptions}
      />
      <Select
        id="edit-template-unit"
        label={t('itemForm.unit')}
        value={formData.defaultUnit}
        onChange={(e) => update({ defaultUnit: e.target.value as Unit })}
        options={unitOptions}
      />
      <label className={styles.checkboxLabel}>
        <input
          type="checkbox"
          checked={formData.neverExpires}
          onChange={(e) => update({ neverExpires: e.target.checked })}
        />
        {t('itemForm.neverExpires')}
      </label>
      {!formData.neverExpires && (
        <Input
          id="edit-template-expiration-months"
          type="number"
          min={1}
          label={t('settings.customTemplates.defaultExpirationMonths')}
          value={formData.defaultExpirationMonths}
          onChange={(e) => update({ defaultExpirationMonths: e.target.value })}
        />
      )}
      {isFoodCategory(formData.category) && (
        <>
          <Input
            id="edit-template-weight"
            type="number"
            min={0}
            label={t('itemForm.weightGrams')}
            value={formData.weightGrams}
            onChange={(e) => update({ weightGrams: e.target.value })}
          />
          <Input
            id="edit-template-calories-unit"
            type="number"
            min={0}
            label={t('itemForm.caloriesPerUnit')}
            value={formData.caloriesPerUnit}
            onChange={(e) => update({ caloriesPerUnit: e.target.value })}
          />
          <Input
            id="edit-template-calories-100g"
            type="number"
            min={0}
            label={t('settings.customTemplates.caloriesPer100g')}
            value={formData.caloriesPer100g}
            onChange={(e) => update({ caloriesPer100g: e.target.value })}
          />
          <Input
            id="edit-template-water"
            type="number"
            min={0}
            step={0.1}
            label={t('itemForm.requiresWaterLiters')}
            value={formData.requiresWaterLiters}
            onChange={(e) => update({ requiresWaterLiters: e.target.value })}
          />
        </>
      )}
      <div className={styles.modalButtons}>
        <Button type="button" variant="secondary" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={!hasValidNames}
          aria-describedby={
            !hasValidNames ? 'edit-template-name-error' : undefined
          }
        >
          {t('common.save')}
        </Button>
      </div>
    </form>
  );
}

export function CustomTemplates() {
  const { t, i18n } = useTranslation(['common', 'categories', 'units']);
  const { customTemplates, updateCustomTemplate, deleteCustomTemplate } =
    useInventory();
  const [editingTemplate, setEditingTemplate] =
    useState<ProductTemplate | null>(null);
  const [formData, setFormData] = useState<EditFormData>(INITIAL_FORM_DATA);

  const handleEditClick = (template: ProductTemplate) => {
    setEditingTemplate(template);
    setFormData(formDataFromTemplate(template));
  };

  const handleCloseModal = () => {
    setEditingTemplate(null);
    setFormData(INITIAL_FORM_DATA);
  };

  const handleSave = () => {
    if (!editingTemplate) return;
    const update = buildTemplateUpdate(formData);
    if (!update) return;
    updateCustomTemplate(editingTemplate.id, update);
    handleCloseModal();
  };

  const categoryOptions = STANDARD_CATEGORIES.map((cat) => ({
    value: cat.id,
    label: t(cat.id, { ns: 'categories' }),
  }));
  const unitOptions = VALID_UNITS.map((unit) => ({
    value: unit,
    label: t(unit, { ns: 'units' }),
  }));

  if (customTemplates.length === 0) {
    return (
      <div className={styles.container}>
        <p className={styles.emptyMessage}>
          {t('settings.customTemplates.empty')}
        </p>
        <p className={styles.hint}>{t('settings.customTemplates.hint')}</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <p className={styles.description}>
        {t('settings.customTemplates.description', {
          count: customTemplates.length,
        })}
      </p>
      <ul className={styles.templatesList}>
        {customTemplates.map((template) => {
          const displayName = getLocalizedName(template, i18n.language);
          return (
            <li key={template.id} className={styles.templateItem}>
              <div className={styles.templateContent}>
                <span className={styles.templateName}>
                  <strong>{displayName}</strong>
                  <span className={styles.templateCategory}>
                    {' '}
                    ({t(template.category, { ns: 'categories' })})
                  </span>
                </span>
                <span className={styles.templateUnit}>
                  {t(template.defaultUnit || 'pieces', { ns: 'units' })}
                </span>
              </div>
              <div className={styles.buttonGroup}>
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => handleEditClick(template)}
                  aria-label={`${t('common.edit')}: ${displayName}`}
                >
                  {t('common.edit')}
                </Button>
                <Button
                  variant="danger"
                  size="small"
                  onClick={() => deleteCustomTemplate(template.id)}
                  aria-label={`${t('common.delete')}: ${displayName}`}
                >
                  {t('common.delete')}
                </Button>
              </div>
            </li>
          );
        })}
      </ul>

      {editingTemplate && (
        <Modal
          isOpen={true}
          onClose={handleCloseModal}
          title={t('settings.customTemplates.editTitle')}
        >
          <TemplateEditForm
            formData={formData}
            setFormData={setFormData}
            categoryOptions={categoryOptions}
            unitOptions={unitOptions}
            onSave={handleSave}
            onCancel={handleCloseModal}
          />
        </Modal>
      )}
    </div>
  );
}
