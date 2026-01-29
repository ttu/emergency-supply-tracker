import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useInventory } from '@/features/inventory';
import { Button } from '@/shared/components/Button';
import { Modal } from '@/shared/components/Modal';
import { CategoryList } from '../CategoryList';
import { CategoryForm, type CategoryFormData } from '../CategoryForm';
import type { Category } from '@/shared/types';
import styles from './CategoriesSection.module.css';

export function CategoriesSection() {
  const { t } = useTranslation();
  const { customCategories, addCustomCategory, updateCustomCategory } =
    useInventory();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const handleAdd = () => {
    setEditingCategory(null);
    setIsFormOpen(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setIsFormOpen(true);
  };

  const handleClose = () => {
    setIsFormOpen(false);
    setEditingCategory(null);
  };

  const handleSubmit = (data: CategoryFormData) => {
    if (editingCategory) {
      // Update existing category
      updateCustomCategory(editingCategory.id, {
        names: data.names,
        icon: data.icon,
        descriptions: data.descriptions,
        color: data.color,
        sortOrder: data.sortOrder,
      });
    } else {
      // Create new category
      addCustomCategory({
        name: data.names.en, // Required for validation
        names: data.names,
        icon: data.icon,
        descriptions: data.descriptions,
        color: data.color,
        sortOrder: data.sortOrder ?? 100,
        isCustom: true,
      });
    }
    handleClose();
  };

  const existingIds = customCategories.map((c) => c.id as string);

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>{t('settings.customCategories.title')}</h2>
        <Button variant="primary" size="small" onClick={handleAdd}>
          {t('settings.customCategories.addCategory')}
        </Button>
      </div>

      <CategoryList onEdit={handleEdit} />

      <Modal isOpen={isFormOpen} onClose={handleClose}>
        <CategoryForm
          initialCategory={editingCategory || undefined}
          onSubmit={handleSubmit}
          onCancel={handleClose}
          existingIds={
            editingCategory
              ? existingIds.filter((id) => id !== editingCategory.id)
              : existingIds
          }
        />
      </Modal>
    </section>
  );
}
