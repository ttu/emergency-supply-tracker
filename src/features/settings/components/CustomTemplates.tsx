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
  name: string;
  category: string;
  defaultUnit: Unit;
}

export function CustomTemplates() {
  const { t } = useTranslation(['common', 'categories', 'units']);
  const { customTemplates, updateCustomTemplate, deleteCustomTemplate } =
    useInventory();
  const [editingTemplate, setEditingTemplate] =
    useState<ProductTemplate | null>(null);
  const [formData, setFormData] = useState<EditFormData>({
    name: '',
    category: '',
    defaultUnit: 'pieces',
  });

  const handleEditClick = (template: ProductTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name || '',
      category: template.category,
      defaultUnit: template.defaultUnit || 'pieces',
    });
  };

  const handleCloseModal = () => {
    setEditingTemplate(null);
    setFormData({ name: '', category: '', defaultUnit: 'pieces' });
  };

  const handleSave = () => {
    if (editingTemplate && formData.name.trim()) {
      updateCustomTemplate(editingTemplate.id, {
        name: formData.name.trim(),
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
    label: t(`units.${unit}`),
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
        {customTemplates.map((template) => (
          <li key={template.id} className={styles.templateItem}>
            <div className={styles.templateContent}>
              <span className={styles.templateName}>
                <strong>{template.name}</strong>
                <span className={styles.templateCategory}>
                  {' '}
                  ({t(template.category, { ns: 'categories' })})
                </span>
              </span>
              <span className={styles.templateUnit}>
                {t(`units.${template.defaultUnit}`)}
              </span>
            </div>
            <div className={styles.buttonGroup}>
              <Button
                variant="secondary"
                size="small"
                onClick={() => handleEditClick(template)}
                aria-label={`${t('common.edit')}: ${template.name}`}
              >
                {t('common.edit')}
              </Button>
              <Button
                variant="danger"
                size="small"
                onClick={() => deleteCustomTemplate(template.id)}
                aria-label={`${t('common.delete')}: ${template.name}`}
              >
                {t('common.delete')}
              </Button>
            </div>
          </li>
        ))}
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
              id="edit-template-name"
              label={t('itemForm.name')}
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
              autoFocus
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
