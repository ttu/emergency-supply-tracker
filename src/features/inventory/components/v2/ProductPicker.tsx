import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDesignTheme } from '@/shared/hooks/useDesignTheme';
import { categoryCode } from '@/shared/i18n/voice';
import { CategoryIcon } from '@/shared/components/design-v2/CategoryIcon';
import { resolveCategoryLabel } from '@/shared/i18n/categoryLabel';
import { formatBaseQuantityCompact } from '@/shared/utils/formatting/baseQuantity';
import type {
  Category,
  ProductTemplate,
  RecommendedItemDefinition,
} from '@/shared/types';
import styles from './ProductPicker.module.css';

export interface ProductPickerProps {
  templates: RecommendedItemDefinition[];
  customTemplates: ProductTemplate[];
  categories: Category[];
  /** Category to open on, when the user arrived from one. */
  initialCategoryId?: string;
  onSelectTemplate: (template: RecommendedItemDefinition) => void;
  onSelectCustomTemplate: (template: ProductTemplate) => void;
  onSelectCustom: () => void;
}

/** Strip the namespace prefix the definitions carry in their `i18nKey`. */
const productKey = (i18nKey: string) =>
  i18nKey.replace(/^(products\.|custom\.)/, '');

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" strokeWidth={2} aria-hidden="true">
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4-4" />
  </svg>
);

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

/**
 * The v2 product picker: search, a category rail, and the recommended
 * products for the household — or a way out to a blank custom item.
 *
 * Presentational; the caller supplies the products already narrowed to what
 * applies to this household.
 */
