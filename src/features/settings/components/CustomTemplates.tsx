import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useInventory } from '@/features/inventory';
import { STANDARD_CATEGORIES } from '@/features/categories';
import { Button } from '@/shared/components/Button';
import { Modal } from '@/shared/components/Modal';
import { Input } from '@/shared/components/Input';
import { Select } from '@/shared/components/Select';
import type { ProductTemplate, Unit } from '@/shared/types';
import { VALID_UNITS } from '@/shared/types';
import styles from './CustomTemplates.module.css';

interface EditFormData {
  nameEn: string;
  nameFi: string;
  category: string;
  defaultUnit: Unit;
}

/** Get the localized name for a template based on current language */
function getLocalizedName(template: ProductTemplate, language: string): string {
  // First try localized names
  if (template.names) {
    const localizedName = template.names[language];
    if (localizedName) return localizedName;
  }
  // Fallback to single name field
  return template.name || '';
}

export function CustomTemplates() {
  const { t, i18n } = useTranslation(['common', 'categories', 'units']);
  const { customTemplates, updateCustomTemplate, deleteCustomTemplate } =
    useInventory();
  const [editingTemplate, setEditingTemplate] =
    useState<ProductTemplate | null>(null);
  const [formData, setFormData] = useState<EditFormData>({
    nameEn: '',
    nameFi: '',
    category: '',
    defaultUnit: 'pieces',
  });

  const handleEditClick = (template: ProductTemplate) => {
    setEditingTemplate(template);
    setFormData({
      nameEn: template.names?.en || template.name || '',
      nameFi: template.names?.fi || template.name || '',
      category: template.category,
      defaultUnit: template.defaultUnit || 'pieces',
    });
  };

  const handleCloseModal = () => {
    setEditingTemplate(null);
    setFormData({
      nameEn: '',
      nameFi: '',
      category: '',
      defaultUnit: 'pieces',
    });
  };

  const handleSave = () => {
    if (editingTemplate && (formData.nameEn.trim() || formData.nameFi.trim())) {
      const nameEn = formData.nameEn.trim();
      const nameFi = formData.nameFi.trim();
      // Use EN name as the primary name for backwards compatibility
      const primaryName = nameEn || nameFi;
      updateCustomTemplate(editingTemplate.id, {
        name: primaryName,
        names: { en: nameEn || primaryName, fi: nameFi || primaryName },
        category: formData.category,
        defaultUnit: formData.defaultUnit,
      });
      handleCloseModal();
    }
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
          <form
            className={styles.editForm}
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
          >
            <Input
              id="edit-template-name-en"
              label={t('settings.customTemplates.nameEn')}
              value={formData.nameEn}
              onChange={(e) =>
                setFormData({ ...formData, nameEn: e.target.value })
              }
              autoFocus
            />
            <Input
              id="edit-template-name-fi"
              label={t('settings.customTemplates.nameFi')}
              value={formData.nameFi}
              onChange={(e) =>
                setFormData({ ...formData, nameFi: e.target.value })
              }
            />
            <Select
              id="edit-template-category"
              label={t('itemForm.category')}
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              options={categoryOptions}
            />
            <Select
              id="edit-template-unit"
              label={t('itemForm.unit')}
              value={formData.defaultUnit}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  defaultUnit: e.target.value as Unit,
                })
              }
              options={unitOptions}
            />
            <div className={styles.modalButtons}>
              <Button
                type="button"
                variant="secondary"
                onClick={handleCloseModal}
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit" variant="primary">
                {t('common.save')}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
