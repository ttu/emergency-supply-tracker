import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { RecommendedItemDefinition, Category } from '../../types';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import styles from './TemplateSelector.module.css';

export interface TemplateSelectorProps {
  templates: RecommendedItemDefinition[];
  categories: Category[];
  onSelectTemplate: (template: RecommendedItemDefinition) => void;
}

export const TemplateSelector = ({
  templates,
  categories,
  onSelectTemplate,
}: TemplateSelectorProps) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');

  const filteredTemplates = templates.filter((template) => {
    const templateName = t(`products.${template.i18nKey}`).toLowerCase();
    const matchesSearch = templateName.includes(searchQuery.toLowerCase());
    const matchesCategory =
      !selectedCategoryId || template.category === selectedCategoryId;
    return matchesSearch && matchesCategory;
  });

  const categoryOptions = [
    { value: '', label: t('inventory.allCategories') },
    ...categories.map((cat) => ({
      value: cat.id,
      label: t(`categories.${cat.id}`),
      icon: cat.icon,
    })),
  ];

  const handleTemplateClick = (template: RecommendedItemDefinition) => {
    onSelectTemplate(template);
  };

  return (
    <div className={styles.container}>
      <div className={styles.filters}>
        <Input
          id="template-search"
          type="text"
          placeholder={t('templateSelector.searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label={t('templateSelector.searchLabel')}
        />
        <Select
          id="template-category"
          value={selectedCategoryId}
          options={categoryOptions}
          onChange={(e) => setSelectedCategoryId(e.target.value)}
          aria-label={t('templateSelector.categoryLabel')}
        />
      </div>

      <div className={styles.templateList}>
        {filteredTemplates.length === 0 ? (
          <div className={styles.emptyState}>
            <p>{t('templateSelector.noTemplates')}</p>
          </div>
        ) : (
          filteredTemplates.map((template) => {
            const category = categories.find(
              (cat) => cat.id === template.category,
            );
            return (
              <button
                key={template.id}
                type="button"
                className={styles.templateCard}
                onClick={() => handleTemplateClick(template)}
              >
                <div className={styles.templateIcon}>{category?.icon}</div>
                <div className={styles.templateInfo}>
                  <h3 className={styles.templateName}>
                    {t(`products.${template.i18nKey}`)}
                  </h3>
                  <p className={styles.templateCategory}>
                    {t(`categories.${template.category}`)}
                  </p>
                  <p className={styles.templateQuantity}>
                    {t('templateSelector.recommended')}: {template.baseQuantity}{' '}
                    {t(`units.${template.unit}`)}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