export function ProductPicker({
  templates,
  customTemplates,
  categories,
  initialCategoryId = '',
  onSelectTemplate,
  onSelectCustomTemplate,
  onSelectCustom,
}: Readonly<ProductPickerProps>) {
  const { t, i18n } = useTranslation([
    'common',
    'categories',
    'products',
    'units',
  ]);
  const { themeKey } = useDesignTheme();
  const lang = i18n?.language || 'en';

  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState(initialCategoryId);

  const categoryLabel = (id: string): string =>
    resolveCategoryLabel(
      categories.find((c) => String(c.id) === id),
      id,
      lang,
      t,
    );

  const categoryEmoji = (id: string) =>
    categories.find((c) => String(c.id) === id)?.icon;

  const query = search.trim().toLowerCase();

  /**
   * Products are matched and ordered by their *translated* name, so the list
   * reads alphabetically in whichever language is on screen.
   */
  const visibleTemplates = useMemo(() => {
    return templates
      .map((item) => ({
        item,
        name: t(productKey(item.i18nKey), { ns: 'products' }),
      }))
      .filter(
        ({ item, name }) =>
          name.toLowerCase().includes(query) &&
          (!categoryId || String(item.category) === categoryId),
      )
      .sort((a, b) => a.name.localeCompare(b.name, lang));
  }, [templates, query, categoryId, t, lang]);

  const visibleCustomTemplates = useMemo(() => {
    return customTemplates
      .map((item) => ({ item, name: item.name ?? '' }))
      .filter(
        ({ item, name }) =>
          name.toLowerCase().includes(query) &&
          (!categoryId || String(item.category) === categoryId),
      )
      .sort((a, b) => a.name.localeCompare(b.name, lang));
  }, [customTemplates, query, categoryId, lang]);

  const total = visibleTemplates.length + visibleCustomTemplates.length;

  const toggleCategory = (id: string) =>
    setCategoryId((current) => (current === id ? '' : id));

  const resultLabel = categoryId
    ? categoryLabel(categoryId)
    : t(`v2.picker.allProducts.${themeKey}`);

  const row = (
    key: string,
    testId: string,
    iconCategoryId: string,
    name: string,
    category: string,
    recommended: string | undefined,
    onClick: () => void,
  ) => (
    <button
      key={key}
      type="button"
      className={styles.productRow}
      data-testid={testId}
      onClick={onClick}
    >
      <span className={styles.badge} aria-hidden="true">
        <CategoryIcon
          categoryId={iconCategoryId}
          size={26}
          fallback={categoryEmoji(iconCategoryId)}
        />
      </span>
      <span className={styles.info}>
        <span className={styles.productName}>{name}</span>
        <span className={styles.productMeta}>
          <span className={styles.productCategory}>{category}</span>
          {recommended && (
            <>
              <span className={styles.metaDot} aria-hidden="true" />
              <span className={styles.productRecommended}>
                {t('templateSelector.recommended')}: <b>{recommended}</b>
              </span>
            </>
          )}
        </span>
      </span>
      <span className={styles.go} aria-hidden="true">
        <span className={styles.goLabel}>{t(`v2.picker.add.${themeKey}`)}</span>
        <span className={styles.goArrow}>
          <PlusIcon />
        </span>
      </span>
    </button>
  );

  return (
    <div data-testid="template-selector">
      <div className={styles.searchRow}>
        <div className={styles.field}>
          <SearchIcon />
          <input
            className={styles.search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('templateSelector.searchPlaceholder')}
            aria-label={t('templateSelector.searchLabel')}
            data-testid="template-search-input"
          />
        </div>
      </div>

      <div className={styles.railHead}>
        <span className={styles.chipCode}>
          {t(`v2.picker.categoryRail.${themeKey}`)}
        </span>
        <span className={styles.chipCode}>
          {t(`v2.picker.categoryCount.${themeKey}`, {
            count: categories.length,
          })}
        </span>
      </div>
      <div className={styles.rail}>
        {categories.map((c) => {
          const id = String(c.id);
          return (
            <button
              key={id}
              type="button"
              className={styles.categoryChip}
              aria-pressed={categoryId === id}
              data-testid={`picker-category-chip-${id}`}
              onClick={() => toggleCategory(id)}
            >
              <span className={styles.chipIcon} aria-hidden="true">
                <CategoryIcon categoryId={id} size={17} fallback={c.icon} />
              </span>
              <span className={styles.chipMeta}>
                <span className={styles.chipCode}>{categoryCode(id)}</span>
                <span className={styles.chipName}>{categoryLabel(id)}</span>
              </span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        className={styles.customButton}
        onClick={onSelectCustom}
        data-testid="custom-item-button"
      >
        <PlusIcon />
        {t('itemForm.customItem')}
      </button>

      <div className={styles.resultHead}>
        <span className={styles.chipCode}>{resultLabel}</span>
        <span className={styles.chipCode} data-testid="picker-result-count">
          {t(`v2.picker.templateCount.${themeKey}`, { count: total })}
        </span>
      </div>

      <div className={styles.list}>
        {total === 0 && (
          <div className={styles.empty} data-testid="picker-empty">
            {t(`v2.picker.empty.${themeKey}`)}
          </div>
        )}

        {visibleCustomTemplates.length > 0 && (
          <div className={styles.sectionHeader}>
            {t('templateSelector.yourTemplates')}
          </div>
        )}
        {visibleCustomTemplates.map(({ item, name }) =>
          row(
            String(item.id),
            `custom-template-card-${String(item.id)}`,
            String(item.category),
            name,
            categoryLabel(String(item.category)),
            undefined,
            () => onSelectCustomTemplate(item),
          ),
        )}

        {visibleCustomTemplates.length > 0 && visibleTemplates.length > 0 && (
          <div className={styles.sectionHeader}>
            {t('templateSelector.recommendedItems')}
          </div>
        )}
        {visibleTemplates.map(({ item, name }) =>
          row(
            String(item.id),
            `template-card-${String(item.id)}`,
            String(item.category),
            name,
            categoryLabel(String(item.category)),
            formatBaseQuantityCompact(
              item.baseQuantity,
              t(item.unit, { ns: 'units' }),
            ),
            () => onSelectTemplate(item),
          ),
        )}
      </div>
    </div>
  );
}
