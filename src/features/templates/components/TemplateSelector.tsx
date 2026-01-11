import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { RecommendedItemDefinition, Category } from '@/shared/types';
import { Input } from '@/shared/components/Input';
import { Select } from '@/shared/components/Select';
import styles from './TemplateSelector.module.css';

export interface TemplateSelectorProps {
  templates: RecommendedItemDefinition[];
  categories: Category[];
  onSelectTemplate: (template: RecommendedItemDefinition) => void;
  onSelectCustom: () => void;
  initialCategoryId?: string;
}

/**
 * Normalize i18n key by removing 'products.' or 'custom.' prefix
 */
const normalizeI18nKey = (i18nKey: string): string => {
  return i18nKey.replace(/^(products\.|custom\.)/, '');
};

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

  const filteredTemplates = templates
    .filter((template) => {
      // Normalize i18nKey to extract the key part (removes 'products.' or 'custom.' prefix)
      const key = normalizeI18nKey(template.i18nKey);
      const templateName = t(key, { ns: 'products' }).toLowerCase();
      const matchesSearch = templateName.includes(searchQuery.toLowerCase());
      const matchesCategory =
        !selectedCategoryId || template.category === selectedCategoryId;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      // Get translated names for sorting
      const keyA = normalizeI18nKey(a.i18nKey);
      const keyB = normalizeI18nKey(b.i18nKey);
      const nameA = t(keyA, { ns: 'products' });
      const nameB = t(keyB, { ns: 'products' });
      return nameA.localeCompare(nameB);
    });

  const categoryOptions = [
    { value: '', label: t('inventory.allCategories') },
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
                    {t(normalizeI18nKey(template.i18nKey), {
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
