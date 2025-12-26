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
  onSelectCustom: () => void;
  initialCategoryId?: string;
}

export const TemplateSelector = ({
  templates,
  categories,
  onSelectTemplate,
  onSelectCustom,
  initialCategoryId = '',
}: TemplateSelectorProps) => {
  const { t } = useTranslation(['common', 'categories', 'products', 'units']);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] =
    useState<string>(initialCategoryId);

  const filteredTemplates = templates.filter((template) => {
    // i18nKey is like 'products.bottled-water', extract the key part
    const key = template.i18nKey.replace('products.', '');
    const templateName = t(key, { ns: 'products' }).toLowerCase();
    const matchesSearch = templateName.includes(searchQuery.toLowerCase());
    const matchesCategory =
      !selectedCategoryId || template.category === selectedCategoryId;
    return matchesSearch && matchesCategory;
  });

  const categoryOptions = [
    { value: '', label: t('allCategories', { ns: 'inventory' }) },
    ...categories.map((cat) => ({
      value: cat.id,
      label: t(cat.id, { ns: 'categories' }),
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

      <button
        type="button"
        className={styles.customItemButton}
        onClick={onSelectCustom}
      >
        ➕ {t('itemForm.customItem')}
      </button>

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
                    {t(template.i18nKey.replace('products.', ''), {
                      ns: 'products',
                    })}
                  </h3>
                  <p className={styles.templateCategory}>
                    {t(template.category, { ns: 'categories' })}
                  </p>
                  <p className={styles.templateQuantity}>
                    {t('templateSelector.recommended')}: {template.baseQuantity}{' '}
                    {t(template.unit, { ns: 'units' })}
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
